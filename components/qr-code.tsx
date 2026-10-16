import QRCodeSvg from 'react-native-qrcode-svg';
import { colors } from '@/theme';

interface QrCodeProps {
    value: string;
    size?: number;
}

export function QrCode({ value, size = 220 }: QrCodeProps) {
    if (!value) return null;

    return <QRCodeSvg value={value} size={size} color={colors.ink} backgroundColor={colors.surface} />;
}
