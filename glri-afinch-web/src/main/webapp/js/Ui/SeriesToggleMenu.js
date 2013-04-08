Ext.ns("AFINCH.ui");
AFINCH.ui.SeriesToggleMenu= Ext.extend(Ext.menu.Menu, {
    getSeriesTogglers: function(){
      return this.items.items;  
    },
    constructor: function(config) {
         var toggleSeriesHandler = function(checkItem, checked, optionalGraph){
            var lowestDecileGraphIndex = 5;
            var highestDecileGraphIndex = 14;
            var graph;
            if(optionalGraph){
                graph = optionalGraph;
            }else{
                var win = checkItem.findParentByType('dataWindow');
                graph = win.graphPanel.graph;
            } 
            
            if(checkItem.chartColumn !== undefined || checkItem.statName){
                if(checkItem.statName == 'deciles'){
                    for(var i = lowestDecileGraphIndex; i < highestDecileGraphIndex; i++){
                        graph.setVisibility(i, checked);
                    }
                }
                else{
                    graph.setVisibility(checkItem.chartColumn, checked);
                }
            }
        };
        
        //compose some CheckItem objects
        var baseCheckItem = {
            checkHandler: toggleSeriesHandler,
            checked: false,
            disabled: true
        }
        //most statName fields not in use EXCEPT for deciles
        var checkItems = [
        {
            text: 'Monthly Flow',
            chartColumn: 0,
            checked: true
        },
        {
            text: 'Mean Annual Flow',
            statName: 'mean_annual_flow',
            chartColumn: 1,
            checked: true
        }, 

        {
            text:'Median Annual Flow',
            statName: 'median_annual_flow',
            chartColumn: 2,
            checked: true
        }, 

        {
            text: 'Mean Monthly Flow',
            chartColumn: 3,
            statName: 'mean_monthly_flow'
        },

        {
            text: 'Median Monthly Flow',
            statName: 'median_monthly_flow',
            chartColumn: 4
        },
        {
            text: 'Deciles',
            statName: 'deciles'
        //no chart column because deciles is a special case
        }
        ];
        checkItems = checkItems.map(function(checkItem){
            var composedCheckItem = {};
            Object.merge(composedCheckItem, baseCheckItem);
            return Object.merge(composedCheckItem, checkItem);
        });
            
        config = Ext.apply({
            items : checkItems
        }, config);

        AFINCH.ui.SeriesToggleMenu.superclass.constructor.call(this, config);
        LOG.info('AFINCH.ui.SeriesToggleMenu::constructor(): Construction complete.');
    }
});