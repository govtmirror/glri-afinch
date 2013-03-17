/**
 * @requires OpenLayers/Layer/Raster.js
 */

/**
 * Class: OpenLayers.Layer.GageRaster
 *
 * Inherits from:
 *  - <OpenLayers.Layer.Raster>
 */
OpenLayers.Layer.GageRaster = OpenLayers.Class(OpenLayers.Layer.Raster, {
    gageStyle: undefined,
    gageStyleR: 0,
    gageStyleG: 255,
    gageStyleB: 0,
    gageStyleA: 255,
    gageRadius: 4,
    gageFill: false,
    CLASS_NAME: "OpenLayers.Layer.GageRaster",
    initialize: function(config) {
        config.isBaseLayer = false;
        config.readOnly = true;
        config.visibility = false;
        if (!config.data && config.dataLayer) {
            var gageComposite = OpenLayers.Raster.Composite.fromLayer(config.dataLayer, {int32: true});
            config.data = this.clipOperation(gageComposite);
        }
        OpenLayers.Layer.Raster.prototype.initialize.apply(this, [config]);
        this.createGageStyle();
        this.events.on('visibilitychanged',this.updateVisibility);
    },
    flowlineClipOperation: OpenLayers.Raster.Operation.create(function(pixel) {
        if (pixel >> 24 === 0) {
            return 0;
        }
        var value = pixel & 0x00ffffff;
        if (value >= this.streamOrderClipValue && value < 0x00ffffff) {
            return this.flowlineAboveClipPixel;
        } else {
            return 0;
        }
    }),
    createGageStyle: function() {
        this.gageStyle =
                "rgba(" +
                this.gageStyleR + "," +
                this.gageStyleG + "," +
                this.gageStyleB + "," +
                this.gageStyleA / 255 + ")";
    },
    clipOperation: OpenLayers.Raster.Operation.create(function(pixel, x, y) {
        var value = pixel & 0x00ffffff;
        if (value >= this.streamOrderClipValue && value < 0x00ffffff) {
            this.context.beginPath();
            this.context.fillStyle = this.gageStyle;
            this.context.strokeStyle = this.gageStyle;
            this.context.arc(x, y, this.gageRadius, 0, 2 * Math.PI);
            if (this.gageFill) {
                this.context.fill();
            } else {
                this.context.stroke();
            }
        }
    }),
    updateFromClipValue: function() {
        if (this.getVisibility()) {
            this.onDataUpdate();
        }
    },
                updateVisibility: function() {
        //            flowlineRasterWindow.setVisible(flowlineRaster.getVisibility());
    }
});