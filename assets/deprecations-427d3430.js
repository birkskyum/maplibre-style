import{g as Pe,a as o,i as n,c as e,t as qe}from"./entry-client-7e9ccddb.js";import{M as i}from"./markdown-566fbefe.js";import{C as P}from"./caption-971c75a4.js";import{P as a,S as q}from"./property-cca33a39.js";import{S as r}from"./subtitle-baef190d.js";const Ce=qe('<div><!#><!/><!#><!/><!#><!/><!#><!/><!#><!/><!#><!/><!#><!/><!#><!/><!#><!/><!#><!/><!#><!/><!#><!/><!#><!/><!#><!/><!#><!/><!#><!/><!#><!/><!#><!/><!#><!/><!#><!/><div class="mb12"></div><!#><!/><a id="types-function-zoom-property" class="anchor"></a><!#><!/><!#><!/><!#><!/><!#><!/></div>',56);function He(){return(()=>{const t=Pe(Ce),C=t.firstChild,[l,O]=o(C.nextSibling),E=l.nextSibling,[s,N]=o(E.nextSibling),F=s.nextSibling,[p,B]=o(F.nextSibling),H=p.nextSibling,[c,R]=o(H.nextSibling),Z=c.nextSibling,[u,D]=o(Z.nextSibling),G=u.nextSibling,[d,M]=o(G.nextSibling),U=d.nextSibling,[h,W]=o(U.nextSibling),Y=h.nextSibling,[f,K]=o(Y.nextSibling),J=f.nextSibling,[m,Q]=o(J.nextSibling),V=m.nextSibling,[y,X]=o(V.nextSibling),ee=y.nextSibling,[g,te]=o(ee.nextSibling),ne=g.nextSibling,[b,oe]=o(ne.nextSibling),ie=b.nextSibling,[v,ae]=o(ie.nextSibling),re=v.nextSibling,[_,le]=o(re.nextSibling),se=_.nextSibling,[x,pe]=o(se.nextSibling),ce=x.nextSibling,[$,ue]=o(ce.nextSibling),de=$.nextSibling,[w,he]=o(de.nextSibling),fe=w.nextSibling,[S,me]=o(fe.nextSibling),ye=S.nextSibling,[j,ge]=o(ye.nextSibling),be=j.nextSibling,[k,ve]=o(be.nextSibling),z=k.nextSibling,_e=z.nextSibling,[T,xe]=o(_e.nextSibling),$e=T.nextSibling,we=$e.nextSibling,[L,Se]=o(we.nextSibling),je=L.nextSibling,[A,ke]=o(je.nextSibling),ze=A.nextSibling,[I,Te]=o(ze.nextSibling),Le=I.nextSibling,[Ae,Ie]=o(Le.nextSibling);return n(t,e(i,{content:`# Deprecations

Some style properties are no longer the preferred method of accomplishing a particular styling goal. While they are still supported, they will eventually be removed from the MapLibre Style Specification and it is not recommended to use them in new styles. The following is provided as reference for users who need to continue maintaining legacy styles while transitioning to preferred style properties.


## Function
`}),l,O),n(t,e(P,{theme:"warning",get children(){return e(i,{content:`
As of [v0.41.0](https://github.com/maplibre/maplibre-gl-js/blob/main/CHANGELOG.md#0410-october-11-2017), [property expressions](/maplibre-gl-js-docs/style-spec/expressions) is the preferred method for styling features based on zoom level or the feature's properties. Zoom and property functions are still supported, but will be phased out in a future release.
`})}}),s,N),n(t,e(i,{content:`
The value for any layout or paint property may be specified as a _function_. Functions allow you to make the appearance of a map feature change with the current zoom level and/or the feature's properties.
`}),p,B),n(t,e(a,{headingLevel:"3",id:"function-stops",children:"stops"}),c,R),n(t,e(r,{children:"Required (except for `identity` functions) [array](/maplibre-gl-js-docs/style-spec/types/#array)."}),u,D),n(t,e(i,{content:'\nA set of one input value and one output value is a "stop." Stop output values must be literal values (i.e. not functions or expressions), and appropriate for the property. For example, stop output values for a `fill-color` function property must be [colors](/maplibre-gl-js-docs/style-spec/types/#color).\n'}),d,M),n(t,e(a,{headingLevel:"3",id:"function-property",children:"property"}),h,W),n(t,e(r,{get children(){return e(i,{content:`
Optional [string](/maplibre-gl-js-docs/style-spec/types/#string).
`})}}),f,K),n(t,e(i,{content:`
If specified, the function will take the specified feature property as an input. See [Zoom Functions and Property Functions](/maplibre-gl-js-docs/style-spec/types/#function-zoom-property) for more information.
`}),m,Q),n(t,e(a,{headingLevel:"3",id:"function-base",children:"base"}),y,X),n(t,e(r,{get children(){return e(i,{content:`
Optional [number](/maplibre-gl-js-docs/style-spec/types/#number). Default is ref.function.base.default.
`})}}),g,te),n(t,e(i,{content:`
The exponential base of the interpolation curve. It controls the rate at which the function output increases. Higher values make the output increase more towards the high end of the range. With values close to 1 the output increases linearly.
`}),b,oe),n(t,e(a,{headingLevel:"3",id:"function-type",children:"type"}),v,ae),n(t,e(r,{get children(){return e(i,{content:'\nOptional [string](/maplibre-gl-js-docs/style-spec/types/#string). One of `"identity"`, `"exponential"`, `"interval"`, or `"categorical"`.\n'})}}),_,le),n(t,e(i,{content:`

\`identity\`
: A function that returns its input as the output.

\`exponential\`
: A function that generates an output by interpolating between stops just less than and just greater than the function input. The domain (input value) must be numeric, and the style property must support interpolation. Style properties that support interpolation are marked marked with, the "exponential" symbol, and \`exponential\` is the default function type for these properties.

\`interval\`
: A function that returns the output value of the stop just less than the function input. The domain (input value) must be numeric. Any style property may use interval functions. For properties marked with, the "interval" symbol, this is the default function type.

\`categorical\`
: A function that returns the output value of the stop equal to the function input.
`}),x,pe),n(t,e(a,{headingLevel:"3",id:"function-default",children:"default"}),$,ue),n(t,e(i,{content:`
A value to serve as a fallback function result when a value isn't otherwise available. It is used in the following circumstances:

- In categorical functions, when the feature value does not match any of the stop domain values.
- In property and zoom-and-property functions, when a feature does not contain a value for the specified property.
- In identity functions, when the feature value is not valid for the style property (for example, if the function is being used for a \`circle-color\` property but the feature property value is not a string or not a valid color).
- In interval or exponential property and zoom-and-property functions, when the feature value is not numeric.

If no default is provided, the style property's default is used in these circumstances.
`}),w,he),n(t,e(a,{headingLevel:"3",id:"function-colorSpace",children:"colorSpace"}),S,me),n(t,e(r,{get children(){return e(i,{content:'\nOptional [string](/maplibre-gl-js-docs/style-spec/types/#string). One of `"rgb"`, `"lab"`, `"hcl"`.\n'})}}),j,ge),n(t,e(i,{content:`
The color space in which colors interpolated. Interpolating colors in perceptual color spaces like LAB and HCL tend to produce color ramps that look more consistent and produce colors that can be differentiated more easily than those interpolated in RGB space.


\`rgb\`
: Use the RGB color space to interpolate color values

\`lab\`
: Use the LAB color space to interpolate color values.

\`hcl\`
: Use the HCL color space to interpolate color values, interpolating the Hue, Chroma, and Luminance channels individually.
            
            `}),k,ve),n(z,e(q,{supportItems:{"basic functionality":{js:"0.10.0",android:"2.0.1",ios:"2.0.0",macos:"0.1.0"},"`property`":{js:"0.18.0",android:"5.0.0",ios:"3.5.0",macos:"0.4.0"},"`code`":{js:"0.18.0",android:"5.0.0",ios:"3.5.0",macos:"0.4.0"},"`exponential` type":{js:"0.18.0",android:"5.0.0",ios:"3.5.0",macos:"0.4.0"},"`interval` type":{js:"0.18.0",android:"5.0.0",ios:"3.5.0",macos:"0.4.0"},"`categorical` type":{js:"0.18.0",android:"5.0.0",ios:"3.5.0",macos:"0.4.0"},"`identity` type":{js:"0.26.0",android:"5.0.0",ios:"3.5.0",macos:"0.4.0"},"`default`":{js:"0.33.0",android:"5.0.0",ios:"3.5.0",macos:"0.4.0"},"`colorSpace`":{js:"0.26.0"}}})),n(t,e(i,{content:`
**Zoom functions** allow the appearance of a map feature to change with map’s zoom level. Zoom functions can be used to create the illusion of depth and control data density. Each stop is an array with two elements: the first is a zoom level and the second is a function output value.

\`\`\`json
{
    "circle-radius": {
        "stops": [
            // zoom is 5 -> circle radius will be 1px
            [5, 1],
            // zoom is 10 -> circle radius will be 2px
            [10, 2]
        ]
    }
}
\`\`\`

The rendered values of [color](/maplibre-gl-js-docs/style-spec/types/#color), [number](/maplibre-gl-js-docs/style-spec/types/#number), and [array](/maplibre-gl-js-docs/style-spec/types/#array) properties are interpolated between stops. [Boolean](/maplibre-gl-js-docs/style-spec/types/#boolean) and [string](/maplibre-gl-js-docs/style-spec/types/#string) property values cannot be interpolated, so their rendered values only change at the specified stops.

There is an important difference between the way that zoom functions render for _layout_ and _paint_ properties. Paint properties are continuously re-evaluated whenever the zoom level changes, even fractionally. The rendered value of a paint property will change, for example, as the map moves between zoom levels \`4.1\` and \`4.6\`. Layout properties, however, are evaluated only once for each integer zoom level. To continue the prior example: the rendering of a layout property will _not_ change between zoom levels \`4.1\` and \`4.6\`, no matter what stops are specified; but at zoom level \`5\`, the function will be re-evaluated according to the function, and the property's rendered value will change. (You can include fractional zoom levels in a layout property zoom function, and it will affect the generated values; but, still, the rendering will only change at integer zoom levels.)

**Property functions** allow the appearance of a map feature to change with its properties. Property functions can be used to visually differentiate types of features within the same layer or create data visualizations. Each stop is an array with two elements, the first is a property input value and the second is a function output value. Note that support for property functions is not available across all properties and platforms.

\`\`\`json
{
    "circle-color": {
        "property": "temperature",
        "stops": [
            // "temperature" is 0   -> circle color will be blue
            [0, 'blue'],
            // "temperature" is 100 -> circle color will be red
            [100, 'red']
        ]
    }
}
\`\`\`
`}),T,xe),n(t,e(i,{content:`
**Zoom-and-property functions** allow the appearance of a map feature to change with both its properties _and_ zoom. Each stop is an array with two elements, the first is an object with a property input value and a zoom, and the second is a function output value. Note that support for property functions is not yet complete.

\`\`\`json
{
    "circle-radius": {
        "property": "rating",
        "stops": [
            // zoom is 0 and "rating" is 0 -> circle radius will be 0px
            [{zoom: 0, value: 0}, 0],

            // zoom is 0 and "rating" is 5 -> circle radius will be 5px
            [{zoom: 0, value: 5}, 5],

            // zoom is 20 and "rating" is 0 -> circle radius will be 0px
            [{zoom: 20, value: 0}, 0],

            // zoom is 20 and "rating" is 5 -> circle radius will be 20px
            [{zoom: 20, value: 5}, 20]
        ]
    }
}
\`\`\`


## Other filter
`}),L,Se),n(t,e(P,{theme:"warning",get children(){return e(i,{content:`
In previous versions of the style specification, [filters](/maplibre-gl-js-docs/style-spec/layers/#filter) were defined using the deprecated syntax documented below. Though filters defined with this syntax will continue to work, we recommend using the more flexible [expression](/maplibre-gl-js-docs/style-spec/expressions/) syntax instead. Expression syntax and the deprecated syntax below cannot be mixed in a single filter definition.
`})}}),A,ke),n(t,e(i,{content:'\n### Existential filters\n\n`["has", `key`]` `feature[key]` exists\n\n`["!has", `key`]` `feature[key]` does not exist\n\n### Comparison filters\n\n`["==", `key`, `value`]` equality: `feature[key]` = `value`\n\n`["!=", `key`, `value`]` inequality: `feature[key]` ≠ `value`\n\n`["&gt;", `key`, `value`]` greater than: `feature[key]` > `value`\n\n`["&gt;=", `key`, `value`]` greater than or equal: `feature[key]` ≥ `value`\n\n`["&lt;", `key`, `value`]` less than: `feature[key]` &lt; `value`\n\n`["&lt;=", `key`, `value`]` less than or equal: `feature[key]` ≤ `value`\n\n\n### Set membership filters\n\n`["in", `key`, `v0`, ..., `vn`]` set inclusion: `feature[key]` ∈ {`v0`, ..., `vn`}\n\n`["!in", `key`, `v0`, ..., `vn`]` set exclusion: `feature[key]` ∉ { `v0`, ..., `vn`}\n\n\n### Combining filters\n\n`["all", `f0`, ..., `fn`]` logical `AND`: `f0` ∧ ... ∧ `fn`\n\n`["any", `f0`, ..., `fn`]` logical `OR`: `f0` ∨ ... ∨ `fn`\n\n`["none", `f0`, ..., `fn`]` logical `NOR`: ¬`f0` ∧ ... ∧ ¬`fn`\n\nA `key` must be a string that identifies a feature property, or one of the following special keys:\n\n- `"$type"`: the feature type. This key may be used with the `"=="`,`"!="`, `"in"`, and `"!in"` operators. Possible values are `"Point"`,  `"LineString"`, and `"Polygon"`.\n- `"$id"`: the feature identifier. This key may be used with the `"=="`,`"!="`, `"has"`, `"!has"`, `"in"`, and `"!in"` operators.\n\nA `value` (and `v0`, ..., `vn` for set operators) must be a [string](/maplibre-gl-js-docs/style-spec/types/#string), [number](/maplibre-gl-js-docs/style-spec/types/#number), or [boolean](/maplibre-gl-js-docs/style-spec/types/#boolean) to compare the property value against.\n\nSet membership filters are a compact and efficient way to test whether a field matches any of multiple values.\n\nThe comparison and set membership filters implement strictly-typed comparisons; for example, all of the following evaluate to false: `0 &lt; "1"`, `2 == "2"`, `"true" in [true, false]`.\n\nThe `"all"`, `"any"`, and `"none"` filter operators are used to create compound filters. The values `f0`, ..., `fn` must be filter expressions themselves.\n\n```json\n["==", "$type", "LineString"]\n```\n\nThis filter requires that the `class` property of each feature is equal to either "street_major", "street_minor", or "street_limited".\n\n```json\n["in", "class", "street_major", "street_minor", "street_limited"]`\n```\n\nThe combining filter "all" takes the three other filters that follow it and requires all of them to be true for a feature to be included: a feature must have a  `class` equal to "street_limited", its `admin_level` must be greater than or equal to 3, and its type cannot be Polygon. You could change the combining filter to "any" to allow features matching any of those criteria to be included - features that are Polygons, but have a different `class` value, and so on.\n\n```json\n[\n    "all",\n    ["==", "class", "street_limited"],\n    [">=", "admin_level", 3],\n    ["!in", "$type", "Polygon"]\n]\n```\n'}),I,Te),n(t,e(q,{supportItems:{"basic functionality":{js:"0.10.0",android:"2.0.1",ios:"2.0.0",macos:"0.1.0"},"`has` / `!has`":{js:"0.19.0",android:"4.1.0",ios:"3.3.0",macos:"0.1.0"}}}),Ae,Ie),t})()}export{He as default};
