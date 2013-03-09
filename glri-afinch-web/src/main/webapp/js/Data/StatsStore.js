Ext.ns("AFINCH.data");

AFINCH.data.StatsStore = Ext.extend(Ext.data.Store, {
    constructor: function(config) {
        AFINCH.data.StatsStore.superclass.constructor.call(this, config);
        LOG.info('AFINCH.data.StatsStore::constructor(): Construction complete.');
    }
});