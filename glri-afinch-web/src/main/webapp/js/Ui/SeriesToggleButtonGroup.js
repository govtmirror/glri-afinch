Ext.ns("AFINCH.ui");
//@todo:  Holy Hardcoding Batman!
AFINCH.ui.SeriesToggleButtonGroup= Ext.extend(Ext.ButtonGroup, {
    constructor: function(config) {
         var toggleSeriesHandler = function(button, event){
          
            var win = button.findParentByType('dataWindow');
            var graph = win.graphPanel.graph;
            
            if(button.chartColumn !== undefined || button.statName){
                if(button.statName == 'deciles'){
                    for(var i = 5; i < 14; i++){
                        graph.setVisibility(i, button.pressed);
                    }
                }
                else{
                    graph.setVisibility(button.chartColumn, button.pressed);
                }
            }
//            var buttonGroup = button.findParentByType('buttongroup');
//            var pressedButtons = buttonGroup.items.filter(function(button){
//                return button.pressed;
        //            });
        //            var storesToVisualize = pressedButtons.map(function(button){
        //               return button.statName; 
        //            });
        //            
           
        };
        
        //compose some button objects
        var baseButton = {
            enableToggle: true,
            handler: toggleSeriesHandler,
            pressed: true,
            disabled: true
        }
        //most statName fields not in use EXCEPT for deciles
        var buttons = [
        {
            text: 'Mean Annual Flow',
            statName: 'mean_annual_flow',
            chartColumn: 1
        }, 

        {
            text:'Median Annual Flow',
            statName: 'median_annual_flow',
            chartColumn: 2
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
        buttons = buttons.map(function(button){
            var composedButton = {};
            Object.merge(composedButton, baseButton);
            return Object.merge(composedButton, button);
        });
        //now the button objects have all the desired properties, but there is one missing
        //add the Monthly Flow button to the front:
        buttons.unshift({
            text: 'Monthly Flow',
            chartColumn: 0,
            enableToggle: true,
            handler: toggleSeriesHandler,
            pressed: true
        } );
            
        config = Ext.apply({
            items : buttons
        }, config);

        AFINCH.ui.SeriesToggleButtonGroup.superclass.constructor.call(this, config);
        LOG.info('AFINCH.ui.SeriesToggleButtonGroup::constructor(): Construction complete.');
    }
});