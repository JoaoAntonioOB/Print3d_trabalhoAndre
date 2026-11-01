import { StyleSheet, Text, View } from 'react-native';
import { Icon } from 'react-native-paper';
import { STATUS_ICON, STATUS_LABEL, type OrderStatus } from '../api/orders';
import { radius, spacing, statusColors } from '../theme';

export function StatusChip({ status }: { status: OrderStatus }) {
  const c = statusColors[status];
  return (
    <View style={[styles.chip, { backgroundColor: c.bg }]} accessibilityLabel={`Status: ${STATUS_LABEL[status]}`}>
      <Icon source={STATUS_ICON[status]} size={14} color={c.fg} />
      <Text style={[styles.text, { color: c.fg }]}>{STATUS_LABEL[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: radius.lg,
  },
  text: { fontSize: 12, fontWeight: '600' },
});
