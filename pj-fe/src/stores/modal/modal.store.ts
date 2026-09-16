import type { ModalStore } from './modal.types';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

const initialState = {
  modalVisible: false,
  modalContent: { component: null, props: {} },
  showBackdrop: false,
  isShowDrawer: false,
  drawerContent: { component: null, props: {} },
  positionDraw: 'right' as const,
  drawerProps: {},
};

export const useModalStore = create<ModalStore>()(
  devtools(
    set => ({
      ...initialState,

      showModal: (component, props) =>
        set({ modalContent: { component, props }, modalVisible: true }, false, 'modal/show'),

      hideModal: () =>
        set({ modalVisible: false }, false, 'modal/hide'),

      handleShowBackDrop: isShow =>
        set({ showBackdrop: isShow }, false, 'modal/backdrop'),

      updateModalProps: newProps =>
        set(
          state => ({
            modalContent: {
              ...state.modalContent,
              props: { ...state.modalContent.props, ...newProps },
            },
          }),
          false,
          'modal/updateProps',
        ),

      showDrawer: (component, props, position = 'right', drawerProps = {}) =>
        set(
          {
            drawerContent: { component, props },
            isShowDrawer: true,
            positionDraw: position,
            drawerProps,
          },
          false,
          'drawer/show',
        ),

      hideDrawer: () =>
        set({ isShowDrawer: false }, false, 'drawer/hide'),

      toggleDrawer: () =>
        set(state => ({ isShowDrawer: !state.isShowDrawer }), false, 'drawer/toggle'),
    }),
    { name: 'ModalStore' },
  ),
);
