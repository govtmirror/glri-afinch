Ext.ns("AFINCH.ui");

AFINCH.ui.StatsGraphPanel = Ext.extend(Ext.Panel, {
    statsStore: undefined,
    graph: undefined,
    constructor: function(config) {
        config = Ext.apply({
            listeners: {
                afterrender: function(panel) {
                    var keys = panel.statsStore.fields.keys;
                    var csv = keys.join(',') + '\n';

                    panel.statsStore.data.items.each(function(record) {
                        var values = [];
                        keys.each(function(key) {
                            values.push(record.data[key]);
                        });
                        csv += values.join(',') + '\n';
                    });
                    panel.graph = new Dygraph(panel.getEl().dom, csv, {xlabel: keys[0], ylabel: keys[1]});
                }
            }
        }, config);

        AFINCH.ui.StatsGraphPanel.superclass.constructor.call(this, config);
        LOG.info('AFINCH.ui.StatsGraphPanel::constructor(): Construction complete.');
    }
});