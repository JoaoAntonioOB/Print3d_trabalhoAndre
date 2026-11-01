import { useInfiniteQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Chip, Icon, Searchbar, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { listOrders, ORDER_STATUSES, STATUS_ICON, STATUS_LABEL, isOpen, type OrderStatus } from '../../src/api/orders';
import { toApiError } from '../../src/api/http';
import { EmptyState, ErrorState, LoadingState } from '../../src/components/ScreenState';
import { StatusChip } from '../../src/components/StatusChip';
import { Screen } from '../../src/components/Screen';
import { colors, layout, radius, spacing } from '../../src/theme';
import { formatBRL, isoToBr, todayIso } from '../../src/utils/format';

export default function OrdersList() {
  const router = useRouter();
  const { bottom } = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [busca, setBusca] = useState('');
  const [status, setStatus] = useState<OrderStatus | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setBusca(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

  const query = useInfiniteQuery({
    queryKey: ['orders', busca, status],
    queryFn: ({ pageParam }) => listOrders(busca, status, pageParam),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.last ? undefined : last.page + 1),
  });

  const orders = query.data?.pages.flatMap((p) => p.content) ?? [];
  const today = todayIso();
  const filtered = !!busca || !!status;

  let body;
  if (query.isPending) {
    body = <LoadingState />;
  } else if (query.isError) {
    body = <ErrorState message={toApiError(query.error).message} onRetry={() => void query.refetch()} />;
  } else if (orders.length === 0) {
    body = filtered ? (
      <EmptyState icon="magnify" message="Nenhum pedido encontrado com esses filtros." />
    ) : (
      <EmptyState
        icon="clipboard-text-outline"
        message="Nenhum pedido cadastrado ainda."
        actionLabel="Criar pedido"
        onAction={() => router.push('/orders/form')}
      />
    );
  } else {
    body = (
      <FlatList
        data={orders}
        keyExtractor={(o) => String(o.id)}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching && !query.isFetchingNextPage}
            onRefresh={() => void query.refetch()}
          />
        }
        onEndReached={() => query.hasNextPage && !query.isFetchingNextPage && void query.fetchNextPage()}
        onEndReachedThreshold={0.4}
        ListFooterComponent={query.isFetchingNextPage ? <ActivityIndicator style={styles.footer} /> : undefined}
        contentContainerStyle={[layout.content, styles.listContent, { paddingBottom: spacing.xl + bottom }]}
        renderItem={({ item }) => {
          const late = isOpen(item.status) && item.prazo < today;
          return (
            <Pressable
              style={styles.card}
              accessibilityRole="button"
              onPress={() => router.push({ pathname: '/orders/[id]', params: { id: String(item.id) } })}
            >
              <View style={styles.row}>
                <Text variant="titleMedium" style={styles.title} numberOfLines={1}>{item.descricao}</Text>
                <Text variant="titleSmall" style={styles.value}>{formatBRL(item.valor)}</Text>
              </View>
              <View style={styles.clientRow}>
                <Icon source="account-outline" size={16} color={colors.textMuted} />
                <Text variant="bodyMedium" style={[styles.muted, styles.flex]} numberOfLines={1}>{item.clienteNome}</Text>
              </View>
              <View style={[styles.row, styles.footerRow]}>
                <StatusChip status={item.status} />
                <View style={styles.dateRow}>
                  <Icon source={late ? 'alert-circle-outline' : 'calendar-outline'} size={16} color={late ? colors.error : colors.textMuted} />
                  <Text variant="bodySmall" style={late ? styles.late : styles.muted}>
                    {late ? 'Atrasado · ' : ''}{isoToBr(item.prazo)}
                  </Text>
                </View>
              </View>
            </Pressable>
          );
        }}
      />
    );
  }

  return (
    <Screen title="Pedidos" menu>
      <View style={styles.searchRow}>
        <Searchbar placeholder="Buscar pedido" value={search} onChangeText={setSearch} style={styles.search} />
        <Button mode="contained" icon="plus" onPress={() => router.push('/orders/form')} style={styles.newButton} contentStyle={styles.newContent}>
          Novo
        </Button>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersScroll}
        contentContainerStyle={styles.filters}
      >
        <Chip icon="format-list-bulleted" selected={status === null} onPress={() => setStatus(null)} style={styles.filter}>Todos</Chip>
        {ORDER_STATUSES.map((s) => (
          <Chip key={s} icon={STATUS_ICON[s]} selected={status === s} onPress={() => setStatus(status === s ? null : s)} style={styles.filter}>
            {STATUS_LABEL[s]}
          </Chip>
        ))}
      </ScrollView>
      {body}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, paddingBottom: spacing.sm },
  search: { flex: 1, backgroundColor: colors.surface },
  newButton: { borderRadius: 28 },
  newContent: { height: 48 },
  filtersScroll: { flexGrow: 0, flexShrink: 0 },
  filters: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  flex: { flex: 1 },
  clientRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xs },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  filter: { marginRight: spacing.sm },
  listContent: {},
  card: { backgroundColor: colors.surface, marginHorizontal: spacing.md, marginBottom: spacing.sm, borderRadius: radius.md, padding: spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerRow: { marginTop: spacing.sm },
  title: { flex: 1, color: colors.text, marginRight: spacing.sm },
  value: { color: colors.primary, fontWeight: '700' },
  muted: { color: colors.textMuted },
  late: { color: colors.error, fontWeight: '600' },
  footer: { margin: spacing.md },
});
