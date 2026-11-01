import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { Button, Dialog, HelperText, List, Portal, Searchbar, TextInput } from 'react-native-paper';
import { listClients } from '../api/clients';
import { toApiError } from '../api/http';
import { spacing } from '../theme';

type Props = {
  /** Nome do cliente selecionado (exibido no campo). */
  selectedName?: string;
  error?: string;
  onSelect: (client: { id: number; nome: string }) => void;
};

export function ClientPicker({ selectedName, error, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [busca, setBusca] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setBusca(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const query = useQuery({
    queryKey: ['clients', 'picker', busca],
    queryFn: () => listClients(busca, 0),
    enabled: open,
  });

  return (
    <>
      <TextInput
        label="Cliente *"
        mode="outlined"
        value={selectedName ?? ''}
        editable={false}
        error={!!error}
        right={<TextInput.Icon icon="menu-down" onPress={() => setOpen(true)} />}
        onPressIn={() => setOpen(true)}
        placeholder="Selecionar cliente"
      />
      <HelperText type="error" visible={!!error}>{error}</HelperText>

      <Portal>
        <Dialog visible={open} onDismiss={() => setOpen(false)} style={styles.dialog}>
          <Dialog.Title>Selecionar cliente</Dialog.Title>
          <Dialog.Content>
            <Searchbar placeholder="Buscar" value={search} onChangeText={setSearch} />
          </Dialog.Content>
          <Dialog.ScrollArea style={styles.scroll}>
            {query.isError ? (
              <HelperText type="error" visible>{toApiError(query.error).message}</HelperText>
            ) : (
              <FlatList
                data={query.data?.content ?? []}
                keyExtractor={(c) => String(c.id)}
                keyboardShouldPersistTaps="handled"
                ListEmptyComponent={
                  <HelperText type="info" visible>
                    {query.isPending ? 'Carregando…' : 'Nenhum cliente encontrado.'}
                  </HelperText>
                }
                renderItem={({ item }) => (
                  <List.Item
                    title={item.nome}
                    description={item.telefone ?? item.endereco?.cidade ?? undefined}
                    onPress={() => {
                      onSelect({ id: item.id, nome: item.nome });
                      setOpen(false);
                    }}
                  />
                )}
              />
            )}
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setOpen(false)}>Fechar</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  dialog: { maxHeight: '80%' },
  scroll: { maxHeight: 320, paddingHorizontal: spacing.sm },
});
