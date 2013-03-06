Ext.ns('AFINCH.data');
var printParse = function(data){
    console.dir(AFINCH.data.RParse(data));
};

$.ajax('/glri-afinch-web/js/RWps/results.xml', {
    success: printParse,
    //it's .xml file ext so that tomcat will serve it, but it's just a plaintext:
    mimeType: 'text/plain'
});

