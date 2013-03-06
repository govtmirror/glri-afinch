Ext.ns("AFINCH");

AFINCH.MapPanel = Ext.extend(GeoExt.MapPanel, {
    border: false,
    mapPanel: undefined,
    WGS84_GOOGLE_MERCATOR: new OpenLayers.Projection("EPSG:900913"),
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
                                                pointRadius: 5,
                                                fillOpacity: 0.5,
                                                strokeOpacity: 0.5
                                            }),
                                            Text: new OpenLayers.Symbolizer.Text({
                                                label: '${ComID}',
                                                fontFamily: 'arial',
                                                fontColor: '#000000',
                                                fontSize: 12,
                                                fontOpacity: 1,
                                                labelXOffset: -5,
                                                labelRotation: -45,
                                                haloColor: '#FFFFFF',
                                                haloRadius: 3,
                                                haloOpacity: 1
                                            })
                                        }
                                    })
                                ]
                            })
                ]
            }]
    }),
    defaultMapConfig: {
        layers: {
            baseLayers: [],
            layers: []
        },
        initialZoom: undefined,
        initialExtent: new OpenLayers.Bounds(-15702073.155034, 2738495.0572218, -6309491.121034, 6612935.1462468)
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
            maxResolution: 156543.0339,
            buffer: 3,
            transitionEffect: 'resize'
        };

        this.mapPanel = new OpenLayers.Map({
            //order of controls defines z-index
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
                new OpenLayers.Control.PanZoomBar({
                    zoomWorldIcon: true
                }),
                new OpenLayers.Control.LayerSwitcher()
            ]
        });

        this.defaultMapConfig.layers.baseLayers = [
            new OpenLayers.Layer.XYZ(
                    "World Light Gray Base",
                    "http://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/${z}/${y}/${x}",
                    Ext.apply(EPSG900913Options, {
                numZoomLevels: 14
            })
                    ),
            new OpenLayers.Layer.XYZ(
                    "World Terrain Base",
                    "http://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/${z}/${y}/${x}",
                    Ext.apply(EPSG900913Options, {
                numZoomLevels: 14
            })
                    ),
            new OpenLayers.Layer.XYZ(
                    "USA Topo Map",
                    "http://services.arcgisonline.com/ArcGIS/rest/services/USA_Topo_Maps/MapServer/tile/${z}/${y}/${x}",
                    Ext.apply(EPSG900913Options, {
                numZoomLevels: 16
            })
                    )
        ];

        this.defaultMapConfig.layers.overlays = [
            new OpenLayers.Layer.WMS(
                    'NHD Flowlines',
                    CONFIG.endpoint.geoserver + 'glri/wms',
                    {
                        layers: 'NHDFlowline',
                        transparent: true
                    },
            {
                isBaseLayer: false,
                unsupportedBrowsers: [],
                tileOptions: {
                    maxGetUrlLength: 2048
                }
            }),
            new OpenLayers.Layer.WMS(
                    'Gage Locations',
                    CONFIG.endpoint.geoserver + 'glri/wms',
                    {
                        layers: 'GageLoc',
                        transparent: true,
                        sld_body: this.gagePointSymbolizer,
                        tiled : true,
                        format: "image/png"
                    },
            {
                isBaseLayer: false,
                unsupportedBrowsers: [],
                tileOptions: {
                    maxGetUrlLength: 2048,
                    crossOriginKeyword: 'anonymous'
                }
            })
        ];

        config = Ext.apply({
            id: 'map-panel',
            region: 'center',
            map: this.mapPanel,
            extent: this.defaultMapConfig.initialExtent,
            prettyStateKeys: true,
            layers: new GeoExt.data.LayerStore({
                initDir: GeoExt.data.LayerStore.STORE_TO_MAP,
                map: this.map,
                layers: this.defaultMapConfig.layers.baseLayers.union(this.defaultMapConfig.layers.overlays),
                listeners: {
                    load: function(store) {
                        LOG.debug('map.js::constructor(): Base layer store loaded ' + store.getCount() + ' base layers.');
                    }
                }
            }),
            border: false
        }, config);

        AFINCH.MapPanel.superclass.constructor.call(this, config);
        LOG.info('map.js::constructor(): Construction complete.');
    }
});
