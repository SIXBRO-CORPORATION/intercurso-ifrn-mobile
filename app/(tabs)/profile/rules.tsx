import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import Pdf from 'react-native-pdf';
import { Icon } from '@/components/icon';
import { LoadingState, ErrorState } from '@/components/states/screen-states';
import { colors } from '@/theme';

function OpenExternallyButton({ onPress }: { onPress: () => void }) {
    return (
        <Pressable accessibilityRole="button" accessibilityLabel="Abrir no navegador" onPress={onPress} hitSlop={8}>
            <Icon name="share" size={20} color={colors.ink} />
        </Pressable>
    );
}

export default function RulesPreviewScreen() {
    const { url, title } = useLocalSearchParams<{ url: string; title?: string }>();
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    const handleOpenExternally = useCallback(() => {
        if (url) void WebBrowser.openBrowserAsync(url);
    }, [url]);

    const handleError = useCallback(() => {
        setIsLoading(false);
        setHasError(true);
    }, []);

    if (!url) {
        return <ErrorState title="Documento indisponível" description="Não encontramos o link do regulamento." />;
    }

    return (
        <View style={styles.container}>
            <Stack.Screen
                options={{
                    title: title || 'Regulamento',
                    headerRight: () => <OpenExternallyButton onPress={handleOpenExternally} />,
                }}
            />

            {hasError ? (
                <ErrorState
                    title="Não foi possível exibir o documento"
                    description="Você ainda pode abri-lo no navegador do seu dispositivo."
                    onRetry={handleOpenExternally}
                />
            ) : (
                <>
                    <Pdf
                        source={{ uri: url, cache: true }}
                        style={styles.pdf}
                        trustAllCerts={false}
                        onLoadComplete={() => setIsLoading(false)}
                        onError={handleError}
                    />
                    {isLoading ? (
                        <View style={styles.loadingOverlay}>
                            <LoadingState label="Carregando regulamento…" />
                        </View>
                    ) : null}
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    pdf: {
        flex: 1,
        backgroundColor: colors.background,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: colors.background,
    },
});
