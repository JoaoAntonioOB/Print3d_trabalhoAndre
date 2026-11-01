import type { ReactNode } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, layout, spacing } from '../theme';

/**
 * Rolagem padrão dos formulários: no iOS o próprio ScrollView sobe o conteúdo acima do
 * teclado (automaticallyAdjustKeyboardInsets); a folga embaixo deixa o último campo livre
 * e o conteúdo é centralizado com largura máxima em telas grandes.
 */
export function FormScroll({ children }: { children: ReactNode }) {
  const { bottom } = useSafeAreaInsets();
  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[layout.content, styles.content, { paddingBottom: 120 + bottom }]}
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
  content: { padding: spacing.md },
});
