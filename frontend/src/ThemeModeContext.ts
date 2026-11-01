import { createContext, useContext } from 'react';
import type { PaletteMode } from '@mui/material/styles';

export const ThemeModeContext = createContext({ mode: 'light' as PaletteMode, toggleMode: () => {} });
export const useThemeMode = () => useContext(ThemeModeContext);
