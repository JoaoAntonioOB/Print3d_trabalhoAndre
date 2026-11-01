import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm, type Control, type FieldPath } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { Button, HelperText, Icon, Text, TextInput } from 'react-native-paper';
import { z } from 'zod';
import { createClient, getClient, lookupCep, lookupCnpj, updateClient, type Client, type ClientInput } from '../../src/api/clients';
import { toApiError } from '../../src/api/http';
import { FormScroll } from '../../src/components/FormScroll';
import { Screen } from '../../src/components/Screen';
import { LoadingState } from '../../src/components/ScreenState';
import { fonts, colors, spacing } from '../../src/theme';
import { maskCep, maskCpfCnpj, maskPhone, onlyDigits } from '../../src/utils/masks';

const schema = z.object({
  nome: z.string().trim().min(1, 'Informe o nome').max(160, 'Máximo de 160 caracteres'),
  email: z.string().trim().max(160).refine((v) => v === '' || z.string().email().safeParse(v).success, 'E-mail inválido'),
  telefone: z.string().refine((v) => v === '' || [10, 11].includes(onlyDigits(v).length), 'Telefone inválido (DDD + número)'),
  cpfCnpj: z.string().refine((v) => v === '' || [11, 14].includes(onlyDigits(v).length), 'CPF (11) ou CNPJ (14 dígitos)'),
  cep: z.string().refine((v) => v === '' || onlyDigits(v).length === 8, 'CEP deve ter 8 dígitos'),
  logradouro: z.string().max(160),
  numero: z.string().max(20),
  complemento: z.string().max(80),
  bairro: z.string().max(80),
  cidade: z.string().max(80),
  estado: z.string().refine((v) => v === '' || /^[A-Za-z]{2}$/.test(v), 'Use a UF com 2 letras'),
});
type FormData = z.infer<typeof schema>;
type Name = FieldPath<FormData>;
type InputHandle = { focus: () => void };

const EMPTY: FormData = {
  nome: '', email: '', telefone: '', cpfCnpj: '', cep: '',
  logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '',
};

const orUndef = (v: string) => (v.trim() === '' ? undefined : v.trim());

function toInput(f: FormData): ClientInput {
  return {
    nome: f.nome.trim(),
    email: orUndef(f.email),
    telefone: orUndef(f.telefone),
    cpfCnpj: orUndef(f.cpfCnpj),
    endereco: {
      cep: orUndef(f.cep),
      logradouro: orUndef(f.logradouro),
      numero: orUndef(f.numero),
      complemento: orUndef(f.complemento),
      bairro: orUndef(f.bairro),
      cidade: orUndef(f.cidade),
      estado: orUndef(f.estado)?.toUpperCase(),
    },
  };
}

function fromClient(c: Client): FormData {
  const e = c.endereco ?? {};
  return {
    nome: c.nome ?? '', email: c.email ?? '', telefone: c.telefone ?? '', cpfCnpj: c.cpfCnpj ?? '',
    cep: e.cep ?? '', logradouro: e.logradouro ?? '', numero: e.numero ?? '', complemento: e.complemento ?? '',
    bairro: e.bairro ?? '', cidade: e.cidade ?? '', estado: e.estado ?? '',
  };
}

type FieldProps = {
  control: Control<FormData>;
  name: Name;
  label: string;
  error?: string;
  mask?: (v: string) => string;
  inputRef?: React.Ref<InputHandle>;
  onChangeExtra?: (v: string) => void;
  icon?: string;
} & Omit<React.ComponentProps<typeof TextInput>, 'value' | 'onChangeText' | 'error' | 'ref'>;

function Field({ control, name, label, error, mask, inputRef, onChangeExtra, icon, ...rest }: FieldProps) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange, onBlur } }) => (
        <View>
          <TextInput
            ref={inputRef as never}
            label={label}
            mode="outlined"
            value={value}
            onBlur={onBlur}
            onChangeText={(t) => {
              const v = mask ? mask(t) : t;
              onChange(v);
              onChangeExtra?.(v);
            }}
            error={!!error}
            left={icon ? <TextInput.Icon icon={icon} /> : undefined}
            {...rest}
          />
          <HelperText type="error" visible={!!error}>{error}</HelperText>
        </View>
      )}
    />
  );
}

export default function ClientForm() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editingId = id ? Number(id) : undefined;
  const router = useRouter();
  const queryClient = useQueryClient();
  const numeroRef = useRef<InputHandle>(null);
  const lastCep = useRef('');
  const lastCnpj = useRef('');
  const [cnpjLoading, setCnpjLoading] = useState(false);
  const [cnpjMessage, setCnpjMessage] = useState<{ text: string; warn: boolean } | null>(null);
  const [cepLoading, setCepLoading] = useState(false);
  const [cepMessage, setCepMessage] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const existing = useQuery({
    queryKey: ['client', editingId],
    queryFn: () => getClient(editingId!),
    enabled: editingId !== undefined,
  });

  const { control, handleSubmit, reset, setValue, getValues, setError, formState: { errors, isSubmitting } } =
    useForm<FormData>({ resolver: zodResolver(schema), defaultValues: EMPTY });

  useEffect(() => {
    if (existing.data) {
      reset(fromClient(existing.data));
      lastCep.current = onlyDigits(existing.data.endereco?.cep ?? '');
      lastCnpj.current = onlyDigits(existing.data.cpfCnpj ?? '');
    }
  }, [existing.data, reset]);

  const save = useMutation({
    mutationFn: (input: ClientInput) =>
      editingId !== undefined ? updateClient(editingId, input) : createClient(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['clients'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      if (editingId !== undefined) await queryClient.invalidateQueries({ queryKey: ['client', editingId] });
      router.back();
    },
  });

  // CEP completo -> consulta a API (que consulta a ViaCEP) e preenche o endereço.
  // Falha nunca bloqueia o cadastro: o usuário pode preencher manualmente.
  const onCepChange = async (masked: string) => {
    const digits = onlyDigits(masked);
    setCepMessage(null);
    if (digits.length !== 8 || digits === lastCep.current) return;
    lastCep.current = digits;
    setCepLoading(true);
    try {
      const r = await lookupCep(digits);
      setValue('logradouro', r.logradouro ?? '', { shouldValidate: true });
      setValue('bairro', r.bairro ?? '');
      setValue('cidade', r.cidade ?? '');
      setValue('estado', r.estado ?? '', { shouldValidate: true });
      setTimeout(() => numeroRef.current?.focus(), 100);
    } catch (e) {
      lastCep.current = '';
      setCepMessage(toApiError(e).message);
    } finally {
      setCepLoading(false);
    }
  };

  // CNPJ completo (14 dígitos) -> consulta a API (que consulta a BrasilAPI) e preenche só o que estiver vazio.
  // Falha nunca bloqueia o cadastro.
  const onCpfCnpjChange = async (masked: string) => {
    const digits = onlyDigits(masked);
    setCnpjMessage(null);
    if (digits.length !== 14 || digits === lastCnpj.current) return;
    lastCnpj.current = digits;
    setCnpjLoading(true);
    try {
      const r = await lookupCnpj(digits);
      const fill = (name: Name, value?: string | null) => {
        if (value && !getValues(name).trim()) setValue(name, value, { shouldValidate: true });
      };
      fill('nome', r.nomeFantasia || r.razaoSocial);
      fill('email', r.email);
      const phone = onlyDigits(r.telefone ?? '');
      if (phone.length === 10 || phone.length === 11) fill('telefone', maskPhone(phone));
      const e = r.endereco;
      const cepDigits = onlyDigits(e.cep ?? '');
      if (cepDigits.length === 8) {
        if (!getValues('cep').trim()) lastCep.current = cepDigits; // evita nova consulta de CEP
        fill('cep', maskCep(cepDigits));
      }
      fill('logradouro', e.logradouro);
      fill('numero', e.numero);
      fill('complemento', e.complemento);
      fill('bairro', e.bairro);
      fill('cidade', e.cidade);
      fill('estado', e.estado?.toUpperCase());
      const inactive = r.situacao && r.situacao.toUpperCase() !== 'ATIVA';
      setCnpjMessage({
        text: inactive
          ? `Atenção: situação cadastral ${r.situacao}. Dados preenchidos, confira antes de salvar.`
          : 'Dados da empresa preenchidos. Confira antes de salvar.',
        warn: !!inactive,
      });
    } catch (err) {
      lastCnpj.current = '';
      setCnpjMessage({ text: toApiError(err).message, warn: true });
    } finally {
      setCnpjLoading(false);
    }
  };

  const submit = handleSubmit(async (data) => {
    setServerError(null);
    try {
      await save.mutateAsync(toInput(data));
    } catch (e) {
      const err = toApiError(e);
      err.fieldErrors.forEach((f) => {
        const name = f.field.replace(/^endereco\./, '') as Name;
        if (name in EMPTY) setError(name, { message: f.message });
      });
      setServerError(err.message);
    }
  });

  const title = editingId !== undefined ? 'Editar cliente' : 'Novo cliente';

  if (editingId !== undefined && existing.isPending) {
    return <Screen title={title} back><LoadingState /></Screen>;
  }

  const busy = isSubmitting || save.isPending;
  const msg = (n: Name) => errors[n]?.message;

  return (
    <Screen title={title} back>
      <FormScroll>
        <Field control={control} name="nome" label="Nome *" icon="account-outline" error={msg('nome')} autoCapitalize="words" />
        <Field control={control} name="telefone" label="Telefone" icon="phone-outline" error={msg('telefone')} mask={maskPhone} keyboardType="phone-pad" />
        <Field control={control} name="email" label="E-mail" icon="email-outline" error={msg('email')} autoCapitalize="none" keyboardType="email-address" />
        <Field
          control={control}
          name="cpfCnpj"
          label="CPF/CNPJ"
          icon="card-account-details-outline"
          error={msg('cpfCnpj')}
          mask={maskCpfCnpj}
          keyboardType="number-pad"
          onChangeExtra={(v) => void onCpfCnpjChange(v)}
          right={cnpjLoading ? <TextInput.Icon icon="loading" /> : undefined}
        />
        <HelperText type={cnpjMessage?.warn ? 'error' : 'info'} visible={!!cnpjMessage} style={styles.cepMessage}>
          {cnpjMessage?.text}
        </HelperText>

        <View style={styles.sectionRow}>
          <Icon source="map-marker-radius-outline" size={20} color={colors.primary} />
          <Text variant="titleSmall" style={styles.section}>Endereço</Text>
        </View>
        <Field
          control={control}
          name="cep"
          label="CEP"
          icon="map-marker-outline"
          error={msg('cep')}
          mask={maskCep}
          keyboardType="number-pad"
          onChangeExtra={(v) => void onCepChange(v)}
          right={cepLoading ? <TextInput.Icon icon="loading" /> : undefined}
        />
        <HelperText type="info" visible={!!cepMessage} style={styles.cepMessage}>{cepMessage}</HelperText>
        <Field control={control} name="logradouro" label="Logradouro" icon="road-variant" error={msg('logradouro')} />
        <Field control={control} name="numero" label="Número" icon="numeric" error={msg('numero')} inputRef={numeroRef} />
        <Field control={control} name="complemento" label="Complemento" icon="home-plus-outline" error={msg('complemento')} />
        <Field control={control} name="bairro" label="Bairro" icon="home-group" error={msg('bairro')} />
        <Field control={control} name="cidade" label="Cidade" icon="city-variant-outline" error={msg('cidade')} />
        <Field control={control} name="estado" label="UF" icon="map-outline" error={msg('estado')} autoCapitalize="characters" maxLength={2} />

        <HelperText type="error" visible={!!serverError}>{serverError}</HelperText>
        <Button mode="contained" icon={editingId !== undefined ? 'content-save-outline' : 'account-plus-outline'} onPress={() => void submit()} loading={busy} disabled={busy}>
          {editingId !== undefined ? 'Salvar alterações' : 'Cadastrar'}
        </Button>
      </FormScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { color: colors.text, fontFamily: fonts.semibold },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md, marginBottom: spacing.sm },
  cepMessage: { marginTop: -spacing.md },
});
