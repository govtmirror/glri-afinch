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
        this.events.on('visibilitychanged', this.updateVisibility);
    },
    createGageStyle: function() {
        this.gageStyle =
                "rgba(" +
                this.gageStyleR + "," +
                this.gageStyleG + "," +
                this.gageStyleB + "," +
                this.gageStyleA / 255 + ")";
    },
    clipOperation: function(composite) {
        var scope = this;
        return (OpenLayers.Raster.Operation.create(function(pixel, x, y) {
            var value = pixel & 0x00ffffff;
            if (value >= scope.streamOrderClipValue && value < 0x00ffffff) {
                scope.context.beginPath();
                scope.context.fillStyle = scope.gageStyle;
                scope.context.strokeStyle = scope.gageStyle;
                scope.context.arc(x, y, scope.gageRadius, 0, 2 * Math.PI);
                if (scope.gageFill) {
                    scope.context.fill();
                } else {
                    scope.context.stroke();
                }
            }
        }))(composite);
    },
    updateFromClipValue: function(cv) {
        this.streamOrderClipValue = cv;
        if (this.getVisibility()) {
            this.onDataUpdate();
        }
    },
    updateVisibility: function() {
        //            flowlineRasterWindow.setVisible(flowlineRaster.getVisibility());
    }
});