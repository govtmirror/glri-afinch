Ext.ns("AFINCH.ui");

AFINCH.ui.StatsGraphPanel = Ext.extend(Ext.Panel, {
    statsStores: undefined,
    graph: undefined,
    constructor: function(config) {
        var self = this;
        config = Ext.apply({
            listeners: {
                afterrender: function(panel) {
                    //grab all store titles
                    var storeTitles = self.statsStores.map(function(store){
                        return store.title;
                    });
                    var data =  [ 
                    [new Date('1900/01/01'),  100,    150,50,75,      37,74,111,149,186,223,261,298,335],
                    [new Date('1900/02/01'),  null,   null,125,170,   37,74,111,149,186,223,261,298,335],
                    [new Date('1900/03/01'),  null,   null,150,175,   37,74,111,149,186,223,261,298,335],
                    [new Date('1901/01/01'),  150,    200,100,150,    37,74,111,149,186,223,261,298,335]
                    ];
                    var labels = ['Date','Annual Median Flow','Annual Mean Flow','Monthly Median Flow','Monthly Mean Flow','0.1','0.2','0.3','0.4','0.5','0.6','0.7','0.8','0.9'];
                    new Dygraph(self.getEl().dom, data, {labels: labels});
//                    this.graphStoresInPanel();
                }
            }
        }, config);

        AFINCH.ui.StatsGraphPanel.superclass.constructor.call(this, config);
        LOG.info('AFINCH.ui.StatsGraphPanel::constructor(): Construction complete.');
    },
    /**
     * @param array of string store titles to graph
     * @note this can only be called after rendering the Ext Panel; otherwise no
     * dom element will exist
     */
    graphStores: function(storeTitles){
        var storesToGraph = this.statsStores.filter(function(store){
            return !!storeTitles.find(store.title);
        });
        console.dir(storesToGraph);
        
        this.graph = new Dygraph(this.getEl().dom, csv, {xlabel: keys[0], ylabel: keys[1]});
    }
});