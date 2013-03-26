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
            var filename = win.title.length > 0 ? win.title : CONFIG.defaultExportFilename;
            filename = filename.replace(/ /g, '_');
            filename += '.csv';
            filename = escape(filename);
            var type = escape('text/csv');
            var data = escape(csv);
            
            $('#filename_value').val(filename);
            $('#type_value').val(type);
            $('#data_value').val(data);
            $('#download_form').submit();
        };
        var button = {
            xtype: 'button', 
            text: 'Download Data', 
            handler: exportHandler
        };
        config = Ext.apply({
            items : ['->', button],
            defaultExportName : ''
        }, config);

        AFINCH.ui.DataExportToolbar.superclass.constructor.call(this, config);
        LOG.info('AFINCH.ui.DataExportToolbar::constructor(): Construction complete.');
    }
});