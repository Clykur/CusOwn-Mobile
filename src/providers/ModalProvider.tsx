import React, { useState, useCallback } from 'react';

import type { ReactNode } from 'react';
import { GlobalModal } from '@/components/ui/Modal/GlobalModal';
import { ModalContext } from '@/hooks/useModal';

import type { ModalConfig } from '@/types/modal';

export const ModalProvider = ({ children }: { children: ReactNode }) => {
  const [config, setConfig] = useState<ModalConfig | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const showModal = useCallback((newConfig: ModalConfig) => {
    setConfig(newConfig);
    setIsVisible(true);
  }, []);

  const hideModal = useCallback(() => {
    setIsVisible(false);
    // Note: We don't clear config immediately so the exit animation has content to render.
    // We could clear it in an onAnimationEnd callback in GlobalModal if needed.
  }, []);

  return (
    <ModalContext.Provider value={{ config, isVisible, showModal, hideModal }}>
      {children}
      <GlobalModal />
    </ModalContext.Provider>
  );
};
