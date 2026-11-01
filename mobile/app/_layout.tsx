import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { AuthProvider, useAuth } from '../src/auth/AuthContext';
import { colors, paperTheme } from '../src/theme';

function RootStack() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!user}>
        <Stack.Screen name="login" />
      </Stack.Protected>
      <Stack.Protected guard={!!user}>
        <Stack.Screen name="index" />
        <Stack.Screen name="clients/index" options={{ headerShown: true, title: 'Clientes' }} />
        <Stack.Screen name="clients/[id]" options={{ headerShown: true, title: 'Cliente' }} />
        <Stack.Screen name="clients/form" options={{ headerShown: true, title: 'Cliente' }} />
        <Stack.Screen name="orders/index" options={{ headerShown: true, title: 'Pedidos' }} />
        <Stack.Screen name="orders/[id]" options={{ headerShown: true, title: 'Pedido' }} />
        <Stack.Screen name="orders/form" options={{ headerShown: true, title: 'Pedido' }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider theme={paperTheme}>
        <StatusBar style="dark" />
        <AuthProvider>
          <RootStack />
        </AuthProvider>
      </PaperProvider>
    </QueryClientProvider>
  );
}
