Ext.ns("AFINCH.data");
AFINCH.data.RWpsStore = function(meta) {
    meta = meta || {};

    meta.format = new OpenLayers.Format.WPSExecute();
    meta.fields = [
        {name: "version", type: "string"},
        {name: "languages"}, // Array of objects
        {name: "operationsMetadata"}, // Array of objects
        {name: "processOfferings"}, // Object
        {name: "serviceIdentification"}, // Object
        {name: "serviceProvider"}
    ]
    AFINCH.data.RWpsStore.superclass.constructor.call(
        this,
        Ext.apply(meta, {
            proxy: meta.proxy || (!meta.data ? new Ext.data.HttpProxy({url: meta.url, disableCaching: false, method: "GET"}) : undefined),
            reader: new AFINCH.data.RWpsReader(meta)
        })
    );
};

Ext.extend(AFINCH.data.RWpsStore, Ext.data.Store);
