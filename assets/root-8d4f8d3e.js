import{g as c,a as o,i as r,c as s,t as f}from"./entry-client-700eaf20.js";import{M as d}from"./markdown-2caa340c.js";import{s as x}from"./v8-31fa6040.js";import{I as b}from"./items-9f77d011.js";import"./property-8ad9533c.js";import"./subtitle-ca2c7d28.js";const g=f("<div><!#><!/><!#><!/></div>",6);function M(){const a=`# Root
Root level properties of a MapLibre style specify the map's layers, tile sources and other resources, and default values for the initial camera position when not specified elsewhere.


\`\`\`json
{
    "version": 8,
        "name": "Mapbox Streets",
            "sprite": "mapbox://sprites/mapbox/streets-v8",
                "glyphs": "mapbox://fonts/mapbox/{fontstack}/{range}.pbf",
                    "sources": {... },
    "layers": [...]
}
\`\`\`

`;return(()=>{const e=c(g),n=e.firstChild,[t,i]=o(n.nextSibling),p=t.nextSibling,[l,m]=o(p.nextSibling);return r(e,s(d,{content:a}),t,i),r(e,s(b,{headingLevel:"2",get entry(){return x.$root}}),l,m),e})()}export{M as default};
