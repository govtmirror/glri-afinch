Ext.ns("AFINCH.ui");

AFINCH.ui.StatsGraphPanel = Ext.extend(Ext.Panel, {
    initialData: undefined,
    graph: undefined,
    constructor: function(config) {
        var self = this;
        
        config = Ext.apply({
            width: 800,
            listeners: {
                afterrender: function(panel) {
                    var data = self.initialData.data;
                    var labels = self.initialData.headers;
                    var win = panel.findParentByType('dataWindow');
                    win.graphPanel.graph = new Dygraph(panel.getEl().dom, data, {
                        labels: labels,
                        connectSeparatedPoints: true,
                        showRangeSelector: true        
                    });
                    win.graphPanel.graph.data = data;
                    win.graphPanel.graph.getOption('labels');
                    var labelPanel = win.labelPanel = new AFINCH.ui.StatsLabelPanel();
                    
                    win.add(labelPanel);
                    win.doLayout();
                }
            }
        }, config);

        AFINCH.ui.StatsGraphPanel.superclass.constructor.call(this, config);
        LOG.info('AFINCH.ui.StatsGraphPanel::constructor(): Construction complete.');
    }
});