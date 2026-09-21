import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { setupUser } from '../helpers/user';
import { OnboardingModal } from '../../src/components/layout/OnboardingModal';
import { FirstRunHint } from '../../src/components/layout/FirstRunHint';
import { LanguageTab } from '../../src/components/layout/settings/LanguageTab';
import { useDashboardStore } from '../../src/store/useDashboardStore';
import { resetDashboardStore } from '../helpers/store';

const state = () => useDashboardStore.getState();

describe('OnboardingModal', () => {
  beforeEach(() => resetDashboardStore({ isOnboardingOpen: true }));

  it('3 ステップを進み、選んだ言語で文言が切り替わり、完了で applySetup が呼ばれること', async () => {
    const user = setupUser();
    const applySetup = vi.fn().mockResolvedValue(undefined);
    useDashboardStore.setState({ applySetup });
    render(<OnboardingModal />);

    expect(screen.getByRole('dialog', { name: 'Welcome to ZenithTab' })).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: '日本語' }));
    // The wizard now speaks Japanese, before anything is saved.
    expect(screen.getByRole('dialog', { name: 'ZenithTab へようこそ' })).toBeInTheDocument();
    expect(state().appearance.language).toBe('auto');

    await user.click(screen.getByRole('button', { name: '次へ' }));
    await user.click(screen.getByRole('button', { name: 'テクノロジー' }));
    await user.click(screen.getByRole('button', { name: 'スポーツ' }));
    await user.click(screen.getByRole('button', { name: 'テクノロジー' })); // toggle off again
    expect(screen.getByRole('button', { name: 'スポーツ' })).toHaveAttribute('aria-pressed', 'true');

    await user.click(screen.getByRole('button', { name: '次へ' }));
    await user.click(screen.getByRole('radio', { name: /仕事/ }));
    await user.click(screen.getByRole('button', { name: '戻る' }));
    expect(screen.getByRole('button', { name: 'スポーツ' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: '次へ' }));
    await user.click(screen.getByRole('button', { name: '完了' }));

    expect(applySetup).toHaveBeenCalledWith({ interests: ['SPORTS'], purpose: 'work' }, 'ja');
  });

  it('スキップと × はどちらも skipSetup を呼ぶこと', async () => {
    const user = setupUser();
    const skipSetup = vi.fn().mockResolvedValue(undefined);
    useDashboardStore.setState({ skipSetup });
    render(<OnboardingModal />);
    await user.click(screen.getByRole('button', { name: 'Skip' }));
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(skipSetup).toHaveBeenCalledTimes(2);
  });
});

describe('FirstRunHint', () => {
  beforeEach(() => resetDashboardStore());

  it('フラグが立っているときだけ表示し、× で閉じること', async () => {
    const user = setupUser();
    const { rerender } = render(<FirstRunHint />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    useDashboardStore.setState({ showFirstRunHint: true });
    rerender(<FirstRunHint />);
    expect(screen.getByRole('status')).toHaveTextContent('Hover a widget');
    await user.click(screen.getByRole('button', { name: 'Hide this tip' }));
    await waitFor(() => expect(state().showFirstRunHint).toBe(false));
  });
});

describe('LanguageTab › set up again', () => {
  beforeEach(() => resetDashboardStore({ activeSettingsModal: 'settings' }));

  it('設定を閉じてウィザードを開くこと', async () => {
    const user = setupUser();
    render(<LanguageTab />);
    await user.click(screen.getByRole('button', { name: 'Set up again' }));
    expect(state().isOnboardingOpen).toBe(true);
    expect(state().activeSettingsModal).toBeNull();
  });
});
