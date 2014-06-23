Ext.ns("AFINCH.ui");
AFINCH.ui.SeriesToggleToolbar= Ext.extend(Ext.Toolbar, {
	
    getSeriesTogglers: function(){
        return this.menu.getSeriesTogglers();
    },
	
    constructor: function(config) {
        var self = this;
        self.menu = new AFINCH.ui.SeriesToggleMenu({
			graphPanel: config.graphPanel,
			paramName: config.paramName
		});
        config = Ext.apply({
            items: [
                {text: 'Toggle Graph Series',
                 menu: self.menu
                }
            ],
			graphPanel: config.graphPanel,
			paramName: config.paramName
        }, config);

        AFINCH.ui.SeriesToggleToolbar.superclass.constructor.call(this, config);
        LOG.info('AFINCH.ui.SeriesToggleToolbar::constructor(): Construction complete.');
    }
});