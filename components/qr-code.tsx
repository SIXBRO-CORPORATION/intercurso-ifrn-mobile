import { useMemo } from 'react';
import Svg, { Rect } from 'react-native-svg';
import { encodeQrMatrix } from '@/utils/qr-code';
import { colors, radius } from '@/theme';

const QUIET_ZONE_MODULES = 2;

interface QrCodeProps {
    value: string;
    size?: number;
}

/**
 * QR Code escaneável renderizado em SVG puro (sem lib de QR — ver
 * `utils/qr-code.ts`). Retorna `null` quando `value` não couber no encoder
 * (ver limite em `encodeQrMatrix`); quem chama decide o que mostrar no lugar.
 */
export function QrCode({ value, size = 220 }: QrCodeProps) {
    const matrix = useMemo(() => encodeQrMatrix(value), [value]);

    if (!matrix) return null;

    const totalModules = matrix.length + QUIET_ZONE_MODULES * 2;
    const cell = size / totalModules;

    return (
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} accessibilityIgnoresInvertColors>
            <Rect x={0} y={0} width={size} height={size} rx={radius.sm} fill={colors.surface} />
            {matrix.map((row, r) =>
                row.map((dark, c) =>
                    dark ? (
                        <Rect
                            key={`${r}-${c}`}
                            x={(c + QUIET_ZONE_MODULES) * cell}
                            y={(r + QUIET_ZONE_MODULES) * cell}
                            width={cell}
                            height={cell}
                            fill={colors.ink}
                        />
                    ) : null
                )
            )}
        </Svg>
    );
}
