'use client';

import type { ModalStore } from '@/stores/modal/modal.types';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useModalStore } from '@/stores/modal/modal.store';

export default function ModalRenderer() {
  const modalVisible = useModalStore((s: ModalStore) => s.modalVisible);
  const modalContent = useModalStore((s: ModalStore) => s.modalContent);
  const showBackdrop = useModalStore((s: ModalStore) => s.showBackdrop);
  const isShowDrawer = useModalStore((s: ModalStore) => s.isShowDrawer);
  const drawerContent = useModalStore((s: ModalStore) => s.drawerContent);
  const positionDraw = useModalStore((s: ModalStore) => s.positionDraw);
  const drawerProps = useModalStore((s: ModalStore) => s.drawerProps);
  const hideModal = useModalStore((s: ModalStore) => s.hideModal);
  const toggleDrawer = useModalStore((s: ModalStore) => s.toggleDrawer);

  const { isShowCloseButton, ...remainingDrawerProps } = drawerProps ?? {};

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      const onCloseCallback = modalContent.props?.modalProps?.onClose ?? modalContent.props?.onClose;
      if (onCloseCallback) {
        onCloseCallback();
      } else {
        hideModal();
      }
    }
  };

  const handleSheetOpenChange = (open: boolean) => {
    if (!open) {
      toggleDrawer();
    }
  };

  return (
    <>
      <Dialog open={modalVisible} onOpenChange={handleDialogOpenChange}>
        <DialogContent
          showCloseButton={modalContent.props?.isShowCloseButton ?? false}
          onInteractOutside={(e: Event) => {
            if (modalContent.props?.disableBackdropClick) {
              e.preventDefault();
            }
          }}
          className="w-auto max-w-none border-none bg-transparent p-0 shadow-none"
          {...(modalContent.props?.modalProps as any)}
        >
          {modalContent.component
            ? (
                <div className="bg-background relative rounded-lg shadow-lg">
                  <modalContent.component {...modalContent.props} onClose={hideModal} />
                </div>
              )
            : null}
        </DialogContent>
      </Dialog>

      {showBackdrop
        ? (
            <div className="pointer-events-auto fixed inset-0 z-[9999] flex items-center justify-center bg-black/40">
              <Loader2 className="h-10 w-10 animate-spin text-white" />
            </div>
          )
        : null}

      <Sheet open={isShowDrawer} onOpenChange={handleSheetOpenChange}>
        <SheetContent
          side={positionDraw as any ?? 'right'}
          close={isShowCloseButton !== false}
          className={positionDraw === 'bottom' ? 'h-auto max-h-[90vh]' : ''}
          {...(remainingDrawerProps as any)}
          {...(drawerContent.props?.propsDrawer as any)}
        >
          {drawerContent.component
            ? (
                <drawerContent.component {...drawerContent.props} onClose={toggleDrawer} />
              )
            : null}
        </SheetContent>
      </Sheet>
    </>
  );
}
