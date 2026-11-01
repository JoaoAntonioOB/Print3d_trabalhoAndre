import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Controller, useForm, type FieldPath } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { Button, Chip, HelperText, TextInput } from 'react-native-paper';
import { z } from 'zod';
import { getClient } from '../../src/api/clients';
import { toApiError } from '../../src/api/http';
import { canEdit, createOrder, getOrder, updateOrder, type OrderInput } from '../../src/api/orders';
import { FormScroll } from '../../src/components/FormScroll';
import { ClientPicker } from '../../src/components/ClientPicker';
import { LoadingState } from '../../src/components/ScreenState';
import { colors, spacing } from '../../src/theme';
import { brToIso, isoToBr, maskDate, parseDecimal, todayIso } from '../../src/utils/format';

const round2 = (n: number) => Math.round(n * 100) / 100;

const MATERIALS = ['PLA', 'PETG', 'ABS', 'TPU'];

const positive = (v: string) => {
  const n = parseDecimal(v);
  return v.trim() !== '' && Number.isFinite(n) && n > 0;
};

const schema = z.object({
  clienteId: z.number('Selecione um cliente'),
  descricao: z.string().trim().min(1, 'Informe a descrição').max(500, 'Máximo de 500 caracteres'),
  material: z.string().trim().min(1, 'Informe o material').max(30, 'Máximo de 30 caracteres'),
  pesoGramas: z.string().refine(positive, 'Informe um peso maior que zero'),
  valor: z.string().refine(positive, 'Informe um valor maior que zero'),
  prazo: z.string().refine((v) => brToIso(v) !== null, 'Data inválida (DD/MM/AAAA)'),
});
type FormData = z.infer<typeof schema>;
type Name = FieldPath<FormData>;

const EMPTY = {
  clienteId: undefined as unknown as number,
  descricao: '', material: '', pesoGramas: '', valor: '', prazo: '',
} satisfies FormData;

export default function OrderForm() {
  const { id, clienteId: presetClientId } = useLocalSearchParams<{ id?: string; clienteId?: string }>();
  const editingId = id ? Number(id) : undefined;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [clientName, setClientName] = useState<string | undefined>();
  const [serverError, setServerError] = useState<string | null>(null);

  const existing = useQuery({
    queryKey: ['order', editingId],
    queryFn: () => getOrder(editingId!),
    enabled: editingId !== undefined,
  });

  const { control, handleSubmit, reset, setValue, setError, watch, formState: { errors, isSubmitting } } =
    useForm<FormData>({ resolver: zodResolver(schema), defaultValues: EMPTY });

  useEffect(() => {
    if (existing.data) {
      const o = existing.data;
      reset({
        clienteId: o.clienteId, descricao: o.descricao, material: o.material,
        pesoGramas: String(o.pesoGramas).replace('.', ','), valor: o.valor.toFixed(2).replace('.', ','),
        prazo: isoToBr(o.prazo),
      });
      setClientName(o.clienteNome);
    }
  }, [existing.data, reset]);

  // "Novo pedido" a partir da tela do cliente
  useEffect(() => {
    if (!presetClientId || editingId !== undefined) return;
    getClient(Number(presetClientId))
      .then((c) => {
        setValue('clienteId', c.id, { shouldValidate: true });
        setClientName(c.nome);
      })
      .catch(() => undefined);
  }, [presetClientId, editingId, setValue]);

  const onSelectClient = useCallback(
    (c: { id: number; nome: string }) => {
      setValue('clienteId', c.id, { shouldValidate: true });
      setClientName(c.nome);
    },
    [setValue],
  );

  const save = useMutation({
    mutationFn: (input: OrderInput) =>
      editingId !== undefined ? updateOrder(editingId, input) : createOrder(input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['orders'] }),
        queryClient.invalidateQueries({ queryKey: ['order'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      ]);
      router.back();
    },
  });

  const submit = handleSubmit(async (data) => {
    setServerError(null);
    const prazo = brToIso(data.prazo)!;
    // Regra da API: prazo não pode estar no passado na criação.
    if (editingId === undefined && prazo < todayIso()) {
      setError('prazo', { message: 'O prazo não pode estar no passado' });
      return;
    }
    try {
      await save.mutateAsync({
        clienteId: data.clienteId,
        descricao: data.descricao.trim(),
        material: data.material.trim().toUpperCase(),
        pesoGramas: round2(parseDecimal(data.pesoGramas)),
        valor: round2(parseDecimal(data.valor)),
        prazo,
      });
    } catch (e) {
      const err = toApiError(e);
      err.fieldErrors.forEach((f) => {
        if (f.field in EMPTY) setError(f.field as Name, { message: f.message });
      });
      setServerError(err.message);
    }
  });

  if (editingId !== undefined && existing.isPending) return <LoadingState />;
  if (existing.data && !canEdit(existing.data.status)) {
    return <HelperText type="error" visible style={styles.blocked}>Este pedido não pode mais ser editado.</HelperText>;
  }

  const busy = isSubmitting || save.isPending;
  const material = watch('material');
  const msg = (n: Name) => errors[n]?.message;

  return (
    <>
      <Stack.Screen options={{ title: editingId !== undefined ? 'Editar pedido' : 'Novo pedido' }} />
      <FormScroll>
        <ClientPicker
          selectedName={clientName}
          error={msg('clienteId')}
          onSelect={onSelectClient}
        />

        <Controller control={control} name="descricao" render={({ field: { value, onChange, onBlur } }) => (
          <View>
            <TextInput label="Descrição *" mode="outlined" left={<TextInput.Icon icon="text-box-outline" />} value={value} onChangeText={onChange} onBlur={onBlur}
              multiline error={!!msg('descricao')} />
            <HelperText type="error" visible={!!msg('descricao')}>{msg('descricao')}</HelperText>
          </View>
        )} />

        <Controller control={control} name="material" render={({ field: { value, onChange, onBlur } }) => (
          <View>
            <View style={styles.chips}>
              {MATERIALS.map((m) => (
                <Chip key={m} icon="cube-outline" selected={material?.toUpperCase() === m} onPress={() => onChange(m)} style={styles.chip}>{m}</Chip>
              ))}
            </View>
            <TextInput label="Material *" mode="outlined" left={<TextInput.Icon icon="cube-outline" />} value={value} onChangeText={onChange} onBlur={onBlur}
              autoCapitalize="characters" error={!!msg('material')} />
            <HelperText type="error" visible={!!msg('material')}>{msg('material')}</HelperText>
          </View>
        )} />

        <Controller control={control} name="pesoGramas" render={({ field: { value, onChange, onBlur } }) => (
          <View>
            <TextInput label="Peso (g) *" mode="outlined" left={<TextInput.Icon icon="weight-gram" />} value={value} onChangeText={onChange} onBlur={onBlur}
              keyboardType="decimal-pad" error={!!msg('pesoGramas')} />
            <HelperText type="error" visible={!!msg('pesoGramas')}>{msg('pesoGramas')}</HelperText>
          </View>
        )} />

        <Controller control={control} name="valor" render={({ field: { value, onChange, onBlur } }) => (
          <View>
            <TextInput label="Valor (R$) *" mode="outlined" value={value} onChangeText={onChange} onBlur={onBlur}
              keyboardType="decimal-pad" left={<TextInput.Icon icon="cash" />} right={<TextInput.Affix text="R$" />} error={!!msg('valor')} />
            <HelperText type="error" visible={!!msg('valor')}>{msg('valor')}</HelperText>
          </View>
        )} />

        <Controller control={control} name="prazo" render={({ field: { value, onChange, onBlur } }) => (
          <View>
            <TextInput label="Prazo de entrega *" mode="outlined" left={<TextInput.Icon icon="calendar-outline" />} value={value}
              onChangeText={(t) => onChange(maskDate(t))} onBlur={onBlur}
              placeholder="DD/MM/AAAA" keyboardType="number-pad" error={!!msg('prazo')} />
            <HelperText type="error" visible={!!msg('prazo')}>{msg('prazo')}</HelperText>
          </View>
        )} />

        <HelperText type="error" visible={!!serverError}>{serverError}</HelperText>
        <Button mode="contained" icon={editingId !== undefined ? 'content-save-outline' : 'clipboard-plus-outline'} onPress={() => void submit()} loading={busy} disabled={busy}>
          {editingId !== undefined ? 'Salvar alterações' : 'Criar pedido'}
        </Button>
      </FormScroll>
    </>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.sm },
  chip: { marginRight: spacing.sm, marginBottom: spacing.xs },
  blocked: { margin: spacing.lg },
});
