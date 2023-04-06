import{s as m,b as f,d as b,t as g,i as a,c as e}from"./entry-client-8aa7ecb6.js";import{M as r}from"./markdown-4e7b44d8.js";import{s as d}from"./v8-31fa6040.js";import{I as n}from"./items-3c541dd5.js";import{C as i}from"./caption-f0432936.js";import"./property-34334485.js";import"./subtitle-9d8b2e13.js";const v="_image_1st6w_1",w={image:v},x=g('<img alt="">',1);function s({imageId:c}){const t=`/img/src/${c}.png`;return(()=>{const u=x.cloneNode(!0);return m(u,"src",t),f(()=>b(u,w.image)),u})()}function p(c,t){const h=c.map(l=>({ref:d[`${l}_${t}`],kind:l,section:`${l}-${t}`})).reduce((l,o)=>(Object.keys(o.ref).forEach(y=>{o.ref[y].kind=o.kind,o.ref[y].section=o.section,l[y]=o.ref[y]}),l),{});return Object.keys(h).sort().reduce((l,o)=>(l[o]=h[o],l),{})}const k=g('<div><a id="layout-property" class="anchor"></a><a id="paint-property" class="anchor"></a><hr class="my36"></div>',7);function A(){const c=["background","fill","line","symbol","raster","circle","fill-extrusion","heatmap","hillshade"];return(()=>{const t=k.cloneNode(!0),u=t.firstChild;return u.nextSibling.nextSibling,a(t,e(r,{get content(){return`# Layers

A style's \`layers\` property lists all the layers available in that style. The type of layer is specified by the \`"type"\` property, and must be one of ${c.map(l=>`\`${l}\``).join(", ")}.

Except for layers of the \`background\` type, each layer needs to refer to a source. Layers take the data that they get from a source, optionally filter features, and then define how those features are styled.

\`\`\`json
"layers": ${JSON.stringify(d.$root.layers.example,null,2)}
\`\`\`

## Layer properties
`}}),u),a(t,e(n,{get entry(){return d.layer}}),u),a(t,e(r,{content:`
Layers have two sub-properties that determine how data from that layer is rendered: \`layout\` and \`paint\` properties.

_Layout properties_ appear in the layer's \`"layout"\` object. They are applied early in the rendering process and define how data for that layer is passed to the GPU. Changes to a layout property require an asynchronous "layout" step.

_Paint properties_ are applied later in the rendering process. Paint properties appear in the layer's \`"paint"\` object. Changes to a paint property are cheap and happen synchronously.

## background

The \`background\` style layer covers the entire map. Use a background style layer to configure a color or pattern to show below all other map content. If the background layer is transparent or omitted from the style, any part of the map view that does not show another style layer is transparent.
`}),null),a(t,e(s,{imageId:"layer-background",alt:"Vintage map style with a brown halftone background pattern."}),null),a(t,e(i,{get children(){return e(r,{content:"\nThe [Vintage map style](https://blog.mapbox.com/designing-the-vintage-style-in-mapbox-studio-9da4aa2a627f) uses a custom SVG [`background-pattern`](/maplibre-gl-js-docs/style-spec/layers/#paint-background-background-pattern) to achieve a textured vintage look.\n"})}}),null),a(t,e(n,{headingLevel:"3",get entry(){return p(["layout","paint"],"background")}}),null),a(t,e(r,{content:`
## fill

A \`fill\` style layer renders one or more filled (and optionally stroked) polygons on a map. You can use a fill layer to configure the visual appearance of polygon or multipolygon features.
`}),null),a(t,e(s,{imageId:"layer-fill",alt:"Map of Washington, D.C. with a purple isochrone polygon in the center."}),null),a(t,e(i,{get children(){return e(r,{content:"\nThis map of Washington, D.C. uses the [`fill-opacity`](/maplibre-gl-js-docs/style-spec/layers/#paint-fill-fill-opacity) paint property to render a semi-transparent polygon, showing how far a person can walk from the center of the city in ten minutes.\n"})}}),null),a(t,e(n,{headingLevel:"3",get entry(){return p(["layout","paint"],"fill")}}),null),a(t,e(r,{content:`
## line

A \`line\` style layer renders one or more stroked polylines on the map. You can use a line layer to configure the visual appearance of polyline or multipolyline features.
`}),null),a(t,e(s,{imageId:"layer-line",alt:"Outdoors style map with a red line showing a hiking path."}),null),a(t,e(i,{get children(){return e(r,{content:"\nThis map of a [Strava](https://blog.mapbox.com/strava-launches-gorgeous-new-outdoor-maps-977c74cf37f9) user's hike through Grand Teton National Park uses the [`line-color`](/maplibre-gl-js-docs/style-spec/layers/#paint-line-line-color) and [`line-width`](/maplibre-gl-js-docs/style-spec/layers/#paint-line-line-width) paint properties to style the strong red line of the user's route.\n"})}}),null),a(t,e(n,{headingLevel:"3",get entry(){return p(["layout","paint"],"line")}}),null),a(t,e(r,{content:`
## symbol

A \`symbol\` style layer renders icon and text labels at points or along lines on a map. You can use a symbol layer to configure the visual appearance of labels for features in vector tiles.
`}),null),a(t,e(s,{imageId:"layer-symbol",alt:"Map with thirty shopping bag icons, color-coded red, orange, and green."}),null),a(t,e(i,{get children(){return e(r,{content:"\nThis map of Denver area businesses uses the [`icon-image`](/maplibre-gl-js-docs/style-spec/layers/#layout-symbol-icon-image) layout property to use a custom image as an icon in a symbol layer.\n"})}}),null),a(t,e(n,{headingLevel:"3",get entry(){return p(["layout","paint"],"symbol")}}),null),a(t,e(r,{content:`
## raster

A \`raster\` style layer renders raster tiles on a map. You can use a raster layer to configure the color parameters of raster tiles.
`}),null),a(t,e(s,{imageId:"layer-raster",alt:"Shortwave infrared imagery of California wildfires overlayed near the city of Morgan Hill."}),null),a(t,e(i,{get children(){return e(r,{content:"\nThis [interactive SWIR imagery map by Maxar](https://blog.maxar.com/news-events/2020/maxar-and-mapbox-release-interactive-swir-imagery-map-of-california-wildfires?utm_source=mapbox&utm_medium=blog&utm_campaign=ca-wildfires-2020-map) uses the [`visibility`](/maplibre-gl-js-docs/style-spec/layers/#layout-raster-visibility) layout property to show or hide raster layers with shortwave infrared satellite imagery of California wildfires.\n"})}}),null),a(t,e(n,{headingLevel:"3",get entry(){return p(["layout","paint"],"raster")}}),null),a(t,e(r,{content:`
## circle

A \`circle\` style layer renders one or more filled circles on a map. You can use a circle layer to configure the visual appearance of point or point collection features in vector tiles. A circle layer renders circles whose radii are measured in screen units.
`}),null),a(t,e(s,{imageId:"layer-circle",alt:"Map with circles of different sizes and colors."}),null),a(t,e(i,{get children(){return e(r,{content:"\nThis [cluster map](/maplibre-gl-js-docs/example/cluster/) uses a circle layer with a GeoJSON data source and sets the source's [`cluster`](/maplibre-gl-js-docs/style-spec/sources/#geojson-cluster) property to `true` to visualize points as clusters.\n"})}}),null),a(t,e(n,{headingLevel:"3",get entry(){return p(["layout","paint"],"circle")}}),null),a(t,e(r,{content:`
## fill-extrusion

A \`fill-extrusion\` style layer renders one or more filled (and optionally stroked) extruded (3D) polygons on a map. You can use a fill-extrusion layer to configure the extrusion and visual appearance of polygon or multipolygon features.
`}),null),a(t,e(s,{imageId:"layer-fill-extrusion",alt:"Map of Europe and North Africa with countries extruded to various heights."}),null),a(t,e(i,{get children(){return e(r,{content:"\nThis map uses an external dataset to provide data-driven values for the [`fill-extrusion-height`](/maplibre-gl-js-docs/style-spec/layers/#paint-fill-extrusion-fill-extrusion-height) paint property of various [country polygons](https://blog.mapbox.com/high-resolution-administrative-country-polygons-in-studio-57cf4abb0768) in a fill-extrusion layer.\n"})}}),null),a(t,e(n,{headingLevel:"3",get entry(){return p(["layout","paint"],"fill-extrusion")}}),null),a(t,e(r,{content:`
## heatmap

A \`heatmap\` style layer renders a range of colors to represent the density of points in an area.
`}),null),a(t,e(s,{imageId:"layer-heatmap",alt:"Dark map with a heatmap layer glowing red inside and white outside."}),null),a(t,e(i,{get children(){return e(r,{content:`
[This visualization of earthquake data](/maplibre-gl-js-docs/example/heatmap-layer/) uses a heatmap layer with carefully defined [paint](/maplibre-gl-js-docs/style-spec/layers/#paint-property) properties to highlight areas where earthquake frequency is high and many points are clustered closely together.
`})}}),null),a(t,e(n,{headingLevel:"3",get entry(){return p(["layout","paint"],"heatmap")}}),null),a(t,e(r,{content:`
## hillshade

A \`hillshade\` style layer renders digital elevation model (DEM) data on the client-side. The implementation only supports Mapbox Terrain RGB and Mapzen Terrarium tiles.
`}),null),a(t,e(s,{imageId:"layer-hillshade",alt:"Map of Mount Shasta rising up with striking texture and shading."}),null),a(t,e(i,{get children(){return e(r,{content:"\nThis map of Mount Shasta uses a high value for the [`hillshade-exaggeration`](/maplibre-gl-js-docs/style-spec/layers/#paint-hillshade-hillshade-exaggeration) paint property to apply an intense shading effect.\n"})}}),null),a(t,e(n,{headingLevel:"3",get entry(){return p(["layout","paint"],"hillshade")}}),null),t})()}export{A as default};
