import { usePathname, useRouter } from 'expo-router';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Animated, Modal, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Divider, Drawer, Icon, IconButton, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../auth/AuthContext';
import { fonts, colors, spacing } from '../theme';

type MenuState = { openMenu: () => void; closeMenu: () => void };
const MenuContext = createContext<MenuState | null>(null);

export function useMenu(): MenuState {
  const ctx = useContext(MenuContext);
  if (!ctx) throw new Error('useMenu deve ser usado dentro de MenuProvider');
  return ctx;
}

/** Botão "três barras" que abre o menu lateral. */
export function MenuButton() {
  const { openMenu } = useMenu();
  return <IconButton icon="menu" accessibilityLabel="Abrir menu" onPress={openMenu} />;
}

type Item = { label: string; icon: string; href: string };

const SECTIONS: { title: string; items: Item[] }[] = [
  { title: 'Geral', items: [{ label: 'Início', icon: 'home-outline', href: '/' }] },
  {
    title: 'Clientes',
    items: [
      { label: 'Lista de clientes', icon: 'account-group-outline', href: '/clients' },
    ],
  },
  {
    title: 'Pedidos',
    items: [
      { label: 'Lista de pedidos', icon: 'clipboard-list-outline', href: '/orders' },
    ],
  },
  {
    title: 'Estoque',
    items: [
      { label: 'Estoque', icon: 'spool', href: '/filaments' },
    ],
  },
];

export function MenuProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;

  const openMenu = useCallback(() => {
    setVisible(true);
    Animated.timing(progress, { toValue: 1, duration: 220, useNativeDriver: true }).start();
  }, [progress]);

  const closeMenu = useCallback(() => {
    Animated.timing(progress, { toValue: 0, duration: 180, useNativeDriver: true }).start(({ finished }) => {
      if (finished) setVisible(false);
    });
  }, [progress]);

  const value = useMemo(() => ({ openMenu, closeMenu }), [openMenu, closeMenu]);

  return (
    <MenuContext.Provider value={value}>
      {children}
      <SideMenuPanel visible={visible} progress={progress} onClose={closeMenu} />
    </MenuContext.Provider>
  );
}

function SideMenuPanel({ visible, progress, onClose }: {
  visible: boolean;
  progress: Animated.Value;
  onClose: () => void;
}) {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const panelWidth = Math.min(320, Math.round(width * 0.82));

  // Sem usuário (tela de login) não há menu.
  useEffect(() => {
    if (!user && visible) onClose();
  }, [user, visible, onClose]);

  if (!user || !visible) return null;

  const go = (item: Item) => {
    onClose();
    router.navigate(item.href as never);
  };

  const isActive = (item: Item) =>
    item.href === '/' ? pathname === '/' : pathname === item.href;

  return (
    <Modal transparent visible animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        <Animated.View style={[styles.backdrop, { opacity: progress }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Fechar menu" />
        </Animated.View>

        <Animated.View
          style={[
            styles.panel,
            { width: panelWidth, transform: [{ translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [-panelWidth, 0] }) }] },
          ]}
        >
          <SafeAreaView style={styles.flex} edges={['top', 'bottom', 'left']}>
            <View style={styles.header}>
              <View style={styles.logo}>
                <Icon source="printer-3d" size={28} color={colors.onPrimary} />
              </View>
              <View style={styles.flex}>
                <Text variant="titleMedium" style={styles.userName} numberOfLines={1}>{user?.nome}</Text>
                <Text variant="bodySmall" style={styles.muted} numberOfLines={1}>{user?.email}</Text>
              </View>
              <IconButton icon="close" accessibilityLabel="Fechar menu" onPress={onClose} />
            </View>
            <Divider />

            <ScrollView style={styles.flex} contentContainerStyle={styles.list}>
              {SECTIONS.map((section) => (
                <Drawer.Section key={section.title} title={section.title} showDivider={false}>
                  {section.items.map((item) => (
                    <Drawer.Item
                      key={item.href}
                      label={item.label}
                      icon={item.icon}
                      active={isActive(item)}
                      onPress={() => go(item)}
                    />
                  ))}
                </Drawer.Section>
              ))}
            </ScrollView>

            <Divider />
            <Drawer.Item
              label="Sair"
              icon="logout"
              style={styles.logout}
              onPress={() => {
                onClose();
                void signOut();
              }}
            />
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  root: { flex: 1, flexDirection: 'row' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.45)' },
  panel: { backgroundColor: colors.surface, height: '100%' },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md },
  logo: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  userName: { color: colors.text, fontFamily: fonts.semibold },
  muted: { color: colors.textMuted },
  list: { paddingVertical: spacing.sm },
  logout: { marginHorizontal: spacing.sm, marginVertical: spacing.sm },
});
