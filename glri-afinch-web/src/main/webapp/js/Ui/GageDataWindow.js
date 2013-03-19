Ext.ns("AFINCH.ui");

AFINCH.ui.GageDataWindow = Ext.extend(Ext.Window, {
    constructor: function(config) {
        var title = config.title || "";
        var width = config.width || 800;
        var height = config.height || 400;
        
        var buttonGroup = new AFINCH.ui.SeriesToggleButtonGroup({
           width: "100%"
        });
        
        config = Ext.apply({
            width: width,
            height: height,
            tbar: buttonGroup,
            title: title,
            collapsible: true,
            layout : 'vbox',
            fbar: new AFINCH.ui.DataExportToolbar()
        }, config);

        AFINCH.ui.GageDataWindow.superclass.constructor.call(this, config);
        LOG.info('AFINCH.ui.GageDataWindow::constructor(): Construction complete.');
    }
});