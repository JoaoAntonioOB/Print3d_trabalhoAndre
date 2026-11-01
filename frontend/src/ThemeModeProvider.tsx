import { useMemo, useState, type ReactNode } from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, type PaletteMode } from '@mui/material/styles';
import { Toaster } from 'react-hot-toast';
import { createAppTheme } from './theme';
import { ThemeModeContext } from './ThemeModeContext';

const STORAGE_KEY = 'print3d-theme-mode';

export function ThemeModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<PaletteMode>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });
  const theme = useMemo(() => createAppTheme(mode), [mode]);
  const value = useMemo(() => ({
    mode,
    toggleMode: () => setMode((current) => {
      const next = current === 'light' ? 'dark' : 'light';
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // A troca continua disponível quando o navegador bloqueia o armazenamento.
      }
      return next;
    }),
  }), [mode]);

  return (
    <ThemeModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline enableColorScheme />
        {children}
        <Toaster position="top-right" toastOptions={{
          style: {
            background: theme.palette.background.paper,
            color: theme.palette.text.primary,
            border: `1px solid ${theme.palette.divider}`,
          },
          success: { iconTheme: { primary: theme.palette.success.main, secondary: theme.palette.background.paper } },
          error: { iconTheme: { primary: theme.palette.error.main, secondary: theme.palette.background.paper } },
        }} />
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
}
