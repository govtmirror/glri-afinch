Ext.ns("AFINCH.ui");

AFINCH.ui.DataWindow = Ext.extend(Ext.Window, {
	record: undefined,
	sosUrlWithoutBase: undefined,
	
    constructor: function(config) {
        var self = this;
		
        var title = config.title || "";
        var width = config.width || 1000;
        var height = config.height || 500;
        
		self.reachPanel = new AFINCH.ui.DataDisplayPanel({
			title: CONFIG.metadata.reach_con.display_name,
			record: config.record,
			thredds_filename: CONFIG.metadata.reach_con.thredds_filename,
			export_filename: CONFIG.metadata.reach_con.export_filename,
			id_prop: CONFIG.metadata.reach_con.id_prop,
			observed_prop: CONFIG.metadata.reach_con.observed_prop,
			legendParamName: "Flow",
			yAxixParamName: "Discharge",
			unit: "(cfs)"
		});
		self.catchPanel = new AFINCH.ui.DataDisplayPanel({
			title: CONFIG.metadata.catch_con.display_name,
			record: config.record,
			thredds_filename: CONFIG.metadata.catch_con.thredds_filename,
			export_filename: CONFIG.metadata.catch_con.export_filename,
			id_prop: CONFIG.metadata.catch_con.id_prop,
			observed_prop: CONFIG.metadata.catch_con.observed_prop,
			legendParamName: "Yield",
			yAxixParamName: "Yield",
			unit: "(inches)"
		});
		
        
        config = Ext.apply({
            width: width,
            height: height,
            tbar: self.toggleBar,
			bbar: new AFINCH.ui.GageToolbar({
				gage: config.gage,
				reachPanel: self.reachPanel,
				catchPanel: self.catchPanel
			}),
            title: title,
            collapsible: true,
            layout : 'fit',
            items: [
				new Ext.TabPanel({
					activeTab: CONFIG.userpref.graphTab,
					deferredRender:false,	/* Need rendering so dom can be accessed for graph */
					items:[
						self.reachPanel, self.catchPanel
					],
					listeners: {
						tabchange: function(panel, tab) {
							CONFIG.userpref.graphTab = panel.items.indexOf(tab);
						}
					}
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