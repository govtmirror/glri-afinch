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
    styles: 'FlowlineStreamOrder',
    format: "image/png",
    tiled: "true",
    isBaseLayer: false,
    opacity: 0,
    displayInLayerSwitcher: true,
    tileOptions: {
        crossOriginKeyword: 'anonymous'
    },
    CLASS_NAME: "OpenLayers.Layer.FlowlinesData",
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