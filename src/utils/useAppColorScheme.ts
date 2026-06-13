import { useColorScheme } from 'react-native';
import Colors from '@/constants/Colors';

type ColorSchemeKey = 'light' | 'dark';

export function useAppColors() {
  const scheme = useColorScheme() as ColorSchemeKey | null;
  return Colors[scheme ?? 'light'];
}
