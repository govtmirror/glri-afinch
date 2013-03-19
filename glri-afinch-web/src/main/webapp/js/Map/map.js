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
                "World Light Gray Base",
                "http://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base" + zyx,
                Ext.apply(EPSG900913Options, {numZoomLevels: 14})
                ));
        mapLayers.push(new OpenLayers.Layer.XYZ(
                "World Imagery",
                "http://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery" + zyx,
                {isBaseLayer: true, units: "m"}));
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
                CONFIG.endpoint.geoserver + 'glri/wms'
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

        var gageRaster = new OpenLayers.Layer.GageRaster({
            name: "Gage Location",
            dataLayer: gageData,
            streamOrderClipValue: this.streamOrderClipValue
        });
        gageRaster.id = 'gage-location-raster';

        mapLayers.push(flowlinesWMSData);
        mapLayers.push(gageData);
        mapLayers.push(flowlineRaster);
        mapLayers.push(gageRaster);
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
                                panel.streamOrderSlider.setValue(panel.streamOrderClipValue);
                                
                                panel.map.getLayersBy('id', 'gage-feature-layer')[0].updateGageStreamOrderFilter();
                            },
                            true);

                    var mapZoomForExtent = panel.map.getZoomForExtent(panel.map.restrictedExtent);
                    panel.map.setCenter(panel.map.restrictedExtent.getCenterLonLat(), mapZoomForExtent);
                    panel.updateFromClipValue(panel.streamOrderClipValues[panel.map.zoom]);

                    panel.streamOrderSlider = new Ext.slider.SingleSlider({
                        fieldLabel: "Stream Order",
                        width: 120,
                        value: panel.streamOrderClipValue,
                        increment: 1,
                        minValue: 1,
                        maxValue: 7,
                        listeners: {
                            change: function(element, newValue) {
                                if (newValue !== panel.streamOrderClipValue) {
                                    panel.updateFromClipValue(newValue);
                                }
                            }
                        }
                    });

                    for (var zoomIndex = 0; zoomIndex < panel.streamOrderTable.length; ++zoomIndex) {
                        panel.streamOrderTable[zoomIndex] = new Ext.slider.SingleSlider({
                            fieldLabel: '' + zoomIndex,
                            value: panel.streamOrderClipValues[zoomIndex],
                            minValue: 1,
                            maxValue: 7,
                            zoom: zoomIndex,
                            listeners: {
                                change: function(element, newValue) {
                                    panel.setClipValueForZoom(element.zoom, newValue);
                                    if (element.zoom === map.zoom) {
                                        panel.streamOrderSlider.setValue(panel.streamOrderClipValue);
                                        if (newValue !== panel.streamOrderClipValue) {
                                            panel.updateFromClipValue(newValue);
                                        }
                                    }
                                }
                            }
                        });
                    }

                    panel.map.getLayersBy('id', 'nhd-flowlines-raster-layer')[0].updateVisibility();
                    panel.map.getLayersBy('id', 'gage-location-raster')[0].updateVisibility();
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
                        var dataDisplayWindow = Ext.ComponentMgr.get('data-display-window');
                        if (dataDisplayWindow) {
                            LOG.debug('Removing previous data display window');
                            dataDisplayWindow.destroy();
                        }

                        var dataTabPanel = new Ext.TabPanel({
                            id: 'data-tab-pabel',
                            region: 'center',
                            activeTab: 0,
                            autoScroll: true,
                            layoutOnTabChange: true,
                            monitorResize: true,
                            resizeTabs: true,
                            height: 400,
                            width: 800
                        });
                        var statsCallback = function(statsStores, success) {
                            if (!success || !statsStores) {
                                return;
                            }
                            var tabPanel = this.items.first();
                            statsStores.each(function(statsStore) {
                                tabPanel.add(new AFINCH.ui.DataDisplayPanel({
                                    statsStore: statsStore,
                                    region: 'center',
                                    width: 1050
                                }));
                            });
                            this.show();
                        };
                        //init a window that will be used as context for the callback
                        var win = new Ext.Window({
                            id: 'data-display-window',
                            items: [dataTabPanel]
                        });
                        var params = {
                            sosEndpointUrl: self.sosEndpointUrl
                        };
                        var statsStore = new AFINCH.data.StatsStore();
                        statsStore.load({
                            params: params,
                            scope: win,
                            callback: statsCallback
                        });
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
        return this.streamOrderTable[zoom].getValue();
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
