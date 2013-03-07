Ext.ns('AFINCH.data');
/**
 * @param rWpsConfig - object literal of options
 * @param tabPane - an ExtJS TabPane component in which to render tables
 */ 
AFINCH.data.putRWpsResultsInTabPane = function(rWpsConfig, tabPane){
    var url = rWpsConfig.url || "";
    var xmlData = rWpsConfig.xmlData || "";

    $.ajax(url,{
        type: 'POST',
        data: xmlData,
        success: function(data){
            console.log('done');
        },
        error: function(data){
            console.log('OH NO');
        }

    });
};
