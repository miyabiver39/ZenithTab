import { describe, it, expect } from 'vitest';
import { evaluateSmartInput, evaluateExpression, convertUnits, formatNumber } from '../../../src/utils/smartInput';

const fixed = (values: number[]) => {
  let i = 0;
  return () => values[i++ % values.length];
};
const now = new Date(2026, 8, 20);
const evalAt = (q: string, random = fixed([0.5])) => evaluateSmartInput(q, { now, random });

describe('utils/smartInput', () => {
  it('普通の検索語には反応しないこと', () => {
    for (const q of ['hello world', 'iphone 15', 'sin city', '2026', 'e', 'log 4', '50%', 'what is 2', '']) {
      expect(evalAt(q), q).toBeNull();
    }
    expect(evalAt('iphone 15 * 2')).toBeNull();
  });

  it('四則演算・べき乗・関数・定数・桁区切りを計算すること', () => {
    expect(evalAt('120*1.1')).toMatchObject({ kind: 'calc', value: '132' });
    expect(evalAt('(3+4)^2')).toMatchObject({ value: '49' });
    expect(evalAt('2^3^2')).toMatchObject({ value: '512' });
    expect(evalAt('sqrt(2)')).toMatchObject({ value: '1.414213562' });
    expect(evalAt('10 % 3')).toMatchObject({ value: '1' });
    expect(evalAt('-3 + 5')).toMatchObject({ value: '2' });
    expect(evalAt('1,000 * 3')).toMatchObject({ value: '3000' });
    expect(evalAt('2 × pi')).toMatchObject({ value: '6.283185307' });
    expect(evalAt('10 ÷ 4')).toMatchObject({ value: '2.5' });
    expect(evalAt('1/0')).toMatchObject({ value: '∞' });
    expect(evaluateExpression('(1+2')).toBeNull();
    expect(evaluateExpression('2 3')).toBeNull();
  });

  it('パーセント計算(英語と日本語)', () => {
    expect(evalAt('20% of 150')).toMatchObject({ kind: 'percent', value: '30' });
    expect(evalAt('150 の 20%')).toMatchObject({ kind: 'percent', value: '30' });
  });

  it('単位変換: 長さ・温度・データ量・時間・面積', () => {
    expect(evalAt('10 km to mi')).toMatchObject({ kind: 'unit', value: '6.213711922', unit: 'mi' });
    expect(evalAt('72 f to c')).toMatchObject({ value: '22.22222222', unit: '°C' });
    expect(evalAt('100 c in k')).toMatchObject({ value: '373.15', unit: 'K' });
    expect(evalAt('1 GB to MB')).toMatchObject({ value: '1024' });
    expect(evalAt('3 kg → lb')).toMatchObject({ value: '6.613867866' });
    expect(evalAt('90 min in h')).toMatchObject({ value: '1.5' });
    expect(evalAt('1 ha to m2')).toMatchObject({ value: '10000' });
    expect(evalAt('100 km/h to mph')).toMatchObject({ value: '62.13711922' });
    expect(convertUnits(1, 'kg', 'km')).toBeNull();
    expect(evalAt('10 kg to km')).toBeNull();
  });

  it('進数変換', () => {
    expect(evalAt('0xff')).toMatchObject({ kind: 'base', dec: '255', bin: '0b11111111', oct: '0o377' });
    expect(evalAt('255 to hex')).toMatchObject({ hex: '0xFF' });
    expect(evalAt('0b1010 to dec')).toMatchObject({ dec: '10' });
  });

  it('サイコロ・コイン・乱数・選択は注入した乱数で決まること', () => {
    expect(evalAt('coin', fixed([0.2]))).toEqual({ kind: 'coin', side: 'heads' });
    expect(evalAt('コイントス', fixed([0.9]))).toEqual({ kind: 'coin', side: 'tails' });
    expect(evalAt('dice', fixed([0.999]))).toMatchObject({ kind: 'dice', rolls: [6], total: 6, notation: '1d6' });
    expect(evalAt('2d6', fixed([0, 0.5]))).toMatchObject({ rolls: [1, 4], total: 5, notation: '2d6' });
    expect(evalAt('d20', fixed([0.5]))).toMatchObject({ rolls: [11], notation: '1d20' });
    expect(evalAt('random', fixed([0]))).toMatchObject({ kind: 'random', value: 1, min: 1, max: 100 });
    expect(evalAt('random 1-6', fixed([0.999]))).toMatchObject({ value: 6, min: 1, max: 6 });
    expect(evalAt('rand 10', fixed([0.5]))).toMatchObject({ value: 6, min: 1, max: 10 });
    expect(evalAt('乱数 5〜7', fixed([0]))).toMatchObject({ value: 5 });
    expect(evalAt('choose tea, coffee, water', fixed([0.5]))).toEqual({ kind: 'choose', pick: 'coffee', options: ['tea', 'coffee', 'water'] });
    expect(evalAt('pick 寿司 ラーメン カレー', fixed([0.999]))).toMatchObject({ pick: 'カレー' });
    expect(evalAt('choose tea or coffee', fixed([0]))).toMatchObject({ pick: 'tea', options: ['tea', 'coffee'] });
    expect(evalAt('choose only')).toBeNull();
  });

  it('日付までの日数(ISO・日本語・過去)', () => {
    expect(evalAt('days until 2026-12-31')).toEqual({ kind: 'days', days: 102, date: '2026-12-31' });
    expect(evalAt('2026-12-31 まで')).toMatchObject({ days: 102 });
    expect(evalAt('2026年10月1日まで')).toMatchObject({ days: 11, date: '2026-10-01' });
    expect(evalAt('2026/09/10')).toMatchObject({ days: -10 });
    expect(evalAt('2026-02-30')).toBeNull();
  });

  it('formatNumber は有効数字 10 桁・末尾ゼロなし・極端な値は指数表記', () => {
    expect(formatNumber(0.1 + 0.2)).toBe('0.3');
    expect(formatNumber(1e20)).toBe('1e+20');
    expect(formatNumber(-0)).toBe('0');
    expect(formatNumber(1234.5)).toBe('1234.5');
  });
});
