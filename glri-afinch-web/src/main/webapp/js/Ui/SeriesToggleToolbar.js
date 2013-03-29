Ext.ns("AFINCH.ui");
AFINCH.ui.SeriesToggleToolbar= Ext.extend(Ext.Toolbar, {
    _menu: undefined,
    getSeriesTogglers: function(){
        return this._menu.getSeriesTogglers();
    },
    constructor: function(config) {
        var menu = this._menu = new AFINCH.ui.SeriesToggleMenu();
        config = Ext.apply({
            items: [
                {text: 'Toggle Graph Series',
                 menu: menu
                }
            ]
        }, config);

        AFINCH.ui.SeriesToggleToolbar.superclass.constructor.call(this, config);
        LOG.info('AFINCH.ui.SeriesToggleToolbar::constructor(): Construction complete.');
    }
});