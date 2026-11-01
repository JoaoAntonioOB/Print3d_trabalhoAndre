import { MD3LightTheme } from 'react-native-paper';
import { colors, fonts, radius } from './tokens';

/** Cada variante do Paper aponta para o arquivo da fonte do peso certo (sem negrito sintético). */
const family = (face: string) => ({ fontFamily: face, fontWeight: 'normal' as const });

const paperFonts = {
  ...MD3LightTheme.fonts,
  displayLarge: { ...MD3LightTheme.fonts.displayLarge, ...family(fonts.regular) },
  displayMedium: { ...MD3LightTheme.fonts.displayMedium, ...family(fonts.regular) },
  displaySmall: { ...MD3LightTheme.fonts.displaySmall, ...family(fonts.regular) },
  headlineLarge: { ...MD3LightTheme.fonts.headlineLarge, ...family(fonts.semibold) },
  headlineMedium: { ...MD3LightTheme.fonts.headlineMedium, ...family(fonts.semibold) },
  headlineSmall: { ...MD3LightTheme.fonts.headlineSmall, ...family(fonts.semibold) },
  titleLarge: { ...MD3LightTheme.fonts.titleLarge, ...family(fonts.semibold) },
  titleMedium: { ...MD3LightTheme.fonts.titleMedium, ...family(fonts.medium) },
  titleSmall: { ...MD3LightTheme.fonts.titleSmall, ...family(fonts.medium) },
  labelLarge: { ...MD3LightTheme.fonts.labelLarge, ...family(fonts.medium) },
  labelMedium: { ...MD3LightTheme.fonts.labelMedium, ...family(fonts.medium) },
  labelSmall: { ...MD3LightTheme.fonts.labelSmall, ...family(fonts.medium) },
  bodyLarge: { ...MD3LightTheme.fonts.bodyLarge, ...family(fonts.regular) },
  bodyMedium: { ...MD3LightTheme.fonts.bodyMedium, ...family(fonts.regular) },
  bodySmall: { ...MD3LightTheme.fonts.bodySmall, ...family(fonts.regular) },
  default: { ...MD3LightTheme.fonts.default, ...family(fonts.regular) },
};

export const paperTheme = {
  ...MD3LightTheme,
  roundness: radius.sm,
  fonts: paperFonts,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    onPrimary: colors.onPrimary,
    primaryContainer: colors.raised,
    onPrimaryContainer: colors.text,
    secondary: colors.accent,
    onSecondary: colors.onPrimary,
    secondaryContainer: colors.raised,
    onSecondaryContainer: colors.text,
    background: colors.background,
    surface: colors.surface,
    surfaceVariant: colors.raised,
    onSurface: colors.text,
    onSurfaceVariant: colors.textMuted,
    outline: colors.control,
    outlineVariant: colors.border,
    error: colors.error,
    onError: colors.onError,
    elevation: {
      level0: 'transparent',
      level1: colors.surface,
      level2: colors.surface,
      level3: colors.surface,
      level4: colors.surface,
      level5: colors.surface,
    },
  },
};

export { colors, fonts, spacing, radius, statusColors, layout } from './tokens';
