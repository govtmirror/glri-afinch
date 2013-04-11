Ext.ns("AFINCH.ui");
AFINCH.ui.SeriesToggleMenuMixin = function(){
   var self = this;
   
    //properties:
    
    //public properties:
    /**
     * Maintain a map of series names to CheckItem objects.
     * Use series names instead of the button text because user may want to change
     * button text.
     */
    self.checkedSeriesButtons= {}; 
    self.monthlySeriesIdSet= {     //Emulate a hash set using Javascript's builtin hash table
        'mean_monthly_flow' : 0, //These keys match against programmatic series identifiers , not user-facing text.
        'median_monthly_flow': 0 //The values that the keys map to are meaningless, we just want fast key lookup with the 'in' operator
        }; 
    self.onlyMonthlySeriesSelected = false;
    
    //private properties:
    var oneYearInMs = 31536000000,//approximate
        lowestDecileGraphIndex = 5,
        highestDecileGraphIndex = 14,
        originalDateWindow = [],//prior to zooming down to monthly stats, the min and max dates for the graph will be saved here
        originalAxisOptions;
    
    //methods:    
    self.getSeriesTogglers= function(){
      return this.items.items;  
    };
    self.toggleSeriesHandler = function(checkItem, checked, optionalGraph){
        var graph;
        if(optionalGraph){
            graph = optionalGraph;
        }else{
            var win = checkItem.findParentByType('dataWindow');
            graph = win.graphPanel.graph;
        } 
        
        //update the seriesIdToStats map
        if(checked){
            self.checkedSeriesButtons[checkItem.seriesId] = checkItem;
        }
        else{
            delete self.checkedSeriesButtons[checkItem.seriesId];
        }
        //detect if exclusively monthly stat series have been selected
        var checkedSeriesIds = Object.keys(self.checkedSeriesButtons);
        var monthlySeriesIds = Object.keys(self.monthlySeriesIdSet);
        var isAMonthlySeriesId = function(id){
            return id in self.monthlySeriesIdSet;
        };
        if( (   //if the set of currently checked series is equivalent to the set of monthly series
            checkedSeriesIds.length === monthlySeriesIds.length
            && Array.every(checkedSeriesIds, isAMonthlySeriesId)
            )

            ||

            ( //or if the set of currently checked series is a subset of the set of monthly series
            checkedSeriesIds.length < monthlySeriesIds.length
            && Array.every(checkedSeriesIds, isAMonthlySeriesId)
            )    
           ){
            if(!self.onlyMonthlySeriesSelected){
                //stash current options
                originalDateWindow = graph.getOption('dateWindow');
                originalAxisOptions = graph.getOption('axis');
                //build new options and update the graph
                var options = {};
                
                var lowestDate = graph.getValue(0,0); //the first date in the data set
                var endOfYear = lowestDate + oneYearInMs;
                options.dateWindow = [lowestDate, endOfYear];
                
                var axis = {
                    x: {
                        valueFormatter: graph.afinchFormatters.dateToOnlyMonthString,
                        axisLabelFormatter:  graph.afinchFormatters.dateToOnlyMonthString
                    }
                };
                options.axis = axis;
                graph.updateOptions(options);
                self.onlyMonthlySeriesSelected = true;
            }
        }
        else{
            if(self.onlyMonthlySeriesSelected){//if previously only monthly series were selected
                //restore the former min, max date
                graph.updateOptions({
                    dateWindow: originalDateWindow,
                    axis : originalAxisOptions
                });
                self.onlyMonthlySeriesSelected = false;
            }
        }
        
        



        if(checkItem.chartColumn !== undefined || checkItem.seriesId){
            if(checkItem.seriesId == 'deciles'){
                for(var i = lowestDecileGraphIndex; i < highestDecileGraphIndex; i++){
                    graph.setVisibility(i, checked);
                }
            }
            else{
                graph.setVisibility(checkItem.chartColumn, checked);
            }
        }

    };
    self.constructor = function(config) {
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
        
        //now update the map
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
    };
}
AFINCH.ui.SeriesToggleMenu= Ext.extend(Ext.menu.Menu, new AFINCH.ui.SeriesToggleMenuMixin());