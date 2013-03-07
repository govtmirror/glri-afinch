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
        defaults: {autoScroll:true},
    });

    
    var useExampleXML = function(xmlData){
        var rWpsConfig = {
            /* @prod
            url: 'http://cida-wiwsc-wsdev.er.usgs.gov:8080/wps/WebProcessingService?Service=WPS&Request=execute&identifier=org.n52.wps.server.r.monthlyq_swe_csv_stats',
            //*/
            
            //* @debug 
            url: 'http://localhost:8080/glri-afinch/js/RWps/results.xml',
            //*/
            xmlData: xmlData

        };
        AFINCH.data.putRWpsResultsInTabPane(rWpsConfig, tabs);
    };
    //kick off all the callbacks: 
    $.ajax('/glri-afinch/js/RWps/example.xml', {
        success: useExampleXML,
        //it's .xml file ext so that tomcat will serve it, but it's just a plaintext:
        mimeType: 'text/plain'
    });


});
