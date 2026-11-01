import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import type { VendaMensal } from '../api/dashboard';
import { colors, fonts, spacing } from '../theme';
import { formatBRL, formatCompact, monthLabel } from '../utils/format';

const CHART_HEIGHT = 120;

/**
 * Colunas das vendas por mês: uma série, uma cor. O mês atual leva o destaque (laranja);
 * os anteriores ficam em cinza. Zero é impresso como zero.
 */
export function MonthlyBars({ data }: { data: VendaMensal[] }) {
  const max = Math.max(1, ...data.map((d) => d.total));
  const currentIndex = data.length - 1;

  return (
    <View style={styles.row}>
      {data.map((d, i) => {
        const height = d.total > 0 ? Math.max(4, (d.total / max) * CHART_HEIGHT) : 2;
        const current = i === currentIndex;
        return (
          <View
            key={d.mes}
            style={styles.col}
            accessible
            accessibilityLabel={`${monthLabel(d.mes)}: ${formatBRL(d.total)}, ${d.pedidos} ${d.pedidos === 1 ? 'pedido' : 'pedidos'}`}
          >
            <Text style={[styles.value, current && styles.valueCurrent]} numberOfLines={1}>
              {formatCompact(d.total)}
            </Text>
            <View style={styles.barArea}>
              <View style={[styles.bar, { height, backgroundColor: current ? colors.accent : colors.control }]} />
            </View>
            <Text style={[styles.month, current && styles.monthCurrent]}>{monthLabel(d.mes)}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-end' },
  col: { flex: 1, alignItems: 'center' },
  barArea: { height: CHART_HEIGHT, justifyContent: 'flex-end', alignSelf: 'stretch', alignItems: 'center' },
  bar: { width: '70%', maxWidth: 40, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  value: { fontFamily: fonts.medium, fontSize: 11, color: colors.textMuted, marginBottom: 4, fontVariant: ['tabular-nums'] },
  valueCurrent: { color: colors.text },
  month: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted, marginTop: spacing.xs },
  monthCurrent: { fontFamily: fonts.semibold, color: colors.text },
});
