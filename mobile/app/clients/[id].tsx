import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Divider, List } from 'react-native-paper';
import { deleteClient, getClient } from '../../src/api/clients';
import { toApiError } from '../../src/api/http';
import { ErrorState, LoadingState } from '../../src/components/ScreenState';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, layout, spacing } from '../../src/theme';

export default function ClientDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const clientId = Number(id);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { bottom } = useSafeAreaInsets();

  const query = useQuery({ queryKey: ['client', clientId], queryFn: () => getClient(clientId) });

  const remove = useMutation({
    mutationFn: () => deleteClient(clientId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['clients'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.removeQueries({ queryKey: ['client', clientId] });
      router.back();
    },
    // Ex.: 409 "Não é possível excluir o cliente X: ele possui pedidos."
    onError: (e) => Alert.alert('Não foi possível excluir', toApiError(e).message),
  });

  const confirmDelete = () =>
    Alert.alert('Excluir cliente', `Deseja excluir ${query.data?.nome}? Esta ação não pode ser desfeita.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => remove.mutate() },
    ]);

  if (query.isPending) return <LoadingState />;
  if (query.isError) {
    return <ErrorState message={toApiError(query.error).message} onRetry={() => void query.refetch()} />;
  }

  const c = query.data;
  const e = c.endereco;
  const rua = [e?.logradouro, e?.numero].filter(Boolean).join(', ') + (e?.complemento ? ` – ${e.complemento}` : '');
  const cidade = [e?.bairro, [e?.cidade, e?.estado].filter(Boolean).join('/')].filter(Boolean).join(' · ');

  return (
    <ScrollView style={styles.container} contentContainerStyle={[layout.content, styles.content, { paddingBottom: spacing.xl + bottom }]}>
      <List.Section style={styles.card}>
        <List.Item title={c.nome} description="Nome" left={(p) => <List.Icon {...p} icon="account-outline" />} />
        <Divider />
        <List.Item title={c.telefone || '—'} description="Telefone" left={(p) => <List.Icon {...p} icon="phone-outline" />} />
        <Divider />
        <List.Item title={c.email || '—'} description="E-mail" left={(p) => <List.Icon {...p} icon="email-outline" />} />
        <Divider />
        <List.Item title={c.cpfCnpj || '—'} description="CPF/CNPJ" left={(p) => <List.Icon {...p} icon="card-account-details-outline" />} />
        <Divider />
        <List.Item
          title={rua || '—'}
          description={[cidade, e?.cep].filter(Boolean).join(' · ') || 'Endereço'}
          titleNumberOfLines={3}
          descriptionNumberOfLines={3}
          left={(p) => <List.Icon {...p} icon="map-marker-outline" />}
        />
      </List.Section>

      <View style={styles.actions}>
        <Button
          mode="contained"
          icon="clipboard-plus-outline"
          onPress={() => router.push({ pathname: '/orders/form', params: { clienteId: String(c.id) } })}
          style={styles.secondary}
        >
          Novo pedido
        </Button>
        <Button
          mode="outlined"
          icon="pencil"
          onPress={() => router.push({ pathname: '/clients/form', params: { id: String(c.id) } })}
        >
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md },
  card: { backgroundColor: colors.surface, borderRadius: 10, marginTop: 0 },
  actions: { marginTop: spacing.lg },
  secondary: { marginBottom: spacing.sm },
  delete: { marginTop: spacing.sm, borderColor: colors.error },
});
