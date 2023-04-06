import{g as h,a as i,i as r,c as o,t as u}from"./entry-client-25b5b67e.js";import{M as c}from"./markdown-c97785c0.js";import{s}from"./v8-31fa6040.js";import{I as y}from"./items-25cc94fd.js";import"./property-15e7c8eb.js";import"./subtitle-738d91e8.js";const d=u("<div><!#><!/><!#><!/></div>",6);function S(){const l=`# Light
    
A style's \`light\` property provides a global light source for that style. Since this property is the light used to light extruded features, you will only see visible changes to your map style when modifying this property if you are using extrusions.

\`\`\`json
"light": ${JSON.stringify(s.$root.light.example,null,2)}
\`\`\`
`;return(()=>{const t=h(d),n=t.firstChild,[e,a]=i(n.nextSibling),g=e.nextSibling,[p,m]=i(g.nextSibling);return r(t,o(c,{content:l}),e,a),r(t,o(y,{headingLevel:"2",get entry(){return s.light}}),p,m),t})()}export{S as default};
