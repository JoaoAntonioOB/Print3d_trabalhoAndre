import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { API_URL } from '../src/api/http';
import { colors, spacing } from '../src/theme';

/** Tela provisória do Marco 0; o login entra no Marco 1. */
export default function Home() {
  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Print3D Mobile
      </Text>
      <Text variant="bodyMedium" style={styles.muted}>
        API: {API_URL}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  title: { color: colors.primary, fontWeight: '700' },
  muted: { color: colors.textMuted, marginTop: spacing.sm },
});
