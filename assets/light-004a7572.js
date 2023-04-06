import{i as e,c as o,t as s}from"./entry-client-8aa7ecb6.js";import{M as l}from"./markdown-4e7b44d8.js";import{s as r}from"./v8-31fa6040.js";import{I as n}from"./items-3c541dd5.js";import"./property-34334485.js";import"./subtitle-9d8b2e13.js";const a=s("<div></div>",2);function c(){const i=`# Light
    
A style's \`light\` property provides a global light source for that style. Since this property is the light used to light extruded features, you will only see visible changes to your map style when modifying this property if you are using extrusions.

\`\`\`json
"light": ${JSON.stringify(r.$root.light.example,null,2)}
\`\`\`
`;return(()=>{const t=a.cloneNode(!0);return e(t,o(l,{content:i}),null),e(t,o(n,{headingLevel:"2",get entry(){return r.light}}),null),t})()}export{c as default};
