/**
 * @requires OpenLayers/Layer/WMS.js
 */

/**
 * Class: OpenLayers.Layer.FlowlinesData
 *
 * Inherits from:
 *  - <OpenLayers.Layer.WMS>
 */
OpenLayers.Layer.FlowlinesData = OpenLayers.Class(OpenLayers.Layer.WMS, {
    CLASS_NAME: "OpenLayers.Layer.FlowlinesData",
    initialize: function(name, url, params, options) {
        params = params || {};
        options = options || {};
        params.layers = 'glri:NHDFlowline';
        params.styles = 'FlowlineStreamOrder';
        params.format = "image/png";
        params.tiled = true;
        options.isBaseLayer = false;
        options.opacity = 0;
        options.displayInLayerSwitcher = false;
        options.tileOptions = {
            crossOriginKeyword: 'anonymous'
        };
        var newArguments = [];
        newArguments.push(name, url, params, options);
        OpenLayers.Layer.WMS.prototype.initialize.apply(this, newArguments);
    }
});