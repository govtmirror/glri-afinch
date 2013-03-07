Ext.ns('AFINCH.data');

var makeLegalJavaScriptIdentifier = function(str){
    var illegal = /[^0-9a-zA-Z_$]/;
    var safe = str.replace(illegal, '_');
    return safe;
};

AFINCH.data.RParse = function(data){
    if(data.length === 0){
        throw new Error("Cannot parse zero-length string.");
    }
    var lines = data.split("\n");//note: the string might terminate with a newline
    if(lines.length === 0){
        throw new Error("Cannot parse data - only one line given");
    }
    //tables will be objects with 'title', 'headers', and 'values' properties
    var tables = [];
    for(var i = 0; i < lines.length; i++){
        var line = lines[i];
        //if it's a line describing column headers
        if('"' === line[0]){
            var headerStrings = line.split(',');
            //take out the leading and trailing quotes
            headerStrings=headerStrings.map(function(n){
                n = n.slice(1);
                n = n.slice(0, -1);
                //since header strings are used as js properties later on, 
                //make them legal 
                return makeLegalJavaScriptIdentifier(n);
            });
            currentTable.headers = headerStrings;
            currentTable.values = [];
        }
        //if it's a line describing values
        else if(/[0-9]/.test(line[0])){
            var values = line.split(',');
            currentTable.values.push(values);
        }
        //if it's a line describing a new table name
        else{
            //ignore the case where the data string was terminated with a newline char
            if(0 !== line.length){
                var currentTable = {title: line};
                tables.push(currentTable);
            }
        }
    }
    return tables;
};

