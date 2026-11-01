import * as SecureStore from 'expo-secure-store';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { configureAuth, http } from '../api/http';

const TOKEN_KEY = 'print3d.accessToken';
const USER_KEY = 'print3d.user';

export type User = { id: number; nome: string; email: string };

type AuthState = {
  user: User | null;
  /** true enquanto o token salvo ainda está sendo lido no início do app. */
  loading: boolean;
  signIn: (email: string, senha: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(async () => {
    configureAuth(null);
    setUser(null);
    await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => undefined);
    await SecureStore.deleteItemAsync(USER_KEY).catch(() => undefined);
  }, []);

  // 401 em qualquer chamada autenticada derruba a sessão.
  useEffect(() => {
    configureAuth(null, () => void clearSession());
  }, [clearSession]);

  // Restaura a sessão salva.
  useEffect(() => {
    (async () => {
      try {
        const token = await SecureStore.getItemAsync(TOKEN_KEY);
        const saved = await SecureStore.getItemAsync(USER_KEY);
        if (token && saved) {
          configureAuth(token);
          setUser(JSON.parse(saved) as User);
        }
      } catch {
        await clearSession();
      } finally {
        setLoading(false);
      }
    })();
  }, [clearSession]);

  const signIn = useCallback(async (email: string, senha: string) => {
    const { data } = await http.post<{ accessToken: string; usuario: User }>('/auth/login', {
      email,
      senha,
    });
    await SecureStore.setItemAsync(TOKEN_KEY, data.accessToken);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(data.usuario));
    configureAuth(data.accessToken);
    setUser(data.usuario);
  }, []);

  const value = useMemo(
    () => ({ user, loading, signIn, signOut: clearSession }),
    [user, loading, signIn, clearSession],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
