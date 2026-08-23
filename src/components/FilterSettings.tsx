import React from 'react';
import { SettingsModal } from './settings/SettingsModal';

interface FilterSettingsProps {
  open: boolean;
  onClose: () => void;
}

export const FilterSettings: React.FC<FilterSettingsProps> = ({ open, onClose }) => {
  return <SettingsModal open={open} onClose={onClose} />;
};
