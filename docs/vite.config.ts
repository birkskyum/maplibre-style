import solid from 'solid-start/vite';
import {defineConfig} from 'vite';
import staticAdapter from 'solid-start-static';

const config = defineConfig(({command, mode, ssrBuild}) => {
    console.log('command', command);
    console.log('mode', mode);
    console.log('ssrBuild', ssrBuild);

    return {
        base: mode === 'production' ? '/github-repo-name/' : '',
        plugins: [solid({ssr: true, adapter: staticAdapter()})],
    };
});

// const config = defineConfig({
//     base: '/github-repo-name/',
//     plugins: [solid({ssr: true, adapter: staticAdapter()})],
// });

export default config;
