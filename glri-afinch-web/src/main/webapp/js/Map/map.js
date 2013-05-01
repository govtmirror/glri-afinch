Ext.ns("AFINCH");
AFINCH.MapPanel = Ext.extend(GeoExt.MapPanel, {
    border: false,
    map: undefined,
    currentZoom: 0,
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
    fieldNames:{
        reachCode : 'REACHCODE',
        hasGage : 'hasGage',
        gageId : 'SOURCE_FEA',
        link : 'FEATUREDET',
        gageName : 'STATION_NM',
        gageTotdasqkm : 'TotDASqKM',
        gageComId : 'ComID',
        reachComId: 'COMID',
        reachName: 'GNIS_NAME'
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

        mapLayers.push(flowlinesData);
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
                new OpenLayers.Control.Attribution({
                    template: '<a target="_blank" class="no_hover_change" href="' + CONFIG.attribution.nhd.link+ '">'+
                    '<img id="attribution" src="' + CONFIG.attribution.nhd.logo + '"/></a>'
                }),
                new OpenLayers.Control.ScaleLine({
                    geodesic: true
                }),
                new OpenLayers.Control.LayerSwitcher({
                    roundedCorner: true
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
            layers: [
                flowlinesData,
                flowlineRaster,
                gageData
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
    showAttributionSplash: function(){
        var slogan = 'Data furnished by the EPA, NHDPlus, and USGS.';
        var attribPopupTimeout = 3000;
        
        var makeAttribEntry = function(orgName){
            return '<a target="_blank" class="no_hover_change" href="' + CONFIG.attribution[orgName].link + '">' +
                    '<img src="' + CONFIG.attribution[orgName].logo +'"/>' +
                    '</a>';
        };
        
        var html = '<div class="attribution_splash">';
        ['epa', 'nhd', 'usgs'].each(function(orgName){
           html+=makeAttribEntry(orgName); 
        });
        html += '</div>' + 
        '<div class="attribution_text">'+ slogan +'</div>';

        var msgWidth = 550;
        
        Ext.Msg.show({
            title: 'Loading...',
            msg: html,
            width: msgWidth
        });
        var attribPopup = Ext.Msg.getDialog();
        var closeAttribPopup = function(){
            attribPopup.close();
        }
        setTimeout(closeAttribPopup, attribPopupTimeout);
    },
    /**
     *@param statsStores - array of StatStores
     *@param success - whether or not the request was successful
     */
    statsCallback : function(statsStores, success) {
            var self = this;
            var win = self.dataWindow;
            if(win.isVisible()){//else, if the user has already closed the window, skip everything
                if(!success || !statsStores){
                    new Ext.ux.Notify({
                        msgWidth: 200,
                        title: 'Error',
                        msg: "Error retrieving data from server. See browser logs for details."
                    }).show(document);
                    return;
                }

                //put stores into a title-to-store map for convenient access later
                var tempStores = {};
                statsStores.each(function(store){
                   tempStores[store.title] = store; 
                });
                statsStores = tempStores;

                var data = win.graphPanel.data.values;

                var decileValues = [];//this will be appended onto the end of every row of the new data
                statsStores.deciles.each(function(record){
                   decileValues.push(record.get('q'));
                });

                /**
                 * Declare some constants to be used in the table update:
                 * 
                 * - Variables with 'Index' in the name are indexing columns in the 
                 * array of arrays that we will pass to Dygraphs
                 * 
                 * - Variables with 'ColumnName' in the name refer to field names in the StatStores
                 * 
                 */

                var dateIndex = 0,
                    annualMeanIndex = 2,
                    annualMedianIndex = 3,
                    monthlyMeanIndex = 4,
                    monthlyMedianIndex = 5,
                    lowestDecileIndex = 6,
                    highestDecileIndex = 15,
                    yearColumnName = 'Year', //these are the column names returned by the RWPS call
                    monthColumnName = 'Month',
                    meanFlowColumnName = 'meanq',
                    medianFlowColumnName = 'medianq';

                data = data.map(function(row){
                    var month = row[dateIndex].getMonth();
                    //native javascript months are 0-indexed
                    //but the RWPS process feeds the stats store a 1-based month index.
                    //so...
                    var extStoreMonth = month+1;
                    var isJanuary = 0 === month;
                    if(isJanuary){
                        //add the annual stats
                        var year = row[dateIndex].getFullYear();
                        row[annualMeanIndex] = statsStores.mean_annual_flow.query(yearColumnName, year).first().get(meanFlowColumnName);
                        row[annualMedianIndex] = statsStores.median_annual_flow.query(yearColumnName, year).first().get(medianFlowColumnName);
                    }
                    //use the ext-adjusted storeMonth in the statsStores queries
                    row[monthlyMeanIndex] = statsStores.mean_monthly_flow.query(monthColumnName, extStoreMonth).first().get(meanFlowColumnName);
                    row[monthlyMedianIndex] = statsStores.median_monthly_flow.query(monthColumnName, extStoreMonth).first().get(medianFlowColumnName);
                    //append the deciles to the end of the row
                    for(var i = lowestDecileIndex; i < highestDecileIndex; i++){
                        row[i] = decileValues[i-lowestDecileIndex];
                    }
                    return row;
                });

                var headers = win.graphPanel.data.headers;

                win.graphPanel.graph.updateOptions({
                   labels: headers,
                   file: data
                });

                //now enable the series toggle buttons
                var tbar = win.getTopToolbar()
                var checkedItems = tbar.getSeriesTogglers();
                checkedItems.each(function(checkedItem){
                    checkedItem.enable();
                    checkedItem.fireEvent('checkchange', checkedItem, 
                                            checkedItem.initialConfig.checked, 
                                            win.graphPanel.graph,
                                            tbar.menu
                                        );
                });
            }
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
        if(!response.responseXML){  //since IE doesn't always populate this
                                    //property, parse the text if necessary
            response.responseXML = $.parseXML(response.responseText);
        }
        if(response.responseText.toLowerCase().indexOf('exception') !== -1){
            AFINCH.ui.errorNotify("Error retrieving data from server. See browser logs for details.");
            LOG.error(response.responseText);
        }
        else{
            var responseTxt = $(response.responseXML).find('swe\\:values').text();
            if (0 === responseTxt.length){
                responseTxt = $(response.responseXML).find('values').text();
            }
            var numFieldsToLoadLater = 13;
            var values = AFINCH.data.parseSosResponse(responseTxt, numFieldsToLoadLater);

            win.graphPanel.graph = AFINCH.ui.FlowDygraph(
                win.graphPanel.getEl().dom, 
                win.labelPanel.getEl().dom,
                values);

            //attach the info to the graphPanel for easy access during data export
            win.graphPanel.data={
                values : values,
                headers: win.graphPanel.graph.getLabels()
            };
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
            comId: record.get(self.fieldNames.gageComId),
            link: record.get(self.fieldNames.link),
            totdasqkm: record.get(self.fieldNames.gageTotdasqkm),
            reachCode: record.get(self.fieldNames.reachCode),
            name: record.get(self.fieldNames.gageName)
        };
        //init a window that will be used as context for the callback
        var win = self.dataWindow = new AFINCH.ui.DataWindow({
            id: 'data-display-window',
            title: title,
            gage: gage
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
                if (feature.data['StreamOrde'] >= self.streamOrderClipValue) {
                    layerFeatures[feature.gml.featureType].push(feature);
                }
            });
        }
        //prepare field definitions for Ext Store contructors:
        var gageLocFields = [
                {name: self.fieldNames.gageName, type: 'string'},
                {name: self.fieldNames.gageComId, type: 'int'},
                {name: self.fieldNames.gageTotdasqkm, type: 'double'},
                {name: self.fieldNames.reachCode, type: 'long'},
                {name: self.fieldNames.gageId, type: 'long'},
                {name: self.fieldNames.link, type: 'string'}
            ];
            
        var nhdFlowLineFields = [
                {name: self.fieldNames.reachName, type: 'string'},
                {name: self.fieldNames.reachComId, type: 'long'},
                {name: self.fieldNames.hasGage, type: 'boolean'}
            ].concat(gageLocFields);
        
        gageLocFeatureStore = new GeoExt.data.FeatureStore({
            features: layerFeatures.GageLoc,
            fields: gageLocFields,
            initDir: 0
        });
        nhdFlowLineFeatureStore = new GeoExt.data.FeatureStore({
            features: layerFeatures.NHDFlowline,
            fields: nhdFlowLineFields,
            initDir: 0
        });
                    
        var gageFieldsToAttachToReach = [
            self.fieldNames.gageTotdasqkm, self.fieldNames.gageComId, self.fieldNames.reachCode,
            self.fieldNames.gageName, self.fieldNames.gageId, self.fieldNames.link
        ];
        
        if (nhdFlowLineFeatureStore.totalLength) {
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
