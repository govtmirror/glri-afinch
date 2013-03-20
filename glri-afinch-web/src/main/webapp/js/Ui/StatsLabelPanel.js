/**
 * Just an empty panel with a fancy afterrender event. Dygraph puts it's label in here.
 * @warning this will break unless instantiated from the afterrender event of the relevant Dygraph panel
 */
Ext.ns("AFINCH.ui");

AFINCH.ui.StatsLabelPanel = Ext.extend(Ext.Panel, {
    initialData: undefined,
    graph: undefined,
    constructor: function(config) {
        var self = this;
        config = Ext.apply({
            listeners: {
                afterrender: function(panel) {
                    var win = panel.findParentByType('dataWindow');
                    win.graphPanel.graph.updateOptions({
                        labelsDiv: panel.getEl().dom,
                        labelsSeparateLines: true,
                        legend: 'always'
                    });
                }
            }
        }, config);

        AFINCH.ui.StatsLabelPanel.superclass.constructor.call(this, config);
        LOG.info('AFINCH.ui.StatsLabelPanel::constructor(): Construction complete.');
    }
});