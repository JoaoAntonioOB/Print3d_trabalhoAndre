import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import { getDashboard } from '../src/api/dashboard';
import { toApiError } from '../src/api/http';
import { ORDER_STATUSES, STATUS_LABEL, type Order } from '../src/api/orders';
import { useAuth } from '../src/auth/AuthContext';
import { MonthlyBars } from '../src/components/MonthlyBars';
import { Screen } from '../src/components/Screen';
import { ErrorState, LoadingState } from '../src/components/ScreenState';
import { StatusChip } from '../src/components/StatusChip';
import { colors, fonts, layout, radius, spacing } from '../src/theme';
import { formatBRL, formatWeight, isoToBr } from '../src/utils/format';

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

function Section({ title, hint, count, children }: { title: string; hint?: string; count?: number; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Text variant="titleMedium" style={styles.sectionTitle}>{title}</Text>
        {count ? <Text style={[styles.sectionCount, num]}>{count}</Text> : null}
      </View>
      {hint ? <Text variant="bodySmall" style={styles.muted}>{hint}</Text> : null}
      {children}
    </View>
  );
}

/** Célula de indicador: rótulo cinza sobre o valor; sem ícone, sem azulejo. */
function Kpi({ label, value, tone, onPress, divider }: {
  label: string;
  value: string;
  tone?: string;
  onPress?: () => void;
  divider?: boolean;
}) {
  return (
    <Pressable
      style={[styles.kpi, divider && styles.kpiDivider]}
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${label}: ${value}`}
    >
      <Text variant="bodySmall" style={styles.muted} numberOfLines={1}>{label}</Text>
      <Text style={[styles.kpiValue, num, tone ? { color: tone } : null]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
    </Pressable>
  );
}

/** Linha com barra proporcional: rótulo, barra e valor. */
function BarRow({ label, sub, value, ratio, accent, last }: {
  label: string;
  sub?: string;
  value: string;
  ratio: number;
  accent?: boolean;
  last: boolean;
}) {
  return (
    <View style={[styles.barRow, !last && styles.rowRule]}>
      <View style={styles.barHead}>
        <View style={styles.flex}>
          <Text variant="bodyMedium" style={styles.text} numberOfLines={1}>{label}</Text>
          {sub ? <Text variant="bodySmall" style={styles.muted} numberOfLines={1}>{sub}</Text> : null}
        </View>
        <Text variant="titleSmall" style={[styles.barValue, num]}>{value}</Text>
      </View>
      <View style={styles.barTrack}>
        <View
          style={[
            styles.barFill,
            { width: `${Math.max(2, Math.min(100, ratio * 100))}%`, backgroundColor: accent ? colors.accent : colors.control },
          ]}
        />
      </View>
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
  const maxStatus = Math.max(1, ...ORDER_STATUSES.map(count));
  const maxCliente = Math.max(1, ...d.maioresClientes.map((c) => c.total));
  const maxMaterial = Math.max(1, ...d.materiais.map((m) => m.pedidos));
  const totalSeisMeses = d.vendasMensais.reduce((acc, v) => acc + v.total, 0);
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
            {count('EM_PRODUCAO')} em produção · {count('PENDENTE')} pendentes · {formatBRL(d.valorEmAberto)} a receber
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

        {/* Indicadores: um bloco de 2 colunas, divisórias finas, sem azulejos. */}
        <View style={styles.panel}>
          <View style={[styles.kpiRowPair, styles.rowRule]}>
            <Kpi label="Faturamento do mês" value={formatBRL(d.faturamentoMes)} divider />
            <Kpi label="Ticket médio" value={formatBRL(d.ticketMedio)} />
          </View>
          <View style={styles.kpiRowPair}>
            <Kpi label="Clientes" value={String(d.totalClientes)} onPress={() => router.push('/clients')} divider />
            <Kpi label="Material nos pedidos" value={formatWeight(d.pesoTotalGramas)} />
          </View>
        </View>

        {(d.filamentosAbaixoMinimo ?? []).length > 0 ? (
          <Section title="Estoque baixo" count={d.filamentosAbaixoMinimo.length} hint="Filamentos abaixo do mínimo: hora de repor">
            <View style={styles.panel}>
              {d.filamentosAbaixoMinimo.map((f, i) => (
                <Pressable
                  key={f.id}
                  style={[styles.orderRow, i < d.filamentosAbaixoMinimo.length - 1 && styles.rowRule]}
                  onPress={() => router.push({ pathname: '/filaments/[id]', params: { id: String(f.id) } })}
                  accessibilityRole="button"
                  accessibilityLabel={`${f.nome}, saldo ${formatWeight(f.quantidadeGramas)}`}
                >
                  <View style={styles.flex}>
                    <Text variant="titleSmall" numberOfLines={1} style={styles.text}>{f.nome}</Text>
                    <Text variant="bodySmall" style={styles.muted}>Mínimo {formatWeight(f.estoqueMinimoGramas)}</Text>
                  </View>
                  <Text variant="titleSmall" style={[styles.alertText, num]}>{formatWeight(f.quantidadeGramas)}</Text>
                </Pressable>
              ))}
            </View>
          </Section>
        ) : null}

        <Section
          title="Vendas por mês"
          hint={`Últimos 6 meses · ${formatBRL(totalSeisMeses)} no período · valores em R$`}
        >
          <View style={[styles.panel, styles.chartPanel]}>
            <MonthlyBars data={d.vendasMensais} />
          </View>
        </Section>

        <Section title="Fila de produção">
          <View style={styles.panel}>
            {ORDER_STATUSES.map((s, i) => (
              <BarRow
                key={s}
                label={STATUS_LABEL[s]}
                value={String(count(s))}
                ratio={count(s) / maxStatus}
                accent={s === 'EM_PRODUCAO'}
                last={i === ORDER_STATUSES.length - 1}
              />
            ))}
          </View>
        </Section>

        <Section title="Vencem nos próximos 7 dias" count={d.proximosVencimentos.length}>
          <View style={styles.panel}>
            {d.proximosVencimentos.length === 0 ? (
              <Text style={styles.empty}>Nenhum pedido vence nesta semana.</Text>
            ) : (
              d.proximosVencimentos.map((o, i) => (
                <OrderRow key={o.id} order={o} last={i === d.proximosVencimentos.length - 1} onPress={() => openOrder(o)} />
              ))
            )}
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

        <Section title="Maiores clientes" hint="Por valor em pedidos, sem cancelados">
          <View style={styles.panel}>
            {d.maioresClientes.length === 0 ? (
              <Text style={styles.empty}>Ainda não há pedidos.</Text>
            ) : (
              d.maioresClientes.map((c, i) => (
                <BarRow
                  key={c.clienteId}
                  label={c.nome}
                  sub={`${c.pedidos} ${c.pedidos === 1 ? 'pedido' : 'pedidos'}`}
                  value={formatBRL(c.total)}
                  ratio={c.total / maxCliente}
                  accent={i === 0}
                  last={i === d.maioresClientes.length - 1}
                />
              ))
            )}
          </View>
        </Section>

        <Section title="Materiais" hint="Pedidos, peso e valor por material">
          <View style={styles.panel}>
            {d.materiais.length === 0 ? (
              <Text style={styles.empty}>Ainda não há pedidos.</Text>
            ) : (
              d.materiais.map((m, i) => (
                <BarRow
                  key={m.material}
                  label={m.material}
                  sub={`${m.pedidos} ${m.pedidos === 1 ? 'pedido' : 'pedidos'} · ${formatWeight(m.pesoGramas)}`}
                  value={formatBRL(m.total)}
                  ratio={m.pedidos / maxMaterial}
                  accent={i === 0}
                  last={i === d.materiais.length - 1}
                />
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
  chartPanel: { paddingVertical: spacing.md },

  kpiRowPair: { flexDirection: 'row' },
  kpi: { flex: 1, paddingVertical: spacing.md, paddingHorizontal: spacing.sm, gap: spacing.xs, minWidth: 0 },
  kpiDivider: { borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: colors.rule, paddingLeft: 0 },
  kpiValue: { color: colors.text, fontFamily: fonts.semibold, fontSize: 20, lineHeight: 26 },

  section: { gap: spacing.sm },
  sectionHead: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm, marginTop: spacing.sm },
  sectionTitle: { color: colors.text, fontFamily: fonts.semibold },
  sectionCount: { color: colors.textMuted, fontFamily: fonts.medium, fontSize: 14 },

  barRow: { paddingVertical: spacing.md, gap: spacing.sm },
  barHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  barValue: { color: colors.text },
  barTrack: { height: 6, borderRadius: 3, backgroundColor: colors.raised, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 3 },

  orderRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  orderRight: { alignItems: 'flex-end', gap: spacing.xs },
  empty: { color: colors.textMuted, paddingVertical: spacing.md },
});
