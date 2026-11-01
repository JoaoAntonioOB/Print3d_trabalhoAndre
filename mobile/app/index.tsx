import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import { getDashboard } from '../src/api/dashboard';
import { toApiError } from '../src/api/http';
import { ORDER_STATUSES, STATUS_LABEL, type Order } from '../src/api/orders';
import { useAuth } from '../src/auth/AuthContext';
import { Screen } from '../src/components/Screen';
import { ErrorState, LoadingState } from '../src/components/ScreenState';
import { StatusChip } from '../src/components/StatusChip';
import { colors, fonts, layout, radius, spacing } from '../src/theme';
import { formatBRL, isoToBr } from '../src/utils/format';

const num = { fontVariant: ['tabular-nums'] as const };

/** Linha de lista de pedidos: quem e o quê à esquerda, valor e status à direita. */
function OrderRow({ order, last, onPress }: { order: Order; last: boolean; onPress: () => void }) {
  return (
    <Pressable
      style={[styles.orderRow, !last && styles.rowRule]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${order.descricao}, ${order.clienteNome}`}
    >
      <View style={styles.flex}>
        <Text variant="titleSmall" numberOfLines={1} style={styles.text}>{order.descricao}</Text>
        <Text variant="bodySmall" numberOfLines={1} style={styles.muted}>
          {order.clienteNome} · prazo {isoToBr(order.prazo)}
        </Text>
      </View>
      <View style={styles.orderRight}>
        <Text variant="titleSmall" style={[styles.money, num]}>{formatBRL(order.valor)}</Text>
        <StatusChip status={order.status} />
      </View>
    </Pressable>
  );
}

function Section({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Text variant="titleMedium" style={styles.sectionTitle}>{title}</Text>
        {count ? <Text style={[styles.sectionCount, num]}>{count}</Text> : null}
      </View>
      {children}
    </View>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const query = useQuery({ queryKey: ['dashboard'], queryFn: getDashboard });

  if (query.isPending) {
    return <Screen title="Painel" menu><LoadingState /></Screen>;
  }
  if (query.isError) {
    return (
      <Screen title="Painel" menu>
        <ErrorState message={toApiError(query.error).message} onRetry={() => void query.refetch()} />
      </Screen>
    );
  }

  const d = query.data;
  const openOrder = (o: Order) => router.push({ pathname: '/orders/[id]', params: { id: String(o.id) } });
  const count = (s: (typeof ORDER_STATUSES)[number]) => d.pedidosPorStatus[s] ?? 0;
  const maxCount = Math.max(1, ...ORDER_STATUSES.map(count));
  const firstName = user?.nome?.split(' ')[0];

  return (
    <Screen title="Painel" menu>
      <ScrollView
        contentContainerStyle={[layout.content, styles.content]}
        refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} />}
      >
        {/* A pergunta da tela: o que está na fila de produção e o que está atrasado? */}
        <Pressable style={styles.lead} onPress={() => router.push('/orders')} accessibilityRole="button">
          <Text variant="bodyMedium" style={styles.muted}>Pedidos em aberto{firstName ? ` · ${firstName}` : ''}</Text>
          <Text style={[styles.leadValue, num]}>{d.pedidosAbertos}</Text>
          <Text variant="bodyMedium" style={[styles.muted, num]}>
            {count('EM_PRODUCAO')} em produção · {count('PENDENTE')} pendentes
          </Text>
          {d.totalAtrasados > 0 ? (
            <View style={styles.alert}>
              <Icon source="alert-circle-outline" size={18} color={colors.error} />
              <Text variant="bodyMedium" style={styles.alertText}>
                {d.totalAtrasados} {d.totalAtrasados === 1 ? 'pedido atrasado' : 'pedidos atrasados'}
              </Text>
            </View>
          ) : null}
        </Pressable>

        {/* Números de apoio: um bloco com linhas finas, sem azulejos. */}
        <View style={styles.panel}>
          <Pressable style={[styles.kpiRow, styles.rowRule]} onPress={() => router.push('/clients')} accessibilityRole="button">
            <Text variant="bodyMedium" style={styles.muted}>Clientes</Text>
            <Text variant="titleMedium" style={[styles.kpiValue, num]}>{d.totalClientes}</Text>
          </Pressable>
          <View style={[styles.kpiRow, styles.rowRule]}>
            <Text variant="bodyMedium" style={styles.muted}>Faturamento do mês</Text>
            <Text variant="titleMedium" style={[styles.kpiValue, num]}>{formatBRL(d.faturamentoMes)}</Text>
          </View>
          <View style={styles.kpiRow}>
            <Text variant="bodyMedium" style={styles.muted}>Atrasados</Text>
            <Text
              variant="titleMedium"
              style={[styles.kpiValue, num, d.totalAtrasados > 0 && { color: colors.error }]}
            >
              {d.totalAtrasados}
            </Text>
          </View>
        </View>

        {/* Lista de barras: uma série, uma cor; o destaque fica no que está sendo impresso agora. */}
        <Section title="Fila de produção">
          <View style={styles.panel}>
            {ORDER_STATUSES.map((s, i) => (
              <View key={s} style={[styles.barRow, i < ORDER_STATUSES.length - 1 && styles.rowRule]}>
                <Text variant="bodyMedium" style={styles.barLabel}>{STATUS_LABEL[s]}</Text>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${(count(s) / maxCount) * 100}%`,
                        backgroundColor: s === 'EM_PRODUCAO' ? colors.accent : colors.control,
                      },
                    ]}
                  />
                </View>
                <Text variant="titleSmall" style={[styles.barValue, num]}>{count(s)}</Text>
              </View>
            ))}
          </View>
        </Section>

        <Section title="Atrasados" count={d.totalAtrasados}>
          <View style={styles.panel}>
            {d.pedidosAtrasados.length === 0 ? (
              <Text style={styles.empty}>Nenhum pedido atrasado.</Text>
            ) : (
              d.pedidosAtrasados.map((o, i) => (
                <OrderRow key={o.id} order={o} last={i === d.pedidosAtrasados.length - 1} onPress={() => openOrder(o)} />
              ))
            )}
          </View>
        </Section>

        <Section title="Últimos pedidos">
          <View style={styles.panel}>
            {d.ultimosPedidos.length === 0 ? (
              <Text style={styles.empty}>Nenhum pedido ainda. Abra Pedidos e toque em Novo.</Text>
            ) : (
              d.ultimosPedidos.map((o, i) => (
                <OrderRow key={o.id} order={o} last={i === d.ultimosPedidos.length - 1} onPress={() => openOrder(o)} />
              ))
            )}
          </View>
        </Section>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: spacing.xl, gap: spacing.md },
  text: { color: colors.text },
  muted: { color: colors.textMuted },
  money: { color: colors.text, fontFamily: fonts.semibold },
  rowRule: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.rule },

  lead: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  leadValue: { color: colors.text, fontFamily: fonts.semibold, fontSize: 40, lineHeight: 46 },
  alert: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  alertText: { color: colors.error, fontFamily: fonts.medium },

  panel: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  kpiRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 48 },
  kpiValue: { color: colors.text, fontFamily: fonts.medium },

  section: { gap: spacing.sm },
  sectionHead: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm, marginTop: spacing.sm },
  sectionTitle: { color: colors.text, fontFamily: fonts.semibold },
  sectionCount: { color: colors.error, fontFamily: fonts.medium, fontSize: 14 },

  barRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 44 },
  barLabel: { width: 96, color: colors.text },
  barTrack: { flex: 1, height: 8, borderRadius: 4, backgroundColor: colors.raised, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4 },
  barValue: { width: 28, textAlign: 'right', color: colors.text },

  orderRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  orderRight: { alignItems: 'flex-end', gap: spacing.xs },
  empty: { color: colors.textMuted, paddingVertical: spacing.md },
});
