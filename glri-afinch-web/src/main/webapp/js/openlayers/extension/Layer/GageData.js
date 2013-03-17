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
    createFlowlineClipData: function(args) {
        var compositeLayer = OpenLayers.Raster.Composite.fromLayer(this, {int32: true});
        var streamOrderClipValue = args.streamOrderClipValue;
        var flowlineAboveClipPixel = args.flowlineAboveClipPixel;
        var createFunct = OpenLayers.Raster.Operation.create(function(pixel) {
            if (pixel >> 24 === 0) {
                return 0;
            }
            var value = pixel & 0x00ffffff;
            if (value >= streamOrderClipValue && value < 0x00ffffff) {
                return flowlineAboveClipPixel;
            } else {
                return 0;
            }
        });
        return createFunct.call(compositeLayer);
    },
    createGageClipData: function(args) {
        var streamOrderClipValue = args.streamOrderClipValue;
        var gageRaster = args.gageRaster;
        var gageStyle = args.gageStyle;
        var gageRadius = args.gageRadius;
        var gageFill = args.gageFill;
        var gageComposite = OpenLayers.Raster.Composite.fromLayer(this, {int32: true});
        var createFunct = OpenLayers.Raster.Operation.create(function(pixel, x, y) {
            var value = pixel & 0x00ffffff;
            if (value >= streamOrderClipValue && value < 0x00ffffff) {
                gageRaster.context.beginPath();
                gageRaster.context.fillStyle = gageStyle;
                gageRaster.context.strokeStyle = gageStyle;
                gageRaster.context.arc(x, y, gageRadius, 0, 2 * Math.PI);
                if (gageFill) {
                    gageRaster.context.fill();
                } else {
                    gageRaster.context.stroke();
                }
            }
        });
        return createFunct.call(gageComposite);
        return data;
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