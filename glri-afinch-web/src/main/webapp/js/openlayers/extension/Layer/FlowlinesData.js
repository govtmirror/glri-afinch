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
    }
});