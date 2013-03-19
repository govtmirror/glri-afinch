/**
 * @requires OpenLayers/Layer/WMS.js
 */

/**
 * Class: OpenLayers.Layer.GageData
 *
 * Inherits from:
 *  - <OpenLayers.Layer.WMS>
 */
OpenLayers.Layer.GageData = OpenLayers.Class(OpenLayers.Layer.WMS, {
    format: "image/png",
    tiled: "true",
    isBaseLayer: false,
    opacity: 0,
    displayInLayerSwitcher: false,
    gageStyleA: 255,
    gageStyleR: 0,
    gageStyleG: 255,
    gageStyleB: 0,
    gageRadius: 4,
    gageFill: false,
    streamOrderClipValue: 0,
    tileOptions: {
        crossOriginKeyword: 'anonymous'
    },
    CLASS_NAME: "OpenLayers.Layer.GageData",
    initialize: function(name, url, params, options) {
        params = params || {};
        options = options || {};
        params.layers = "glri:GageLoc";
        params.styles = 'GageLocStreamOrder';
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
    },
    createGageStyle: function(args) {
        var gageStyleA = args.a;
        var gageStyleR = args.r;
        var gageStyleG = args.g;
        var gageStyleB = args.b;
        return ("rgba(" +
                gageStyleR + "," +
                gageStyleG + "," +
                gageStyleB + "," +
                gageStyleA / 255 + ")");

    }
});