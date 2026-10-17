import { useLocalSearchParams } from 'expo-router';
import { BracketsScreen } from '@/components/brackets/brackets-screen';

export default function BracketsModalityScreen() {
    const { modalityId } = useLocalSearchParams<{ modalityId: string }>();
    return <BracketsScreen initialModalityId={modalityId} />;
}
