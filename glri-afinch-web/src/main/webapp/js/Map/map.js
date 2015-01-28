OpenLayers.IMAGE_RELOAD_ATTEMPTS = 3; // if tiles don't load correctly initially, try a few more times

Ext.ns("AFINCH");
AFINCH.MapPanel = Ext.extend(GeoExt.MapPanel, {
    border: false,
    map: undefined,
    currentZoom: 0,
    nhdFlowlineLayername: CONFIG.maplayers.flowline.layerName + ":" + CONFIG.maplayers.flowline.layerName,
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
    fieldNames:{
        reachCode : 'REACHCODE',
        hasGage : 'hasGage',
        gageId : 'SOURCE_FEA',
        link : 'FEATUREDET',
        gageName : 'STATION_NM',
        gageTotdasqkm : 'TotDASqKM',
        reachComId: 'COMID',
        reachName: 'GNIS_NAME',
		catchGridCode: "GRIDCODE", /* Catchment gridcode, similar to reachComId, but not compatable */
		catchFeatureId: "FEATUREID", /* Catchment attrib that relate catchments to reachComId (or a sink ID if no reach) */
		catchAreaSqKM: "AreaSqKM" /* Catchment area */
    },
    constructor: function(config) {
        var self = this;
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
                "World Topo Map",
                "http://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map" + zyx,
                {isBaseLayer: true, units: "m"}));
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
                "World Street Map",
                "http://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map" + zyx,
                {isBaseLayer: true, units: "m"}));
        mapLayers.push(new OpenLayers.Layer.XYZ(
                "World Terrain Base",
                "http://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief" + zyx,
                Ext.apply(EPSG900913Options, {numZoomLevels: 14})
                ));

        // ////////////////////////////////////////////// FLOWLINES
        var flowlinesData = new OpenLayers.Layer.FlowlinesData(
                "Flowline WMS (Data)",
                CONFIG.endpoint.geoserver + 'wms'
                );
        flowlinesData.id = 'nhd-flowlines-data-layer';
		

        var flowlineRaster = new OpenLayers.Layer.FlowlinesRaster({
            name: "NHD Flowlines",
            dataLayer: flowlinesData,
            streamOrderClipValue: this.streamOrderClipValue
        });
        flowlineRaster.id = 'nhd-flowlines-raster-layer';

        // ////////////////////////////////////////////// GAGES
        var gageFeatureLayer = new OpenLayers.Layer.GageFeature('Gage Locations', {
            url: CONFIG.endpoint.geoserver + 'wfs',
            streamOrderClipValue: this.streamOrderClipValue,
            visibility: false
        });
        gageFeatureLayer.id = 'gage-feature-layer';

        var gageData = new OpenLayers.Layer.GageData(
                "Gage WMS (Data)",
                CONFIG.endpoint.geoserver + 'wms'
                );
        gageData.id = 'gage-location-data';
		
		// ////////////////////////////////////////////// CATCHMENTS
        var catchMean = new OpenLayers.Layer.CatchMean(
                "Catchment Mean Yield, Constrained (inches)",
                CONFIG.endpoint.geoserver + 'wms'
        );
        catchMean.id = 'nhd-catch-mean-data-layer';
		
		mapLayers.push(catchMean);
        mapLayers.push(flowlinesData);
        mapLayers.push(gageData);
        mapLayers.push(flowlineRaster);
        mapLayers.push(gageFeatureLayer);
		
		this.layerSwitcher = new OpenLayers.Control.CustomLayerSwitcher({
			roundedCorner: true,
			ascending: true,
			useLegendGraphics: true
		});

        // MAP
        this.map = new OpenLayers.Map({
            restrictedExtent: this.restrictedMapExtent,
            projection: this.WGS84_GOOGLE_MERCATOR,
            controls: [
                new OpenLayers.Control.Navigation(),
                new OpenLayers.Control.MousePosition({
                    prefix: 'POS: '
                }),
                new OpenLayers.Control.Attribution({
                    template: document.getElementById('attribution-onmap-template').innerHTML
                }),
                new OpenLayers.Control.ScaleLine({
                    geodesic: true
                }),
                this.layerSwitcher,
                new OpenLayers.Control.Zoom()
            ],
            isValidZoomLevel: function(zoomLevel) {
                return zoomLevel && zoomLevel >= this.getZoomForExtent(this.restrictedExtent) && zoomLevel < this.getNumZoomLevels();
            }
        });
		
		this.layerSwitcher.setMap(this.map);
		
				
		var layers = new GeoExt.data.LayerStore({
			initDir: GeoExt.data.LayerStore.STORE_TO_MAP,
			map: this.map,
			layers: mapLayers
		});
					
        config = Ext.apply({
            id: 'map-panel',
            region: 'center',
            map: this.map,
            prettyStateKeys: true,
            layers: layers,
            border: false,
            listeners: {
                added: function(panel, owner, idx) {

                    // Turn layer switcher on by default
                    CONFIG.mapPanel.map.getControlsByClass('OpenLayers.Control.CustomLayerSwitcher')[0].maximizeControl();

                    var clipCount = 7;
                    var zoomLevels = CONFIG.mapPanel.map.getNumZoomLevels();
                    panel.streamOrderClipValues = new Array(zoomLevels);
                    var tableLength = panel.streamOrderClipValues.length;

                    for (var cInd = 0; cInd < tableLength; cInd++) {
                        panel.streamOrderClipValues[cInd] = Math.ceil((tableLength - cInd) * (clipCount / tableLength) - 1);
                    }

                    panel.map.events.register(
                            'zoomend',
                            panel.map,
                            function() {
                                var zoom = panel.map.zoom;
                                LOG.info('Current map zoom: ' + zoom);
                                panel.updateFromClipValue(panel.getClipValueForZoom(zoom));

                                panel.map.getLayersBy('id', 'gage-feature-layer')[0].updateGageStreamOrderFilter();
                                
// To be used in a future release
//                                var getFeatureResponses = Object.extended();
//                                if (!localStorage.getItem('glri-afinch')) {
//                                    localStorage.setItem('glri-afinch', Ext.util.JSON.encode({
//                                        lookupTable: Array.create([[], [], [], [], [], []])
//                                    }));
//                                }
//                                var storageObject = Ext.util.JSON.decode(localStorage.getItem('glri-afinch'));
                                // Check to see if we have the lookup table for clip order values at the current clip value. If we do we don't need to 
                                // make the call again. If we don't, make a call to get the values for the lookup table, create the lookup table 
//                                if (!storageObject.lookupTable[panel.streamOrderClipValue - 1].length) {
//                                    var needed = []
//                                    for (var i = panel.streamOrderClipValue;i < storageObject.lookupTable.length + 1;i++) {
//                                        if (!storageObject.lookupTable[i - 1].length) {
//                                            needed.push(i);
//                                        }
//                                    }
//                                    var filter = "StreamOrde IN ('" + needed.join("','") + "')";
//                                    Ext.Ajax.request({
//                                        url: CONFIG.endpoint.geoserver + 'ows',
//                                        scope: getFeatureResponses,
//                                        method: 'GET',
//                                        params: {
//                                            service: 'WFS',
//                                            version: '1.1.0',
//                                            outputFormat: 'json',
//                                            request: 'GetFeature',
//                                            typeName: panel.nhdFlowlineLayername,
//                                            propertyName: 'StreamOrde,Hydroseq',
//                                            sortBy: 'Hydroseq',
//                                            'CQL_FILTER': filter
//                                        },
//                                        success: function(response, opts) {
//                                            this.streamOrder = Ext.util.JSON.decode(response.responseText);
//                                            Ext.Ajax.request({
//                                                url: CONFIG.endpoint.geoserver + 'ows',
//                                                scope: this,
//                                                method: 'GET',
//                                                params: {
//                                                    service: 'WFS',
//                                                    version: '1.1.0',
//                                                    outputFormat: 'json',
//                                                    request: 'GetFeature',
//                                                    typeName: panel.nhdFlowlineLayername,
//                                                    propertyName: 'StreamLeve,StreamOrde,Hydroseq',
//                                                    sortBy: 'Hydroseq',
//                                                    'CQL_FILTER': filter
//                                                },
//                                                success: function(response, opts) {
//                                                    this.streamLevel = Ext.util.JSON.decode(response.responseText);
//                                                    var storageObject = Ext.util.JSON.decode(localStorage.getItem('glri-afinch'));
//
//                                                    for (var i = 0; i < 6; i++) {
//                                                        if (!storageObject.lookupTable[i].length) {
//                                                            var soSublist = this.streamOrder.features.findAll(function(j) {
//                                                                return j.properties.StreamOrde === (i + 1);
//                                                            });
//
//                                                            for (var soInd = 0; soInd < soSublist.length; soInd++) {
//                                                                var seq = soSublist[soInd].properties.Hydroseq;
//                                                                var order = soSublist[soInd].properties.StreamOrde;
//                                                                var level = soSublist[soInd].properties.StreamLeve;
//
//                                                                storageObject.lookupTable[order - 1].push([seq, order, level])
//                                                            }
//                                                        }
//                                                    }
//
//
//                                                    localStorage.setItem('glri-afinch', Ext.util.JSON.encode(storageObject));
//                                                }
//                                            });
//                                        }
//                                    });
//                                }

                            },
                            true);

                    var mapZoomForExtent = panel.map.getZoomForExtent(panel.map.restrictedExtent);
                    panel.map.setCenter(panel.map.restrictedExtent.getCenterLonLat(), mapZoomForExtent);
                    panel.updateFromClipValue(panel.streamOrderClipValues[panel.map.zoom]);
                    
                },
                afterrender: self.showAttributionSplash
            }
        }, config);
        AFINCH.MapPanel.superclass.constructor.call(this, config);

        LOG.info('map.js::constructor(): Construction complete.');

        this.wmsGetFeatureInfoControl = new OpenLayers.Control.WMSGetFeatureInfo({
            title: 'gage-identify-control',
            hover: false,
            autoActivate: true,
			maxFeatures: 200,
            layers: [
				catchMean,
                flowlinesData,
                gageData
            ],
            queryVisible: false,
            output: 'object',
            drillDown: true,
            infoFormat: 'application/vnd.ogc.gml',
            vendorParams: {
                radius: 5,
            }
        });
        this.wmsGetFeatureInfoControl.events.register("getfeatureinfo", this, this.wmsGetFeatureInfoHandler);
        this.map.addControl(this.wmsGetFeatureInfoControl);
//		this.map.addControl(this.legend);
},
    showAttributionSplash: function(){
        var attribPopupTimeout = 5000;
		var msgWidth = 550;
        
		if (document.getElementById('attribution-splash-template')) {

			Ext.Msg.show({
				title: 'Loading...',
				msg: document.getElementById('attribution-splash-template').innerHTML,
				width: msgWidth
			});
			var attribPopup = Ext.Msg.getDialog();
			var closeAttribPopup = function(){
				attribPopup.close();
			}
			setTimeout(closeAttribPopup, attribPopupTimeout);
		}

    },

    /**
     * @param record - a reach's record.
     * 
     */
    displayDataWindow: function(record){
        var self = this;
        //check to see if a data window already exists. If so, destroy it.
        var dataDisplayWindow = Ext.ComponentMgr.get('data-display-window');
        if (dataDisplayWindow) {
            LOG.debug('Removing previous data display window');
            dataDisplayWindow.destroy();
        }
        var reachName = record.data[self.fieldNames.reachName] || "";
        var reachID = record.data[self.fieldNames.reachComId] || "";
        var title = reachName.length ? reachName + " - " : "";
        title += reachID;
        
        var gage = {
            comId: record.get(self.fieldNames.gageId),
            link: record.get(self.fieldNames.link),
            totdasqkm: record.get(self.fieldNames.gageTotdasqkm),
            reachCode: record.get(self.fieldNames.reachCode),
            name: record.get(self.fieldNames.gageName)
        };
        //init a window that will be used as context for the callback
        var win = self.dataWindow = new AFINCH.ui.DataWindow({
            id: 'data-display-window',
			record: record,
            title: title,
            gage: gage
        });
 
        win.show();
        win.center();
        win.toFront();
        
		win.doInitLoad();
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
            'NHDFlowline': [],
			'Catch': []
        };
        var gageLocFeatureStore, nhdFlowLineFeatureStore;
        if (features.length) {
            features.each(function(feature) {
				
				if (feature.gml.featureType == CONFIG.maplayers.flowline.layerName) {
					if (feature.data[CONFIG.maplayers.flowline.streamOrderAttribName] >= self.streamOrderClipValue) {
						layerFeatures['NHDFlowline'].push(feature);
					}
					
				} else if (feature.gml.featureType == CONFIG.maplayers.gage.layerName) {
					
					if (feature.data[CONFIG.maplayers.gage.streamOrderAttribName] >= self.streamOrderClipValue) {
						layerFeatures['GageLoc'].push(feature);
					}
					
				} else if (feature.gml.featureType == CONFIG.maplayers.catchMean.layerName) {
					
					layerFeatures['Catch'].push(feature);
					
				} else {
					LOG.error("Unrecognized feature type: " + feature.gml.featureType);
				}
					
            });
        }
        //prepare field definitions for Ext Store contructors:
        var gageLocFields = [
                {name: self.fieldNames.gageName, type: 'string'},
                {name: self.fieldNames.gageTotdasqkm, type: 'double'},
                {name: self.fieldNames.reachCode, type: 'long'},
                {name: self.fieldNames.gageId, type: 'long'},
                {name: self.fieldNames.link, type: 'string'}
            ];
            
        var nhdFlowLineFields = [
                {name: self.fieldNames.reachName, type: 'string'},
                {name: self.fieldNames.reachComId, type: 'long'},
                {name: self.fieldNames.hasGage, type: 'boolean'}
            ];
				
		var nhdCatchFields = [
			{name: self.fieldNames.catchGridCode, type: 'long'},
			{name: self.fieldNames.catchFeatureId, type: 'long'},
			{name: self.fieldNames.catchAreaSqKM, type: 'double'}
		];
		
		var allFields = [].concat(gageLocFields).concat(nhdFlowLineFields).concat(nhdCatchFields);
        
        gageLocFeatureStore = new GeoExt.data.FeatureStore({
            features: layerFeatures.GageLoc,
            fields: gageLocFields,
            initDir: 0
        });
        nhdFlowLineFeatureStore = new GeoExt.data.FeatureStore({
            features: layerFeatures.NHDFlowline,
            fields: allFields,
            initDir: 0
        });
        nhdCatchFeatureStore = new GeoExt.data.FeatureStore({
            features: layerFeatures.Catch,
            fields: nhdCatchFields,
            initDir: 0
        });
                    
        var gageFieldsToAttachToReach = [
            self.fieldNames.gageTotdasqkm, self.fieldNames.reachCode,
            self.fieldNames.gageName, self.fieldNames.gageId, self.fieldNames.link
        ];
        
        if (nhdFlowLineFeatureStore.totalLength) {
			
			//Add gage and catchment features
            nhdFlowLineFeatureStore.each(function(flowLineFeature){
                var gageLocForThisFlowLine = gageLocFeatureStore.query(self.fieldNames.reachCode, flowLineFeature.get(self.fieldNames.reachCode)).first();
                if(gageLocForThisFlowLine){
                    gageFieldsToAttachToReach.each(function(fieldName){
                        flowLineFeature.set(fieldName, gageLocForThisFlowLine.get(fieldName));
                    });
                    //also manually attach this field:
                    flowLineFeature.set(self.fieldNames.hasGage, true);
                    //and remove all dirty markers
                    flowLineFeature.modified = {};
                }
				
                var catchForThisFlowLine = nhdCatchFeatureStore.query(self.fieldNames.catchFeatureId, flowLineFeature.get(self.fieldNames.reachComId)).first();
                if(catchForThisFlowLine){
                    nhdCatchFields.each(function(field){
                        flowLineFeature.set(field.name, catchForThisFlowLine.get(field.name));
                    });
                    //and remove all dirty markers
                    flowLineFeature.modified = {};
                }
            });
			

			
            var featureSelectionModel = new GeoExt.grid.FeatureSelectionModel({
                layerFromStore: true,
                singleSelect: true
            });
            featureSelectionModel.on({
                'rowselect' : {
                    fn : function(obj, rowIndex, record) { self.displayDataWindow(record); },
                    delay: 100 
                 }
             });

            if (nhdFlowLineFeatureStore.totalLength) {
                var columnConfig ={};
                //hide all of the gage fields
                gageFieldsToAttachToReach.each(function(field){
                    columnConfig[field] = {hidden: true}
                });
                columnConfig[self.fieldNames.reachName] = {header: 'Reach Name'};
                columnConfig[self.fieldNames.reachComId] = {header: 'Com ID'};
				columnConfig[self.fieldNames.GRIDCODE] = {header: 'Grid Code'};
                columnConfig[self.fieldNames.hasGage]= {header: 'Has Gage?', width: 75, align: 'center'};
                
                var customRenderers= {};
                customRenderers[self.fieldNames.hasGage] = function(hasGage){
                    return hasGage ? '<div class="circle"></div>' : '&nbsp;';
                };
                
                var featureGrid = new gxp.grid.FeatureGrid({
                    id: 'identify-popup-grid-flowline',
                    store: nhdFlowLineFeatureStore,
                    region: 'center',
                    autoHeight: true,
                    deferRowRender: false,
                    forceLayout: true,
                    sm: featureSelectionModel,
                    viewConfig: {
                        autoFill: true,
                        forceFit: true
                    },
                    customRenderers: customRenderers,
                    columnConfig: columnConfig
                });
                
                popup = new GeoExt.Popup({
                    id: 'identify-popup-window',
                    anchored: false,
                    layout: 'fit',
                    map: CONFIG.mapPanel.map,
                    unpinnable: true,
                    minWidth: 200,
                    minHeight: 100,
                    title: 'NHD Flowlines',
                    items: [featureGrid],
                    listeners: {
                        show: function() {
                            // Remove the anchor element (setting anchored to 
                            // false does not do this for us. *Shaking fist @ GeoExt)
                            Ext.select('.gx-popup-anc').remove();
                            this.syncSize();
                            this.setHeight(featureGrid.getHeight());
                            this.setHeight(featureGrid.getWidth());
                        }
                    }

                });
                popup.show();
            }
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
