Ext.ns("AFINCH.ui");

AFINCH.ui.DataExportToolbar= Ext.extend(Ext.Toolbar, {
    constructor: function(config) {
        var exportHandler = function(button, event){
            alert('not yet implemented');
        };
        var button = {
            xtype: 'button', 
            text: 'Download Data', 
            handler: exportHandler
        };
        config = Ext.apply({
            items : ['->', button]
        }, config);

        AFINCH.ui.DataExportToolbar.superclass.constructor.call(this, config);
        LOG.info('AFINCH.ui.DataExportToolbar::constructor(): Construction complete.');
    }
});