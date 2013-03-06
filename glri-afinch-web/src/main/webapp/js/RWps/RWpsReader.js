Ext.ns("AFINCH.data");

AFINCH.data.RWpsReader = function(meta, recordType) {
    meta = meta || {};
    if(!meta.format) {
        meta.format = new OpenLayers.Format.WPSExecute();
    }
    if(typeof recordType !== "function") {
        recordType = Ext.data.Record.create(meta.fields || [
            {name: "version", type: "string"}
        ]
        );
    }
    AFINCH.data.RWpsReader.superclass.constructor.call(
        this, meta, recordType
    );
};

Ext.extend(AFINCH.data.RWpsReader, Ext.data.DataReader, {


    /** api: config[attributionCls]
     *  ``String`` CSS class name for the attribution DOM elements.
     *  Element class names append "-link", "-image", and "-title" as
     *  appropriate.  Default is "gx-attribution".
     */
    attributionCls: "gx-attribution",

    /** private: method[read]
     *  :param request: ``Object`` The XHR object which contains the parsed XML
     *      document.
     *  :return: ``Object`` A data block which is used by an ``Ext.data.Store``
     *      as a cache of ``Ext.data.Record`` objects.
     */
    read: function(request) {
        //todo: more robust error handling for server-side exceptions
        data = request.responseText;
        return this.readRecords(data);
    },
    

    /** private: method[readRecords]
     *  :param data: ``DOMElement | String | Object`` A document element or XHR
     *      response string.  As an alternative to fetching capabilities data
     *      from a remote source, an object representing the capabilities can
     *      be provided given that the structure mirrors that returned from the
     *      capabilities parser.
     *  :return: ``Object`` A data block which is used by an ``Ext.data.Store``
     *      as a cache of ``Ext.data.Record`` objects.
     *  
     *  Create a data block containing Ext.data.Records from an XML document.
     */
    readRecords: function(data) {
        return AFINCH.data.RParse(data);    
    }

});
//@param string - text/plain
AFINCH.data.RParse = function(data){
    var failResults = {
                        records:undefined,
                        totalRecords:0,
                        success: false
                      };
    if(data.length === 0){
        return failResults;
    }
    var lines = data.split("\n");
    if(lines.length === 0){
        return failResults;
    }
    var numTables = 1;
    var currentTable = lines[0];
    var tables = {};
    tables[currentTable]={};
    for(var i = 1; i < lines.length; i++){
        var line = lines[i];
        //if it's a line describing column headers
        if('"' === line[0]){
            var headerStrings = line.split(',');
            //take out the leading and trailing quotes
            headerStrings=headerStrings.map(function(n){
                n = n.slice(1);
                n = n.slice(0, -1);
                return n;
            });
            tables[currentTable]['headers'] = headerStrings;
            tables[currentTable]['values'] = [];
        }
        //if it's a line describing values
        else if(/[0-9]/.test(line[0])){
            var values = line.split(',');
            tables[currentTable]['values'].push(values);
        }
        //if it's a line describing a new table name
        else{
            currentTable = line;
            tables[currentTable]={};
            numTables++;
        }
    }
    return {
            totalRecords: numTables,
            success: true,
            records: tables
            };
};


