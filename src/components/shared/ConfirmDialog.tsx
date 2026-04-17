import { Modal } from './Modal';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      title={title}
      size="sm"
      onClose={onCancel}
      footer={
        <div className="cp-confirm-actions">
          <button className="cp-btn cp-btn-ghost" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            className={`cp-btn ${destructive ? 'cp-btn-danger' : 'cp-btn-primary'}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      }
    >
      <p className="cp-confirm-message">{message}</p>
    </Modal>
  );
}
