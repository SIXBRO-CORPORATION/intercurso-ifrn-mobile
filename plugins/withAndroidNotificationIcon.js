const fs = require('fs');
const path = require('path');
const { withAndroidManifest, withDangerousMod, AndroidConfig } = require('@expo/config-plugins');

const NOTIFICATION_ICON_NAME = 'ic_notification';
const NOTIFICATION_COLOR_NAME = 'notification_icon_color';
const BRAND_COLOR = '#2F9E41';

function withAndroidNotificationIconAsset(config) {
    return withDangerousMod(config, [
        'android',
        async (config) => {
            const projectRoot = config.modRequest.projectRoot;
            const sourceIcon = path.join(projectRoot, 'assets', 'android-icon-monochrome.png');

            if (!fs.existsSync(sourceIcon)) {
                throw new Error(
                    `withAndroidNotificationIcon: não encontrei ${sourceIcon}. Esse arquivo já é usado como monochromeImage do adaptive icon.`
                );
            }

            const drawableDir = path.join(
                config.modRequest.platformProjectRoot,
                'app',
                'src',
                'main',
                'res',
                'drawable'
            );
            fs.mkdirSync(drawableDir, { recursive: true });
            fs.copyFileSync(sourceIcon, path.join(drawableDir, `${NOTIFICATION_ICON_NAME}.png`));

            const valuesDir = path.join(
                config.modRequest.platformProjectRoot,
                'app',
                'src',
                'main',
                'res',
                'values'
            );
            fs.mkdirSync(valuesDir, { recursive: true });

            const colorsPath = path.join(valuesDir, 'colors.xml');
            const colorEntry = `    <color name="${NOTIFICATION_COLOR_NAME}">${BRAND_COLOR}</color>`;

            if (fs.existsSync(colorsPath)) {
                let contents = fs.readFileSync(colorsPath, 'utf8');
                if (!contents.includes(NOTIFICATION_COLOR_NAME)) {
                    contents = contents.replace('</resources>', `${colorEntry}\n</resources>`);
                    fs.writeFileSync(colorsPath, contents);
                }
            } else {
                fs.writeFileSync(
                    colorsPath,
                    `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n${colorEntry}\n</resources>\n`
                );
            }

            return config;
        },
    ]);
}

function withAndroidNotificationIconManifest(config) {
    return withAndroidManifest(config, (config) => {
        const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults);

        const metaData = [
            {
                $: {
                    'android:name': 'com.google.firebase.messaging.default_notification_icon',
                    'android:resource': `@drawable/${NOTIFICATION_ICON_NAME}`,
                    'tools:replace': 'android:resource',
                },
            },
            {
                $: {
                    'android:name': 'com.google.firebase.messaging.default_notification_color',
                    'android:resource': `@color/${NOTIFICATION_COLOR_NAME}`,
                    'tools:replace': 'android:resource',
                },
            },
        ];

        mainApplication['meta-data'] = mainApplication['meta-data'] || [];

        for (const entry of metaData) {
            const name = entry.$['android:name'];
            mainApplication['meta-data'] = mainApplication['meta-data'].filter(
                (item) => item.$['android:name'] !== name
            );
            mainApplication['meta-data'].push(entry);
        }

        return config;
    });
}

module.exports = function withAndroidNotificationIcon(config) {
    config = withAndroidNotificationIconAsset(config);
    config = withAndroidNotificationIconManifest(config);
    return config;
};