Ext.ns("AFINCH");
AFINCH.MapPanel = Ext.extend(GeoExt.MapPanel, {
    border: false,
    map: undefined,
    currentZoom : 0,
    nhdFlowlineLayername: 'glri:NHDFlowline',
    gageStyleName: "GageLocStreamOrder",
    wmsGetFeatureInfoControl: undefined,
    WGS84_GOOGLE_MERCATOR: new OpenLayers.Projection("EPSG:900913"),
    sosEndpointUrl: 'ftp://ftpext.usgs.gov/pub/er/wi/middleton/dblodgett/example_monthly_swecsv.xml',
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
            
            var decileValues = [];//this will be appended onto the end of every row of the new data
            statsStores.deciles.each(function(record){
               decileValues.push(record.get('q'));
            });
            
            var data = win.graphPanel.data.values;
            data = data.map(function(row){
                for(var i = 2; i < 11; i++){
                    row[i] = decileValues[i-2];
                }
                return row;
            });
            
            var headers = win.graphPanel.data.headers;
//            headers = headers.concat(['0.1', '0.2', '0.3', '0.4', '0.5', '0.6', '0.7', '0.8', '0.9']);
            
                        
            win.graphPanel.graph.updateOptions({
               labels: headers,
               file: data
            });
            
//            win.graphPanel.graph.updateOptions({
//               labels: headers
//            });
//            
//            win.graphPanel.graph.updateOptions({
//               file: data
//            });
            
            
//            win.graphPanel.graph.updateOptions({
//               file: data
//            });
//            
//            win.graphPanel.graph.updateOptions({
//               labels: headers
//            });
            
            win.gridPanel = new AFINCH.ui.StatsGridPanel({statsStore: statsStores.deciles});
            win.insert(1, win.gridPanel);
            win.doLayout();
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
        var responseTxt = response.responseText;
        
        /**
         * Given response text, return an array of arrays. The row array has format
         * [<date>, <null or flow>] 
         * @todo talk to Sibley, fix date bugs.
         */
        var parseSosResponse=function(responseTxt, numFieldsLoadedLater){
            var rows = responseTxt.split(' ');
            var rightPadding = [];
            for(var i = 0; i < numFieldsLoadedLater; i++){
                rightPadding.push(null);
            }
                
            rows = rows.map(function(row){
                var tokens = row.split(',');
                
                var dateStr = tokens[0].to(tokens[0].indexOf('T'));
                var date = new Date(dateStr);
                var flow = parseFloat(tokens[1]);
                return [date, flow].concat(rightPadding);
                
            });
            return rows;
            /*
            //should now have all date, flow pairs, but need
            //to add in null flows for every month of the given years
            var inflatedRows = [];
            rows.each(function(januaryRow){
               inflatedRows.push(januaryRow);
               for(var i = 1; i < 12; i++) {
                   var date = Date.create(januaryRow[0]);
                   date.setMonth(i);
                   inflatedRows.push([date, null]);
               }               
            });
            return inflatedRows;
            */
        };    
        var values = parseSosResponse(responseTxt, 9);
        var labels = ['Date', 'Monthly Flow', '0.1', '0.2', '0.3', '0.4', '0.5', '0.6', '0.7', '0.8', '0.9'];
        //@todo get monthly flow series from response instead of mocking data
        win.graphPanel.data={
            values : values,
            headers: labels
        };
        // 'Annual Median Flow', 'Annual Mean Flow', 'Monthly Median Flow', 'Monthly Mean Flow', '0.1', '0.2', '0.3', '0.4', '0.5', '0.6', '0.7', '0.8', '0.9']
          win.graphPanel.graph = new Dygraph(win.graphPanel.getEl().dom, values, {
            labels: labels,
            connectSeparatedPoints: true,
            showRangeSelector: true,
            labelsDiv: win.labelPanel.getEl().dom,
            labelsSeparateLines: true,
            legend: 'always'
        });
//kick off the next ajax call...
        var rParams = {
            sosEndpointUrl: self.sosEndpointUrl
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
        
        
        var params = {};//@todo pass record properties into ajax params
        //@todo use correct thredds Url
        Ext.Ajax.request({
            url: CONFIG.endpoint.threddsProxy + 'dummySosResponse.xml',
            success: self.sosCallback,
            params: params,
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
