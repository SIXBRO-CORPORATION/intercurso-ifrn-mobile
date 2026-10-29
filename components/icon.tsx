import type { ElementType } from 'react';
import {
    AlertTriangle,
    BarChart3,
    Bell,
    Calendar,
    Camera,
    Check,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Clock,
    Copy,
    FileText,
    Flag,
    Heart,
    Info,
    LayoutGrid,
    Link,
    Lock,
    LogOut,
    Minus,
    MoreVertical,
    Pause,
    Pencil,
    Play,
    Plus,
    QrCode,
    Search,
    Share,
    Shuffle,
    SlidersHorizontal,
    Star,
    Tag,
    Trash2,
    Trophy,
    Undo2,
    User,
    UserPlus,
    Users,
    X,
} from 'lucide-react-native';
import { colors } from '@/theme';
import { BallIcon } from '@/components/icons/ball';
import { BracketIcon } from '@/components/icons/bracket';
import { CardIcon } from '@/components/icons/card';
import type { AppIconProps } from '@/components/icons/types';

const icons = {
    back: ChevronLeft,
    chev_r: ChevronRight,
    chev_d: ChevronDown,
    close: X,
    plus: Plus,
    minus: Minus,
    check: Check,
    search: Search,
    filter: SlidersHorizontal,
    bell: Bell,
    share: Share,
    copy: Copy,
    link: Link,
    qr: QrCode,
    more: MoreVertical,
    flag: Flag,
    clock: Clock,
    calendar: Calendar,
    ball: BallIcon,
    trophy: Trophy,
    users: Users,
    user: User,
    user_plus: UserPlus,
    bracket: BracketIcon,
    grid: LayoutGrid,
    trash: Trash2,
    edit: Pencil,
    play: Play,
    pause: Pause,
    undo: Undo2,
    info: Info,
    warn: AlertTriangle,
    camera: Camera,
    logout: LogOut,
    lock: Lock,
    chart: BarChart3,
    shuffle: Shuffle,
    file: FileText,
    card: CardIcon,
    star: Star,
    tag: Tag,
    heart: Heart,
} as const satisfies Record<string, ElementType<AppIconProps>>;

export type IconName = keyof typeof icons;

type IconProps = AppIconProps & {
    name: IconName;
};

export function Icon({ name, size = 24, color = colors.ink, strokeWidth = 2.2, style }: IconProps) {
    const IconComponent = icons[name];
    return <IconComponent size={size} color={color} strokeWidth={strokeWidth} style={style} />;
}
