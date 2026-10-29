import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging';

setBackgroundMessageHandler(getMessaging(), async (remoteMessage) => {
    console.log('[push-notification] Mensagem recebida em background:', remoteMessage.messageId);
});

import 'expo-router/entry';