import Svg, { Circle, Path } from 'react-native-svg';
import { colors } from '@/theme';
import type { AppIconProps } from './types';

export function BracketIcon({ size = 24, color = colors.ink, strokeWidth = 2.2, style }: AppIconProps) {
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
            <Path d="M4 5h5v6" />
            <Path d="M4 19h5v-6" />
            <Path d="M9 12h10" />
            <Circle cx="20.5" cy="12" r="1.4" fill={color} stroke="none" />
        </Svg>
    );
}
