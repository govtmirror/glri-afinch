Ext.ns("AFINCH.ui");
AFINCH.ui.SeriesToggleToolbar= Ext.extend(Ext.Toolbar, {
	
    getSeriesTogglers: function(){
        return this.menu.getSeriesTogglers();
    },
	
    constructor: function(config) {
        var self = this;
		
		self.associatedPanel = config.associatedPanel;
		
        self.menu = new AFINCH.ui.SeriesToggleMenu({
			associatedPanel: config.associatedPanel.graphPanel,
			paramName: config.paramName
		});
		
		
        var exportHandler = function(button, event){
			
            var panel = button.associatedPanel;
			var filename = button.downloadName;
			
            var values = panel.graphData.values;
            var headers = panel.graphData.headers;
            var allData = [];
            allData.push(headers);
            values.each(function(dataRow){
                var myDataRow = [].concat(dataRow);//make a copy of the array so we don't modify the source
                var formattedDate = myDataRow[0].format('{Mon} {year}');
                myDataRow[0] = formattedDate;
                allData.push(myDataRow);
            });
            
            var csv = '';
            allData.each(function(row){
                csv += row.join(',') + '\n'
            });

            var type = escape('text/csv');
            var data = escape(csv);
            
            $('#filename_value').val(filename);
            $('#type_value').val(type);
            $('#data_value').val(data);
            $('#download_form').submit();
        };
		
		var items = [];
		
		items.push(self.menu);
		items.push({ xtype:'tbfill' });
        var exportButton = {
            xtype: 'button', 
            text: 'Download Displayed Data', 
            handler: exportHandler,
            cls: 'export_button',
			associatedPanel: self.associatedPanel,
			downloadName: self.associatedPanel.export_filename
        };
        items.push(exportButton);
		
        config = Ext.apply({
            items: items,
			associatedPanel: config.associatedPanel,
			paramName: config.paramName
        }, config);

        AFINCH.ui.SeriesToggleToolbar.superclass.constructor.call(this, config);
        LOG.info('AFINCH.ui.SeriesToggleToolbar::constructor(): Construction complete.');
    }
});