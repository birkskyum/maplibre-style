import{i as t,c as o,t as s}from"./entry-client-8aa7ecb6.js";import{M as a}from"./markdown-4e7b44d8.js";import{s as n}from"./v8-31fa6040.js";import{I as p}from"./items-3c541dd5.js";import"./property-34334485.js";import"./subtitle-9d8b2e13.js";const i=s("<div></div>",2);function b(){const r=`# Root
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

`;return(()=>{const e=i.cloneNode(!0);return t(e,o(a,{content:r}),null),t(e,o(p,{headingLevel:"2",get entry(){return n.$root}}),null),e})()}export{b as default};
