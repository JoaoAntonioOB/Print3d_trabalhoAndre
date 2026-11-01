/**
 * Único lugar com cores, fontes, espaçamentos e raios.
 *
 * Direção visual: ferramenta de oficina, não vitrine. Superfícies planas separadas por linhas finas,
 * texto em tinta quase preta e UMA cor de destaque ("laranja de impressora 3D") usada só nos dados
 * e em estados selecionados. Botões principais em tinta, como os de um painel de controle.
 */
export const colors = {
  /** Tinta: botões principais, marca e texto forte. */
  primary: '#1b1d22',
  onPrimary: '#ffffff',

  /** Destaque único (≥ 4.5:1 sobre branco): dados em evidência, item ativo, marca. */
  accent: '#c2410c',
  accentSoft: '#fdeee6',

  background: '#f5f6f8',
  surface: '#ffffff',
  /** Degrau acima do fundo, para itens ativos e campos neutros. */
  raised: '#eceef2',

  text: '#16181d',
  textMuted: '#59606c',
  border: '#e3e6eb',
  /** Linha entre linhas de uma lista (um degrau mais leve que a borda). */
  rule: '#eceff3',
  /** Borda de controles (campos, botões vazados). */
  control: '#c9ced6',

  error: '#b3261e',
  onError: '#ffffff',
  success: '#247b50',

  /** Mantidos para compatibilidade com telas antigas. */
  secondary: '#247b50',
  onSecondary: '#ffffff',
} as const;

/** Família única (IBM Plex Sans): dígitos de largura fixa, bons para valores em coluna. */
export const fonts = {
  regular: 'IBMPlexSans_400Regular',
  medium: 'IBMPlexSans_500Medium',
  semibold: 'IBMPlexSans_600SemiBold',
  bold: 'IBMPlexSans_700Bold',
} as const;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;

/** Raio contido: 8 px nas superfícies, 6 px nos controles, pílula só em status. */
export const radius = { sm: 6, md: 8, lg: 12, pill: 999 } as const;

/** Cores de status de pedido (fundo claro + texto escuro, contraste AA). */
export const statusColors = {
  PENDENTE: { bg: '#fdf0c8', fg: '#6b4e00' },
  EM_PRODUCAO: { bg: '#d6e6fb', fg: '#0b3a73' },
  CONCLUIDO: { bg: '#d3f0e2', fg: '#05563b' },
  ENTREGUE: { bg: '#e6e8ec', fg: '#2f3540' },
  CANCELADO: { bg: '#f6d9d6', fg: '#7a1a14' },
} as const;

/** Largura máxima do conteúdo (tablets/web): centraliza em vez de esticar. */
export const layout = {
  content: { width: '100%', maxWidth: 720, alignSelf: 'center' },
} as const;
