import style from './sidebar.module.scss';
import './sidebar.css';
import {useLocation} from 'solid-start';
import {pages} from '~/pages';
import {For} from 'solid-js';

export function Sidebar(props: {
    class?: string;
}) {

    const location = useLocation();
    return (
        <>
            <aside class={`${style.sidebar_outer_container} ${props.class}`}>
                <div class={`${style.sidebar_viewport}`}>
                    <div class={style.sidebar_inner_container}>
                        <div class={style.navItems}>
                            <ul>
                                <For each={pages}>{(page) => (
                                    <li>
                                        <a classList={{'sidebar-link': true, 'active': `${import.meta.env.BASE_URL}${page.path}` === location.pathname}} href={`${import.meta.env.BASE_URL}${page.path}`}>{page.title}</a>
                                    </li>
                                )}
                                </For>
                                <li>
                                    <a  target="_blank" href="https://github.com/maplibre/maplibre-gl-style-spec/blob/main/CHANGELOG.md">Changelog</a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}

// export function Sidebar(props: SidebarProps) {

//     return (
//         <aside class={`${style.sidebar} ${props.class}`}>
//             <h1 class={style.header}>MapLibre Styles Docs</h1>
//             <hr />
//             <div class={style.navItems}>
//                 <ul>
//                     {docs.map((doc) => (
//                         <li>
//                             <a href={doc.link}>{doc.title}</a>
//                         </li>
//                     ))}
//                 </ul>
//             </div>
//         </aside>
//     );
// }
