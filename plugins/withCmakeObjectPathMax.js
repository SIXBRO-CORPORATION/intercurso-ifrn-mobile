const { withAppBuildGradle } = require('@expo/config-plugins');


const CMAKE_OBJECT_PATH_MAX_ARG = '-DCMAKE_OBJECT_PATH_MAX=4096';

module.exports = function withCmakeObjectPathMax(config) {
    return withAppBuildGradle(config, (config) => {
        if (config.modResults.language !== 'groovy') {
            throw new Error(
                'withCmakeObjectPathMax: android/app/build.gradle não está em Groovy — não sei editar esse formato.'
            );
        }

        let contents = config.modResults.contents;

        if (contents.includes(CMAKE_OBJECT_PATH_MAX_ARG)) {
            return config; // já aplicado (plugin é idempotente entre prebuilds)
        }

        const defaultConfigRegex = /defaultConfig\s*\{/;
        if (!defaultConfigRegex.test(contents)) {
            throw new Error(
                'withCmakeObjectPathMax: não encontrei o bloco "defaultConfig {" em android/app/build.gradle.'
            );
        }

        contents = contents.replace(
            defaultConfigRegex,
            `defaultConfig {\n        externalNativeBuild {\n            cmake {\n                arguments "${CMAKE_OBJECT_PATH_MAX_ARG}"\n            }\n        }\n`
        );

        config.modResults.contents = contents;
        return config;
    });
};
