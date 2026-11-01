import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, HelperText, Icon, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';
import { toApiError } from '../src/api/http';
import { useAuth } from '../src/auth/AuthContext';
import { fonts, colors, layout, spacing } from '../src/theme';

const schema = z.object({
  email: z.string().trim().min(1, 'Informe o e-mail').email('E-mail inválido'),
  senha: z.string().min(1, 'Informe a senha'),
});
type FormData = z.infer<typeof schema>;

export default function Login() {
  const { signIn } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { email: '', senha: '' } });

  const submit = handleSubmit(async ({ email, senha }) => {
    setServerError(null);
    try {
      await signIn(email, senha);
    } catch (e) {
      const err = toApiError(e);
      err.fieldErrors.forEach((f) => {
        if (f.field === 'email' || f.field === 'senha') setError(f.field, { message: f.message });
      });
      setServerError(err.message);
    }
  });

  return (
    <SafeAreaView style={styles.flex}>
      <ScrollView
        contentContainerStyle={[layout.content, styles.container]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets
      >
        <View style={styles.logo}>
          <Icon source="printer-3d" size={44} color={colors.onPrimary} />
        </View>
        <Text variant="headlineMedium" style={styles.title}>
          Print3D Mobile
        </Text>
        <Text variant="bodyMedium" style={styles.muted}>
          Entre para gerenciar clientes e pedidos.
        </Text>

        <View style={styles.form}>
          <Controller
            control={control}
            name="email"
            render={({ field: { value, onChange, onBlur } }) => (
              <>
                <TextInput
                  label="E-mail"
                  mode="outlined"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  textContentType="username"
                  left={<TextInput.Icon icon="email-outline" />}
                  error={!!errors.email}
                />
                <HelperText type="error" visible={!!errors.email}>
                  {errors.email?.message}
                </HelperText>
              </>
            )}
          />
          <Controller
            control={control}
            name="senha"
            render={({ field: { value, onChange, onBlur } }) => (
              <>
                <TextInput
                  label="Senha"
                  mode="outlined"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  textContentType="password"
                  left={<TextInput.Icon icon="lock-outline" />}
                  error={!!errors.senha}
                  right={
                    <TextInput.Icon
                      icon={showPassword ? 'eye-off' : 'eye'}
                      onPress={() => setShowPassword((v) => !v)}
                    />
                  }
                  onSubmitEditing={() => void submit()}
                />
                <HelperText type="error" visible={!!errors.senha}>
                  {errors.senha?.message}
                </HelperText>
              </>
            )}
          />

          <HelperText type="error" visible={!!serverError} style={styles.serverError}>
            {serverError}
          </HelperText>

          <Button mode="contained" icon="login" onPress={() => void submit()} loading={isSubmitting} disabled={isSubmitting}>
            Entrar
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg, paddingBottom: 120 },
  logo: { alignSelf: 'center', width: 80, height: 80, borderRadius: 24, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  title: { color: colors.text, fontFamily: fonts.semibold, textAlign: 'center' },
  muted: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm },
  form: { marginTop: spacing.xl },
  serverError: { marginBottom: spacing.sm },
});
