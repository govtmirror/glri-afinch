/* Copyright (c) 2006-2008 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/** 
 * @requires OpenLayers/Control.js
 */

/**
 * Class: OpenLayers.Control.LayerSwitcher
 *
 * Inherits from:
 *  - <OpenLayers.Control>
 */
OpenLayers.Control.CustomLayerSwitcher = 
  OpenLayers.Class(OpenLayers.Control, {
	
	imageDirectory: "js/openlayers/img/",
	
    /**  
     * Property: activeColor
     * {String}
     */
    activeColor: "white",
    
    /**  
     * Property: layerStates 
     * {Array(Object)} Basically a copy of the "state" of the map's layers 
     *     the last time the control was drawn. We have this in order to avoid
     *     unnecessarily redrawing the control.
     */
    layerStates: null,    
        
    /** 
     * Property: useLegendGraphics
     */
    useLegendGraphics: false,    

  // DOM Elements
  
    /**
     * Property: layersDiv
     * {DOMElement} 
     */
    layersDiv: null,
    
    /** 
     * Property: baseLayersDiv
     * {DOMElement}
     */
    baseLayersDiv: null,

    /** 
     * Property: baseLayers
     * {Array(<OpenLayers.Layer>)}
     */
    baseLayers: null,    
    
    /** 
     * Property: dataLayersDiv
     * {DOMElement} 
     */
    dataLayersDiv: null,

    /** 
     * Property: dataLayers
     * {Array(<OpenLayers.Layer>)} 
     */
    dataLayers: null,

    /** 
     * Property: activeLayer
     */
    activeLayer: null,
    
    /** 
     * Property: minimizeDiv
     * {DOMElement} 
     */
    minimizeDiv: null,

    /** 
     * Property: maximizeDiv
     * {DOMElement} 
     */
    maximizeDiv: null,
    
    /**
     * APIProperty: ascending
     * {Boolean} 
     */
    ascending: true,
	
	/** Event handlers */
	handlers: {},
 
    /**
     * Constructor: OpenLayers.Control.LayerSwitcher
     * 
     * Parameters:
     * options - {Object}
     */
    initialize: function(options) {
        OpenLayers.Control.prototype.initialize.apply(this, arguments);
        this.layerStates = [];     
    },

    /**
     * APIMethod: destroy 
     */    
    destroy: function() {
        
        OpenLayers.Event.stopObservingElement(this.div);

        OpenLayers.Event.stopObservingElement(this.minimizeDiv);
        OpenLayers.Event.stopObservingElement(this.maximizeDiv);

        //clear out layers info and unregister their events 
        this.clearDataLayersArray();
        this.clearDataLayersArray();
        
        this.map.events.un({
            "addlayer": this.redraw,
            "changelayer": this.redraw,
            "removelayer": this.redraw,
            "changebaselayer": this.redraw,
            scope: this
        });

        OpenLayers.Control.prototype.destroy.apply(this, arguments);
    },

    /** 
     * Method: setMap
     *
     * Properties:
     * map - {<OpenLayers.Map>} 
     */
    setMap: function(map) {
        OpenLayers.Control.prototype.setMap.apply(this, arguments);
        
        this.map.events.on({
            "addlayer": this.redraw,
            "changelayer": this.redraw,
            "removelayer": this.redraw,
            "changebaselayer": this.redraw,
            scope: this
        });
    },

    /**
     * Method: draw
     *
     * Returns:
     * {DOMElement} A reference to the DIV DOMElement containing the 
     *     switcher tabs.
     */  
    draw: function() {
        OpenLayers.Control.prototype.draw.apply(this);

        // create layout divs
        this.loadContents();

        // set mode to minimize
        if(!this.outsideViewport) {
            this.minimizeControl();
        }

        // populate div with current info
        this.redraw();

        return this.div;       
    },

    /** 
     * Method: clearLayersArray
     * User specifies either "base" or "data". we then clear all the
     *     corresponding listeners, the div, and reinitialize a new array.
     * 
     * Parameters:
     * layersType - {String}  
     */
    clearBaseLayersArray: function() {
        var layers = this.baseLayers;
        if (layers) {
            for(var i=0, len=layers.length; i<len ; i++) {
                var layer = layers[i];
                OpenLayers.Event.stopObservingElement(layer.inputElem);
                OpenLayers.Event.stopObservingElement(layer.labelSpan);
            }
        }
        this._buildEmptyBaseDiv(this.baseLayersDiv);
        this.baseLayers = [];
    },
	
    /** 
     * Method: clearLayersArray
     * User specifies either "base" or "data". we then clear all the
     *     corresponding listeners, the div, and reinitialize a new array.
     * 
     * Parameters:
     * layersType - {String}  
     */
    clearDataLayersArray: function() {
        var layers = this.dataLayers;
        if (layers) {
            for(var i=0, len=layers.length; i<len ; i++) {
                var layer = layers[i];
                OpenLayers.Event.stopObservingElement(layer.inputElem);
                OpenLayers.Event.stopObservingElement(layer.labelSpan);
            }
        }
		this._buildEmptyDataDiv(this.dataLayersDiv);
        this.dataLayers = [];
    },


    /**
     * Method: checkRedraw
     * Checks if the layer state has changed since the last redraw() call.
     * 
     * Returns:
     * {Boolean} The layer state changed since the last redraw() call. 
     */
    checkRedraw: function() {
        var redraw = false;
        if ( !this.layerStates.length ||
             (this.map.layers.length != this.layerStates.length) ) {
            redraw = true;
        } else {
            for (var i=0, len=this.layerStates.length; i<len; i++) {
                var layerState = this.layerStates[i];
                var layer = this.map.layers[i];
                if ( (layerState.name != layer.name) || 
                     (layerState.inRange != layer.inRange) || 
                     (layerState.id != layer.id) || 
                     (layerState.visibility != layer.visibility) ) {
                    redraw = true;
                    break;
                }    
            }
        }    
        return redraw;
    },
    
    /** 
     * Method: redraw
     * Goes through and takes the current state of the Map and rebuilds the
     *     control to display that state. Groups base layers into a 
     *     radio-button group and lists each data layer with a checkbox.
     *
     * Returns: 
     * {DOMElement} A reference to the DIV DOMElement containing the control
     */  
    redraw: function() { 
        // if the state hasn't changed since last redraw, no need 
        // to do anything. Just return the existing div.
        if (!this.checkRedraw()) {        
            return this.div;
        } 

        //clear out previous layers 
        this.clearBaseLayersArray();
        this.clearDataLayersArray();
       
        var containsOverlays = false;
        var containsBaseLayers = false;
        
        // Save state -- for checking layer if the map state changed.
        // We save this before redrawing, because in the process of redrawing
        // we will trigger more visibility changes, and we want to not redraw
        // and enter an infinite loop.
        var len = this.map.layers.length;
        this.layerStates = new Array(len);
        for (var i=0; i <len; i++) {
            var layer = this.map.layers[i];            
            this.layerStates[i] = {
                'name': layer.name, 
                'visibility': layer.visibility,
                'inRange': layer.inRange,
                'id': layer.id                
            };
        }    

        var layers = this.map.layers.slice();
        if (!this.ascending) { layers.reverse(); }
        for(var i=0, len=layers.length; i<len; i++) {
            var layer = layers[i];
            var baseLayer = layer.isBaseLayer;
            
            if (layer.displayInLayerSwitcher) {

                if (baseLayer) {
                    containsBaseLayers = true;
                } else {
                    containsOverlays = true;
                }               

                // only check a baselayer if it is *the* baselayer, check data
                // layers if they are visible
                var checked = (baseLayer) ? (layer == this.map.baseLayer)
                                          : layer.getVisibility();   			
    			
    			var layerWrapper = document.createElement("div");
    			layerWrapper.id = "layer_" + layer.id; 
				layerWrapper.className = "layer-switcher-layer-wrap";
   			
                // create input element
                var inputElem = document.createElement("input");
                inputElem.id = this.id + "_input_" + layer.name;
                inputElem.name = (baseLayer) ? "baseLayers" : layer.name;
                inputElem.type = (baseLayer) ? "radio" : "checkbox";
                inputElem.value = layer.name;
                inputElem.checked = checked;
                inputElem.defaultChecked = checked;

                if (!baseLayer && !layer.inRange) {
                    inputElem.disabled = true;
                }

                // create the label span
                var labelSpan = document.createElement("span");
				labelSpan.className = "layer-label";
                
                if(layer.queryable) {
                	labelSpan.style.cursor = "pointer";
                }
                labelSpan.innerHTML = layer.name;
    
				var abstractSpan = document.createElement("span");
                abstractSpan.id = "abstract_" + layer.id;
				abstractSpan.innerHTML = layer.description;
				abstractSpan.style.display = "none";
				
				var abstractToolbarSpan = document.createElement("span");
				abstractToolbarSpan.style.display = "block";
                    
                abstractSpan.appendChild(abstractToolbarSpan);
                
				if(layer.dataURL) {
				    var dataUrlLink = document.createElement("a");
				    dataUrlLink.style.cursor = "pointer";
				    dataUrlLink.style.display = "inline-block";
				    dataUrlLink.alt = "download";
                    dataUrlLink.title = "download"; 
				    dataUrlLink.innerHTML = '<img src="' + this.imageDirectory + 'download.png" style="border: none;" />';
                    
                    var dataUrlLinkContext = {
                        'url': layer.dataURL
                    };
                    
                    OpenLayers.Event.observe(dataUrlLink, "click", 
                        OpenLayers.Function.bindAsEventListener(this.onDataUrlClick, dataUrlLinkContext)
                    );
				}
				
				if(layer.metadataURL) {
				    var metadataUrlLink = document.createElement("a");
				    metadataUrlLink.style.cursor = "pointer";
				    metadataUrlLink.style.display = "inline-block";
				    metadataUrlLink.style.margin = "5px 0px 0px 0px";
				    metadataUrlLink.alt = "metadata";
                    metadataUrlLink.title = "metadata"; 
				    metadataUrlLink.innerHTML = '<img src="' + this.imageDirectory + 'metadata.png" style="border: none;" />';
                    
                    var metadataUrlLinkContext = {
                        'url': layer.metadataURL
                    };
                    
                    OpenLayers.Event.observe(metadataUrlLink, "click", 
                        OpenLayers.Function.bindAsEventListener(this.onMetadataUrlClick, metadataUrlLinkContext)
                    );
                
                    abstractToolbarSpan.appendChild(metadataUrlLink);
				}
               
                // create the title div
                var titleDiv = document.createElement("div");
                titleDiv.id = "title_" + layer.id;
				titleDiv.className = "layer-title-wrap";
                                
                if(this.activeLayer == layer.id) {
                    titleDiv.className = "layer-title-wrap active";
                }
                
                // create the layer operation panel
                var buttonSpan = document.createElement("span");
                buttonSpan.style.padding = "3px 3px 3px 0";
                
                // remove control
                var removeButton = document.createElement("img");
                removeButton.src = this.imageDirectory + "del.png";
                removeButton.style.cursor = "pointer";
                removeButton.alt = "remove layer";
                removeButton.title = "remove layer";     
                                
                // layer order controls
                var upButton = document.createElement("img");
                upButton.src = this.imageDirectory + "up.png";
                upButton.style.cursor = "pointer";  
                upButton.alt = "move layer up";
                upButton.title = "move layer up";
                
                var downButton = document.createElement("img");
                downButton.src = this.imageDirectory + "down.png";
                downButton.style.cursor = "pointer";
                downButton.alt = "move layer down";
                downButton.title = "move layer down";
                
                // opacity controls
				var opacityContainer = document.createElement("span");
				opacityContainer.className = "layer-switcher-opacity-container";
				
				var opacityLabel = document.createElement("span");
				opacityLabel.className = "layer-switcher-opacity-label";
				opacityLabel.innerHTML = "Opacity:"
				
                var opacityMinusButton = document.createElement("img");
                opacityMinusButton.src = this.imageDirectory + "minus.png";
                opacityMinusButton.style.cursor = "pointer";
                opacityMinusButton.alt = "decrease opacity";
                opacityMinusButton.title = "decrease opacity";
                                
                // set the default opacity
                layer.setOpacity(layer.opacity); 
                
                var opacitySpan = document.createElement("span");                
                opacitySpan.setAttribute("id", "opacityValue_" + layer.id);                
                opacitySpan.style.display = "inline-block";
                opacitySpan.style.width = "23px";        
                
                var opacityImg = document.createElement("img");
                opacityImg.setAttribute("id", "opacityImg_" + layer.id); 
                opacityImg.src = this.imageDirectory + "opacity.png";
                opacityImg.width = (layer.opacity != null) ? (layer.opacity * 23).toFixed(0) : "23";
                opacityImg.height = "12";
                opacityImg.alt = "opacity";
                opacityImg.title = "opacity";
                
                var opacityTextInput = document.createElement("input");                
                opacityTextInput.setAttribute("id", "opacity_" + layer.id); 
                opacityTextInput.setAttribute("type", "hidden");
                opacityTextInput.setAttribute("value", "1.0");
                
                var opacityPlusButton = document.createElement("img");
                opacityPlusButton.src = this.imageDirectory + "plus.png";
                opacityPlusButton.style.cursor = "pointer";
                opacityPlusButton.alt = "increase opacity";
                opacityPlusButton.title = "increase opacity";
				
				opacityContainer.appendChild(opacityLabel);
				opacityContainer.appendChild(opacityMinusButton);
                opacitySpan.appendChild(opacityImg);
                opacityContainer.appendChild(opacitySpan);
                opacityContainer.appendChild(opacityTextInput);
                opacityContainer.appendChild(opacityPlusButton);
				
				//Other stuff
				var abstractButton = document.createElement("img");
				abstractButton.setAttribute("id", "abstractButton_" + layer.id); 
                abstractButton.src = this.imageDirectory + "expand.png";
                abstractButton.style.cursor = "pointer";
                abstractButton.style.position = "absolute";
                abstractButton.style.top = "0";
                abstractButton.style.right = "0";
                abstractButton.style.padding = "5px";   				
                
                var context = {
                    'layer': layer,
                    'inputElem': inputElem,
                    'titleDiv': titleDiv,
                    'layerSwitcher': this
                };                   
                                              
                OpenLayers.Event.observe(inputElem, "mouseup", 
                    OpenLayers.Function.bindAsEventListener(this.onInputClick, context)
                );
                
                if(layer.queryable) {
                
                	var queryableButton = document.createElement("img");
               		queryableButton.src = this.imageDirectory + "queryable.png"; 
               		queryableButton.style.cursor = "pointer";
               		queryableButton.alt = "select for query";
                	queryableButton.title = "select for query";
                	
                	OpenLayers.Event.observe(labelSpan, "click", 
	                    OpenLayers.Function.bindAsEventListener(this.onTitleClick, context)
	                );
	                
					OpenLayers.Event.observe(queryableButton, "click", 
	                    OpenLayers.Function.bindAsEventListener(this.onTitleClick, context)
	                );
	            }
                
                OpenLayers.Event.observe(upButton, "click", 
                    OpenLayers.Function.bindAsEventListener(this.onUpClick, context)
                );
                
                OpenLayers.Event.observe(downButton, "click", 
                    OpenLayers.Function.bindAsEventListener(this.onDownClick, context)
                );
                
                OpenLayers.Event.observe(removeButton, "click", 
                    OpenLayers.Function.bindAsEventListener(this.onRemoveClick, context)
                );
                
                var opacityMinusContext = {
                    'layer': layer,
                    'byOpacity': '-0.1',
                    'layerSwitcher': this
                };
                OpenLayers.Event.observe(opacityMinusButton, "click", 
                    OpenLayers.Function.bindAsEventListener(this.changeLayerOpacity, opacityMinusContext)
                );
               
                var opacityPlusContext = {
                    'layer': layer,
                    'byOpacity': '0.1',
                    'layerSwitcher': this
                };
                OpenLayers.Event.observe(opacityPlusButton, "click", 
                    OpenLayers.Function.bindAsEventListener(this.changeLayerOpacity, opacityPlusContext)
                );
				
				var abstractContext = {
                    'layer': layer,
                    'button' : abstractButton
                };
				OpenLayers.Event.observe(abstractButton, "mouseup", 
                    OpenLayers.Function.bindAsEventListener(this.toggleAbstract, abstractContext)
                );               
                
                // create line break
                var br = document.createElement("br");
                
                var groupArray = (baseLayer) ? this.baseLayers
                                             : this.dataLayers;
                groupArray.push({
                    'layer': layer,
                    'inputElem': inputElem,
                    'titleDiv': titleDiv,
                    'labelSpan': labelSpan
                });
                                                     
                var groupDiv = (baseLayer) ? this.baseLayersDiv
                                           : this.dataLayersDiv;
                                           
                groupDiv.appendChild(layerWrapper);
                layerWrapper.appendChild(titleDiv);  
                titleDiv.appendChild(inputElem);
                titleDiv.appendChild(buttonSpan);
				
				if (! baseLayer) {
//					buttonSpan.appendChild(upButton);	//doesn't work
//					buttonSpan.appendChild(downButton);	//doesn't work
//					buttonSpan.appendChild(removeButton);
					buttonSpan.appendChild(opacityContainer);
				}
                
				if(layer.description) {
					titleDiv.appendChild(abstractButton);
				}
                if(layer.queryable) {
                	buttonSpan.appendChild(queryableButton);
                }
                if(layer.dataURL) {
                    buttonSpan.appendChild(dataUrlLink);
                }
                
                titleDiv.appendChild(labelSpan); 
				titleDiv.appendChild(abstractSpan);
				
				if(this.useLegendGraphics && layer.params && ! baseLayer) {
                    var legendGraphicURL = layer.getFullRequestString({
                    REQUEST: "GetLegendGraphic",
                    LAYER: layer.params.LAYERS,
                    FORMAT: "image/png",
                    WIDTH: "150"});

                    var imgSpan = document.createElement('span');
                    imgSpan.innerHTML = "<img style=\"display:none\" src=\"" + legendGraphicURL + "\" onload=\"this.style.display = 'inline'\" alt=\"\" onerror=\"this.src='" + this.imageDirectory + "blank.gif" + "'\" />";
                    layerWrapper.appendChild(imgSpan);                          
                }                          
            }   
        }
        
        return this.div;        
            
    },   
    
    /** 
     * Method:
     * A label has been clicked, check or uncheck its corresponding input
     * 
     * Parameters:
     * e - {Event} 
     *
     * Context:  
     *  - {DOMElement} inputElem
     *  - {<OpenLayers.Control.LayerSwitcher>} layerSwitcher
     *  - {<OpenLayers.Layer>} layer
     */

    onInputClick: function(e) {
        if (!this.inputElem.disabled) {
            if (this.inputElem.type == "radio") {
                this.inputElem.checked = true;
                this.layer.map.setBaseLayer(this.layer);
            } else {
                this.inputElem.checked = !this.inputElem.checked;
                this.layerSwitcher.updateMap();
            }
        }
        
        if (e != null) {
            OpenLayers.Event.stop(e);                                            
        }
    },    

    /**
     * Method: onRemoveClick
     * Remove the layer from the map
     * 
     * Parameters: 
     * e - {Event} 
     */
    onRemoveClick: function(e)
    {
        this.layer.map.removeLayer(this.layer);
        
        if (e != null) {
            OpenLayers.Event.stop(e);                                            
        } 
    },
    
    /**
     * Method: onDownClick
     * Set the layer position down one level
     * 
     * Parameters: 
     * e - {Event} 
     */
    onDownClick: function(e)
    {
        this.layer.map.raiseLayer(this.layer, -1);  
        
        if (e != null) {
            OpenLayers.Event.stop(e);                                            
        }
    },
    
    /**
     * Method: onUpClick
     * Set the layer position up one level
     * 
     * Parameters: 
     * e - {Event} 
     */
    onUpClick: function(e)
    {
        this.layer.map.raiseLayer(this.layer, 1);  
        
        if (e != null) {
            OpenLayers.Event.stop(e);                                            
        }  
    },
    
     /**
     * Method: onTitleClick
     * Set the active layer
     * 
     * Parameters: 
     * e - {Event} 
     */
    onTitleClick: function(e) 
    {
        var id = this.layer.id;
       
        layerSwitcher.activeLayer = id;
        
        for (var i=0; i<map.layers.length;i++) { 
          var layer = map.layers[i]; 
          
          if(id == layer.id) {
            this.titleDiv.style.backgroundColor = "#999";
            this.titleDiv.style.border = "solid 1px #999";
          }
          else {           
            var div = OpenLayers.Util.getElement("title_" + layer.id); 
            
            if(div) { 
                div.style.backgroundColor = "#e1e1e1";
                div.style.border = "solid 1px #e1e1e1";
            }
          }           
        }        
        
        if (e != null) {
            OpenLayers.Event.stop(e);                                            
        }
    },
	
	toggleAbstract: function(e) 
	{		
		var span = OpenLayers.Util.getElement("abstract_" + this.layer.id);
		var button = this.button;
            
		if(span && button) { 
			var display = span.style.display;
			
			if(display == "block") {
				span.style.display = "none";
				button.src = this.imageDirectory + "expand.png";
			}
			else {
				span.style.display = "block";
				button.src = this.imageDirectory + "collapse.png";
			}
		}
		
	},
    
    /**
     * Method: onDataUrlClick
     * Open new window and redirect to URL.
     * 
     * Parameters: 
     * e - {Event} 
     *
     * Context:  
     *  - {string} url to redirect to
     */
    onDataUrlClick: function(e) 
    {    
        window.open(this.url , "data", "width=550,height=350,status=yes,scrollbars=yes,resizable=yes");
    },
    
    /**
     * Method: onMetadataUrlClick
     * Open new window and redirect to URL.
     * 
     * Parameters: 
     * e - {Event} 
     *
     * Context:  
     *  - {string} url to redirect to
     */
    onMetadataUrlClick: function(e) 
    {    
        window.open(this.url , "metadata", "width=550,height=350,status=yes,scrollbars=yes,resizable=yes");
    },
    
    /**
     * Method: onLayerClick
     * Need to update the map accordingly whenever user clicks in either of
     *     the layers.
     * 
     * Parameters: 
     * e - {Event} 
     */
    onLayerClick: function(e) {
        this.updateMap();
    },

    /**
     * Method: changeLayerOpacity
     * Changes opacity of a given layer for a given delta
     * 
     * Parameters: 
     * e - {Event} 
     *
     * Context:  
     *  - {string} amount to increase or decrease opacity value
     *  - {<OpenLayers.Layer>} layer
     *  - {<OpenLayers.Control.LayerSwitcher>} layerSwitcher
     */
    changeLayerOpacity: function(e) 
    {    
        var maxOpacity = 1.0;
        var minOpacity = 0.1;
        var opacity = (this.layer.opacity != null) ? this.layer.opacity : 1.0;
        var i = parseFloat(this.byOpacity);
        var opacityElement = "opacity_" + this.layer.id;  
        var opacityImg = "opacityImg_" + this.layer.id;
        var newOpacity = (parseFloat(opacity + i)).toFixed(1);
        
        newOpacity = Math.min(maxOpacity, Math.max(minOpacity, newOpacity));
        
        OpenLayers.Util.getElement(opacityElement).value = newOpacity;       
        OpenLayers.Util.getElement(opacityImg).width = (newOpacity * 23).toFixed(0);
        
        this.layer.setOpacity(newOpacity);
    },

    /** 
     * Method: updateMap
     * Cycles through the loaded data and base layer input arrays and makes
     *     the necessary calls to the Map object such that that the map's 
     *     visual state corresponds to what the user has selected in 
     *     the control.
     */
    updateMap: function() 
    {
        // set the newly selected base layer        
        for(var i=0, len=this.baseLayers.length; i<len; i++) {
            var layerEntry = this.baseLayers[i];
            if (layerEntry.inputElem.checked) {
                this.map.setBaseLayer(layerEntry.layer, false);
            }
        }

        // set the correct visibilities for the overlays
        for(var i=0, len=this.dataLayers.length; i<len; i++) {
            var layerEntry = this.dataLayers[i];   
            layerEntry.layer.setVisibility(layerEntry.inputElem.checked);
        }
    },

    /** 
     * Method: maximizeControl
     * Set up the labels and divs for the control
     * 
     * Parameters:
     * e - {Event} 
     */
    maximizeControl: function(e) 
    {
        this.div.style.width = "20em";
        this.div.style.height = "100%";
        this.div.style.borderLeft = "solid 1px #999";

        this.showControls(false);

        if (e != null) {
            OpenLayers.Event.stop(e);                                            
        }
    },
    
    /** 
     * Method: minimizeControl
     * Hide all the contents of the control, shrink the size, 
     *     add the maximize icon
     *
     * Parameters:
     * e - {Event} 
     */
    minimizeControl: function(e) 
    {
        this.div.style.width = "0px";
        this.div.style.height = "100%";
        this.div.style.borderLeft = "none";

        this.showControls(true);

        if (e != null) {
            OpenLayers.Event.stop(e);                                            
        }
    },

    /**
     * Method: showControls
     * Hide/Show all LayerSwitcher controls depending on whether we are
     *     minimized or not
     * 
     * Parameters:
     * minimize - {Boolean}
     */
    showControls: function(minimize) {

        this.maximizeDiv.style.display = minimize ? "" : "none";
        this.minimizeDiv.style.display = minimize ? "none" : "";

        this.layersDiv.style.display = minimize ? "none" : "";
    },
    
    /** 
     * Method: loadContents
     * Set up the labels and divs for the control
     */
    loadContents: function() {

        //configure main div
        this.div.style.position = "absolute";
        this.div.style.top = "0px";
        this.div.style.right = "0px";
        this.div.style.left = ""; 
        this.div.style.backgroundColor = this.activeColor; 
        this.div.style.height = "100%";
		
		this.handlers.drag = new OpenLayers.Handler.Drag(
			this, {}, {
			documentDrag: false,
			map: this.map
		});
    
		// Cancel or catch events 
		OpenLayers.Event.observe(this.div, 'click', OpenLayers.Function.bind(function (ctrl, evt) {
			OpenLayers.Event.stop(evt ? evt : window.event, true);
		}, this, this.div));
		OpenLayers.Event.observe(this.div, 'dblclick', OpenLayers.Function.bind(function (ctrl, evt) {
			OpenLayers.Event.stop(evt ? evt : window.event);
		}, this, this.div));
		OpenLayers.Event.observe(this.div, 'mouseover', OpenLayers.Function.bind(function () {
			this.handlers.drag.activate();
		}, this, this.div));
		OpenLayers.Event.observe(this.div, 'mouseout', OpenLayers.Function.bind(function () {
			this.handlers.drag.deactivate();
		}, this, this.div));
		OpenLayers.Event.observe(this.div, 'touchstart', OpenLayers.Function.bind(function (ele, evt) {
			// Because the event handling affects the entire legend div, I have to check to see if what the 
			// user is touching is actually the minimize/maximize image. If so, forget dragging because
			// the user wants to either open or close the legend
			if (evt.target.nodeName.toLowerCase() === 'img' ) {
				if (evt.target.id.toLowerCase().indexOf('minimize') !== -1) {
					this.minimizeControl();
				} else if (evt.target.id.toLowerCase().indexOf('maximize') !== -1) {
					this.maximizeControl();
				}
			} else {
				// The user is actually dragging the legend (or at least touched it) so mark the y coord where
				// that happened because dragging (touchmove) directionality and distance will  be based on 
				// this delta
				this.dragStart = evt.changedTouches[0].clientY;
			}
			OpenLayers.Event.stop(evt);
		}, this, this.div));
		OpenLayers.Event.observe(this.div, 'touchmove', OpenLayers.Function.bind(function (ele, evt) {
			// The user is actively dragging the legend. I need to figure out the scroll amount so I take the starting
			// point (dragStart) and as the user scrolls, I calculate the distance from the starting point and 
			// programatically scroll the container
			var container = this.legendContainerElement,
				currentY = evt.changedTouches[0].clientY,
				scrollAmount = currentY - this.dragStart,
				scrollToY = -scrollAmount + container.scrollTop;

			container.scrollTop = scrollToY;
			OpenLayers.Event.stop(evt ? evt : window.event);
		}, this, this.div));
		OpenLayers.Event.observe(this.div, 'touchend', OpenLayers.Function.bind(function (ele, evt) {
			OpenLayers.Event.stop(evt);
		}, this, this.div));


        OpenLayers.Event.observe(this.div, "dblclick", this.ignoreEvent);

        // layers list div        
        this.layersDiv = document.createElement("div");
        this.layersDiv.setAttribute("className", "olLayerSwitcherLayerContainer");
        this.layersDiv.id = this.id + "_layersDiv";        
        this.layersDiv.style.overflowX = "hidden"; 
        this.layersDiv.style.overflowY = "scroll";
        this.layersDiv.style.position = "relative";
        this.layersDiv.style.height = "100%";        
        
        this.baseLayersDiv = document.createElement("div");
		this._buildEmptyBaseDiv(this.baseLayersDiv);
        this.dataLayersDiv = document.createElement("div");
		this._buildEmptyDataDiv(this.dataLayersDiv);
		this.footer = undefined;
		
		if (document.getElementById('legend-footer-template')) {
			this.footer = document.createElement("div");
			this.footer.className = "legend-footer";
			this.footer.innerHTML = document.getElementById('legend-footer-template').innerHTML;
		}
		
		
		
        if (this.ascending) {
            this.layersDiv.appendChild(this.baseLayersDiv);
            this.layersDiv.appendChild(this.dataLayersDiv);
        } else {
            this.layersDiv.appendChild(this.dataLayersDiv);
            this.layersDiv.appendChild(this.baseLayersDiv);
        }    
		
		if (this.footer) this.layersDiv.appendChild(this.footer);
        
        this.div.appendChild(this.layersDiv);
        	
		
        var imgLocation = this.imageDirectory;
        var sz = new OpenLayers.Size(20,60);        

        // maximize button div
        var img = imgLocation + 'layer-switcher-maximize.png';
        this.maximizeDiv = OpenLayers.Util.createAlphaImageDiv(
                                    "OpenLayers_Control_MaximizeDiv", 
                                    null, 
                                    sz, 
                                    img, 
                                    "absolute");
        this.maximizeDiv.style.top = "50%";
		this.maximizeDiv.style.marginTop = "-30px";
        this.maximizeDiv.style.right = "0px";
        this.maximizeDiv.style.left = "";
        this.maximizeDiv.style.display = "none";
        OpenLayers.Event.observe(this.maximizeDiv, "click", 
            OpenLayers.Function.bindAsEventListener(this.maximizeControl, this)
        );
        
        this.div.appendChild(this.maximizeDiv);
        //OpenLayers.Rico.Corner.changeOpacity(this.maximizeDiv, 0.95);

        // minimize button div
        var img = imgLocation + 'layer-switcher-minimize.png';
        var sz = new OpenLayers.Size(20,60);        
        this.minimizeDiv = OpenLayers.Util.createAlphaImageDiv(
                                    "OpenLayers_Control_MinimizeDiv", 
                                    null, 
                                    sz, 
                                    img, 
                                    "absolute");
        this.minimizeDiv.style.top = "50%";
		this.minimizeDiv.style.marginTop = "-30px";
        this.minimizeDiv.style.right = "258px";
        this.minimizeDiv.style.left = "";
        OpenLayers.Event.observe(this.minimizeDiv, "click", 
            OpenLayers.Function.bindAsEventListener(this.minimizeControl, this)
        );

        this.div.appendChild(this.minimizeDiv);
        //OpenLayers.Rico.Corner.changeOpacity(this.minimizeDiv, 0.95);
        
        
    },
	
	_buildEmptyBaseDiv: function(divToUse) {
		while (divToUse.firstChild) {
			divToUse.removeChild(divToUse.firstChild);
		}
		
        divToUse.className = "base-layers";
		var baseLayersTitle = document.createElement("h3");
		baseLayersTitle.innerHTML = "Base Layers";
		divToUse.appendChild(baseLayersTitle);
	},
	
	_buildEmptyDataDiv: function(divToUse) {
		while (divToUse.firstChild) {
			divToUse.removeChild(divToUse.firstChild);
		}
        divToUse.className = "data-layers";
		var dataLayersTitle = document.createElement("h3");
		dataLayersTitle.innerHTML = "Data Layers";
		divToUse.appendChild(dataLayersTitle);
	},
    
    /** 
     * Method: ignoreEvent
     * 
     * Parameters:
     * evt - {Event} 
     */
    ignoreEvent: function(evt) {
        OpenLayers.Event.stop(evt);
    },

    /** 
     * Method: mouseDown
     * Register a local 'mouseDown' flag so that we'll know whether or not
     *     to ignore a mouseUp event
     * 
     * Parameters:
     * evt - {Event}
     */
    mouseDown: function(evt) {
        this.isMouseDown = true;
        this.ignoreEvent(evt);
    },

    /** 
     * Method: mouseUp
     * If the 'isMouseDown' flag has been set, that means that the drag was 
     *     started from within the LayerSwitcher control, and thus we can 
     *     ignore the mouseup. Otherwise, let the Event continue.
     *  
     * Parameters:
     * evt - {Event} 
     */
    mouseUp: function(evt) {
        if (this.isMouseDown) {
            this.isMouseDown = false;
            this.ignoreEvent(evt);
        }
    },
	
	CLASS_NAME: "OpenLayers.Control.CustomLayerSwitcher"
});



