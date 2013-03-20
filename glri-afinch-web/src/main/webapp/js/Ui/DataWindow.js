Ext.ns("AFINCH.ui");

AFINCH.ui.DataWindow = Ext.extend(Ext.Window, {
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
            layout : 'hbox',
            fbar: new AFINCH.ui.DataExportToolbar(),
            xtype: 'window'
        }, config);

        AFINCH.ui.DataWindow.superclass.constructor.call(this, config);
        LOG.info('AFINCH.ui.DataWindow::constructor(): Construction complete.');
    }
});
Ext.reg('dataWindow', AFINCH.ui.DataWindow);