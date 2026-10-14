import Svg, { Rect } from 'react-native-svg';
import { colors } from '@/theme';
import type { AppIconProps } from './types';

export function CardIcon({ size = 24, color = colors.ink, strokeWidth = 2.2, style }: AppIconProps) {
    return (
        <Svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={style}
        >
            <Rect x="6" y="3" width="12" height="18" rx="2" />
        </Svg>
    );
}
