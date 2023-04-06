import {useLocation} from 'solid-start';
import {TableOfContents} from '../toc/toc';
import style from './maincontent.module.scss';
import '../collapse/collapse.scss';
import {Collapsible} from '@kobalte/core';

interface MainContentProps {
    children?: any;
    class?: string;
}

export function MainContent(props: MainContentProps) {

    const location = useLocation();
    function getPage() {

        let pageSection = (location.pathname.split(import.meta.env.BASE_URL))[1];
        console.log('page', pageSection);

        if (typeof pageSection === 'string') {
            if (!pageSection.endsWith('/')) {
                pageSection = `${pageSection}/`;
            }

            if (!pageSection.startsWith('/')) {
                pageSection = `/${pageSection}`;
            }

            return pageSection;

        } else {
            console.log('page is undefined', pageSection);
            return '';
        }

    }

    return (
        <main class={`${style.mainContentContainer} ${props.class}`} >

            <div class={style.mainContent_paddingContainer}>

                <Collapsible.Root class={'collapsible'}>
                    <Collapsible.Trigger class={'collapsible__trigger'}>Table of contents<i class={`fa-solid fa-chevron-down ${'collapsible__trigger-icon'}`}></i></Collapsible.Trigger>
                    <Collapsible.Content class={'collapsible__content'}><TableOfContents mode='small' /></Collapsible.Content>
                </Collapsible.Root>

                <div class={style.row}>
                    <div id="ContentWindow" class={style.docItems}>{props.children}</div>
                </div>

                <div class={style.scrollToTop} onClick={() => {
                    document.documentElement.scrollTop = 0;
                }}><i class="fa-solid fa-arrow-up"></i></div>

                <a class={style.githubLink} target="_blank"  href="https://github.com/maplibre/maplibre-style"><i class="fa-brands fa-github"></i> MapLibre Style repository</a>
                <a class={style.githubLink} target="_blank" href={`https://github.com/maplibre/maplibre-style/blob/main/docs/src/routes${getPage()}index.tsx`}><i class="fa-brands fa-github"></i> Edit page</a>
            </div>
        </main>
    );
}
