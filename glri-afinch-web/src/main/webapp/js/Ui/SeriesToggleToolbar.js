Ext.ns("AFINCH.ui");
AFINCH.ui.SeriesToggleToolbar= Ext.extend(Ext.Toolbar, {
    menu: undefined,
    getSeriesTogglers: function(){
        return this.menu.getSeriesTogglers();
    },
    constructor: function(config) {
        var self = this;
        self.menu = new AFINCH.ui.SeriesToggleMenu();
        config = Ext.apply({
            items: [
                {text: 'Toggle Graph Series',
                 menu: self.menu
                }
            ]
        }, config);

        AFINCH.ui.SeriesToggleToolbar.superclass.constructor.call(this, config);
        LOG.info('AFINCH.ui.SeriesToggleToolbar::constructor(): Construction complete.');
    }
});