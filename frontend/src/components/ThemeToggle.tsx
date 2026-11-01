import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { IconButton, Tooltip } from '@mui/material';
import { useThemeMode } from '../ThemeModeContext';

export function ThemeToggle() {
  const { mode, toggleMode } = useThemeMode();
  const label = mode === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro';
  return (
    <Tooltip title={label}>
      <IconButton color="inherit" onClick={toggleMode} aria-label={label}>
        {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
      </IconButton>
    </Tooltip>
  );
}
