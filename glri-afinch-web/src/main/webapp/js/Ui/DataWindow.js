Ext.ns("AFINCH.ui");

AFINCH.ui.DataWindow = Ext.extend(Ext.Window, {
	record: undefined,
	sosUrlWithoutBase: undefined,
	
    constructor: function(config) {
        var self = this;
		
        var title = config.title || "";
        var width = config.width || 1000;
        var height = config.height || 500;
        
		self.reachPanel = new AFINCH.ui.ReachDataPanel({ record: config.record, gage: config.gage });
		self.catchPanel = new AFINCH.ui.CatchDataPanel({ record: config.record });
		
        
        config = Ext.apply({
            width: width,
            height: height,
            tbar: self.toggleBar,
            title: title,
            collapsible: true,
            layout : 'fit',
            items: [
				new Ext.TabPanel({
					activeTab: 1,
					deferredRender:false,	/* Need rendering so dom can be accessed for graph */
					items:[
						self.reachPanel, self.catchPanel
					]
				})
			],
			record: config.record,
			reachPanel: self.reachPanel,
			catchPanel: self.catchPanel
        }, config);

        AFINCH.ui.DataWindow.superclass.constructor.call(this, config);
        LOG.info('AFINCH.ui.DataWindow::constructor(): Construction complete.');
		
	},
	


	doInitLoad: function() {
		this.reachPanel.doInitLoad();
		this.catchPanel.doInitLoad();
	}
});
Ext.reg('dataWindow', AFINCH.ui.DataWindow);