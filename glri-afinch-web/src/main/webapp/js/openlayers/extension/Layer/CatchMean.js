/**
 * @requires OpenLayers/Layer/WMS.js
 */

/**
 * Class: OpenLayers.Layer.CatchMean
 *
 * Inherits from:
 *  - <OpenLayers.Layer.WMS>
 */
OpenLayers.Layer.CatchMean = OpenLayers.Class(OpenLayers.Layer.WMS, {
    CLASS_NAME: "OpenLayers.Layer.CatchMean",
	

	
    initialize: function(name, url, params, options) {
        params = params || {};
        options = options || {};
        params.layers = CONFIG.maplayers.catchMean.layerName;
        params.styles = CONFIG.maplayers.catchMean.layerStyle;
        params.format = "image/png";
        params.tiled = true;
		params.transparent = true;
        options.isBaseLayer = false;
        options.opacity = 1;
        options.displayInLayerSwitcher = true;
        options.tileOptions = {
            crossOriginKeyword: 'anonymous'
        };
        var newArguments = [];
        newArguments.push(name, url, params, options);
        OpenLayers.Layer.WMS.prototype.initialize.apply(this, newArguments);
    }
});