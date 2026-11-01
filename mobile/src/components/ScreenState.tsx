import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Button, Icon, Text } from 'react-native-paper';
import { colors, spacing } from '../theme';

export function LoadingState() {
  return (
    <View style={styles.center} accessibilityRole="progressbar">
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

export function EmptyState({ message, icon = 'inbox-outline', actionLabel, onAction }: {
  message: string;
  icon?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.center}>
      <Icon source={icon} size={56} color={colors.textMuted} />
      <Text variant="bodyLarge" style={styles.text}>{message}</Text>
      {actionLabel && onAction ? (
        <Button mode="contained" icon="plus" onPress={onAction} style={styles.button}>{actionLabel}</Button>
      ) : null}
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.center}>
      <Icon source="alert-circle-outline" size={56} color={colors.error} />
      <Text variant="bodyLarge" style={[styles.text, { color: colors.error }]}>{message}</Text>
      <Button mode="outlined" icon="refresh" onPress={onRetry} style={styles.button}>Tentar novamente</Button>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: spacing.md },
  text: { color: colors.textMuted, textAlign: 'center' },
  button: { marginTop: spacing.sm },
});
