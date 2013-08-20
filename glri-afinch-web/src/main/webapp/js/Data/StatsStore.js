Ext.ns("AFINCH.data");

/**
     * @param options object similar to the load syntax for a generic store's load method
     *      callback - a function accepting the following parameters:
     *			statStores - an array of Ext.data.Store
     *			success - a boolean
     *      scope -  context with which to call the function
     *      params:
     *			sosEndpointUrl - string url for the sosEndpoint
     * @note the function is memoized based on 'params'.
     * @see http://docs.sencha.com/ext-js/3-4/#!/api/Ext.data.Store-method-load
     */
AFINCH.data.statsStoreLoad =  function(options){
    var self = this;
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

    //check to see if results are cached
    var stringifiedParams = JSON.stringify(options.params);
    if(AFINCH.data.statsStoreLoad.cachedResults && stringifiedParams in AFINCH.data.statsStoreLoad.cachedResults){
        callback.call(context, AFINCH.data.statsStoreLoad.cachedResults[stringifiedParams], true);
        return;
    }

    var wpsRequestData = '<?xml version="1.0" encoding="UTF-8"?>'+
    '<wps:Execute xmlns:wps="http://www.opengis.net/wps/1.0.0" xmlns:ows="http://www.opengis.net/ows/1.1" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" service="WPS" version="1.0.0" xsi:schemaLocation="http://www.opengis.net/wps/1.0.0 http://schemas.opengis.net/wps/1.0.0/wpsExecute_request.xsd">'+
    '<ows:Identifier>org.n52.wps.server.r.monthlyq_swe_csv_stats</ows:Identifier>'+
    '<wps:DataInputs>'+
    '<wps:Input>'+
    '<ows:Identifier>model_url</ows:Identifier>'+
    '<wps:Data>'+
    '<wps:LiteralData><![CDATA['+ sosEndpointUrl +']]></wps:LiteralData>'+
    '</wps:Data>'+
    '</wps:Input>'+
    '</wps:DataInputs>'+
    '<wps:ResponseForm>'+
    '<wps:RawDataOutput>'+
    '<ows:Identifier>output</ows:Identifier>'+
    '</wps:RawDataOutput>'+
    '</wps:ResponseForm>'+
    '</wps:Execute>';

    var wpsUrl = CONFIG.endpoint.rwpsProxy +
    'WebProcessingService';
    var successCallback = function(response, options){
            if (response.responseText.toLowerCase().indexOf('exception') !== -1) {
                var errMsg = response.responseXML.getElementsByTagName('ns\:ExceptionText')[0].textContent;
                new Ext.ux.Notify({
                    msgWidth: 200,
                    title: 'Error',
                    msg: errMsg
                }).show(document);
                LOG.error(errMsg);
                return;
            }

            var data = response.responseText;
            var tablesData;
            try{
                tablesData = self.rParse(data);
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
            if(!AFINCH.data.statsStoreLoad.cachedResults){
                AFINCH.data.statsStoreLoad.cachedResults = {};
            }
            AFINCH.data.statsStoreLoad.cachedResults[stringifiedParams] = statsStores;
            callback.call(context, statsStores, true);
        };
    Ext.Ajax.request({
        url: wpsUrl,
        method: 'POST',
        params: wpsRequestData,
        success: successCallback,
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
};
AFINCH.data.RParseError = function(description){
	description = description ||
			'The data was in an unexpected format and hence could not be parsed.';
	return {
		name : 'RParseError',
		description : description
	};
};
AFINCH.data.StatsStore = Ext.extend(Ext.data.Store, {
    constructor: function(config) {
        AFINCH.data.StatsStore.superclass.constructor.call(this, config);
        LOG.info('AFINCH.data.StatsStore::constructor(): Construction complete.');
    },
    /**
     * Parses the string result of an R WPS statistical calculation into objects
     *
     * @param data - the string returned from the R WPS calculation
     * @returns - array of objects of the format:
     * [
     *  {title: 'table1name',
     *   fields: ['field1name', 'field2name', ... ,'field3name'],
     *   values: [
     *            [0.01, 0.02, ... , 0.03],//this array's length == fields.length
     *            [0.00, 0.03, ... , 0.04],
     *            .
     *            .
     *            .
     *            [1.01, 0.08, ... , 0.07]
     *           ] //values.length === number of rows in the table
     *  },
     *  .
     *  .
     *  .
     *  ]
     */
    rParse: function(data){
        if(data.length === 0){
            throw new Error("Cannot parse zero-length string.");
        }
        var lines = data.split("\n");//note: the string might terminate with a newline

		//psuedo-enum for parser state values
		var STATES = {
			TABLE_NAME_SEARCH: 0,
			COLUMN_NAME_SEARCH: 1,
			VALUE_SEARCH: 2
		};
		//initialize state
		var parserState = STATES.TABLE_NAME_SEARCH;

		var throwParserError = function(){
			throw AFINCH.data.RParseError();
		};
        //tables will be objects with 'title', 'headers', and 'values' properties
        var tables = [];
        for(var i = 0; i < lines.length; i++){
            var line = lines[i];
			if(line.trim().length){//ignore whitespace lines
				switch(parserState){
					case STATES.TABLE_NAME_SEARCH:
					case STATES.VALUE_SEARCH:
						//if it's a line describing values
						if(/^(['"]?[0-9\.(NA)]+['"]?,?[ ]?)+$/.test(line)){
							//kill any quotes and split on commas
							var values = line.replace(/["']/g, '').split(',');
							values = values.map(function(value){
								return parseFloat(value);
							});
							currentTable.values.push(values);
						}
						//if it's a line describing a new table name
						else if(/^[a-zA-Z_0-9]+$/.test(line)){
							//ignore the case where the data string was terminated with a newline char
							if(0 !== line.length){
								var currentTable = {
									title: line
								};
								tables.push(currentTable);
								parserState = STATES.COLUMN_NAME_SEARCH;
							}
						}

						else{
							throwParserError();
						}

					break;
					case STATES.COLUMN_NAME_SEARCH:
						if(/^".*"$/.test(line)){//roughly matches comma-separated, double-quoted values
							var headerStrings = line.split(',');
							//take out the leading and trailing quotes
							headerStrings=headerStrings.map(function(n){
								n = n.slice(1);
								n = n.slice(0, -1);
								//since header strings are used as js properties later on,
								//make them legal
								return AFINCH.util.makeLegalJavaScriptIdentifier(n);
							});
							currentTable.headers = headerStrings;
							currentTable.values = [];
							parserState = STATES.VALUE_SEARCH;
						}
						else{
							throwParserError();
						}
					break;
					default:
						throw "Illegal Parser State"

				}
				//if it's a line describing column headers
			}
		}
        return tables;
    },
    load: AFINCH.data.statsStoreLoad,
   /**
    * Converts a storeinto a csv string
    *
    * @returns string - a csv representation of the store
    */
    toCsv: function(){
        var store = this;

        var keys = store.fields.keys;
        var csv = keys.join(',') + '\n';

        store.data.items.each(function(record) {
            var values = [];
            keys.each(function(key) {
                values.push(record.data[key]);
            });
            csv += values.join(',') + '\n';
        });
        return csv;
    }
});