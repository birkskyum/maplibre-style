import{g as f,a as o,i as r,c as e,t as g}from"./entry-client-e88a74e3.js";import{M as c}from"./markdown-d1a514b5.js";import{s as n}from"./v8-31fa6040.js";import{I as d}from"./items-a0160cb5.js";import"./property-1f5fd5ca.js";import"./subtitle-53262955.js";const u=g("<div><!#><!/><!#><!/></div>",6);function S(){const a=`# Transition
A \`transition\` property controls timing for the interpolation between a transitionable style property's previous value and new value. A style's [root \`transition\`](/root/#transition) property provides global transition defaults for that style.
\`\`\`json
"transition": ${JSON.stringify(n.$root.transition.example,null,2)}
\`\`\`
Any transitionable layer property, may also have its own \`*-transition\` property that defines specific transition timing for that layer property, overriding the global \`transition\` values.

\`\`\`json
"fill-opacity-transition": ${JSON.stringify(n.$root.transition.example,null,2)}
\`\`\`

## Transition Options
`;return(()=>{const t=f(u),s=t.firstChild,[i,l]=o(s.nextSibling),p=i.nextSibling,[m,y]=o(p.nextSibling);return r(t,e(c,{content:a}),i,l),r(t,e(d,{headingLevel:"3",get entry(){return n.transition}}),m,y),t})()}export{S as default};
