/** Único lugar com cores, espaçamentos e raios. Paleta herdada do tema web do TCC (modo claro). */
export const colors = {
  primary: '#5846b5',
  primaryLight: '#7361ca',
  primaryDark: '#3f308a',
  onPrimary: '#ffffff',
  secondary: '#087f5b',
  onSecondary: '#ffffff',
  background: '#f4f6fa',
  surface: '#ffffff',
  text: '#1c2733',
  textMuted: '#526477',
  border: 'rgba(28, 39, 51, 0.14)',
  error: '#b3261e',
  onError: '#ffffff',
} as const;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;

export const radius = { md: 10, lg: 16 } as const;

/** Cores de status de pedido (fundo claro + texto escuro, contraste AA). */
export const statusColors = {
  PENDENTE: { bg: '#fdf0c8', fg: '#6b4e00' },
  EM_PRODUCAO: { bg: '#d6e6fb', fg: '#0b3a73' },
  CONCLUIDO: { bg: '#d3f0e2', fg: '#05563b' },
  ENTREGUE: { bg: '#e2dcf7', fg: '#3f308a' },
  CANCELADO: { bg: '#f6d9d6', fg: '#7a1a14' },
} as const;
