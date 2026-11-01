import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Divider, Icon, List, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { toApiError } from '../../src/api/http';
import {
  canDelete, canEdit, changeOrderStatus, deleteOrder, getOrder, isOpen, NEXT_STATUSES, STATUS_ICON, STATUS_LABEL,
  type OrderStatus,
} from '../../src/api/orders';
import { ErrorState, LoadingState } from '../../src/components/ScreenState';
import { StatusChip } from '../../src/components/StatusChip';
import { Screen } from '../../src/components/Screen';
import { colors, layout, radius, spacing } from '../../src/theme';
import { formatBRL, formatGrams, isoToBr, todayIso } from '../../src/utils/format';

const ACTION_LABEL: Record<OrderStatus, string> = {
  PENDENTE: 'Pendente',
  EM_PRODUCAO: 'Iniciar produção',
  CONCLUIDO: 'Marcar como concluído',
  ENTREGUE: 'Marcar como entregue',
  CANCELADO: 'Cancelar pedido',
};

export default function OrderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const orderId = Number(id);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { bottom } = useSafeAreaInsets();

  const query = useQuery({ queryKey: ['order', orderId], queryFn: () => getOrder(orderId) });

  const refreshLists = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: ['orders'] }),
    queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
  ]);

  const changeStatus = useMutation({
    mutationFn: (status: OrderStatus) => changeOrderStatus(orderId, status),
    onSuccess: async (order) => {
      queryClient.setQueryData(['order', orderId], order);
      await refreshLists();
    },
    onError: (e) => Alert.alert('Não foi possível alterar o status', toApiError(e).message),
  });

  const remove = useMutation({
    mutationFn: () => deleteOrder(orderId),
    onSuccess: async () => {
      await refreshLists();
      queryClient.removeQueries({ queryKey: ['order', orderId] });
      router.back();
    },
    onError: (e) => Alert.alert('Não foi possível excluir', toApiError(e).message),
  });

  const askStatus = (next: OrderStatus) => {
    if (next === 'CANCELADO') {
      Alert.alert('Cancelar pedido', 'O pedido cancelado não poderá mais ser alterado. Continuar?', [
        { text: 'Voltar', style: 'cancel' },
        { text: 'Cancelar pedido', style: 'destructive', onPress: () => changeStatus.mutate(next) },
      ]);
    } else {
      changeStatus.mutate(next);
    }
  };

  const askDelete = () =>
    Alert.alert('Excluir pedido', 'Esta ação não pode ser desfeita.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => remove.mutate() },
    ]);

  const frame = (node: React.ReactNode) => <Screen title="Pedido" back>{node}</Screen>;

  if (query.isPending) return frame(<LoadingState />);
  if (query.isError) {
    return frame(<ErrorState message={toApiError(query.error).message} onRetry={() => void query.refetch()} />);
  }

  const o = query.data;
  const late = isOpen(o.status) && o.prazo < todayIso();
  const busy = changeStatus.isPending || remove.isPending;

  return frame(
    <ScrollView style={styles.container} contentContainerStyle={[layout.content, styles.content, { paddingBottom: spacing.xl + bottom }]}>
      <View style={styles.header}>
        <StatusChip status={o.status} />
        {late ? (
          <View style={styles.lateRow}>
            <Icon source="alert-circle-outline" size={16} color={colors.error} />
            <Text style={styles.late}>Atrasado</Text>
          </View>
        ) : null}
      </View>
      <Text variant="headlineSmall" style={styles.title}>{o.descricao}</Text>
      <Text variant="titleLarge" style={styles.value}>{formatBRL(o.valor)}</Text>

      <List.Section style={styles.card}>
        <List.Item
          title={o.clienteNome}
          description="Cliente"
          left={(p) => <List.Icon {...p} icon="account-outline" />}
          right={(p) => <List.Icon {...p} icon="chevron-right" />}
          onPress={() => router.push({ pathname: '/clients/[id]', params: { id: String(o.clienteId) } })}
        />
        <Divider />
        <List.Item title={o.material} description="Material" left={(p) => <List.Icon {...p} icon="printer-3d-nozzle-outline" />} />
        <Divider />
        <List.Item title={formatGrams(o.pesoGramas)} description="Peso" left={(p) => <List.Icon {...p} icon="weight-gram" />} />
        <Divider />
        <List.Item title={isoToBr(o.prazo)} description="Prazo de entrega" left={(p) => <List.Icon {...p} icon="calendar-outline" />} />
      </List.Section>

      {NEXT_STATUSES[o.status].length > 0 ? (
        <View style={styles.actions}>
          <View style={styles.sectionRow}>
            <Icon source="progress-check" size={18} color={colors.textMuted} />
            <Text variant="labelLarge" style={styles.section}>Andamento</Text>
          </View>
          {NEXT_STATUSES[o.status].map((next) => (
            <Button
              key={next}
              mode={next === 'CANCELADO' ? 'outlined' : 'contained'}
              icon={STATUS_ICON[next]}
              textColor={next === 'CANCELADO' ? colors.error : undefined}
              onPress={() => askStatus(next)}
              disabled={busy}
              loading={changeStatus.isPending && changeStatus.variables === next}
              style={[styles.button, next === 'CANCELADO' && { borderColor: colors.error }]}
              accessibilityLabel={`${ACTION_LABEL[next]} (de ${STATUS_LABEL[o.status]})`}
            >
              {ACTION_LABEL[next]}
            </Button>
          ))}
        </View>
      ) : (
        <Text style={styles.final}>
          Pedido {STATUS_LABEL[o.status].toLowerCase()}: não pode mais ser alterado.</Text>
      )}

      <View style={styles.actions}>
        {canEdit(o.status) ? (
          <Button
            mode="outlined"
            icon="pencil"
            onPress={() => router.push({ pathname: '/orders/form', params: { id: String(o.id) } })}
            disabled={busy}
            style={styles.button}
          >
            Editar
          </Button>
        ) : null}
        {canDelete(o.status) ? (
          <Button
            mode="text"
            icon="delete-outline"
            textColor={colors.error}
            onPress={askDelete}
            loading={remove.isPending}
            disabled={busy}
            style={styles.button}
          >
            Excluir
          </Button>
        ) : null}
      </View>
    </ScrollView>,
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  late: { color: colors.error, fontWeight: '700' },
  lateRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  title: { color: colors.text, marginTop: spacing.md },
  value: { color: colors.primary, fontWeight: '700', marginBottom: spacing.md },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, marginTop: 0 },
  section: { color: colors.textMuted },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.sm },
  actions: { marginTop: spacing.lg },
  button: { marginBottom: spacing.sm },
  final: { color: colors.textMuted, marginTop: spacing.lg, textAlign: 'center' },
});
