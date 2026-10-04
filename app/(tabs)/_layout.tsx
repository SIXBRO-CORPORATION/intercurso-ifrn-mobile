import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useAuth } from '@/hooks/useAuth';

export default function TabsLayout() {
    const { user } = useAuth();
    const canManage = user?.role === 'MONITOR' || user?.role === 'ADMIN';

    return (
        <NativeTabs>
            <NativeTabs.Trigger name="(games)">
                <NativeTabs.Trigger.Icon sf="sportscourt" md="sports_soccer" />
                <NativeTabs.Trigger.Label>Jogos</NativeTabs.Trigger.Label>
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="(teams)">
                <NativeTabs.Trigger.Icon sf="person.3" md="groups" />
                <NativeTabs.Trigger.Label>Times</NativeTabs.Trigger.Label>
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="(management)" hidden={!canManage}>
                <NativeTabs.Trigger.Icon sf="gearshape" md="settings" />
                <NativeTabs.Trigger.Label>Gestão</NativeTabs.Trigger.Label>
            </NativeTabs.Trigger>
        </NativeTabs>
    );
}
