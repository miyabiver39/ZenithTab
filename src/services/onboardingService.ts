import { storageGet, storageSet } from '../utils/storage';
import { STORAGE_KEYS, USER_DATA_KEYS } from './storageKeys';

/**
 * First-run state: whether the 3-step setup has run (or been skipped), and
 * how many new tabs have been opened since, which drives the one-line
 * "hover a widget for its settings" hint shown to newcomers.
 */
export interface OnboardingState {
  /** When setup finished or was skipped; undefined = never shown. */
  completedAt?: number;
  /** New-tab opens since setup; the hint hides after HINT_MAX_OPENS or a click on its ×. */
  opensSinceSetup: number;
  hintDismissed: boolean;
}

export const HINT_MAX_OPENS = 5;

const DEFAULT_STATE: OnboardingState = { opensSinceSetup: 0, hintDismissed: false };

export const onboardingService = {
  async get(): Promise<OnboardingState> {
    const stored = await storageGet<Partial<OnboardingState>>(STORAGE_KEYS.ONBOARDING, undefined);
    return { ...DEFAULT_STATE, ...(stored || {}) };
  },

  async save(state: OnboardingState): Promise<void> {
    await storageSet(STORAGE_KEYS.ONBOARDING, state);
  },

  /**
   * True when any dashboard data has ever been written, i.e. this is an
   * existing install, which must never be greeted with the setup wizard.
   * The trash is excluded: it can exist without a dashboard only in tests.
   */
  async hasUserData(): Promise<boolean> {
    for (const key of USER_DATA_KEYS) {
      if (key === STORAGE_KEYS.TRASH) continue;
      if ((await storageGet(key)) !== undefined) return true;
    }
    return false;
  },

  /**
   * Called once per new tab at start-up. Decides whether the wizard should
   * open (fresh install) and whether the hint bar should show, bumping the
   * open counter as a side effect.
   */
  async evaluateStartup(now = Date.now()): Promise<{ showSetup: boolean; showHint: boolean }> {
    const state = await this.get();
    if (!state.completedAt) {
      if (await this.hasUserData()) {
        // Existing user picking up this version: no wizard, no newcomer hint.
        await this.save({ completedAt: now, opensSinceSetup: HINT_MAX_OPENS, hintDismissed: true });
        return { showSetup: false, showHint: false };
      }
      return { showSetup: true, showHint: false };
    }
    const opens = state.opensSinceSetup + 1;
    const showHint = !state.hintDismissed && opens <= HINT_MAX_OPENS;
    if (opens <= HINT_MAX_OPENS + 1) await this.save({ ...state, opensSinceSetup: opens });
    return { showSetup: false, showHint };
  },

  async markCompleted(now = Date.now()): Promise<void> {
    const state = await this.get();
    await this.save({ ...state, completedAt: now, opensSinceSetup: 0, hintDismissed: false });
  },

  async dismissHint(): Promise<void> {
    const state = await this.get();
    await this.save({ ...state, hintDismissed: true });
  },
};
