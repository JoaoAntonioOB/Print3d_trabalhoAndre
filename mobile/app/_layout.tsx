import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { AuthProvider, useAuth } from '../src/auth/AuthContext';
import { MenuProvider } from '../src/components/SideMenu';
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
        <Stack.Screen name="clients/index" />
        <Stack.Screen name="clients/[id]" />
        <Stack.Screen name="clients/form" />
        <Stack.Screen name="orders/index" />
        <Stack.Screen name="orders/[id]" />
        <Stack.Screen name="orders/form" />
        <Stack.Screen name="orders/select-client" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient());
  // Fonte dos ícones carregada antes da primeira tela (evita o quadrado com "?").
  const [fontsLoaded, fontError] = useFonts(MaterialCommunityIcons.font);
  if (!fontsLoaded && !fontError) return null;
  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider theme={paperTheme}>
        <StatusBar style="dark" />
        <AuthProvider>
          <MenuProvider>
            <RootStack />
          </MenuProvider>
        </AuthProvider>
      </PaperProvider>
    </QueryClientProvider>
  );
}
