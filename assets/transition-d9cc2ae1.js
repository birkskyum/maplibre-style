import{i as o,c as r,t as e}from"./entry-client-8aa7ecb6.js";import{M as a}from"./markdown-4e7b44d8.js";import{s as n}from"./v8-31fa6040.js";import{I as s}from"./items-3c541dd5.js";import"./property-34334485.js";import"./subtitle-9d8b2e13.js";const l=e("<div></div>",2);function d(){const i=`# Transition
A \`transition\` property controls timing for the interpolation between a transitionable style property's previous value and new value. A style's [root \`transition\`](/root/#transition) property provides global transition defaults for that style.
\`\`\`json
"transition": ${JSON.stringify(n.$root.transition.example,null,2)}
\`\`\`
Any transitionable layer property, may also have its own \`*-transition\` property that defines specific transition timing for that layer property, overriding the global \`transition\` values.

\`\`\`json
"fill-opacity-transition": ${JSON.stringify(n.$root.transition.example,null,2)}
\`\`\`

## Transition Options
`;return(()=>{const t=l.cloneNode(!0);return o(t,r(a,{content:i}),null),o(t,r(s,{headingLevel:"3",get entry(){return n.transition}}),null),t})()}export{d as default};
