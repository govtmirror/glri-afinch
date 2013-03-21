/**
 * @requires OpenLayers/Layer/Vector.js
 */

/**
 * Class: OpenLayers.Layer.GageFeature
 *
 * Inherits from:
 *  - <OpenLayers.Layer.Vector>
 */
OpenLayers.Layer.GageFeature = OpenLayers.Class(OpenLayers.Layer.Vector, {
    minScale: 15000000,
    strategies: [
        new OpenLayers.Strategy.BBOX(), new OpenLayers.Strategy.Filter({
            filter: new OpenLayers.Filter.Comparison({
                type: OpenLayers.Filter.Comparison.GREATER_THAN_OR_EQUAL_TO,
                property: "StreamOrde",
                value: this.streamOrderClipValue
            })
        })
    ],
    styleMap: new OpenLayers.StyleMap({
        'default': new OpenLayers.Style({
            'pointRadius': 2,
            'fillColor': '#ee9900',
            'fillOpacity': 0.4,
            'strokeColor': '#ee9900',
            'strokeOpacity': 1,
            'strokeWidth': 1
        }),
        'select': new OpenLayers.Style({
            'pointRadius': 2,
            'fillColor': '#ee9900',
            'fillOpacity': 0.4,
            'strokeColor': '#ffffff',
            'strokeOpacity': 1,
            'strokeWidth': 1
        }),
        renderers: ['DeclusterCanvas']
    }),
    CLASS_NAME: "OpenLayers.Layer.GageFeature",
    initialize: function(name, options) {
        var newArguments = [];
        options = options || {};
        options.protocol = new OpenLayers.Protocol.WFS({
            url: options.url,
            featureType: "GageLoc",
            featureNS: "http://cida.usgs.gov/glri"
        });
        newArguments.push(name, options);
        OpenLayers.Layer.Vector.prototype.initialize.apply(this, newArguments);
    },
    updateGageStreamOrderFilter: function() {
        this.strategies[1].setFilter(new OpenLayers.Filter.Comparison({
            type: OpenLayers.Filter.Comparison.GREATER_THAN_OR_EQUAL_TO,
            property: "StreamOrde",
            value: this.streamOrderClipValue
        }));
    },
    updateFromClipValue: function(cv) {
        this.streamOrderClipValue = cv;
        if (this.getVisibility()) {
            this.updateGageStreamOrderFilter();
        }
    }
});