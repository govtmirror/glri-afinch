Ext.ns("AFINCH");
AFINCH.MapPanel = Ext.extend(GeoExt.MapPanel, {
    border: false,
    map: undefined,
    currentZoom : 0,
    nhdFlowlineLayername: 'glri:NHDFlowline',
    gageStyleName: "GageLocStreamOrder",
    wmsGetFeatureInfoControl: undefined,
    WGS84_GOOGLE_MERCATOR: new OpenLayers.Projection("EPSG:900913"),
    sosEndpointUrl: undefined,//defined in displayDataWindow
    restrictedMapExtent: new OpenLayers.Bounds(-93.18993823245728, 40.398554803028716, -73.65211352945056, 48.11264392438207).transform(new OpenLayers.Projection("EPSG:4326"), new OpenLayers.Projection("EPSG:900913")),
    streamOrderClipValue: 0,
    streamOrderTable: new Array(21),
    streamOrderSlider: undefined,
    streamOrderLock: true,
    streamOrderClipValues: undefined,
    constructor: function(config) {
        LOG.debug('map.js::constructor()');
        var config = config || {};
        var mapLayers = [];
        var EPSG900913Options = {
            sphericalMercator: true,
            layers: "0",
            isBaseLayer: true,
            projection: this.WGS84_GOOGLE_MERCATOR,
            units: "m",
            buffer: 3,
            transitionEffect: 'resize'
        };
        // ////////////////////////////////////////////// BASE LAYERS
        var zyx = '/MapServer/tile/${z}/${y}/${x}';
        mapLayers.push(new OpenLayers.Layer.XYZ(
                "World Imagery",
                "http://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery" + zyx,
                {isBaseLayer: true, units: "m"}));
        mapLayers.push(new OpenLayers.Layer.XYZ(
                "World Light Gray Base",
                "http://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base" + zyx,
                Ext.apply(EPSG900913Options, {numZoomLevels: 14})
                ));
        mapLayers.push(new OpenLayers.Layer.XYZ(
                "World Physical Map",
                "http://services.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map" + zyx,
                {isBaseLayer: true, units: "m"}));
        mapLayers.push(new OpenLayers.Layer.XYZ(
                "World Street Map",
                "http://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map" + zyx,
                {isBaseLayer: true, units: "m"}));
        mapLayers.push(new OpenLayers.Layer.XYZ(
                "World Topo Map",
                "http://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer" + zyx,
                {isBaseLayer: true, units: "m"}));
        mapLayers.push(new OpenLayers.Layer.XYZ(
                "World Terrain Base",
                "http://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief" + zyx,
                Ext.apply(EPSG900913Options, {numZoomLevels: 14})
                ));

        // ////////////////////////////////////////////// FLOWLINES
        var flowlinesWMSData = new OpenLayers.Layer.FlowlinesData(
                "Flowline WMS (Data)",
                CONFIG.endpoint.geoserver + 'wms'
                );
        flowlinesWMSData.id = 'nhd-flowlines-data-layer';

        var flowlineRaster = new OpenLayers.Layer.FlowlinesRaster({
            name: "NHD Flowlines",
            dataLayer: flowlinesWMSData,
            streamOrderClipValue: this.streamOrderClipValue
        });
        flowlineRaster.id = 'nhd-flowlines-raster-layer';

        // ////////////////////////////////////////////// GAGES
        var gageFeatureLayer = new OpenLayers.Layer.GageFeature('Gage Locations', {
            url: CONFIG.endpoint.geoserver + 'wfs',
            streamOrderClipValue: this.streamOrderClipValue,
            visibility : false
        });
        gageFeatureLayer.id = 'gage-feature-layer';

        var gageData = new OpenLayers.Layer.GageData(
                "Gage WMS (Data)",
                CONFIG.endpoint.geoserver + 'wms'
                );
        gageData.id = 'gage-location-data';

        mapLayers.push(flowlinesWMSData);
        mapLayers.push(gageData);
        mapLayers.push(flowlineRaster);
        mapLayers.push(gageFeatureLayer);

        // MAP
        this.map = new OpenLayers.Map({
            restrictedExtent: this.restrictedMapExtent,
            projection: this.WGS84_GOOGLE_MERCATOR,
            controls: [
                new OpenLayers.Control.Navigation(),
                new OpenLayers.Control.MousePosition({
                    prefix: 'POS: '
                }),
                new OpenLayers.Control.Attribution({template: '<img id="attribution" src="' + CONFIG.mapLogoUrl + '"/>'}),
                new OpenLayers.Control.ScaleLine({
                    geodesic: true
                }),
                new OpenLayers.Control.LayerSwitcher({
                    roundedCorner : true
                }),
                new OpenLayers.Control.Zoom()
            ],
            isValidZoomLevel: function(zoomLevel) {
                return zoomLevel && zoomLevel >= this.getZoomForExtent(this.restrictedExtent) && zoomLevel < this.getNumZoomLevels();
            }
        });
        config = Ext.apply({
            id: 'map-panel',
            region: 'center',
            map: this.map,
            prettyStateKeys: true,
            layers: new GeoExt.data.LayerStore({
                initDir: GeoExt.data.LayerStore.STORE_TO_MAP,
                map: this.map,
                layers: mapLayers
            }),
            border: false,
            listeners: {
                added: function(panel, owner, idx) {

                    // Turn layer switcher on by default
                    CONFIG.mapPanel.map.getControlsByClass('OpenLayers.Control.LayerSwitcher')[0].maximizeControl();

                    var clipCount = 7;
                    var zoomLevels = CONFIG.mapPanel.map.getNumZoomLevels();
                    panel.streamOrderClipValues = new Array(zoomLevels);
                    var tableLength = panel.streamOrderClipValues.length;

                    for (var cInd = 0; cInd < tableLength; cInd++) {
                        panel.streamOrderClipValues[cInd] = Math.ceil((tableLength - cInd) * (clipCount / tableLength));
                    }

                    panel.map.events.register(
                            'movestart',
                            panel.map,
                            function(evt) {
                                
                            },
                            true);

                    panel.map.events.register(
                            'zoomend',
                            panel.map,
                            function() {
                                var zoom = panel.map.zoom;
                                LOG.info('Current map zoom: ' + zoom);
                                panel.updateFromClipValue(panel.getClipValueForZoom(zoom));

                                panel.map.getLayersBy('id', 'gage-feature-layer')[0].updateGageStreamOrderFilter();

//                                var getFeatureResponses = Object.extended();
//                                var filter = 'StreamOrde>=' + panel.streamOrderClipValue;
//                                Ext.Ajax.request({
//                                    url: CONFIG.endpoint.geoserver + 'ows',
//                                    scope: getFeatureResponses,
//                                    params: {
//                                        service: 'WFS',
//                                        version: '1.1.0',
//                                        outputFormat: 'json',
//                                        request: 'GetFeature',
//                                        typeName: panel.nhdFlowlineLayername,
//                                        propertyName: 'StreamOrde',
//                                        'CQL_FILTER': filter
//                                    },
//                                    success: function(response, opts) {
//                                        this.streamOrder = Ext.util.JSON.decode(response.responseText);
//                                        Ext.Ajax.request({
//                                            url: CONFIG.endpoint.geoserver + 'ows',
//                                            scope: this,
//                                            params: {
//                                                service: 'WFS',
//                                                version: '1.1.0',
//                                                outputFormat: 'json',
//                                                request: 'GetFeature',
//                                                typeName: panel.nhdFlowlineLayername,
//                                                propertyName: 'StreamOrde,StreamLeve',
//                                                'CQL_FILTER': filter
//                                            },
//                                            success: function(response, opts) {
//                                                this.streamLevel = Ext.util.JSON.decode(response.responseText);
//                                                var a = 1;
//                                                var lookupTable = new Array(7);
//                                                var currentIndex = panel.streamOrderClipValue - 1;
//
//                                                if (lookupTable[currentIndex] == undefined) {
//                                                    for (var fInd = 0; fInd < this.streamOrder.features.length; fInd++) {
//                                                        var f = this.streamOrder.features[fInd];
//                                                        var fid = f.id;
//                                                        var streamOrder = f.properties.StreamOrde;
//                                                        var matchingStreamLevel = this.streamLevel.features.find(function(f2) {
//                                                            return f.id == f2.id;
//                                                        });
//                                                        var streamLevel = matchingStreamLevel.properties.StreamLeve;
//                                                        lookupTable[currentIndex].push(fid, streamOrder, streamLevel);
//                                                    }
//                                                }
//                                                console.log(lookupTable)
//                                            }
//                                        });
//                                    }
//                                });
                            },
                            true);

                    var mapZoomForExtent = panel.map.getZoomForExtent(panel.map.restrictedExtent);
                    panel.map.setCenter(panel.map.restrictedExtent.getCenterLonLat(), mapZoomForExtent);
                    panel.updateFromClipValue(panel.streamOrderClipValues[panel.map.zoom]);
                }
            }
        }, config);
        AFINCH.MapPanel.superclass.constructor.call(this, config);

        LOG.info('map.js::constructor(): Construction complete.');

        this.wmsGetFeatureInfoControl = new OpenLayers.Control.WMSGetFeatureInfo({
            title: 'gage-identify-control',
            hover: false,
            autoActivate: true,
            layers: [
                flowlinesWMSData,
                flowlineRaster,
                gageFeatureLayer
            ],
            queryVisible: true,
            output: 'object',
            drillDown: true,
            infoFormat: 'application/vnd.ogc.gml',
            vendorParams: {
                radius: 5
            }
        });
        this.wmsGetFeatureInfoControl.events.register("getfeatureinfo", this, this.wmsGetFeatureInfoHandler);
        this.map.addControl(this.wmsGetFeatureInfoControl);
},
    /**
     *@param statsStores - array of StatStores
     *@param success - whether or not the request was successful
     */
    statsCallback : function(statsStores, success) {
            var self = this;
            var win = self.dataWindow;
            
            if(!success || !statsStores){
                new Ext.ux.Notify({
                    msgWidth: 200,
                    title: 'Error',
                    msg: "Error retrieving data from server. See browser logs for details."
                }).show(document);  
                return;
            }
            
            //put stores into a title-to-store map
            var tempStores = {};
            statsStores.each(function(store){
               tempStores[store.title] = store; 
            });
            statsStores = tempStores;
            
            var data = win.graphPanel.data.values;
            //add the annual aggregations
            for(var dataIndex = 0, annualIndex = 0; dataIndex < data.length; dataIndex+=12, annualIndex++){
                data[dataIndex][2] = statsStores.mean_annual_flow.getAt(annualIndex).get('x');
                data[dataIndex][3] = statsStores.median_annual_flow.getAt(annualIndex).get('medianq');
            }
            
            //add the monthly aggregations
            for(var monthlyIndex = 0; monthlyIndex < data.length; monthlyIndex++){
                data[monthlyIndex][4] = statsStores.mean_monthly_flow.getAt(monthlyIndex % 12).get('meanq');
                data[monthlyIndex][5] = statsStores.median_monthly_flow.getAt(monthlyIndex % 12).get('medianq');
            }
            
            var decileValues = [];//this will be appended onto the end of every row of the new data
            statsStores.deciles.each(function(record){
               decileValues.push(record.get('q'));
            });
            //add the deciles to the data
            decileValues = decileValues.reverse();
            data = data.map(function(row){
                var decileStart = 6;
                for(var i = decileStart; i < 15; i++){
                    row[i] = decileValues[i-decileStart];
                }
                return row;
            });
            
            var headers = win.graphPanel.data.headers;
//            headers = headers.concat(['0.1', '0.2', '0.3', '0.4', '0.5', '0.6', '0.7', '0.8', '0.9']);
            
                        
            win.graphPanel.graph.updateOptions({
               labels: headers,
               file: data
            });
        },
    /**
     * @param ajax - response
     * @param options - the options that initiated the Ajax request
     * @scope the window in which the data will be visualized
     */
    sosCallback : function(response, options){
        //establish scope
        var self = this;
        var win = self.dataWindow;
        if(response.responseText.toLowerCase().indexOf('exception') !== -1){
            new Ext.ux.Notify({
                msgWidth: 200,
                title: 'Error',
                msg: "Error retrieving data from server. See browser logs for details."
            }).show(document);  
            LOG(response.responseText);
            return;
        }
        //todo: fix... very breakable
        var responseTxt = response.responseXML.childNodes[0].childNodes[7].childNodes[1].
            childNodes[7].childNodes[0].childNodes[3].textContent;
        
        
        /**
         * Given response text, return an array of arrays. The row array has format
         * [<date>, <null or flow>] 
         */
        var parseSosResponse=function(responseTxt, numFieldsLoadedLater){
            responseTxt = responseTxt.slice(0, responseTxt.length-2);//kill terminal ' \n'
            var rows = responseTxt.split(' ');
            var rightPadding = [];
            for(var i = 0; i < numFieldsLoadedLater; i++){
                rightPadding.push(null);
            }
                
            rows = rows.map(function(row){
                var tokens = row.split(',');
                
                var dateStr = tokens[0].to(tokens[0].indexOf('T'));
                dateStr = dateStr.replace(/-/g,'/');
                var date = new Date(dateStr);
                var flow = parseFloat(tokens[1]);
                return [date, flow].concat(rightPadding);
                
            });
            return rows;
        };
        var values = parseSosResponse(responseTxt, 13);
        var decileSuffix = "th % (cfs)";
        var decileLabels = ['90','80','70','60','50','40','30','20','10'].map(
            function(prefix){
                return prefix + decileSuffix;
            });
        
        var mainLabelSuffix = " (cfs)";
        var mainLabels = 
        [
        'Monthly Flow',//initial field
        //subsequently-loaded fields:
        'Mean Annual Flow',
        'Median Annual Flow',
        'Mean Monthly Flow',
        'Median Monthly Flow'
        ].map(function(prefix){
            return prefix + mainLabelSuffix;
        });
        //must include x axis label as well:
        var labels = ['Date'].concat(mainLabels).concat(decileLabels);
        
        var canonicalDecileSeriesOptions = {
            strokeWidth: 1,
            stepPlot: false
        };
        var allDecileSeriesOptions ={};
        decileLabels.each(function(label){
            allDecileSeriesOptions[label] = canonicalDecileSeriesOptions;
        });
        var otherSeriesOptions = {
            'Monthly Flow':{
                strokeWidth: 3,
                stepPlot: false
            },
            'Mean Annual Flow':{
                strokeWidth: 2,
                stepPlot: true
            },
            'Median Annual Flow':{
                strokeWidth: 2,
                stepPlot: true
            },
            'Mean Monthly Flow': {
                strokeWidth: 2,
                stepPlot: false
            },
            'Median Monthly Flow':{
                strokeWidth: 2,
                stepPlot: false
            }
        };
        var allSeriesOptions ={};
        Object.merge(allSeriesOptions, allDecileSeriesOptions);
        Object.merge(allSeriesOptions, otherSeriesOptions);
        win.graphPanel.data={
            values : values,
            headers: labels
        };
        var opts = {
            labels: labels,
            colors: ['purple','orange','blue','red','green','black','black','black','black','black','black','black','black','black'],
            connectSeparatedPoints: true,
            showRangeSelector: true,
            labelsDiv: win.labelPanel.getEl().dom,
            labelsSeparateLines: true,
            legend: 'always'
        };
        
        Object.merge(opts, allSeriesOptions);
        win.graphPanel.graph = new Dygraph(win.graphPanel.getEl().dom, values, opts);
//kick off the next ajax call...
        var rParams = {
            sosEndpointUrl: CONFIG.endpoint.thredds + self.sosUrlWithoutBase
        };

        var tempStatsStore = new AFINCH.data.StatsStore();
        
        tempStatsStore.load({
            params: rParams,
            scope: self,
            callback: self.statsCallback
        });        
        win.doLayout();
    },

    /**
     * @param record - a reach's record.
     * 
     */
    displayDataWindow: function(record){
        var self = this;
        //check to see if a Gage data window already exists. If so, destroy it.
        var dataDisplayWindow = Ext.ComponentMgr.get('data-display-window');
        if (dataDisplayWindow) {
            LOG.debug('Removing previous data display window');
            dataDisplayWindow.destroy();
        }
        var name = record.data.GNIS_NAME || "";
        var gageID = record.data.COMID || "";
        var title = name.length ? name + " - " : "";
        title += gageID;

        //init a window that will be used as context for the callback
        var win = self.dataWindow = new AFINCH.ui.DataWindow({
            id: 'data-display-window',
            title: title
        });
 
        win.show();
        win.center();
        win.toFront();
        
        self.sosUrlWithoutBase = 'out.nc?service=SOS&request=GetObservation&Version=1.0.0&offering=' + record.data.COMID +'&observedProperty=QAccCon'
        Ext.Ajax.request({
            url: CONFIG.endpoint.threddsProxy + self.sosUrlWithoutBase,
            success: self.sosCallback,
            scope: self
        }
        );
    },
    wmsGetFeatureInfoHandler: function(responseObject) {
        var self = this;
        var popup = Ext.ComponentMgr.get('identify-popup-window');
        var dataDisplayWindow = Ext.ComponentMgr.get('data-display-window');
        if (popup) {
            popup.destroy();
        }
        if (dataDisplayWindow) {
            dataDisplayWindow.destroy();
        }

        var features = responseObject.features[0].features;
        var layerFeatures = {
            'GageLoc': [],
            'NHDFlowline': []
        };
        var gageLocFeatureStore, nhdFlowLineFeatureStore;
        if (features.length) {
            features.each(function(feature) {
                layerFeatures[feature.gml.featureType].push(feature);
            });
        }

        gageLocFeatureStore = new GeoExt.data.FeatureStore({
            features: layerFeatures.GageLoc,
            fields: [
                {name: 'ComID', type: 'int'},
                {name: 'TotDASqKM', type: 'double'},
                {name: 'REACHCODE', type: 'long'},
                {name: 'SOURCE_FEA', type: 'long'}
            ],
            initDir: 0
        });
        nhdFlowLineFeatureStore = new GeoExt.data.FeatureStore({
            features: layerFeatures.NHDFlowline,
            fields: [
                {name: 'COMID', type: 'long'},
                {name: 'GNIS_NAME', type: 'string'}
            ],
            initDir: 0
        });
        if (gageLocFeatureStore.totalLength || nhdFlowLineFeatureStore.totalLength) {
            var featureGrids = [];
            var featureSelectionModel = new GeoExt.grid.FeatureSelectionModel({
                layerFromStore: true,
                singleSelect: true,
                listeners: {
                    rowselect: function(obj, rowIndex, record) {
                        self.displayDataWindow(record);
                    }
                }
            });
            if (gageLocFeatureStore.totalLength) {
                featureGrids.push(new gxp.grid.FeatureGrid({
                    id: 'identify-popup-grid-gage',
                    title: 'Gage',
                    store: gageLocFeatureStore,
                    region: 'center',
                    autoHeight: true,
                    deferRowRender: false,
                    forceLayout: true,
                    sm: featureSelectionModel,
                    viewConfig: {
                        autoFill: true,
                        forceFit: true
                    }
                }));
            }

            if (nhdFlowLineFeatureStore.totalLength) {
                featureGrids.push(new gxp.grid.FeatureGrid({
                    id: 'identify-popup-grid-flowline',
                    title: 'NHD Flowlines',
                    store: nhdFlowLineFeatureStore,
                    region: 'center',
                    autoHeight: true,
                    deferRowRender: false,
                    forceLayout: true,
                    sm: featureSelectionModel,
                    viewConfig: {
                        autoFill: true,
                        forceFit: true
                    }
                }));
            }

            popup = new GeoExt.Popup({
                id: 'identify-popup-window',
                anchored: false,
                layout: 'fit',
                map: CONFIG.mapPanel.map,
                unpinnable: true,
                minWidth: 200,
                minHeight: 100,
                items: [
                    new Ext.TabPanel({
                        id: 'identify-popup-tabpanel',
                        region: 'center',
                        activeTab: 0,
                        autoScroll: true,
                        layoutOnTabChange: true,
                        monitorResize: true,
                        resizeTabs: true,
                        items: featureGrids,
                        width: 400,
                        height: 200
                    })
                ],
                listeners: {
                    show: function() {
                        // Remove the anchor element (setting anchored to 
                        // false does not do this for us. *Shaking fist @ GeoExt)
                        Ext.select('.gx-popup-anc').remove();
                        this.syncSize();
                        this.setHeight(this.items.first().getActiveTab().getHeight());
                        this.setHeight(this.items.first().getActiveTab().getWidth());
                    }
                }

            });
            popup.show();
        }

    },
    getClipValueForZoom: function(zoom) {
        return this.streamOrderClipValues[zoom];
    },
    setClipValueForZoom: function(zoom, value) {
        if (this.streamOrderLock === true) {
            for (var zoomIndex = 0; zoomIndex < this.streamOrderTable.length; ++zoomIndex) {
                if (zoomIndex < zoom) {
                    if (this.streamOrderTable[zoomIndex].getValue() < value) {
                        this.streamOrderTable[zoomIndex].setValue(value);
                    }
                } else if (zoomIndex > zoom) {
                    if (this.streamOrderTable[zoomIndex].getValue() > value) {
                        this.streamOrderTable[zoomIndex].setValue(value);
                    }
                } else {
                    this.streamOrderTable[zoomIndex].setValue(value);
                }
            }
        } else {
            this.streamOrderTable[zoom].setValue(value);
        }
    },
    updateFromClipValue: function(val) {
        this.streamOrderClipValue = val;
        for (var layerIdx = 0; layerIdx < this.map.layers.length; layerIdx++) {
            var mapLayer = this.map.layers[layerIdx];
            if (typeof mapLayer.updateFromClipValue === 'function') {
                mapLayer.updateFromClipValue(val);
            }
        }
    }
});
