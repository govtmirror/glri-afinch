Ext.ns('AFINCH.data');
/**
 * @param rWpsConfig - object literal of options
 * @param tabPane - an ExtJS TabPane component in which to render tables
 */ 
AFINCH.data.putRWpsResultsInTabPane = function(sosEndpointUrl, tabPane){

    var callback = function(namedStores){
        namedStores.each(function(namedStore){
            var store = namedStore.store;
            var columnObjs = AFINCH.Util.wrapEachWithKey(store.fields.keys, 'header');
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
