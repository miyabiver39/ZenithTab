import type { ConfirmDialogProps } from '../../common/ConfirmDialog';

/** What a tab hands to the shell to show the shared "are you sure" dialog. */
export type ConfirmRequest = Omit<ConfirmDialogProps, 'isOpen' | 'onCancel'>;

export interface ConfirmApi {
  requestConfirm: (state: ConfirmRequest) => void;
  closeConfirm: () => void;
}
