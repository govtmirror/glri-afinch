Ext.ns("AFINCH.ui");

AFINCH.ui.StatsGridPanel = Ext.extend(Ext.grid.GridPanel, {
    constructor: function(config) {
        var statsStore = config.statsStore || [];
        var columnObjs = AFINCH.util.wrapEachWithKey(statsStore.fields.keys, 'header');
        var colModel = new Ext.grid.ColumnModel({
            defaults: {
                width: 50,
                sortable: true
            },
            columns: columnObjs
        });

        config = Ext.apply({
            store: statsStore,
            colModel: colModel,
            height: 350,
            width: 125
        }, config);

        AFINCH.ui.StatsGridPanel.superclass.constructor.call(this, config);
        LOG.info('AFINCH.ui.StatsGridPanel::constructor(): Construction complete.');
    }
});