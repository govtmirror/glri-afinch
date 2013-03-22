Ext.ns("AFINCH.ui");

AFINCH.ui.DataExportToolbar= Ext.extend(Ext.Toolbar, {
    constructor: function(config) {
        var exportHandler = function(button, event){
            
            var win = button.findParentByType('dataWindow');
            var values = win.graphPanel.data.values;
            var headers = win.graphPanel.data.headers;
            var allData = [];
            allData.push(headers);
            values.each(function(dataRow){allData.push(dataRow);});
            
            var csv = '';
            allData.each(function(row){
                csv += row.join(',') + '\n'
            });
            
            var filename = escape('nhd_flowlines_stats.csv');
            var type = escape('text/csv');
            var data = escape(csv);
            
            var urlParams = '?filename=' + filename + '&type=' + type + '&data=' + data;
            var url = CONFIG.endpoint.exporter + urlParams;
            document.getElementById('download').src = url;
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