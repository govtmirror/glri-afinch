/**
 * Just an empty panel with a fancy afterrender event. Dygraph puts its label in here.
 * @warning this will break unless instantiated from the afterrender event of the relevant Dygraph panel
 */
Ext.ns("AFINCH.ui");

AFINCH.ui.StatsLabelPanel = Ext.extend(Ext.Panel, {
    initialData: undefined,
    graph: undefined,
    constructor: function(config) {
        var self = this;
        config = Ext.apply({
            id: 'statsLabelPanel',
listeners: {
                afterrender: function(panel) {
                    var win = panel.findParentByType('dataWindow');
                    win.graphPanel.graph.updateOptions({
                        labelsDiv: 'statsLabelPanel',
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