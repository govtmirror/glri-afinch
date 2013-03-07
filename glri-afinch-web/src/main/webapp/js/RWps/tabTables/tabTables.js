Ext.onReady(function(){
    var tabs = new Ext.TabPanel({
    	activeTab: 0,
        renderTo:'tabs',
        resizeTabs:true, // turn on tab resizing
        minTabWidth: 115,
        tabWidth:150,
        enableTabScroll:true,
        width:400,
        height:250,
        autoScroll:true,
        defaults: {}
    });
    //have to dummy this since CONFIG is set up elsewhere...
    CONFIG = {};
    CONFIG.endpoint = {};
    //CONFIG.endpoint.rwps = 'http://cida-wiwsc-wsdev.er.usgs.gov:8080/wps/';
    CONFIG.endpoint.rwps = 'http://localhost:8080/glri-afinch/rwps/';
    var callback = AFINCH.data.putGridsIntoTabPanel;
    var context = {tabPanel: tabs};//context
    AFINCH.data.retrieveStatStores(
        'ftp://ftpext.usgs.gov/pub/er/wi/middleton/dblodgett/example_monthly_swecsv.xml',
        callback,
        context
    );
});
