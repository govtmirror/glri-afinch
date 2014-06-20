Ext.ns("AFINCH.ui");
AFINCH.ui.SeriesToggleToolbar= Ext.extend(Ext.Toolbar, {
    menu: undefined,
	graphPanel: undefined,
	
    getSeriesTogglers: function(){
        return this.menu.getSeriesTogglers();
    },
    constructor: function(config) {
        var self = this;
        self.menu = new AFINCH.ui.SeriesToggleMenu({graphPanel: config.graphPanel});
        config = Ext.apply({
            items: [
                {text: 'Toggle Graph Series',
                 menu: self.menu
                }
            ],
			graphPanel: config.graphPanel
        }, config);

        AFINCH.ui.SeriesToggleToolbar.superclass.constructor.call(this, config);
        LOG.info('AFINCH.ui.SeriesToggleToolbar::constructor(): Construction complete.');
    }
});