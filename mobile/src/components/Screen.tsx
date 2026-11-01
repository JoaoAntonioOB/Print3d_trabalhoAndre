import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Appbar } from 'react-native-paper';
import { fonts, colors } from '../theme';
import { useMenu } from './SideMenu';

type Props = {
  title: string;
  /** Mostra as três barras que abrem o menu lateral (telas de nível principal). */
  menu?: boolean;
  /** Mostra a seta de voltar (telas internas). */
  back?: boolean;
  children: ReactNode;
};

/**
 * Moldura padrão das telas: cabeçalho próprio (respeita a área segura do topo) acima do conteúdo.
 * Não usa o cabeçalho nativo, que no iOS é transparente e deixava o conteúdo por baixo da barra.
 */
export function Screen({ title, menu, back, children }: Props) {
  const router = useRouter();
  const { openMenu } = useMenu();

  return (
    <View style={styles.root}>
      <Appbar.Header style={styles.header} elevated={false}>
        {menu ? <Appbar.Action icon="menu" accessibilityLabel="Abrir menu" onPress={openMenu} /> : null}
        {back ? (
          <Appbar.BackAction
            accessibilityLabel="Voltar"
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          />
        ) : null}
        <Appbar.Content title={title} titleStyle={styles.title} />
      </Appbar.Header>
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.surface, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  title: { color: colors.text, fontFamily: fonts.semibold },
  body: { flex: 1 },
});
