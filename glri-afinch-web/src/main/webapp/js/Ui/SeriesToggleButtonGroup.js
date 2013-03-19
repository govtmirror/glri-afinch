Ext.ns("AFINCH.ui");

AFINCH.ui.SeriesToggleButtonGroup= Ext.extend(Ext.ButtonGroup, {
    constructor: function(config) {
         var toggleSeriesHandler = function(button, event){
            alert("wow for now!");
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
            pressed: true
        }
        var buttons = [
            {text: 'Mean Annual Flow',
            statName: 'mean_annual_flow'}, 
            {text:'Median Annual Flow',
            statName: 'median_annual_flow'}, 
            {text: 'Mean Monthly Flow',
            statName: 'mean_monthly_flow'},
            {text: 'Median Monthly Flow',
            statName: 'median_monthly_flow'
            },
            {text: 'Deciles',
             statName: 'deciles'
            }
        ];
        buttons = buttons.map(function(button){
            var composedButton = {};
           Object.merge(composedButton, baseButton);
           return Object.merge(composedButton, button);
        });
        //now the button objects have all the desired properties
        
        config = Ext.apply({
            items : buttons
        }, config);

        AFINCH.ui.SeriesToggleButtonGroup.superclass.constructor.call(this, config);
        LOG.info('AFINCH.ui.SeriesToggleButtonGroup::constructor(): Construction complete.');
    }
});