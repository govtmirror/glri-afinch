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
    CONFIG.endpoint.rwps = 'http://130.11.177.42:8080/glri-afinch/rwps/';
       
    var callback = function(namedStores){
        var i = 0;
        namedStores.each(function(namedStore){
           var keys = namedStore.store.fields.keys;
           var csvIsh = keys.join(',') +'\n';
           namedStore.store.each(function(record){
               var values = [];
               keys.each(function(key){
                   values.push(record.data[key]);
               });
               csvIsh += values.join(',')+'\n';
           });
           var graphCont = document.createElement('div');
           graphCont.id = 'graph'+i;
           i++;
           
           document.getElementById('graphs').appendChild(graphCont);
           
           var dg = new Dygraph(graphCont, csvIsh, {xlabel: keys[0], ylabel: keys[1], title: namedStore.name});
          
        });
        
        AFINCH.data.putGridsIntoTabPanel.call(this, namedStores);
        
        tabs.add(new Ext.Component('graphs'));
    };
    var context = {tabPanel: tabs};//context
    AFINCH.data.retrieveStatStores(
        'ftp://ftpext.usgs.gov/pub/er/wi/middleton/dblodgett/example_monthly_swecsv.xml',
        callback,
        context
    );
    
    
    
});
