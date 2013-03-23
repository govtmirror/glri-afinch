Ext.ns("AFINCH.ui");

AFINCH.ui.StatsGraphPanel = Ext.extend(Ext.Panel, {
    initialData: undefined,
    graph: undefined,
    headers: undefined,
    constructor: function(config) {
        var self = this;
        
        config = Ext.apply({
            width: 800
        }, config);

        AFINCH.ui.StatsGraphPanel.superclass.constructor.call(this, config);
        LOG.info('AFINCH.ui.StatsGraphPanel::constructor(): Construction complete.');
    }
});