import { useInfiniteQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, List, Searchbar, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { listFilaments } from '../../src/api/filaments';
import { toApiError } from '../../src/api/http';
import { EmptyState, ErrorState, LoadingState } from '../../src/components/ScreenState';
import { Screen } from '../../src/components/Screen';
import { colors, fonts, layout, radius, spacing } from '../../src/theme';
import { formatWeight } from '../../src/utils/format';

export default function FilamentsList() {
  const router = useRouter();
  const { bottom } = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [busca, setBusca] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setBusca(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

  const query = useInfiniteQuery({
    queryKey: ['filaments', busca],
    queryFn: ({ pageParam }) => listFilaments(busca, pageParam),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.last ? undefined : last.page + 1),
  });

  const items = query.data?.pages.flatMap((p) => p.content) ?? [];

  let body;
  if (query.isPending) {
    body = <LoadingState />;
  } else if (query.isError) {
    body = <ErrorState message={toApiError(query.error).message} onRetry={() => void query.refetch()} />;
  } else if (items.length === 0) {
    body = busca ? (
      <EmptyState icon="magnify" message={`Nenhum filamento encontrado para "${busca}".`} />
    ) : (
      <EmptyState
        icon="warehouse"
        message="Nenhum filamento cadastrado ainda."
        actionLabel="Cadastrar filamento"
        onAction={() => router.push('/filaments/form')}
      />
    );
  } else {
    body = (
      <FlatList
        data={items}
        keyExtractor={(f) => String(f.id)}
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
            description={[item.material, item.cor, item.marca].filter(Boolean).join(' · ')}
            left={(p) => <List.Icon {...p} icon="warehouse" />}
            right={() => (
              <View style={styles.right}>
                <Text style={[styles.balance, item.abaixoDoMinimo && styles.low]}>{formatWeight(item.quantidadeGramas)}</Text>
                {item.abaixoDoMinimo ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>Estoque baixo</Text>
                  </View>
                ) : null}
              </View>
            )}
            onPress={() => router.push({ pathname: '/filaments/[id]', params: { id: String(item.id) } })}
            style={styles.item}
          />
        )}
      />
    );
  }

  return (
    <Screen title="Estoque" menu>
      <View style={styles.searchRow}>
        <Searchbar placeholder="Buscar filamento" value={search} onChangeText={setSearch} style={styles.search} elevation={0} />
        <Button mode="contained" icon="plus" onPress={() => router.push('/filaments/form')} style={styles.newButton} contentStyle={styles.newContent}>
          Novo
        </Button>
      </View>
      {body}
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md },
  search: { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md },
  newButton: { borderRadius: 28 },
  newContent: { height: 48 },
  item: { backgroundColor: colors.surface, marginHorizontal: spacing.md, marginBottom: spacing.sm, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  footer: { margin: spacing.md },
  right: { alignItems: 'flex-end', justifyContent: 'center', gap: spacing.xs },
  balance: { color: colors.text, fontFamily: fonts.semibold },
  low: { color: colors.error },
  badge: { backgroundColor: colors.accentSoft, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  badgeText: { color: colors.accent, fontFamily: fonts.medium, fontSize: 12 },
});
