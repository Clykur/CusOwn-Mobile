import React, { createContext, useContext } from 'react';
import { ModalConfig } from '@/types/modal';

interface ModalContextType {
  config: ModalConfig | null;
  isVisible: boolean;
  showModal: (config: ModalConfig) => void;
  hideModal: () => void;
}

export const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModal = () => {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};
