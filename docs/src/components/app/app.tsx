import {Sidebar} from '../sidebar/sidebar';
import {MainContent} from '../maincontent/maincontent';
import style from './app.module.scss';
import overlayStyle from './overlay-style.module.scss';

import {Header} from '../header/header';
import {TableOfContents} from '../toc/toc';
import {For, Show, createSignal} from 'solid-js';
import {pages} from '~/pages';
import {A} from 'solid-start';

export const [showNavOverlay, setShowNavOverlay] = createSignal(false);

export function openNav() {
    setShowNavOverlay(true);
}

export function closeNav() {
    setShowNavOverlay(false);
}

export function App(props: { children?: any }) {

    return (
        <>
            <div class={style.app_wrap} id="app_wrap">
                <Show when={showNavOverlay()}>
                    <div id="myNav" class={overlayStyle.overlay}>
                        {/* <a class="closebtn" onClick={closeNav}>&times;</a> */}
                        <div>
                            <Header />
                            <ul>
                                <For each={pages}>{(page) => (
                                    <li>
                                        <A end={true} href={page.path.replace('/', '')} onClick={() => {
                                            setShowNavOverlay(false);
                                        }} class="sidebar-link" >{page.title}</A>
                                    </li>
                                )}
                                </For>
                            </ul>
                        </div>
                    </div>
                </Show>
                <Header />
                <div class={style.container}>
                    <Sidebar />
                    <MainContent>{props.children}</MainContent>

                    {/* <div class={style.onlyShowLg}> */}
                    <TableOfContents mode="large" />
                    {/* </div> */}

                </div>
            </div>
        </>
    );
}

