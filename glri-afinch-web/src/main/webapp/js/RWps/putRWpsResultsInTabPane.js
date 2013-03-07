Ext.ns('AFINCH.data');
/**
 * @param rWpsConfig - object literal of options
 * @param tabPane - an ExtJS TabPane component in which to render tables
 */ 
AFINCH.data.putRWpsResultsInTabPane = function(sosEndpointUrl, tabPane){

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
    var callback = function(namedStores){
        namedStores.each(function(namedStore){
            var store = namedStore.store;
            var columnObjs = wrapEachWithKey(store.fields.keys, 'header');
            //todo: enable sorting... need to add dataIndex prop to each
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
                title: namedStore.name
            });
            tabPane.add(grid);
        });
    };
    
    AFINCH.data.getStatStores(sosEndpointUrl, callback);
};
