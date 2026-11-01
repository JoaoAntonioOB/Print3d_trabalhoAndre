import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { colors, spacing } from '../theme';

export function LoadingState() {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

export function EmptyState({ message, actionLabel, onAction }: {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.center}>
      <Text variant="bodyLarge" style={styles.text}>{message}</Text>
      {actionLabel && onAction ? (
        <Button mode="contained" onPress={onAction} style={styles.button}>{actionLabel}</Button>
      ) : null}
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.center}>
      <Text variant="bodyLarge" style={[styles.text, { color: colors.error }]}>{message}</Text>
      <Button mode="outlined" onPress={onRetry} style={styles.button}>Tentar novamente</Button>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  text: { color: colors.textMuted, textAlign: 'center' },
  button: { marginTop: spacing.md },
});
