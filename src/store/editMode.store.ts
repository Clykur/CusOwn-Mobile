import { create } from 'zustand';

interface EditModeState {
  isEditing: boolean;
  setIsEditing: (isEditing: boolean) => void;
}

export const useEditModeStore = create<EditModeState>((set) => ({
  isEditing: false,
  setIsEditing: (isEditing) => set({ isEditing }),
}));
