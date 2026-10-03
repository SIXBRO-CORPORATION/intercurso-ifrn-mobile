import { useColorScheme } from 'react-native';
import { brandPalette } from './colors';

export function useBrandColors() {
    const scheme = useColorScheme();
    return brandPalette[scheme === 'dark' ? 'dark' : 'light'];
}
