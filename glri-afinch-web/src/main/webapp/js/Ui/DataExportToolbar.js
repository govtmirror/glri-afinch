Ext.ns("AFINCH.ui");

AFINCH.ui.DataExportToolbar= Ext.extend(Ext.Toolbar, {
	
	reachPanel: undefined,
	catchPanel: undefined,
	
    makeDataDefinition: function(key, value){
        return  '<p class="gage_KVP">'+
                    '<b>'+key+': </b>'+
                    '<span class="gage_value">'+value+'</span>'+
                '</p>';
    },
    constructor: function(config) {
        var self = this;
		
		self.reachPanel = config.reachPanel;
		self.catchPanel = config.catchPanel;
		
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
        var displayingGageInfo = !!config.gage.comId;
        if(displayingGageInfo){
            var gageInfo ='<div class="gage_info_pane">';
            gageInfo += self.makeDataDefinition('Gage Name', config.gage.name);
            gageInfo += self.makeDataDefinition('Gage Com ID', config.gage.comId);
            gageInfo += self.makeDataDefinition('Total Drainage Area (Sq Km)', config.gage.totdasqkm);
            gageInfo += self.makeDataDefinition('Reach Code', config.gage.reachCode);
            gageInfo +='</div>';
            items.push(gageInfo);
            
            var externalButton = {
                xtype: 'button', 
                text: 'View Gage Details', 
                handler: function(){window.open(config.gage.link);},
                cls: 'export_button'
            };
            items.push(externalButton);
            items.push(' ');
        }
		
		items.push({ xtype:'tbfill' });
        
        var rButton = {
            xtype: 'button', 
            text: 'Download Reach Data', 
            handler: exportHandler,
            cls: 'export_button',
			associatedPanel: self.reachPanel,
			downloadName: 'Reach_Flow_Data.csv'
        };
        items.push(rButton);
		
        var cButton = {
            xtype: 'button', 
            text: 'Download Catch Data', 
            handler: exportHandler,
            cls: 'export_button',
			associatedPanel: self.catchPanel,
			downloadName: 'Catchment_Yield_Data.csv'
        };
        items.push(cButton);
        
        config = Ext.apply({
            items : items,
            defaultExportName : ''
        }, config);

        AFINCH.ui.DataExportToolbar.superclass.constructor.call(this, config);
        LOG.info('AFINCH.ui.DataExportToolbar::constructor(): Construction complete.');
    }
});
Ext.reg('dataExportToolbar', AFINCH.ui.DataExportToolbar);