Ext.ns("AFINCH");
AFINCH.MapPanel = Ext.extend(GeoExt.MapPanel, {
    border: false,
    map: undefined,
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
            name: "NHD Flowlines Raster",
            dataLayer: flowlinesWMSData,
            streamOrderClipValue: this.streamOrderClipValue
        });
        flowlineRaster.id = 'nhd-flowlines-raster-layer';

        // ////////////////////////////////////////////// GAGES
        var gageFeatureLayer = new OpenLayers.Layer.GageFeature('Gage Locations (GF Layer)', {
            url: CONFIG.endpoint.geoserver + 'wfs',
            streamOrderClipValue: this.streamOrderClipValue
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
                new OpenLayers.Control.OverviewMap(),
                new OpenLayers.Control.ScaleLine({
                    geodesic: true
                }),
                new OpenLayers.Control.LayerSwitcher(),
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
                    panel.map.events.register(
                            'zoomend',
                            panel.map,
                            function() {
                                var zoom = panel.map.zoom;
                                LOG.info('Current map zoom: ' + zoom);
                                panel.updateFromClipValue(panel.getClipValueForZoom(zoom));
                                
                                panel.map.getLayersBy('id', 'gage-feature-layer')[0].updateGageStreamOrderFilter();
                            },
                            true);

                    var mapZoomForExtent = panel.map.getZoomForExtent(panel.map.restrictedExtent);
                    panel.map.setCenter(panel.map.restrictedExtent.getCenterLonLat(), mapZoomForExtent);
                    panel.updateFromClipValue(panel.streamOrderClipValues[panel.map.zoom]);

                    panel.map.getLayersBy('id', 'nhd-flowlines-raster-layer')[0].updateVisibility();
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
//debug:
//this.displayDataWindow({data:{"feature":{"layer":null,"lonlat":null,"data":{"COMID":"0","EVENTDATE":"2006-11-21T00:00:00","REACHCODE":"04070007000079","REACHRESOL":"Medium","FEATURECOM":"0","FEATURECLA":"0","SOURCE_ORI":"USGS, Water Resources Division","SOURCE_DAT":null,"SOURCE_FEA":"04136000","FEATUREDET":"http://waterdata.usgs.gov/nwis/nwisman/?site_no=04136000","MEASURE":"68.9925654625","OFFSET":"0.0","EVENTTYPE":"StreamGage","ComID":"12952772","Fdate":"2011-01-08T00:00:00","StreamLeve":"1","StreamOrde":"5","StreamCalc":"5","FromNode":"90036983","ToNode":"90037109","Hydroseq":"90012175","LevelPathI":"90005945","Pathlength":"136.438","TerminalPa":"90005945","ArbolateSu":"639.214","Divergence":"0","StartFlag":"0","TerminalFl":"0","DnLevel":"1","ThinnerCod":"0","UpLevelPat":"90005945","UpHydroseq":"90012364","DnLevelPat":"90005945","DnMinorHyd":"0","DnDrainCou":"1","DnHydroseq":"90011993","FromMeas":"0.0","ToMeas":"100.0","LengthKM":"6.468","Fcode":"46006","RtnDiv":"0","OutDiv":"0","DivEffect":"0","VPUIn":"0","VPUOut":"0","TravTime":"0.0","PathTime":"0.0","AreaSqKM":"13.2039","TotDASqKM":"2789.4069","DivDASqKM":"2789.4069"},"id":"OpenLayers.Feature.Vector_5664","geometry":{"id":"OpenLayers.Geometry.Point_5663","x":-9383394.31635411,"y":5570754.48056071},"state":null,"attributes":{"COMID":"0","EVENTDATE":"2006-11-21T00:00:00","REACHCODE":"04070007000079","REACHRESOL":"Medium","FEATURECOM":"0","FEATURECLA":"0","SOURCE_ORI":"USGS, Water Resources Division","SOURCE_DAT":null,"SOURCE_FEA":"04136000","FEATUREDET":"http://waterdata.usgs.gov/nwis/nwisman/?site_no=04136000","MEASURE":"68.9925654625","OFFSET":"0.0","EVENTTYPE":"StreamGage","ComID":"12952772","Fdate":"2011-01-08T00:00:00","StreamLeve":"1","StreamOrde":"5","StreamCalc":"5","FromNode":"90036983","ToNode":"90037109","Hydroseq":"90012175","LevelPathI":"90005945","Pathlength":"136.438","TerminalPa":"90005945","ArbolateSu":"639.214","Divergence":"0","StartFlag":"0","TerminalFl":"0","DnLevel":"1","ThinnerCod":"0","UpLevelPat":"90005945","UpHydroseq":"90012364","DnLevelPat":"90005945","DnMinorHyd":"0","DnDrainCou":"1","DnHydroseq":"90011993","FromMeas":"0.0","ToMeas":"100.0","LengthKM":"6.468","Fcode":"46006","RtnDiv":"0","OutDiv":"0","DivEffect":"0","VPUIn":"0","VPUOut":"0","TravTime":"0.0","PathTime":"0.0","AreaSqKM":"13.2039","TotDASqKM":"2789.4069","DivDASqKM":"2789.4069"},"style":null,"gml":{"featureType":"GageLoc","featureNS":"http://cida.usgs.gov/glri","featureNSPrefix":"glri"},"fid":"GageLoc.644"},"state":null,"fid":"GageLoc.644","ComID":12952772,"TotDASqKM":"2789.4069","REACHCODE":"04070007000079","SOURCE_FEA":"04136000"}});
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
            
            //
            
            var decStore = statsStores.find(function(store){
                return store.title == 'deciles'; //@todo x-hardcoding
            });
            self.gridPanel = new AFINCH.ui.StatsGridPanel({statsStore: decStore});
            win.add(self.gridPanel);

            

        //            statsStores.each(function(statsStore) {
        //               
        //            
        //            });
        
        //attach it to the Ext window so header, footer elts will have easy access
            this.statsStores = statsStores;
            //update statsStores
        },
    /**
     * @param ajax - response
     * @param options - the options that initiated the Ajax request
     * @scope the window in which the data will be visualized
     */
    sosCallback : function(response, options){
        var self = this;
        var win = self.dataWindow;
      
        var rParams = {
            sosEndpointUrl: self.sosEndpointUrl
        };

        var tempStatsStore = new AFINCH.data.StatsStore();
        //kick off the next ajax call...
        tempStatsStore.load({
            params: rParams,
            scope: self,
            callback: self.statsCallback
        });
        //...while we're waiting, parse the response already received from the last ajax call
        
        //@todo get monthly flow series from response instead of mocking data
        var monthlyFlowData = {
            data :  [
                [new Date('1900/01/01'), 150, 175, 150, 150, 37, 74, 111, 149, 186, 223, 261, 298, 335],
                [new Date('1900/02/01'), null, null, 160, 185, 37, 74, 111, 149, 186, 223, 261, 298, 335],
                [new Date('1900/03/01'), null, null, 170, 195, 37, 74, 111, 149, 186, 223, 261, 298, 335],
                [new Date('1900/04/01'), null, null, 180, 175, 37, 74, 111, 149, 186, 223, 261, 298, 335],
                [new Date('1900/05/01'), null, null, 195, 150, 37, 74, 111, 149, 186, 223, 261, 298, 335],
                [new Date('1900/06/01'), null, null, 200, 175, 37, 74, 111, 149, 186, 223, 261, 298, 335],
                [new Date('1900/07/01'), null, null, 205, 150, 37, 74, 111, 149, 186, 223, 261, 298, 335],
                [new Date('1900/08/01'), null, null, 210, 175, 37, 74, 111, 149, 186, 223, 261, 298, 335],
                [new Date('1900/09/01'), null, null, 215, 150, 37, 74, 111, 149, 186, 223, 261, 298, 335],
                [new Date('1900/10/01'), null, null, 200, 175, 37, 74, 111, 149, 186, 223, 261, 298, 335],
                [new Date('1900/11/01'), null, null, 175, 150, 37, 74, 111, 149, 186, 223, 261, 298, 335],
                [new Date('1900/12/01'), null, null, 150, 175, 37, 74, 111, 149, 186, 223, 261, 298, 335],
                //
                [new Date('1901/01/01'), 250, 275, 150, 150, 37, 74, 111, 149, 186, 223, 261, 298, 335],
                [new Date('1901/02/01'), null, null, 160, 185, 37, 74, 111, 149, 186, 223, 261, 298, 335],
                [new Date('1901/03/01'), null, null, 170, 195, 37, 74, 111, 149, 186, 223, 261, 298, 335],
                [new Date('1901/04/01'), null, null, 180, 175, 37, 74, 111, 149, 186, 223, 261, 298, 335],
                [new Date('1901/05/01'), null, null, 195, 150, 37, 74, 111, 149, 186, 223, 261, 298, 335],
                [new Date('1901/06/01'), null, null, 200, 175, 37, 74, 111, 149, 186, 223, 261, 298, 335],
                [new Date('1901/07/01'), null, null, 205, 150, 37, 74, 111, 149, 186, 223, 261, 298, 335],
                [new Date('1901/08/01'), null, null, 210, 175, 37, 74, 111, 149, 186, 223, 261, 298, 335],
                [new Date('1901/09/01'), null, null, 215, 150, 37, 74, 111, 149, 186, 223, 261, 298, 335],
                [new Date('1901/10/01'), null, null, 200, 175, 37, 74, 111, 149, 186, 223, 261, 298, 335],
                [new Date('1901/11/01'), null, null, 175, 150, 37, 74, 111, 149, 186, 223, 261, 298, 335],
                [new Date('1901/12/01'), null, null, 150, 175, 37, 74, 111, 149, 186, 223, 261, 298, 335],
                //
                [new Date('1902/01/01'), 50, 75, 150, 150, 37, 74, 111, 149, 186, 223, 261, 298, 335],
                [new Date('1902/02/01'), null, null, 160, 185, 37, 74, 111, 149, 186, 223, 261, 298, 335],
                [new Date('1902/03/01'), null, null, 170, 195, 37, 74, 111, 149, 186, 223, 261, 298, 335],
                [new Date('1902/04/01'), null, null, 180, 175, 37, 74, 111, 149, 186, 223, 261, 298, 335],
                [new Date('1902/05/01'), null, null, 195, 150, 37, 74, 111, 149, 186, 223, 261, 298, 335],
                [new Date('1902/06/01'), null, null, 200, 175, 37, 74, 111, 149, 186, 223, 261, 298, 335],
                [new Date('1902/07/01'), null, null, 205, 150, 37, 74, 111, 149, 186, 223, 261, 298, 335],
                [new Date('1902/08/01'), null, null, 210, 175, 37, 74, 111, 149, 186, 223, 261, 298, 335],
                [new Date('1902/09/01'), null, null, 215, 150, 37, 74, 111, 149, 186, 223, 261, 298, 335],
                [new Date('1902/10/01'), null, null, 200, 175, 37, 74, 111, 149, 186, 223, 261, 298, 335],
                [new Date('1902/11/01'), null, null, 175, 150, 37, 74, 111, 149, 186, 223, 261, 298, 335],
                [new Date('1902/12/01'), null, null, 150, 175, 37, 74, 111, 149, 186, 223, 261, 298, 335],
            ],
            headers: ['Date','Annual Median Flow','Annual Mean Flow','Monthly Median Flow','Monthly Mean Flow','0.1','0.2','0.3','0.4','0.5','0.6','0.7','0.8','0.9']
        };
        win.graphPanel = new AFINCH.ui.StatsGraphPanel({
            initialData: monthlyFlowData
        });
        win.add(win.graphPanel);
        
        
        win.show();
        win.center();

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
        self.dataWindow = new AFINCH.ui.DataWindow({
            id: 'data-display-window',
            title: title,
            listeners: {
                afterrender: function(p1, p2, p3){
                    console.dir(params);
                    debugger;
                }
            }
        });
        var params = {};//@todo pass record properties into ajax params
        Ext.Ajax.request({
            url: '/glri-afinch/js/Data/dummyValues.xml',
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
    },
    streamOrderClipValues: [
        7, // 0
        7,
        7,
        6,
        6,
        6, // 5
        5,
        5,
        5,
        4,
        4, // 10
        4,
        3,
        3,
        3,
        2, // 15
        2,
        2,
        1,
        1,
        1  // 20
    ]
});
