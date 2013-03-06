/*
var printIt = function(data){
        console.log("WOW");
        console.dir(data);
        
};
$.ajax('http://cida-wiwsc-wsdev.er.usgs.gov:8080/wps/WebProcessingService?Service=WPS&Request=execute&identifier=org.n52.wps.server.r.monthlyq_swe_csv_stats',
{   sucess: printIt,
    error: printIt
});
*/
//http://cida-wiwsc-wsdev.er.usgs.gov:8080/wps/WebProcessingService?Service=WPS&Request=execute&identifier=org.n52.wps.server.r.monthlyq_swe_csv_stats
$.ajax('http://localhost:8080/glri-afinch-web/js/RWps/example.xml', {
    success: function(data){
var ourStore = new CIDA.WPSExecuteResponseStore({
  url:'http://cida-wiwsc-wsdev.er.usgs.gov:8080/wps/WebProcessingService?Service=WPS&Request=execute&identifier=org.n52.wps.server.r.monthlyq_swe_csv_stats',
  method: 'POST',
  baseParams:{
    xmlData : data
  },
  listeners:{
    beforeload:{
      fn: function(store, options){
        debugger;
      },
      scope:this
    },
    load: {
      fn: function(store,records,options){
        debugger;
        console.log(records);
      }
    },
    scope:this
  }
});

    ourStore.load();
    }
});
