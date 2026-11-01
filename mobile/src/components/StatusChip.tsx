import { StyleSheet, Text, View } from 'react-native';
import { STATUS_LABEL, type OrderStatus } from '../api/orders';
import { radius, spacing, statusColors } from '../theme';

export function StatusChip({ status }: { status: OrderStatus }) {
  const c = statusColors[status];
  return (
    <View style={[styles.chip, { backgroundColor: c.bg }]}>
      <Text style={[styles.text, { color: c.fg }]}>{STATUS_LABEL[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: { alignSelf: 'flex-start', paddingHorizontal: spacing.sm + 2, paddingVertical: spacing.xs, borderRadius: radius.lg },
  text: { fontSize: 12, fontWeight: '600' },
});
