import type { ReactNode } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { colors, spacing } from '../theme';

/**
 * Rolagem padrão dos formulários: no iOS o próprio ScrollView sobe o conteúdo acima do
 * teclado (automaticallyAdjustKeyboardInsets) e a folga embaixo deixa o último campo livre.
 */
export function FormScroll({ children }: { children: ReactNode }) {
  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      automaticallyAdjustKeyboardInsets
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: 160 },
});
