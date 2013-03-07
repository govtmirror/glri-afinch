Ext.onReady(function(){
    var tabs = new Ext.TabPanel({
    	activeTab: 0,
        renderTo:'tabs',
        resizeTabs:true, // turn on tab resizing
        minTabWidth: 115,
        tabWidth:135,
        enableTabScroll:true,
        width:600,
        height:250,
        defaults: {autoScroll:true}
    });
    //have to dummy this since CONFIG is set up elsewhere...
    CONFIG = {};
    CONFIG.endpoint = {};
    //CONFIG.endpoint.rwps = 'http://cida-wiwsc-wsdev.er.usgs.gov:8080/wps/';
    CONFIG.endpoint.rwps = 'http://localhost:8080/glri-afinch/rwps/';
    AFINCH.data.putRWpsResultsInTabPane('ftp://ftpext.usgs.gov/pub/er/wi/middleton/dblodgett/example_monthly_swecsv.xml', tabs);

});
