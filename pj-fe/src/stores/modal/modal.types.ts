import type { ComponentType } from 'react';

export interface ModalContent {
  component: ComponentType<any> | null;
  props: Record<string, any>;
}

export interface DrawerContent {
  component: ComponentType<any> | null;
  props: Record<string, any>;
}

export interface ModalState {
  modalVisible: boolean;
  modalContent: ModalContent;
  showBackdrop: boolean;
  isShowDrawer: boolean;
  drawerContent: DrawerContent;
  positionDraw: 'left' | 'right' | 'top' | 'bottom';
  drawerProps: Record<string, any>;
}

export interface ModalActions {
  showModal: (component: ComponentType<any>, props: Record<string, any>) => void;
  hideModal: () => void;
  handleShowBackDrop: (isShow: boolean) => void;
  updateModalProps: (newProps: Record<string, any>) => void;
  showDrawer: (
    component: ComponentType<any>,
    props: Record<string, any>,
    position?: 'left' | 'right' | 'top' | 'bottom',
    drawerProps?: Record<string, any>,
  ) => void;
  hideDrawer: () => void;
  toggleDrawer: () => void;
}

export type ModalStore = ModalState & ModalActions;
