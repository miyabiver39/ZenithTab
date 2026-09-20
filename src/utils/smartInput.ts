/**
 * "Smart input" for the search bar: recognises a handful of things people
 * type into a search box when they really want an answer, not a results
 * page — arithmetic, unit conversions, a dice roll — and answers inline.
 *
 * Pure functions, no `eval`, language-neutral output (the widget renders
 * the labels). Anything that doesn't clearly match returns null so an
 * ordinary query is never hijacked.
 */

import { parseDayKey, daysBetween } from './countdown';

export type SmartResult =
  | { kind: 'calc'; value: string; expression: string }
  | { kind: 'percent'; value: string; expression: string }
  | { kind: 'unit'; value: string; unit: string; from: string }
  | { kind: 'base'; dec: string; hex: string; bin: string; oct: string }
  | { kind: 'dice'; rolls: number[]; total: number; notation: string }
  | { kind: 'coin'; side: 'heads' | 'tails' }
  | { kind: 'random'; value: number; min: number; max: number }
  | { kind: 'choose'; pick: string; options: string[] }
  | { kind: 'days'; days: number; date: string };

export interface SmartInputOptions {
  now?: Date;
  /** Random source in [0, 1); injectable for tests and for "roll again". */
  random?: () => number;
}

/** Results that change on every evaluation and deserve a "roll again" button. */
export const REROLLABLE_KINDS: SmartResult['kind'][] = ['dice', 'coin', 'random', 'choose'];

// ---------------------------------------------------------------------------
// Number formatting

/** Up to 10 significant digits, no trailing zeros, no "-0". */
export function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return n > 0 ? '∞' : n < 0 ? '-∞' : 'NaN';
  const abs = Math.abs(n);
  let s: string;
  if (abs !== 0 && (abs >= 1e15 || abs < 1e-6)) s = n.toExponential(6).replace(/\.?0+e/, 'e');
  else s = String(parseFloat(n.toPrecision(10)));
  return s === '-0' ? '0' : s;
}

// ---------------------------------------------------------------------------
// Calculator: tokenizer + recursive-descent parser

type Token = { type: 'num'; value: number } | { type: 'op'; value: string } | { type: 'id'; value: string } | { type: 'lparen' } | { type: 'rparen' };

const FUNCTIONS: Record<string, (x: number) => number> = {
  sqrt: Math.sqrt,
  abs: Math.abs,
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  asin: Math.asin,
  acos: Math.acos,
  atan: Math.atan,
  ln: Math.log,
  log: Math.log10,
  log10: Math.log10,
  log2: Math.log2,
  exp: Math.exp,
  round: Math.round,
  floor: Math.floor,
  ceil: Math.ceil,
};

const CONSTANTS: Record<string, number> = { pi: Math.PI, π: Math.PI, e: Math.E };

function tokenize(src: string): Token[] | null {
  const tokens: Token[] = [];
  // Thousands separators: "1,000" → "1000" (only between digit groups of three).
  const s = src.replace(/(\d),(?=\d{3}(\D|$))/g, '$1').replace(/×/g, '*').replace(/÷/g, '/').replace(/\*\*/g, '^').replace(/−/g, '-');
  let i = 0;
  while (i < s.length) {
    const ch = s[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    if (/[\d.]/.test(ch)) {
      const m = /^(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/i.exec(s.slice(i));
      if (!m) return null;
      tokens.push({ type: 'num', value: parseFloat(m[0]) });
      i += m[0].length;
      continue;
    }
    if (/[a-zπ]/i.test(ch)) {
      const m = /^[a-zπ][a-z0-9]*/i.exec(s.slice(i))!;
      tokens.push({ type: 'id', value: m[0].toLowerCase() });
      i += m[0].length;
      continue;
    }
    if ('+-*/^%'.includes(ch)) {
      tokens.push({ type: 'op', value: ch });
      i++;
      continue;
    }
    if (ch === '(') {
      tokens.push({ type: 'lparen' });
      i++;
      continue;
    }
    if (ch === ')') {
      tokens.push({ type: 'rparen' });
      i++;
      continue;
    }
    return null;
  }
  return tokens;
}

class Parser {
  private pos = 0;
  constructor(private tokens: Token[]) {}

  parse(): number | null {
    const value = this.expr();
    return this.pos === this.tokens.length ? value : null;
  }

  private peek(): Token | undefined {
    return this.tokens[this.pos];
  }

  private isOp(value: string): boolean {
    const t = this.peek();
    return !!t && t.type === 'op' && t.value === value;
  }

  // expr := term (('+'|'-') term)*
  private expr(): number {
    let left = this.term();
    while (this.isOp('+') || this.isOp('-')) {
      const op = (this.tokens[this.pos++] as { value: string }).value;
      const right = this.term();
      left = op === '+' ? left + right : left - right;
    }
    return left;
  }

  // term := unary (('*'|'/'|'%') unary)*
  private term(): number {
    let left = this.unary();
    while (this.isOp('*') || this.isOp('/') || this.isOp('%')) {
      const op = (this.tokens[this.pos++] as { value: string }).value;
      const right = this.unary();
      left = op === '*' ? left * right : op === '/' ? left / right : left % right;
    }
    return left;
  }

  // unary := ('-'|'+') unary | power
  private unary(): number {
    if (this.isOp('-')) {
      this.pos++;
      return -this.unary();
    }
    if (this.isOp('+')) {
      this.pos++;
      return this.unary();
    }
    return this.power();
  }

  // power := atom ('^' unary)?   (right-associative)
  private power(): number {
    const base = this.atom();
    if (this.isOp('^')) {
      this.pos++;
      return Math.pow(base, this.unary());
    }
    return base;
  }

  // atom := number | const | func '(' expr ')' | '(' expr ')'
  private atom(): number {
    const t = this.tokens[this.pos++];
    if (!t) throw new Error('unexpected end');
    if (t.type === 'num') return t.value;
    if (t.type === 'lparen') {
      const v = this.expr();
      const close = this.tokens[this.pos++];
      if (!close || close.type !== 'rparen') throw new Error('expected )');
      return v;
    }
    if (t.type === 'id') {
      if (t.value in CONSTANTS) return CONSTANTS[t.value];
      const fn = FUNCTIONS[t.value];
      if (!fn) throw new Error('unknown identifier');
      const open = this.tokens[this.pos++];
      if (!open || open.type !== 'lparen') throw new Error('expected (');
      const arg = this.expr();
      const close = this.tokens[this.pos++];
      if (!close || close.type !== 'rparen') throw new Error('expected )');
      return fn(arg);
    }
    throw new Error('unexpected token');
  }
}

/** Evaluates an arithmetic expression, or null when it isn't one. */
export function evaluateExpression(src: string): number | null {
  const tokens = tokenize(src.trim());
  if (!tokens || tokens.length === 0) return null;
  // A lone number or identifier isn't a calculation worth answering.
  const hasOperator = tokens.some((t) => t.type === 'op' || (t.type === 'id' && t.value in FUNCTIONS));
  if (!hasOperator) return null;
  // Every identifier must be something we know: "iphone 15 * 2" is a query, not maths.
  if (tokens.some((t) => t.type === 'id' && !(t.value in FUNCTIONS) && !(t.value in CONSTANTS))) return null;
  try {
    const value = new Parser(tokens).parse();
    return value === null || Number.isNaN(value) ? null : value;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Units

interface UnitDef {
  /** Multiplier to the category's base unit (linear units only). */
  factor: number;
  aliases: string[];
  category: string;
}

const LINEAR_UNITS: UnitDef[] = [
  // length (base: metre)
  { category: 'length', factor: 0.001, aliases: ['mm', 'millimeter', 'millimeters', 'millimetre', 'millimetres'] },
  { category: 'length', factor: 0.01, aliases: ['cm', 'centimeter', 'centimeters', 'centimetre', 'centimetres'] },
  { category: 'length', factor: 1, aliases: ['m', 'meter', 'meters', 'metre', 'metres'] },
  { category: 'length', factor: 1000, aliases: ['km', 'kilometer', 'kilometers', 'kilometre', 'kilometres'] },
  { category: 'length', factor: 0.0254, aliases: ['in', 'inch', 'inches', '"'] },
  { category: 'length', factor: 0.3048, aliases: ['ft', 'foot', 'feet', "'"] },
  { category: 'length', factor: 0.9144, aliases: ['yd', 'yard', 'yards'] },
  { category: 'length', factor: 1609.344, aliases: ['mi', 'mile', 'miles'] },
  { category: 'length', factor: 1852, aliases: ['nmi', 'nauticalmile', 'nauticalmiles'] },
  // mass (base: gram)
  { category: 'mass', factor: 0.001, aliases: ['mg', 'milligram', 'milligrams'] },
  { category: 'mass', factor: 1, aliases: ['g', 'gram', 'grams'] },
  { category: 'mass', factor: 1000, aliases: ['kg', 'kilogram', 'kilograms', 'kilo', 'kilos'] },
  { category: 'mass', factor: 1e6, aliases: ['t', 'ton', 'tons', 'tonne', 'tonnes'] },
  { category: 'mass', factor: 28.349523125, aliases: ['oz', 'ounce', 'ounces'] },
  { category: 'mass', factor: 453.59237, aliases: ['lb', 'lbs', 'pound', 'pounds'] },
  // volume (base: litre)
  { category: 'volume', factor: 0.001, aliases: ['ml', 'milliliter', 'milliliters', 'millilitre', 'millilitres', 'cc'] },
  { category: 'volume', factor: 1, aliases: ['l', 'liter', 'liters', 'litre', 'litres'] },
  { category: 'volume', factor: 3.785411784, aliases: ['gal', 'gallon', 'gallons'] },
  { category: 'volume', factor: 0.946352946, aliases: ['qt', 'quart', 'quarts'] },
  { category: 'volume', factor: 0.473176473, aliases: ['pt', 'pint', 'pints'] },
  { category: 'volume', factor: 0.2365882365, aliases: ['cup', 'cups'] },
  { category: 'volume', factor: 0.0295735295625, aliases: ['floz', 'fl.oz', 'fluidounce', 'fluidounces'] },
  { category: 'volume', factor: 0.0147867648, aliases: ['tbsp', 'tablespoon', 'tablespoons'] },
  { category: 'volume', factor: 0.00492892159, aliases: ['tsp', 'teaspoon', 'teaspoons'] },
  // data (base: byte)
  { category: 'data', factor: 0.125, aliases: ['bit', 'bits'] },
  { category: 'data', factor: 1, aliases: ['b', 'byte', 'bytes'] },
  { category: 'data', factor: 1024, aliases: ['kb', 'kib', 'kilobyte', 'kilobytes'] },
  { category: 'data', factor: 1024 ** 2, aliases: ['mb', 'mib', 'megabyte', 'megabytes'] },
  { category: 'data', factor: 1024 ** 3, aliases: ['gb', 'gib', 'gigabyte', 'gigabytes'] },
  { category: 'data', factor: 1024 ** 4, aliases: ['tb', 'tib', 'terabyte', 'terabytes'] },
  { category: 'data', factor: 1024 ** 5, aliases: ['pb', 'pib', 'petabyte', 'petabytes'] },
  // time (base: second)
  { category: 'time', factor: 0.001, aliases: ['ms', 'millisecond', 'milliseconds'] },
  { category: 'time', factor: 1, aliases: ['s', 'sec', 'secs', 'second', 'seconds'] },
  { category: 'time', factor: 60, aliases: ['min', 'mins', 'minute', 'minutes'] },
  { category: 'time', factor: 3600, aliases: ['h', 'hr', 'hrs', 'hour', 'hours'] },
  { category: 'time', factor: 86400, aliases: ['d', 'day', 'days'] },
  { category: 'time', factor: 604800, aliases: ['wk', 'week', 'weeks'] },
  { category: 'time', factor: 31557600, aliases: ['y', 'yr', 'year', 'years'] },
  // speed (base: m/s)
  { category: 'speed', factor: 1, aliases: ['m/s', 'mps'] },
  { category: 'speed', factor: 1000 / 3600, aliases: ['km/h', 'kmh', 'kph'] },
  { category: 'speed', factor: 1609.344 / 3600, aliases: ['mph', 'mi/h'] },
  { category: 'speed', factor: 1852 / 3600, aliases: ['kn', 'knot', 'knots'] },
  // area (base: m²)
  { category: 'area', factor: 1, aliases: ['m2', 'm²', 'sqm'] },
  { category: 'area', factor: 1e6, aliases: ['km2', 'km²', 'sqkm'] },
  { category: 'area', factor: 10000, aliases: ['ha', 'hectare', 'hectares'] },
  { category: 'area', factor: 4046.8564224, aliases: ['acre', 'acres', 'ac'] },
  { category: 'area', factor: 0.09290304, aliases: ['ft2', 'ft²', 'sqft'] },
  { category: 'area', factor: 3.3057851, aliases: ['tsubo', '坪'] },
];

const UNIT_INDEX = new Map<string, UnitDef>();
for (const def of LINEAR_UNITS) for (const alias of def.aliases) UNIT_INDEX.set(alias.toLowerCase(), def);

const TEMPERATURE_ALIASES: Record<string, 'c' | 'f' | 'k'> = {
  c: 'c', '°c': 'c', celsius: 'c', '℃': 'c',
  f: 'f', '°f': 'f', fahrenheit: 'f', '℉': 'f',
  k: 'k', kelvin: 'k',
};

function convertTemperature(value: number, from: 'c' | 'f' | 'k', to: 'c' | 'f' | 'k'): number {
  const celsius = from === 'c' ? value : from === 'f' ? ((value - 32) * 5) / 9 : value - 273.15;
  return to === 'c' ? celsius : to === 'f' ? (celsius * 9) / 5 + 32 : celsius + 273.15;
}

/** `10 km to mi`, `72 f in c`, `3 kg → lb`. Null when either unit is unknown or they don't mix. */
export function convertUnits(value: number, fromRaw: string, toRaw: string): { value: number; unit: string } | null {
  const from = fromRaw.toLowerCase();
  const to = toRaw.toLowerCase();
  if (from in TEMPERATURE_ALIASES && to in TEMPERATURE_ALIASES) {
    const toKey = TEMPERATURE_ALIASES[to];
    return { value: convertTemperature(value, TEMPERATURE_ALIASES[from], toKey), unit: toKey === 'k' ? 'K' : `°${toKey.toUpperCase()}` };
  }
  const a = UNIT_INDEX.get(from);
  const b = UNIT_INDEX.get(to);
  if (!a || !b || a.category !== b.category) return null;
  return { value: (value * a.factor) / b.factor, unit: toRaw };
}

// ---------------------------------------------------------------------------
// Pattern matchers

const NUM = '(-?\\d+(?:[.,]\\d+)?)';
const UNIT = '([a-zµ°℃℉][a-z0-9µ°℃℉/²"\']*|坪)';
const UNIT_SEP = '(?:to|in|into|as|→|=|に|を|으로|로|en|a|zu|in)';

const COIN_WORDS = /^(?:flip(?:\s+a)?\s+coin|coin(?:\s+(?:toss|flip))?|toss|heads or tails|コイン(?:トス)?|硬币|moneda|pièce|münze|동전)\s*[?？]?$/i;
const DICE_WORDS = /^(?:roll(?:\s+(?:a\s+)?(?:die|dice))?|dice|die|サイコロ|骰子|dado|dé|würfel|주사위)\s*[?？]?$/i;
const DICE_NOTATION = /^(?:roll\s+)?(\d{0,2})d(\d{1,3})$/i;
const RANDOM_WORDS = /^(?:random(?:\s+number)?|rand|rng|乱数|ランダム|随机(?:数)?|aleatorio|zufall(?:szahl)?|hasard|랜덤|난수)(?:\s+(\d+)(?:\s*(?:-|~|〜|to|–|—)\s*(\d+))?)?\s*[?？]?$/i;
const CHOOSE_WORDS = /^(?:choose|pick|どれ|選んで|选择|elige|choisis|wähle|골라(?:줘)?)\s*[:：]?\s+(.+)$/i;
const PERCENT_OF = new RegExp(`^${NUM}\\s*%\\s*(?:of|de|von|du)\\s*${NUM}$`, 'i');
const PERCENT_OF_JA = new RegExp(`^${NUM}\\s*(?:の|의|的)\\s*${NUM}\\s*(?:%|パーセント|퍼센트)$`);
const BASE_LITERAL = /^(0x[0-9a-f]+|0b[01]+|0o[0-7]+)$/i;
const BASE_CONVERT = /^(0x[0-9a-f]+|0b[01]+|0o[0-7]+|\d+)\s+(?:to|in|as|→|に)\s+(hex|hexadecimal|bin|binary|dec|decimal|oct|octal|16進|2進|10進|8進)$/i;
const DAYS_UNTIL = /^(?:(?:days?|how many days)\s+(?:until|till|to|before)\s+)?(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})\s*(?:まで|까지|까지는|hasta|jusqu'au|bis)?\s*[?？]?$/i;
const DAYS_UNTIL_JA = /^(\d{4})年(\d{1,2})月(\d{1,2})日\s*(?:まで)?\s*[?？]?$/;

function parseNumber(raw: string): number {
  return parseFloat(raw.replace(',', '.'));
}

function parseBaseLiteral(raw: string): number | null {
  const s = raw.toLowerCase();
  const n = s.startsWith('0x') ? parseInt(s.slice(2), 16) : s.startsWith('0b') ? parseInt(s.slice(2), 2) : s.startsWith('0o') ? parseInt(s.slice(2), 8) : parseInt(s, 10);
  return Number.isSafeInteger(n) ? n : null;
}

function baseResult(n: number): SmartResult {
  return { kind: 'base', dec: String(n), hex: '0x' + n.toString(16).toUpperCase(), bin: '0b' + n.toString(2), oct: '0o' + n.toString(8) };
}

function randomInt(random: () => number, min: number, max: number): number {
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);
  return lo + Math.floor(random() * (hi - lo + 1));
}

/**
 * The entry point. Tries the cheap, unambiguous patterns first (a coin
 * flip, a date) and the calculator last, since the calculator is the one
 * most likely to see ordinary queries.
 */
export function evaluateSmartInput(input: string, options: SmartInputOptions = {}): SmartResult | null {
  const random = options.random ?? Math.random;
  const now = options.now ?? new Date();
  const q = input.trim().replace(/\s+/g, ' ');
  if (!q || q.length > 120) return null;

  if (COIN_WORDS.test(q)) return { kind: 'coin', side: random() < 0.5 ? 'heads' : 'tails' };

  const dice = DICE_NOTATION.exec(q);
  if (dice || DICE_WORDS.test(q)) {
    const count = dice ? Math.min(20, Math.max(1, parseInt(dice[1] || '1', 10))) : 1;
    const sides = dice ? parseInt(dice[2], 10) : 6;
    if (sides < 2) return null;
    const rolls = Array.from({ length: count }, () => randomInt(random, 1, sides));
    return { kind: 'dice', rolls, total: rolls.reduce((a, b) => a + b, 0), notation: `${count}d${sides}` };
  }

  const rnd = RANDOM_WORDS.exec(q);
  if (rnd) {
    // "random" → 1..100, "random 10" → 1..10, "random 5-7" → 5..7.
    const min = rnd[1] !== undefined && rnd[2] !== undefined ? parseInt(rnd[1], 10) : 1;
    const max = rnd[2] !== undefined ? parseInt(rnd[2], 10) : rnd[1] !== undefined ? parseInt(rnd[1], 10) : 100;
    if (!Number.isSafeInteger(min) || !Number.isSafeInteger(max)) return null;
    return { kind: 'random', value: randomInt(random, min, max), min: Math.min(min, max), max: Math.max(min, max) };
  }

  const choose = CHOOSE_WORDS.exec(q);
  if (choose) {
    const raw = choose[1];
    const options = (raw.includes(',') || raw.includes('、') ? raw.split(/[,、]/) : raw.split(/\s+(?:or|か|или|o|ou|oder|아니면)\s+|\s+/i))
      .map((s) => s.trim())
      .filter(Boolean);
    if (options.length < 2) return null;
    return { kind: 'choose', pick: options[randomInt(random, 0, options.length - 1)], options };
  }

  const untilJa = DAYS_UNTIL_JA.exec(q);
  const until = untilJa || DAYS_UNTIL.exec(q);
  if (until) {
    const key = `${until[1]}-${until[2].padStart(2, '0')}-${until[3].padStart(2, '0')}`;
    const target = parseDayKey(key);
    // Looks like a date but isn't one (2026-02-30): say nothing rather than "calculate" it.
    return target ? { kind: 'days', days: daysBetween(now, target), date: key } : null;
  }

  const pct = PERCENT_OF.exec(q);
  if (pct) {
    const value = (parseNumber(pct[1]) / 100) * parseNumber(pct[2]);
    return { kind: 'percent', value: formatNumber(value), expression: `${pct[1]}% × ${pct[2]}` };
  }
  const pctJa = PERCENT_OF_JA.exec(q);
  if (pctJa) {
    const value = (parseNumber(pctJa[2]) / 100) * parseNumber(pctJa[1]);
    return { kind: 'percent', value: formatNumber(value), expression: `${pctJa[1]} × ${pctJa[2]}%` };
  }

  const baseLit = BASE_LITERAL.exec(q);
  if (baseLit) {
    const n = parseBaseLiteral(baseLit[1]);
    if (n !== null) return baseResult(n);
  }
  const baseConv = BASE_CONVERT.exec(q);
  if (baseConv) {
    const n = parseBaseLiteral(baseConv[1]);
    if (n !== null) return baseResult(n);
  }

  const unit = new RegExp(`^${NUM}\\s*${UNIT}\\s+${UNIT_SEP}\\s+${UNIT}$`, 'i').exec(q) || new RegExp(`^${NUM}\\s*${UNIT}\\s*(?:→|=)\\s*${UNIT}$`, 'i').exec(q);
  if (unit) {
    const converted = convertUnits(parseNumber(unit[1]), unit[2], unit[3]);
    if (converted) return { kind: 'unit', value: formatNumber(converted.value), unit: converted.unit, from: `${unit[1]} ${unit[2]}` };
  }

  // Calculator last: it has to see digits and an operator, and every word
  // must be a function or constant, so "iphone 15" never gets here.
  if (/\d/.test(q) && /[-+*/^%()×÷]|sqrt|sin|cos|tan|log|ln|abs|round|floor|ceil|exp/i.test(q)) {
    const value = evaluateExpression(q);
    if (value !== null) return { kind: 'calc', value: formatNumber(value), expression: q };
  }

  return null;
}
