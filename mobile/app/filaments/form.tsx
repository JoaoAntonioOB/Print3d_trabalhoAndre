import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm, type FieldPath } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { Button, Chip, HelperText, TextInput } from 'react-native-paper';
import { z } from 'zod';
import {
  createFilament, getFilament, updateFilament, type FilamentCreateInput, type FilamentUpdateInput,
} from '../../src/api/filaments';
import { toApiError } from '../../src/api/http';
import { FormScroll } from '../../src/components/FormScroll';
import { Screen } from '../../src/components/Screen';
import { LoadingState } from '../../src/components/ScreenState';
import { spacing } from '../../src/theme';
import { parseDecimal } from '../../src/utils/format';

const round2 = (n: number) => Math.round(n * 100) / 100;
const MATERIALS = ['PLA', 'PETG', 'ABS', 'TPU'];

const nonNegative = (v: string) => {
  const n = parseDecimal(v);
  return v.trim() !== '' && Number.isFinite(n) && n >= 0;
};

const schema = z.object({
  nome: z.string().trim().min(1, 'Informe o nome').max(120, 'Máximo de 120 caracteres'),
  material: z.string().trim().min(1, 'Informe o material').max(30, 'Máximo de 30 caracteres'),
  cor: z.string().trim().max(40, 'Máximo de 40 caracteres'),
  marca: z.string().trim().max(60, 'Máximo de 60 caracteres'),
  quantidadeGramas: z.string(),
  estoqueMinimoGramas: z.string().refine(nonNegative, 'Informe um valor igual ou maior que zero'),
});
type FormData = z.infer<typeof schema>;
type Name = FieldPath<FormData>;

const EMPTY: FormData = { nome: '', material: '', cor: '', marca: '', quantidadeGramas: '', estoqueMinimoGramas: '0' };

const orUndef = (v: string) => (v.trim() === '' ? undefined : v.trim());
const toBr = (n: number) => String(n).replace('.', ',');

export default function FilamentForm() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editingId = id ? Number(id) : undefined;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);

  const existing = useQuery({
    queryKey: ['filament', editingId],
    queryFn: () => getFilament(editingId!),
    enabled: editingId !== undefined,
  });

  const { control, handleSubmit, reset, setError, watch, formState: { errors, isSubmitting } } =
    useForm<FormData>({ resolver: zodResolver(schema), defaultValues: EMPTY });

  useEffect(() => {
    if (existing.data) {
      const f = existing.data;
      reset({
        nome: f.nome, material: f.material, cor: f.cor ?? '', marca: f.marca ?? '',
        quantidadeGramas: toBr(f.quantidadeGramas), estoqueMinimoGramas: toBr(f.estoqueMinimoGramas),
      });
    }
  }, [existing.data, reset]);

  const save = useMutation({
    mutationFn: (data: FormData) => {
      const base: FilamentUpdateInput = {
        nome: data.nome.trim(),
        material: data.material.trim().toUpperCase(),
        cor: orUndef(data.cor),
        marca: orUndef(data.marca),
        estoqueMinimoGramas: round2(parseDecimal(data.estoqueMinimoGramas)),
      };
      if (editingId !== undefined) return updateFilament(editingId, base);
      const input: FilamentCreateInput = { ...base, quantidadeGramas: round2(parseDecimal(data.quantidadeGramas)) };
      return createFilament(input);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['filaments'] }),
        queryClient.invalidateQueries({ queryKey: ['filament'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      ]);
      router.back();
    },
  });

  const submit = handleSubmit(async (data) => {
    setServerError(null);
    if (editingId === undefined && !nonNegative(data.quantidadeGramas)) {
      setError('quantidadeGramas', { message: 'Informe o saldo inicial (pode ser 0)' });
      return;
    }
    try {
      await save.mutateAsync(data);
    } catch (e) {
      const err = toApiError(e);
      err.fieldErrors.forEach((f) => {
        if (f.field in EMPTY) setError(f.field as Name, { message: f.message });
      });
      setServerError(err.message);
    }
  });

  const title = editingId !== undefined ? 'Editar filamento' : 'Novo filamento';

  if (editingId !== undefined && existing.isPending) {
    return <Screen title={title} back><LoadingState /></Screen>;
  }

  const busy = isSubmitting || save.isPending;
  const material = watch('material');
  const msg = (n: Name) => errors[n]?.message;

  return (
    <Screen title={title} back>
      <FormScroll>
        <Controller control={control} name="nome" render={({ field: { value, onChange, onBlur } }) => (
          <View>
            <TextInput label="Nome *" mode="outlined" left={<TextInput.Icon icon="spool" />} value={value} onChangeText={onChange} onBlur={onBlur} error={!!msg('nome')} />
            <HelperText type="error" visible={!!msg('nome')}>{msg('nome')}</HelperText>
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

        <Controller control={control} name="cor" render={({ field: { value, onChange, onBlur } }) => (
          <View>
            <TextInput label="Cor" mode="outlined" left={<TextInput.Icon icon="palette-outline" />} value={value} onChangeText={onChange} onBlur={onBlur} error={!!msg('cor')} />
            <HelperText type="error" visible={!!msg('cor')}>{msg('cor')}</HelperText>
          </View>
        )} />

        <Controller control={control} name="marca" render={({ field: { value, onChange, onBlur } }) => (
          <View>
            <TextInput label="Marca" mode="outlined" left={<TextInput.Icon icon="tag-outline" />} value={value} onChangeText={onChange} onBlur={onBlur} error={!!msg('marca')} />
            <HelperText type="error" visible={!!msg('marca')}>{msg('marca')}</HelperText>
          </View>
        )} />

        {editingId === undefined ? (
          <Controller control={control} name="quantidadeGramas" render={({ field: { value, onChange, onBlur } }) => (
            <View>
              <TextInput label="Saldo inicial (g) *" mode="outlined" left={<TextInput.Icon icon="weight-gram" />} value={value} onChangeText={onChange} onBlur={onBlur}
                keyboardType="decimal-pad" error={!!msg('quantidadeGramas')} />
              <HelperText type="error" visible={!!msg('quantidadeGramas')}>{msg('quantidadeGramas')}</HelperText>
            </View>
          )} />
        ) : null}

        <Controller control={control} name="estoqueMinimoGramas" render={({ field: { value, onChange, onBlur } }) => (
          <View>
            <TextInput label="Estoque mínimo (g) *" mode="outlined" left={<TextInput.Icon icon="alert-outline" />} value={value} onChangeText={onChange} onBlur={onBlur}
              keyboardType="decimal-pad" error={!!msg('estoqueMinimoGramas')} />
            <HelperText type="error" visible={!!msg('estoqueMinimoGramas')}>{msg('estoqueMinimoGramas')}</HelperText>
          </View>
        )} />

        <HelperText type="error" visible={!!serverError}>{serverError}</HelperText>
        <Button mode="contained" icon="content-save-outline" onPress={() => void submit()} loading={busy} disabled={busy}>
          {editingId !== undefined ? 'Salvar alterações' : 'Cadastrar filamento'}
        </Button>
      </FormScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.sm },
  chip: { marginRight: spacing.sm, marginBottom: spacing.xs },
});
