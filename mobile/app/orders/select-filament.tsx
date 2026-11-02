import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { List, Searchbar } from 'react-native-paper';
import { listFilaments } from '../../src/api/filaments';
import { toApiError } from '../../src/api/http';
import { EmptyState, ErrorState, LoadingState } from '../../src/components/ScreenState';
import { Screen } from '../../src/components/Screen';
import { colors, layout, radius, spacing } from '../../src/theme';
import { formatWeight } from '../../src/utils/format';
import { setPickedFilament } from '../../src/utils/pickerBus';

/** Tela cheia para escolher o filamento do pedido, mostrando o saldo de cada um. */
export default function SelectFilament() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [busca, setBusca] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setBusca(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const query = useQuery({
    queryKey: ['filaments', 'picker', busca],
    queryFn: () => listFilaments(busca, 0),
    staleTime: 0,
    gcTime: 0,
  });

  const items = query.data?.content ?? [];

  let body;
  if (query.isPending) body = <LoadingState />;
  else if (query.isError) body = <ErrorState message={toApiError(query.error).message} onRetry={() => void query.refetch()} />;
  else if (items.length === 0) {
    body = (
      <EmptyState
        icon={busca ? 'magnify' : 'warehouse'}
        message={busca ? `Nenhum filamento encontrado para "${busca}".` : 'Nenhum filamento cadastrado.'}
        actionLabel={busca ? undefined : 'Cadastrar filamento'}
        onAction={busca ? undefined : () => router.push('/filaments/form')}
      />
    );
  } else {
    body = (
      <FlatList
        data={items}
        keyExtractor={(f) => String(f.id)}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={[layout.content, styles.list]}
        ListHeaderComponent={
          <List.Item
            title="Sem filamento do estoque"
            description="Informar só o material, sem descontar saldo"
            left={(p) => <List.Icon {...p} icon="close-circle-outline" />}
            style={styles.item}
            onPress={() => {
              setPickedFilament(null);
              router.back();
            }}
          />
        }
        renderItem={({ item }) => (
          <List.Item
            title={item.nome}
            description={`${[item.material, item.cor].filter(Boolean).join(' · ')} · saldo ${formatWeight(item.quantidadeGramas)}${item.abaixoDoMinimo ? ' (baixo)' : ''}`}
            left={(p) => <List.Icon {...p} icon="warehouse" />}
            style={styles.item}
            onPress={() => {
              setPickedFilament({ id: item.id, nome: item.nome, material: item.material, quantidadeGramas: item.quantidadeGramas });
              router.back();
            }}
          />
        )}
      />
    );
  }

  return (
    <Screen title="Selecionar filamento" back>
      <Searchbar placeholder="Buscar filamento" value={search} onChangeText={setSearch} style={styles.search} />
      {body}
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: { margin: spacing.md, backgroundColor: colors.surface },
  list: { paddingBottom: 160 },
  item: { backgroundColor: colors.surface, marginHorizontal: spacing.md, marginBottom: spacing.sm, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
});
