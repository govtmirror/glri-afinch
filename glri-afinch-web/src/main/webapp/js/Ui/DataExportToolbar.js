Ext.ns("AFINCH.ui");

AFINCH.ui.DataExportToolbar= Ext.extend(Ext.Toolbar, {
    makeDataDefinition: function(key, value){
        return  '<p class="gageKVP">'+
                    '<b>'+key+': </b>'+
                    '<span class="gageValue">'+value+'</span>'+
                '</p>';
    },
    constructor: function(config) {
        var self = this;
        var exportHandler = function(button, event){
            
            var win = button.findParentByType('dataWindow');
            var values = win.graphPanel.data.values;
            var headers = win.graphPanel.data.headers;
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
        var items = [];
        if(config.gage){
            var gageInfo = self.makeDataDefinition('Gage Name', config.gage.name);
            gageInfo += self.makeDataDefinition('Gage Id', config.gage.comId);
            gageInfo += self.makeDataDefinition('Totdasqkm', config.gage.totdasqkm);
            gageInfo += self.makeDataDefinition('Reach Code', config.gage.reachCode);
//            items.push(new Ext.Panel({
//                html: gageInfo
//            }))
//            items.push(gageInfo);
//            items.push({xtype:'tbfill'});
//            items.push(self.makeDataDefinition('Gage Name', config.gage.name));
//            items.push(self.makeDataDefinition('Gage Id', config.gage.comId));
//            items.push(self.makeDataDefinition('Totdasqkm', config.gage.totdasqkm));
//            items.push(self.makeDataDefinition('Reach Code', config.gage.reachCode));
//            items.push('<div class="tbar_spacer"></div>');
items.push('hello');
items.push('->');
items.push('there')
            var externalButton = {
                xtype: 'button', 
                text: 'View Gage Details', 
                handler: function(){window.open(config.gage.link);}
            };
//            items.push(externalButton);
//            items.push(' ');
        }
        var button = {
            xtype: 'button', 
            text: 'Download Data', 
            handler: exportHandler
        };
//        items.push(button);
        
        config = Ext.apply({
            items : items,
            defaultExportName : '',
            layout: 'toolbar'
        }, config);

        AFINCH.ui.DataExportToolbar.superclass.constructor.call(this, config);
        LOG.info('AFINCH.ui.DataExportToolbar::constructor(): Construction complete.');
    }
});