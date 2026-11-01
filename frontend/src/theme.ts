import { createTheme, type PaletteMode } from '@mui/material/styles';
import { ptBR } from '@mui/material/locale';

/** Temas claro e escuro com identidade visual índigo e verde. */
export const createAppTheme = (mode: PaletteMode) => createTheme(
  {
    palette: {
      mode,
      primary: {
        main: '#9085e9',
        light: '#b3ace7',
        dark: '#4a3aa7',
        contrastText: '#14101f',
      },
      secondary: {
        main: '#199e70',
        light: '#4fbb95',
        dark: '#0f7355',
        contrastText: '#04140f',
      },
      background: {
        default: '#111820',
        paper: '#1a222c',
      },
      text: {
        primary: '#e7edf3',
        secondary: '#9fb0c0',
      },
      divider: 'rgba(231, 237, 243, 0.12)',
      ...(mode === 'light' && {
        primary: { main: '#5846b5', light: '#7361ca', dark: '#3f308a', contrastText: '#ffffff' },
        secondary: { main: '#087f5b', light: '#199e70', dark: '#056044', contrastText: '#ffffff' },
        background: { default: '#f4f6fa', paper: '#ffffff' },
        text: { primary: '#1c2733', secondary: '#526477' },
        divider: 'rgba(28, 39, 51, 0.14)',
      }),
    },
    shape: {
      borderRadius: 10,
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    },
    components: {
      MuiButton: {
        defaultProps: { disableElevation: true },
      },
    },
  },
  ptBR,
);
