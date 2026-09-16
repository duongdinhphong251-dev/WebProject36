import type { ModalActions } from '@/stores/modal/modal.types';
import { useModalStore } from '@/stores/modal/modal.store';

export type { ModalActions as ModalContextProps };

export function useModal(): Omit<ModalActions, 'toggleDrawer'> {
  const showModal = useModalStore(s => s.showModal);
  const hideModal = useModalStore(s => s.hideModal);
  const handleShowBackDrop = useModalStore(s => s.handleShowBackDrop);
  const showDrawer = useModalStore(s => s.showDrawer);
  const hideDrawer = useModalStore(s => s.hideDrawer);
  const updateModalProps = useModalStore(s => s.updateModalProps);

  return { showModal, hideModal, handleShowBackDrop, showDrawer, hideDrawer, updateModalProps };
}
