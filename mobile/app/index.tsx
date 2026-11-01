import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { Button, Icon, IconButton, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getDashboard } from '../src/api/dashboard';
import { toApiError } from '../src/api/http';
import { ORDER_STATUSES, STATUS_LABEL, type Order } from '../src/api/orders';
import { useAuth } from '../src/auth/AuthContext';
import { ErrorState, LoadingState } from '../src/components/ScreenState';
import { StatusChip } from '../src/components/StatusChip';
import { colors, layout, radius, spacing, statusColors } from '../src/theme';
import { formatBRL, isoToBr } from '../src/utils/format';

const SHORT: Record<string, string> = {
  PENDENTE: 'Pend.', EM_PRODUCAO: 'Prod.', CONCLUIDO: 'Concl.', ENTREGUE: 'Entr.', CANCELADO: 'Canc.',
};

function StatCard({ icon, tint, label, value, onPress }: {
  icon: string;
  tint: { bg: string; fg: string };
  label: string;
  value: string;
  onPress?: () => void;
}) {
  return (
    <Pressable style={styles.stat} onPress={onPress} disabled={!onPress} accessibilityRole={onPress ? 'button' : undefined}>
      <View style={[styles.statIcon, { backgroundColor: tint.bg }]}>
        <Icon source={icon} size={22} color={tint.fg} />
      </View>
      <Text variant="headlineSmall" style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      <Text variant="bodySmall" style={styles.muted} numberOfLines={1}>{label}</Text>
    </Pressable>
  );
}

function SectionTitle({ icon, children }: { icon: string; children: string }) {
  return (
    <View style={styles.sectionRow}>
      <Icon source={icon} size={20} color={colors.primary} />
      <Text variant="titleMedium" style={styles.sectionText}>{children}</Text>
    </View>
  );
}

function OrderRow({ order, onPress }: { order: Order; onPress: () => void }) {
  return (
    <Pressable style={styles.orderRow} onPress={onPress} accessibilityRole="button">
      <View style={styles.flex}>
        <Text variant="titleSmall" numberOfLines={1} style={styles.text}>{order.descricao}</Text>
        <Text variant="bodySmall" style={styles.muted} numberOfLines={1}>
          {order.clienteNome} · prazo {isoToBr(order.prazo)}
        </Text>
      </View>
      <View style={styles.orderRight}>
        <Text variant="titleSmall" style={styles.value}>{formatBRL(order.valor)}</Text>
        <StatusChip status={order.status} />
      </View>
    </Pressable>
  );
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const query = useQuery({ queryKey: ['dashboard'], queryFn: getDashboard });

  if (query.isPending) return <LoadingState />;
  if (query.isError) {
    return <ErrorState message={toApiError(query.error).message} onRetry={() => void query.refetch()} />;
  }

  const d = query.data;
  const openOrder = (o: Order) => router.push({ pathname: '/orders/[id]', params: { id: String(o.id) } });

  const chartData = ORDER_STATUSES.map((s) => ({
    value: d.pedidosPorStatus[s] ?? 0,
    label: SHORT[s],
    frontColor: statusColors[s].fg,
    topLabelComponent: () => <Text style={styles.barTop}>{d.pedidosPorStatus[s] ?? 0}</Text>,
  }));
  const hasOrders = chartData.some((c) => c.value > 0);
  // largura útil do cartão (tela limitada ao maxWidth, menos paddings do conteúdo e do cartão)
  const chartWidth = Math.min(width, 720) - spacing.md * 4;
  const barWidth = Math.floor((chartWidth - 8) / 8);
  const barSpacing = Math.floor(barWidth * 0.6);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
    <ScrollView
      contentContainerStyle={[layout.content, styles.content]}
      refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} />}
    >
      <View style={styles.header}>
        <View style={styles.flex}>
          <Text variant="bodyMedium" style={styles.muted}>Olá,</Text>
          <Text variant="headlineSmall" style={styles.title} numberOfLines={1}>{user?.nome}</Text>
        </View>
        <IconButton icon="logout" accessibilityLabel="Sair" onPress={() => void signOut()} />
      </View>

      <View style={styles.statsRow}>
        <StatCard icon="account-group-outline" tint={statusColors.ENTREGUE} label="Clientes" value={String(d.totalClientes)} onPress={() => router.push('/clients')} />
        <StatCard icon="printer-3d" tint={statusColors.EM_PRODUCAO} label="Pedidos abertos" value={String(d.pedidosAbertos)} onPress={() => router.push('/orders')} />
      </View>
      <View style={styles.statsRow}>
        <StatCard icon="cash-multiple" tint={statusColors.CONCLUIDO} label="Faturamento do mês" value={formatBRL(d.faturamentoMes)} />
        <StatCard icon="alert-circle-outline" tint={statusColors.CANCELADO} label="Atrasados" value={String(d.totalAtrasados)} onPress={() => router.push('/orders')} />
      </View>

      <SectionTitle icon="chart-bar">Pedidos por status</SectionTitle>
      <View style={styles.card}>
        {hasOrders ? (
          <BarChart
            data={chartData}
            width={chartWidth}
            height={150}
            barWidth={barWidth}
            spacing={barSpacing}
            initialSpacing={8}
            endSpacing={0}
            yAxisLabelWidth={0}
            noOfSections={3}
            hideRules
            yAxisThickness={0}
            xAxisThickness={1}
            xAxisColor={colors.border}
            hideYAxisText
            barBorderTopLeftRadius={4}
            barBorderTopRightRadius={4}
            xAxisLabelTextStyle={styles.axisLabel}
            isAnimated={false}
            disableScroll
          />
        ) : (
          <Text style={styles.muted}>Ainda não há pedidos para exibir.</Text>
        )}
        <View style={styles.legend}>
          {ORDER_STATUSES.map((s) => (
            <View key={s} style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: statusColors[s].fg }]} />
              <Text variant="bodySmall" style={styles.text}>{STATUS_LABEL[s]}: {d.pedidosPorStatus[s] ?? 0}</Text>
            </View>
          ))}
        </View>
      </View>

      <SectionTitle icon="alert-outline">
        {`Pedidos atrasados${d.totalAtrasados > 0 ? ` (${d.totalAtrasados})` : ''}`}
      </SectionTitle>
      <View style={styles.card}>
        {d.pedidosAtrasados.length === 0 ? (
          <View style={styles.emptyRow}>
            <Icon source="check-circle-outline" size={20} color={colors.secondary} />
            <Text style={styles.muted}>Nenhum pedido atrasado.</Text>
          </View>
        ) : (
          d.pedidosAtrasados.map((o) => <OrderRow key={o.id} order={o} onPress={() => openOrder(o)} />)
        )}
      </View>

      <SectionTitle icon="history">Últimos pedidos</SectionTitle>
      <View style={styles.card}>
        {d.ultimosPedidos.length === 0 ? (
          <Text style={styles.muted}>Nenhum pedido ainda.</Text>
        ) : (
          d.ultimosPedidos.map((o) => <OrderRow key={o.id} order={o} onPress={() => openOrder(o)} />)
        )}
      </View>

      <View style={styles.actions}>
        <Button mode="contained" icon="clipboard-plus-outline" onPress={() => router.push('/orders/form')}>
          Novo pedido
        </Button>
        <Button mode="outlined" icon="account-plus-outline" onPress={() => router.push('/clients/form')} style={styles.second}>
          Novo cliente
        </Button>
      </View>
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.lg, marginBottom: spacing.sm },
  sectionText: { color: colors.text, fontWeight: '600' },
  emptyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  statIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  title: { color: colors.primary, fontWeight: '700' },
  text: { color: colors.text },
  muted: { color: colors.textMuted },
  value: { color: colors.primary, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  stat: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md },
  statValue: { color: colors.primary, fontWeight: '700' },
  section: { color: colors.text, marginTop: spacing.lg, marginBottom: spacing.sm },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md },
  barTop: { color: colors.text, fontSize: 12, fontWeight: '600', marginBottom: 2 },
  axisLabel: { color: colors.textMuted, fontSize: 11 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.md, gap: spacing.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginRight: spacing.sm },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: spacing.xs },
  orderRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, gap: spacing.sm },
  orderRight: { alignItems: 'flex-end', gap: spacing.xs },
  actions: { marginTop: spacing.lg },
  second: { marginTop: spacing.sm },
});
