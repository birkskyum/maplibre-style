import solid from 'solid-start/vite';
import {defineConfig} from 'vite';
import staticAdapter from 'solid-start-static';

const config = defineConfig(({command, mode, ssrBuild}) => {

    console.log('mode', mode);

    return {
        base: mode === 'production' ? '/publish-maplibre-style-spec-docs/' : '',
        plugins: [solid({ssr: true, adapter: staticAdapter()})],
    };
});

// const config = defineConfig({
//     base: '/github-repo-name/',
//     plugins: [solid({ssr: true, adapter: staticAdapter()})],
// });

export default config;
