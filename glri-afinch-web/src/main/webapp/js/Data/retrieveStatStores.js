Ext.ns('AFINCH.data');

/**
 * Calls 'callback' on the stats calculated from the specified
 * sosEndpointUrl
 * @param sosEndpointUrl - required string url
 * @param callback - required function that takes one parameter - 'stores', an array of named Ext.data.Store s
 *                   the callback should expect an array of the following format:
 *                   [
 *                      {name: "<a string name>"
 *                       store: <an Ext.data.Store>
 *                      },
 *                      .
 *                      .
 *                      .
 *                   ]
 * @param context - Object used as **this** in the callback
 * @param errorCallback - optional error handler for if the ajax request fails.
 *                        accepts same args as the Ext Ajax failure callback
 * 
 * 
 */

AFINCH.data.retrieveStatStores = function(sosEndpointUrl, callback, context, errorCallback){
    if(!sosEndpointUrl.length){
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
            if (response.responseText.toLowerCase().has('exception')) {
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
            
            callback.call(context, statsStores);
        },
        failure: function(response, options){
            LOG.error(response);
            if(errorCallback){
               errorCallback(response, options);
            }
        }
    });
};
