Ext.ns("AFINCH.ui");

AFINCH.ui.GageToolbar= Ext.extend(Ext.Toolbar, {
	
    makeDataDefinition: function(key, value){
        return  '<p class="gage_KVP">'+
                    '<b>'+key+': </b>'+
                    '<span class="gage_value">'+value+'</span>'+
                '</p>';
    },
    constructor: function(config) {
        var self = this;
		
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
        
        config = Ext.apply({
            items : items,
        }, config);

        AFINCH.ui.GageToolbar.superclass.constructor.call(this, config);
        LOG.info('AFINCH.ui.GageToolbar::constructor(): Construction complete.');
    }
});
Ext.reg('GageToolbar', AFINCH.ui.GageToolbar);