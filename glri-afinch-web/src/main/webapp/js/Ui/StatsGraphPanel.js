Ext.ns("AFINCH.ui");

AFINCH.ui.StatsGraphPanel = Ext.extend(Ext.Panel, {
    initialData: undefined,
    graph: undefined,
    constructor: function(config) {
        var self = this;
        config = Ext.apply({
            listeners: {
                afterrender: function(panel) {
                    var data = self.initialData.data;
                    var labels = self.initialData.headers;
                    self.graph = new Dygraph(panel.getEl().dom, data, {
                        labels: labels,
                        connectSeparatedPoints: true
                    });
                }
            }
        }, config);

        AFINCH.ui.StatsGraphPanel.superclass.constructor.call(this, config);
        LOG.info('AFINCH.ui.StatsGraphPanel::constructor(): Construction complete.');
    }
});