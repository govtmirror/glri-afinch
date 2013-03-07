Ext.ns('AFINCH.data');
/**
 * @param rWpsConfig - object literal of options
 * @param tabPane - an ExtJS TabPane component in which to render tables
 */ 
AFINCH.data.putRWpsResultsInTabPane = function(rWpsConfig, tabPane){
    var url = rWpsConfig.url || "";
    var xmlData = rWpsConfig.xmlData || "";
    //todo: use the open layers wps client instead of jQuery
    $.ajax(url,{
        type: 'POST',
        //* @debug
        mimeType: 'text/plain',
        //*/
        data: xmlData,
        success: function(data){
            var tableData;
            try{
                tablesData = AFINCH.data.RParse(data);
            }
            catch(e){
                alert("Error Parsing data. See browser logs for details.");
                LOG.error(e);
                return;
            }

            //given an array, return an array of the original elements
            //wrapped in an object and nested under a key of your choosing
            //
            //format:
            //[{<your key>:<original data>}, {<your key>:<original data>}, ... ]
            var wrapEachWithKey = function(array, key){
                return array.map(function(theVal){
                    var obj = {};
                    obj[key]=theVal;
                    return obj;
               });
            };

            tablesData.each(function(tableData){
                var fieldObjs = wrapEachWithKey(tableData.headers, 'name');
                fieldObjs = fieldObjs.map(function(n){
                    n.type = 'float';
                    return n;
                });

                var ar = new Ext.data.ArrayReader({}, 
                    Ext.data.Record.create(fieldObjs)
                ); 
                var store = new Ext.data.Store({
                    reader: ar,
                    data: tableData.values
                });
                
                var columnObjs = wrapEachWithKey(tableData.headers, 'header');
                //todo: enable sortin... need to add dataIndex prop to each
                //column object?
                var colModel = new Ext.grid.ColumnModel({
                    defaults: {
                        width: 120,
                        sortable: true
                    },
                    columns: columnObjs
                });
                var grid = new Ext.grid.GridPanel({
                    store: store,
                    colModel:colModel,
                    title: tableData.title
                });
                tabPane.add(grid);
            });
        },
        error: function(data, thing, otherThing){
            console.dir([data, thing, otherThing]);;
        }

    });
};
