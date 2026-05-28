export type ModalVariant =
  | 'confirmation'
  | 'delete'
  | 'warning'
  | 'success'
  | 'error'
  | 'signout'
  | 'business_delete';

export type ModalActionVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

export interface ModalAction {
  label: string;
  variant?: ModalActionVariant;
  onPress: () => void | Promise<void>;
  loading?: boolean;
  disabled?: boolean;
}

export interface ModalConfig {
  variant: ModalVariant;
  title: string;
  description?: string;
  bullets?: string[];
  icon?: React.ReactNode;
  actions?: ModalAction[];
  cancelText?: string;
  onCancel?: () => void;
  hideCancel?: boolean;
  dismissible?: boolean; // Click outside to dismiss
  autoCloseDelay?: number; // Auto close after ms
}
