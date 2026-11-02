import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, View } from 'react-native';
import { HelperText, TextInput } from 'react-native-paper';
import { takePickedFilament, type PickedFilament } from '../utils/pickerBus';

type Props = {
  selectedName?: string;
  /** Texto de apoio, ex.: saldo atual. */
  hint?: string;
  /** `null` = o usuário escolheu "sem filamento". */
  onSelect: (filament: PickedFilament | null) => void;
};

/** Campo opcional que abre a tela cheia de seleção de filamento. */
export function FilamentPicker({ selectedName, hint, onSelect }: Props) {
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      const picked = takePickedFilament();
      if (picked !== undefined) onSelect(picked);
    }, [onSelect]),
  );

  return (
    <View>
      <Pressable onPress={() => router.push('/orders/select-filament')} accessibilityRole="button">
        <View pointerEvents="none">
          <TextInput
            label="Filamento do estoque (opcional)"
            mode="outlined"
            value={selectedName ?? ''}
            editable={false}
            left={<TextInput.Icon icon="spool" />}
            right={<TextInput.Icon icon="chevron-right" />}
          />
        </View>
      </Pressable>
      <HelperText type="info" visible={!!hint}>{hint}</HelperText>
    </View>
  );
}
