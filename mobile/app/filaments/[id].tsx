import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Divider, HelperText, List, Text, TextInput } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  addStockEntry, deleteFilament, getFilament, listMovements, MOVIMENTO_LABEL, type Movimentacao,
} from '../../src/api/filaments';
import { toApiError } from '../../src/api/http';
import { ErrorState, LoadingState } from '../../src/components/ScreenState';
import { Screen } from '../../src/components/Screen';
import { colors, fonts, layout, radius, spacing } from '../../src/theme';
import { formatGrams, formatWeight, parseDecimal } from '../../src/utils/format';

const MOVE_ICON: Record<Movimentacao['tipo'], string> = {
  ENTRADA: 'arrow-down-bold-circle-outline',
  SAIDA: 'arrow-up-bold-circle-outline',
  ESTORNO: 'undo-variant',
  AJUSTE: 'tune-variant',
};

const dateTime = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

export default function FilamentDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const filamentId = Number(id);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { bottom } = useSafeAreaInsets();
  const [gramas, setGramas] = useState('');
  const [entryError, setEntryError] = useState<string | null>(null);

  const query = useQuery({ queryKey: ['filament', filamentId], queryFn: () => getFilament(filamentId) });
  const moves = useQuery({ queryKey: ['filament', filamentId, 'movimentacoes'], queryFn: () => listMovements(filamentId) });

  const refresh = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: ['filaments'] }),
    queryClient.invalidateQueries({ queryKey: ['filament', filamentId] }),
    queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
  ]);

  const entry = useMutation({
    mutationFn: (g: number) => addStockEntry(filamentId, g),
    onSuccess: async (f) => {
      queryClient.setQueryData(['filament', filamentId], f);
      setGramas('');
      setEntryError(null);
      await refresh();
    },
    onError: (e) => setEntryError(toApiError(e).message),
  });

  const remove = useMutation({
    mutationFn: () => deleteFilament(filamentId),
    onSuccess: async () => {
      await refresh();
      queryClient.removeQueries({ queryKey: ['filament', filamentId] });
      router.back();
    },
    // Ex.: 409 quando algum pedido usa o filamento
    onError: (e) => Alert.alert('Não foi possível excluir', toApiError(e).message),
  });

  const submitEntry = () => {
    const n = parseDecimal(gramas);
    if (gramas.trim() === '' || !Number.isFinite(n) || n <= 0) {
      setEntryError('Informe uma quantidade maior que zero');
      return;
    }
    setEntryError(null);
    entry.mutate(Math.round(n * 100) / 100);
  };

  const confirmDelete = () =>
    Alert.alert('Excluir filamento', `Deseja excluir ${query.data?.nome}? Esta ação não pode ser desfeita.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => remove.mutate() },
    ]);

  const frame = (node: React.ReactNode) => <Screen title="Filamento" back>{node}</Screen>;

  if (query.isPending) return frame(<LoadingState />);
  if (query.isError) {
    return frame(<ErrorState message={toApiError(query.error).message} onRetry={() => void query.refetch()} />);
  }

  const f = query.data;

  return frame(
    <ScrollView
      style={styles.container}
      contentContainerStyle={[layout.content, styles.content, { paddingBottom: spacing.xl + bottom }]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.balanceBox}>
        <Text variant="bodyMedium" style={styles.muted}>Saldo em estoque</Text>
        <Text style={[styles.balance, f.abaixoDoMinimo && { color: colors.error }]}>{formatWeight(f.quantidadeGramas)}</Text>
        <Text variant="bodySmall" style={styles.muted}>Mínimo: {formatWeight(f.estoqueMinimoGramas)}</Text>
        {f.abaixoDoMinimo ? <Text style={styles.low}>Estoque baixo: hora de repor.</Text> : null}
      </View>

      <List.Section style={styles.card}>
        <List.Item title={f.nome} description="Nome" left={(p) => <List.Icon {...p} icon="warehouse" />} />
        <Divider />
        <List.Item title={f.material} description="Material" left={(p) => <List.Icon {...p} icon="printer-3d-nozzle-outline" />} />
        <Divider />
        <List.Item title={f.cor || '—'} description="Cor" left={(p) => <List.Icon {...p} icon="palette-outline" />} />
        <Divider />
        <List.Item title={f.marca || '—'} description="Marca" left={(p) => <List.Icon {...p} icon="tag-outline" />} />
      </List.Section>

      <Text variant="titleMedium" style={styles.sectionTitle}>Registrar entrada</Text>
      <View style={styles.card2}>
        <TextInput
          label="Quantidade (g)"
          mode="outlined"
          value={gramas}
          onChangeText={setGramas}
          keyboardType="decimal-pad"
          left={<TextInput.Icon icon="weight-gram" />}
          error={!!entryError}
        />
        <HelperText type="error" visible={!!entryError}>{entryError}</HelperText>
        <Button mode="contained" icon="plus" onPress={submitEntry} loading={entry.isPending} disabled={entry.isPending}>
          Registrar entrada
        </Button>
      </View>

      <Text variant="titleMedium" style={styles.sectionTitle}>Histórico</Text>
      <View style={styles.card2}>
        {moves.isPending ? (
          <LoadingState />
        ) : moves.isError ? (
          <ErrorState message={toApiError(moves.error).message} onRetry={() => void moves.refetch()} />
        ) : moves.data.length === 0 ? (
          <Text style={styles.empty}>Nenhuma movimentação ainda.</Text>
        ) : (
          moves.data.map((m, i) => (
            <View key={m.id}>
              {i > 0 ? <Divider /> : null}
              <List.Item
                title={`${MOVIMENTO_LABEL[m.tipo]}: ${m.tipo === 'SAIDA' ? '-' : m.tipo === 'AJUSTE' ? '' : '+'}${formatGrams(m.gramas)}`}
                description={`${dateTime(m.criadoEm)}${m.pedidoId ? ` · pedido #${m.pedidoId}` : ''}`}
                left={(p) => <List.Icon {...p} icon={MOVE_ICON[m.tipo]} />}
                onPress={m.pedidoId ? () => router.push({ pathname: '/orders/[id]', params: { id: String(m.pedidoId) } }) : undefined}
              />
            </View>
          ))
        )}
      </View>

      <View style={styles.actions}>
        <Button mode="outlined" icon="pencil" onPress={() => router.push({ pathname: '/filaments/form', params: { id: String(f.id) } })}>
          Editar
        </Button>
        <Button
          mode="outlined"
          icon="delete-outline"
          textColor={colors.error}
          onPress={confirmDelete}
          loading={remove.isPending}
          disabled={remove.isPending}
          style={styles.delete}
        >
          Excluir
        </Button>
      </View>
    </ScrollView>,
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md },
  muted: { color: colors.textMuted },
  balanceBox: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, gap: spacing.xs, marginBottom: spacing.md },
  balance: { color: colors.text, fontFamily: fonts.semibold, fontSize: 36, lineHeight: 42 },
  low: { color: colors.error, fontFamily: fonts.medium },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, marginTop: 0 },
  card2: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  sectionTitle: { color: colors.text, fontFamily: fonts.semibold, marginTop: spacing.lg, marginBottom: spacing.sm },
  empty: { color: colors.textMuted },
  actions: { marginTop: spacing.lg },
  delete: { marginTop: spacing.sm, borderColor: colors.error },
});
