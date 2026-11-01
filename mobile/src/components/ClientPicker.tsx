import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, View } from 'react-native';
import { HelperText, TextInput } from 'react-native-paper';
import { takePickedClient } from '../utils/pickerBus';

type Props = {
  /** Nome do cliente selecionado (exibido no campo). */
  selectedName?: string;
  error?: string;
  onSelect: (client: { id: number; nome: string }) => void;
};

/** Campo que abre a tela cheia de seleção; ao voltar, recebe o cliente escolhido. */
export function ClientPicker({ selectedName, error, onSelect }: Props) {
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      const picked = takePickedClient();
      if (picked) onSelect(picked);
    }, [onSelect]),
  );

  return (
    <View>
      <Pressable onPress={() => router.push('/orders/select-client')} accessibilityRole="button">
        <View pointerEvents="none">
          <TextInput
            label="Cliente *"
            mode="outlined"
            value={selectedName ?? ''}
            editable={false}
            error={!!error}
            right={<TextInput.Icon icon="chevron-right" />}
          />
        </View>
      </Pressable>
      <HelperText type="error" visible={!!error}>{error}</HelperText>
    </View>
  );
}
