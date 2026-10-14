import Svg, { Circle, Path } from 'react-native-svg';
import { colors } from '@/theme';
import type { AppIconProps } from './types';

export function BallIcon({ size = 24, color = colors.ink, strokeWidth = 2.2, style }: AppIconProps) {
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
            <Circle cx="12" cy="12" r="9" />
            <Path d="M12 7.5l3.5 2.6-1.3 4h-4.4l-1.3-4z" />
            <Path d="M12 7.5V4.3" />
            <Path d="M15.5 10.1l3.2-1.9" />
            <Path d="M13.8 14.2l1.9 3" />
            <Path d="M10.2 14.2l-1.9 3" />
            <Path d="M8.5 10.1l-3.2-1.9" />
        </Svg>
    );
}
