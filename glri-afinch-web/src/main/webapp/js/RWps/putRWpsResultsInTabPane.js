Ext.ns('AFINCH.data');
/**
 * Given a data store, construct an Ext.grid.GridPanel and add it to the tabPanel
 *
 *@param store - Ext.data.Store
 *@param title - string title for the GridPanel
 *
 *@returns void
 */

AFINCH.data.makeGridPanelFromStore = function(store, title){
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
        title: title
    });
    return grid;
};

/**
 * @param namedStores - array
 * @returns array<Ext.grid.GridPanel>
 */ 
AFINCH.data.makeGridPanelsFromNamedStores = function(namedStores){
        return namedStores.map(function(namedStore){
            return AFINCH.data.makeGridPanelFromStore(namedStore.store, namedStore.name);
        });
};

/**
 * Given named stores, creates grids. Puts the grids into an array
 * @param namedStores - array
 */
AFINCH.data.putGridsIntoTabPanel = function(namedStores){
    //needs a tabPane property set as 'this' via call()
    if(!this.tabPanel){
        throw Error("You must specify a TabPane.");
    }

    var grids = AFINCH.data.makeGridPanelsFromNamedStores(namedStores);
    
    //bring into local scope so that tabPane can be accessed via closure in 
    //the following function
    var tabPanel = this.tabPanel;
    
    grids.map(function(grid){
        tabPanel.add(grid);
    });
    tabPanel.setActiveTab(0);
};