Ext.ns("AFINCH.data");

AFINCH.data.StatsStore = Ext.extend(Ext.data.Store, {
    constructor: function(config) {
        AFINCH.data.StatsStore.superclass.constructor.call(this, config);
        LOG.info('AFINCH.data.StatsStore::constructor(): Construction complete.');
    },
    /**
     * @param options object similar to the load syntax for a generic store's load method
     *      @param callback - a function accepting the following parameters:
     *              @param statStores - an array of Ext.data.Store
     *              @param success - a boolean 
     *      @param scope -  context with which to call the function
     *      @param params:
     *          @param sosEndpointUrl - string url for the sosEndpoint
     *          
     * @see http://docs.sencha.com/ext-js/3-4/#!/api/Ext.data.Store-method-load
     */
    load: function(options){
        
        var sosEndpointUrl = options.params.sosEndpointUrl,
            callback = options.callback,
            context = options.scope;
            
        if(!sosEndpointUrl || !sosEndpointUrl.length){
            LOG.error('url not specified');
            return;
        }
        if(!callback){
            LOG.error('callback not specified');
            return;
        }
        var wpsRequestData = '<?xml version="1.0" encoding="UTF-8"?>'+
            '<wps:Execute xmlns:wps="http://www.opengis.net/wps/1.0.0" xmlns:ows="http://www.opengis.net/ows/1.1" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" service="WPS" version="1.0.0" xsi:schemaLocation="http://www.opengis.net/wps/1.0.0 http://schemas.opengis.net/wps/1.0.0/wpsExecute_request.xsd">'+
                '<ows:Identifier>org.n52.wps.server.r.monthlyq_swe_csv_stats</ows:Identifier>'+
                '<wps:DataInputs>'+
                    '<wps:Input>'+
                        '<ows:Identifier>model_url</ows:Identifier>'+
                        '<wps:Data>'+
                            '<wps:LiteralData>'+ sosEndpointUrl +'</wps:LiteralData>'+
                        '</wps:Data>'+
                    '</wps:Input>'+
                '</wps:DataInputs>'+
                '<wps:ResponseForm>'+
                    '<wps:RawDataOutput>'+
                        '<ows:Identifier>output</ows:Identifier>'+
                    '</wps:RawDataOutput>'+
                '</wps:ResponseForm>'+
            '</wps:Execute>';

        var wpsUrl = CONFIG.endpoint.rwps + 
            'WebProcessingService?Service=WPS&Request=execute&Identifier=org.n52.wps.server.r.monthlyq_swe_csv_stats';

        Ext.Ajax.request({
            url: wpsUrl,
            method: 'POST',
            params: wpsRequestData,
            success: function(response, options){
                if (response.responseText.toLowerCase().contains('exception')) {
                    new Ext.ux.Notify({
                        msgWidth: 200,
                        title: 'Error',
                        msg: response.responseXML.getElementsByTagName('ns\:ExceptionText')[0].textContent
                    }).show(document);
                    LOG.error(e);
                    return;
                }

                var data = response.responseText;
                var tablesData;
                try{
                    tablesData = AFINCH.data.RParse(data);
                }
                catch(e){
                    new Ext.ux.Notify({
                        msgWidth: 200,
                        title: 'Error',
                        msg: "Error Parsing data. See browser logs for details."
                    }).show(document);
                    LOG.error(e);
                    return;
                }

                var statsStores = tablesData.map(function(tableData){
                    var fieldObjs = AFINCH.util.wrapEachWithKey(tableData.headers, 'name');
                    fieldObjs = fieldObjs.map(function(n){
                        n.type = 'float';
                        return n;
                    });

                    var ar = new Ext.data.ArrayReader({}, 
                        Ext.data.Record.create(fieldObjs)
                    ); 

                    return new AFINCH.data.StatsStore({
                        title : tableData.title,
                        reader: ar,
                        data: tableData.values
                    });
                });

                callback.call(context, statsStores, true);
            },
            failure: function(response, options){
                LOG.error(response);
                    new Ext.ux.Notify({
                        msgWidth: 200,
                        title: 'Error',
                        msg: "Error retrieving data from server. See browser logs for details."
                    }).show(document);         
                callback.call(context, null, false);
            }
        });  
    }
});