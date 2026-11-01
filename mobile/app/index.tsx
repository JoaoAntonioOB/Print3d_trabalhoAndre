import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { useAuth } from '../src/auth/AuthContext';
import { colors, spacing } from '../src/theme';

/** Tela provisória (só autenticados): o dashboard entra no Marco 4. */
export default function Home() {
  const { user, signOut } = useAuth();
  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Olá, {user?.nome}
      </Text>
      <Text variant="bodyMedium" style={styles.muted}>
        {user?.email}
      </Text>
      <Button mode="outlined" onPress={() => void signOut()} style={styles.button}>
        Sair
      </Button>
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
  button: { marginTop: spacing.lg },
});
