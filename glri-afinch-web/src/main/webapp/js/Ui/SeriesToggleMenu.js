Ext.ns("AFINCH.ui");
AFINCH.ui.SeriesToggleMenu= Ext.extend(Ext.menu.Menu, {
    /**
     * Maintain a map of series names to CheckItem objects.
     * Use series names instead of the button text because user may want to change
     * button text.
     */
    checkedSeriesButtons: {},
    monthlySeriesIds: ['mean_monthly_flow', 'median_monthly_flow'], //matches against programmatic identifiers, not user-facing text.
    getSeriesTogglers: function(){
      return this.items.items;  
    },
    toggleSeriesHandler: function(checkItem, checked, optionalGraph){
        var self = this;
        
        //update the seriesIdToStats map
        if(checked){
            self.checkedSeriesButtons[checkItem.seriesId] = checkItem;
        }
        else{
            delete self.checkedSeriesButtons[checkItem.seriesId];
        }
        
        var checkedSeriesIds = Object.keys(self.checkedSeriesButtons);
        
        var isAMonthlySeriesId = function(id){
            return id in self.monthlySeriesIds;
        };
        
        if( (   //if the set of currently checked series is equivalent to the set of monthly series
            checkedSeriesIds.length === self.monthlySeriesIds.length
            && Array.every(checkedSeriesIds, isAMonthlySeriesId)
            )
                
            ||
            
            ( //or if the set of currently checked series is a subset of the set of monthly series
            checkedSeriesIds.length < self.monthlySeriesIds.length
            && Array.every(checkedSeriesIds, isAMonthlySeriesId)
            )    
           ){
            
            alert("only monthly series are selected");
        }
        
        
        var graph;
        if(optionalGraph){
            graph = optionalGraph;
        }else{
            var win = checkItem.findParentByType('dataWindow');
            graph = win.graphPanel.graph;
        } 


        if(checkItem.chartColumn !== undefined || checkItem.seriesId){
            if(checkItem.seriesId == 'deciles'){
                for(var i = 5; i < 14; i++){
                    graph.setVisibility(i, checked);
                }
            }
            else{
                graph.setVisibility(checkItem.chartColumn, checked);
            }
        }

    },
    constructor: function(config) {
        var self = this;
        
        //compose some CheckItem objects
        var baseCheckItem = {
            checkHandler: self.toggleSeriesHandler,
            checked: false,
            disabled: true
        }
        
        //in the following composed buttons...
        //'seriesId' properties are for programmatic identification of buttons
        //whereas 'text' properties are for display to the user
        var checkItems = [
        {
            text: 'Monthly Flow',
            seriesId: 'monthly_flow',
            chartColumn: 0,
            checked: true
        },
        {
            text: 'Mean Annual Flow',
            seriesId: 'mean_annual_flow',
            chartColumn: 1,
            checked: true
        }, 

        {
            text:'Median Annual Flow',
            seriesId: 'median_annual_flow',
            chartColumn: 2,
            checked: true
        }, 

        {
            text: 'Mean Monthly Flow',
            chartColumn: 3,
            seriesId: 'mean_monthly_flow'
        },

        {
            text: 'Median Monthly Flow',
            seriesId: 'median_monthly_flow',
            chartColumn: 4
        },
        {
            text: 'Deciles',
            seriesId: 'deciles'
        //no chart column because deciles is a special case
        }
        ];
        checkItems = checkItems.map(function(checkItem){
            var composedCheckItem = {};
            Object.merge(composedCheckItem, baseCheckItem);
            return Object.merge(composedCheckItem, checkItem);
        });
        
        //now update seriesIdsCheckedStatus map
        checkItems.each(function(checkItem){
            if(checkItem.checked){
                self.checkedSeriesButtons[checkItem.seriesId] = checkItem;
            }
        });
        
        config = Ext.apply({
            items : checkItems
        }, config);

        AFINCH.ui.SeriesToggleMenu.superclass.constructor.call(this, config);
        LOG.info('AFINCH.ui.SeriesToggleMenu::constructor(): Construction complete.');
    }
});