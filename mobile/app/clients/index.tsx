import { useInfiniteQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, List, Searchbar } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { toApiError } from '../../src/api/http';
import { listClients } from '../../src/api/clients';
import { EmptyState, ErrorState, LoadingState } from '../../src/components/ScreenState';
import { Screen } from '../../src/components/Screen';
import { colors, layout, radius, spacing } from '../../src/theme';

export default function ClientsList() {
  const router = useRouter();
  const { bottom } = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [busca, setBusca] = useState('');

  // debounce da busca
  useEffect(() => {
    const t = setTimeout(() => setBusca(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

  const query = useInfiniteQuery({
    queryKey: ['clients', busca],
    queryFn: ({ pageParam }) => listClients(busca, pageParam),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.last ? undefined : last.page + 1),
  });

  const clients = query.data?.pages.flatMap((p) => p.content) ?? [];

  let body;
  if (query.isPending) {
    body = <LoadingState />;
  } else if (query.isError) {
    body = <ErrorState message={toApiError(query.error).message} onRetry={() => void query.refetch()} />;
  } else if (clients.length === 0) {
    body = busca ? (
      <EmptyState icon="magnify" message={`Nenhum cliente encontrado para "${busca}".`} />
    ) : (
      <EmptyState
        icon="account-group-outline"
        message="Nenhum cliente cadastrado ainda."
        actionLabel="Cadastrar cliente"
        onAction={() => router.push('/clients/form')}
      />
    );
  } else {
    body = (
      <FlatList
        data={clients}
        keyExtractor={(c) => String(c.id)}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching && !query.isFetchingNextPage}
            onRefresh={() => void query.refetch()}
          />
        }
        onEndReached={() => query.hasNextPage && !query.isFetchingNextPage && void query.fetchNextPage()}
        onEndReachedThreshold={0.4}
        ListFooterComponent={query.isFetchingNextPage ? <ActivityIndicator style={styles.footer} /> : undefined}
        contentContainerStyle={[layout.content, { paddingBottom: spacing.xl + bottom }]}
        renderItem={({ item }) => (
          <List.Item
            title={item.nome}
            description={[item.telefone, item.endereco?.cidade].filter(Boolean).join(' · ') || item.email || undefined}
            left={(p) => <List.Icon {...p} icon="account-outline" />}
            right={(p) => <List.Icon {...p} icon="chevron-right" />}
            onPress={() => router.push({ pathname: '/clients/[id]', params: { id: String(item.id) } })}
            style={styles.item}
          />
        )}
      />
    );
  }

  return (
    <Screen title="Clientes" menu>
      <View style={styles.searchRow}>
        <Searchbar placeholder="Buscar cliente" value={search} onChangeText={setSearch} style={styles.search} elevation={0} />
        <Button mode="contained" icon="plus" onPress={() => router.push('/clients/form')} style={styles.newButton} contentStyle={styles.newContent}>
          Novo
        </Button>
      </View>
      {body}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md },
  search: { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md },
  newButton: { borderRadius: 28 },
  newContent: { height: 48 },
  item: { backgroundColor: colors.surface, marginHorizontal: spacing.md, marginBottom: spacing.sm, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  footer: { margin: spacing.md },
});
