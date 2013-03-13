Ext.ns("AFINCH");

AFINCH.MapPanel = Ext.extend(GeoExt.MapPanel, {
    border: false,
    map: undefined,
    nhdFlowlineLayername: 'glri:NHDFlowline',
    gageLayername: 'glri:GageLoc',
    wmsGetFeatureInfoControl: undefined,
    WGS84_GOOGLE_MERCATOR: new OpenLayers.Projection("EPSG:900913"),
    restrictedMapExtent: new OpenLayers.Bounds(-93.18993823245728, 40.398554803028716, -73.65211352945056, 48.11264392438207).transform(new OpenLayers.Projection("EPSG:4326"), new OpenLayers.Projection("EPSG:900913")),
    streamOrderClipValue: 0,
    flowlineAboveClipPixelR: 255,
    flowlineAboveClipPixelG: 255,
    flowlineAboveClipPixelB: 255,
    flowlineAboveClipPixelA: 128,
    flowlineAboveClipPixel: undefined,
    gageStyleR: 0,
    gageStyleG: 255,
    gageStyleB: 0,
    gageStyleA: 255,
    gageRadius: 4,
    gageFill: false,
    gageStyle: undefined,
    defaultMapConfig: {
        layers: {
            baseLayers: [],
            overlays: []
        },
        initialZoom: undefined
    },
    constructor: function(config) {
        LOG.debug('map.js::constructor()');
        var config = config || {};

        var EPSG900913Options = {
            sphericalMercator: true,
            layers: "0",
            isBaseLayer: true,
            projection: this.WGS84_GOOGLE_MERCATOR,
            units: "m",
            buffer: 3,
            transitionEffect: 'resize'
        };

        var zyx = '/MapServer/tile/${z}/${y}/${x}';
        this.defaultMapConfig.layers.baseLayers = [
            new OpenLayers.Layer.XYZ(
                    "World Light Gray Base",
                    "http://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base" + zyx,
                    Ext.apply(EPSG900913Options, {numZoomLevels: 14})
                    ),
            new OpenLayers.Layer.XYZ(
                    "World Terrain Base",
                    "http://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief" + zyx,
                    Ext.apply(EPSG900913Options, {numZoomLevels: 14})
                    ),
            new OpenLayers.Layer.XYZ(
                    "USA Topo Map",
                    "http://services.arcgisonline.com/ArcGIS/rest/services/USA_Topo_Maps" + zyx,
                    Ext.apply(EPSG900913Options, {numZoomLevels: 16})
                    )
        ];

        // ////////////////////////////////////////////// FLOWLINES
        LOG.debug('AFINCH.MapPanel::constructor: Setting up flow lines layer');
        var flowlinesLayer = new OpenLayers.Layer.WMS(
                'NHD Flowlines',
                CONFIG.endpoint.geoserver + 'glri/wms',
                {
                    layers: [this.nhdFlowlineLayername],
                    styles: "line",
                    format: "image/png",
                    tiled: true
                },
        {
            isBaseLayer: false,
            unsupportedBrowsers: [],
            tileOptions: {
                maxGetUrlLength: 2048
            }
        });
        flowlinesLayer.id = 'nhd-flowlines-layer';
        this.defaultMapConfig.layers.overlays.push(flowlinesLayer);

        LOG.debug('AFINCH.MapPanel::constructor: Setting up flow lines WMS Data Layer');
        var flowlinesWMSData = new OpenLayers.Layer.FlowlinesData(
                "Flowline WMS (Data)",
                CONFIG.endpoint.geoserver + 'glri/wms',
                {
                    layers: [this.nhdFlowlineLayername],
                    styles: 'FlowlineStreamOrder',
                    format: "image/png",
                    tiled: "true",
                },
                {
    isBaseLayer: false,
    opacity: 0,
    displayInLayerSwitcher: true,
    tileOptions: {
        crossOriginKeyword: 'anonymous'
    }
});
        flowlinesWMSData.id = 'nhd-flowlines-data-layer';
        this.defaultMapConfig.layers.overlays.push(flowlinesWMSData);

        LOG.debug('AFINCH.MapPanel::constructor: Setting up flowlines raster Layer');
        this.flowlineAboveClipPixel = this.createFlowlineAboveClipPixel({
            a: this.flowlineAboveClipPixelA,
            b: this.flowlineAboveClipPixelB,
            g: this.flowlineAboveClipPixelG,
            r: this.flowlineAboveClipPixelR
        });
        var flowlineRaster = new OpenLayers.Layer.FlowlinesRaster({
            name: "NHD Flowlines Raster",
            data: flowlinesWMSData.createFlowlineClipData({
                streamOrderClipValue: this.streamOrderClipValue,
                flowlineAboveClipPixel: this.flowlineAboveClipPixel
            })
        });
        flowlineRaster.id = 'nhd-flowlines-raster-layer';
        this.defaultMapConfig.layers.overlays.push(flowlineRaster);


        // ////////////////////////////////////////////// GAGES
        var gageLocationsLayer = new OpenLayers.Layer.WMS(
                'Gage Locations',
                CONFIG.endpoint.geoserver + 'glri/wms',
                {
                    layers: 'GageLoc',    
                    tiled: true,
                    sld_body: this.gagePointSymbolizer,
                    format: "image/png"
                },
        {
            isBaseLayer: false,
            unsupportedBrowsers: [],
            tileOptions: {
                maxGetUrlLength: 2048,
                crossOriginKeyword: 'anonymous'
            }
        });
        gageLocationsLayer.id = 'gage-location-layer';
        this.defaultMapConfig.layers.overlays.push(gageLocationsLayer);

        var gageFeatureLayer = new OpenLayers.Layer.GageFeature('Gage Locations', {
            url: CONFIG.endpoint.geoserver + 'glri/wfs'
        });
        gageFeatureLayer.id = 'gage-feature-layer';
        this.defaultMapConfig.layers.overlays.push(gageFeatureLayer);
        var gageWMSData = new OpenLayers.Layer.GageData(
                "Gage WMS (Data)",
                CONFIG.endpoint.geoserver + 'glri/wms',
                {
                    layers: [this.gageLayername]
                }
        );
        var gageComposite = OpenLayers.Raster.Composite.fromLayer(gageWMSData, {int32: true});

        // MAP
        this.map = new OpenLayers.Map({
            restrictedExtent: this.restrictedMapExtent,
            projection: this.WGS84_GOOGLE_MERCATOR,
            controls: [
                new OpenLayers.Control.Navigation(),
                new OpenLayers.Control.MousePosition({
                    prefix: 'POS: '
                }),
                new OpenLayers.Control.Attribution({template:
                            '<img id="attribution" src="' + CONFIG.mapLogoUrl + '"/>'}),
                new OpenLayers.Control.OverviewMap(),
                new OpenLayers.Control.ScaleLine({
                    geodesic: true
                }),
                new OpenLayers.Control.LayerSwitcher(),
                new OpenLayers.Control.Zoom()
            ]
        });

        config = Ext.apply({
            id: 'map-panel',
            region: 'center',
            map: this.map,
            extent: this.defaultMapConfig.initialExtent,
            prettyStateKeys: true,
            layers: new GeoExt.data.LayerStore({
                initDir: GeoExt.data.LayerStore.STORE_TO_MAP,
                map: this.map,
                layers: this.defaultMapConfig.layers.baseLayers.union(this.defaultMapConfig.layers.overlays)
            }),
            border: false,
            listeners: {
                afterlayout: function(panel, layout) {
                    var mapZoomForExtent = panel.map.getZoomForExtent(panel.map.restrictedExtent);

                    panel.map.isValidZoomLevel = function(zoomLevel) {
                        return zoomLevel && zoomLevel >= mapZoomForExtent && zoomLevel < this.getNumZoomLevels();
                    };

                    panel.map.setCenter(panel.map.restrictedExtent.getCenterLonLat(), mapZoomForExtent);

                    panel.streamOrderClipValue = panel.streamOrderClipValues[panel.map.zoom];
                }
            }
        }, config);

        AFINCH.MapPanel.superclass.constructor.call(this, config);
        LOG.info('map.js::constructor(): Construction complete.');

        this.wmsGetFeatureInfoControl = new OpenLayers.Control.WMSGetFeatureInfo({
            title: 'gage-identify-control',
            hover: false,
            autoActivate: true,
            layers: this.defaultMapConfig.layers.overlays,
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

                        var win = new Ext.Window({
                            id: 'data-display-window',
                            items: [dataTabPanel]
                        });

                        AFINCH.data.retrieveStatStores(
                                'ftp://ftpext.usgs.gov/pub/er/wi/middleton/dblodgett/example_monthly_swecsv.xml',
                                function(statsStores) {
                                    var tabPanel = this.items.first();
                                    statsStores.each(function(statsStore) {
                                        tabPanel.add(new AFINCH.ui.DataDisplayPanel({
                                            statsStore: statsStore,
                                            region: 'center',
                                            width: 1050
                                        }));
                                    });
                                    this.show();
                                },
                                win
                                );
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
    createFlowlineAboveClipPixel: function(args) {
        var flowlineAboveClipPixelA = args.a;
        var flowlineAboveClipPixelB = args.b;
        var flowlineAboveClipPixelG = args.g;
        var flowlineAboveClipPixelR = args.r;

        return ((flowlineAboveClipPixelA & 0xff) << 24 |
                (flowlineAboveClipPixelB & 0xff) << 16 |
                (flowlineAboveClipPixelG & 0xff) << 8 |
                (flowlineAboveClipPixelR & 0xff));
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
    ],
    gagePointSymbolizer: new OpenLayers.Format.SLD().write({
        namedLayers: [{
                name: "glri:GageLoc",
                userStyles: [
                    new OpenLayers.Style("Gage Style",
                            {
                                rules: [
                                    new OpenLayers.Rule({
                                        symbolizer: {
                                            Point: new OpenLayers.Symbolizer.Point({
                                                graphicName: 'Circle',
                                                strokeColor: '#99FF99',
                                                fillColor: '#00FF00',
                                                pointRadius: 4,
                                                fillOpacity: 0.5,
                                                strokeOpacity: 0.5
                                            })
                                        }
                                    })
                                ]
                            })
                ]
            }]
    }),
    createGageStyle: function(args) {
        var gageStyleA = args.a;
        var gageStyleR = args.R;
        var gageStyleG = args.G;
        var gageStyleB = args.B;
        return ("rgba(" +
                gageStyleR + "," +
                gageStyleG + "," +
                gageStyleB + "," +
                gageStyleA / 255 + ")");

    }
});
