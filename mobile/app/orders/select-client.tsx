import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { List, Searchbar } from 'react-native-paper';
import { listClients } from '../../src/api/clients';
import { toApiError } from '../../src/api/http';
import { EmptyState, ErrorState, LoadingState } from '../../src/components/ScreenState';
import { Screen } from '../../src/components/Screen';
import { colors, layout, radius, spacing } from '../../src/theme';
import { setPickedClient } from '../../src/utils/pickerBus';

/** Tela cheia para escolher o cliente do pedido (evita lista dentro de diálogo com teclado). */
export default function SelectClient() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [busca, setBusca] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setBusca(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const query = useQuery({
    queryKey: ['clients', 'picker', busca],
    queryFn: () => listClients(busca, 0),
    // sempre busca de novo: clientes cadastrados agora precisam aparecer
    staleTime: 0,
    gcTime: 0,
  });

  const clients = query.data?.content ?? [];

  let body;
  if (query.isPending) body = <LoadingState />;
  else if (query.isError) body = <ErrorState message={toApiError(query.error).message} onRetry={() => void query.refetch()} />;
  else if (clients.length === 0) {
    body = (
      <EmptyState
        icon={busca ? 'magnify' : 'account-group-outline'}
        message={busca ? `Nenhum cliente encontrado para "${busca}".` : 'Nenhum cliente cadastrado. Cadastre um cliente primeiro.'}
        actionLabel={busca ? undefined : 'Cadastrar cliente'}
        onAction={busca ? undefined : () => router.push('/clients/form')}
      />
    );
  } else {
    body = (
      <FlatList
        data={clients}
        keyExtractor={(c) => String(c.id)}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={[layout.content, styles.list]}
        renderItem={({ item }) => (
          <List.Item
            title={item.nome}
            description={[item.telefone, item.endereco?.cidade].filter(Boolean).join(' · ') || item.email || undefined}
            left={(p) => <List.Icon {...p} icon="account-outline" />}
            style={styles.item}
            onPress={() => {
              setPickedClient({ id: item.id, nome: item.nome });
              router.back();
            }}
          />
        )}
      />
    );
  }

  return (
    <Screen title="Selecionar cliente" back>
      <Searchbar placeholder="Buscar cliente" value={search} onChangeText={setSearch} style={styles.search} />
      {body}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  search: { margin: spacing.md, backgroundColor: colors.surface },
  list: { paddingBottom: 160 },
  item: { backgroundColor: colors.surface, marginHorizontal: spacing.md, marginBottom: spacing.sm, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
});
