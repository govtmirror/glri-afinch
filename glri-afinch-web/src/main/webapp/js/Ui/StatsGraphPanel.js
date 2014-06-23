Ext.ns("AFINCH.ui");

AFINCH.ui.StatsGraphPanel = Ext.extend(Ext.Panel, {
    initialData: undefined,
    graph: undefined,
    headers: undefined,
    constructor: function(config) {
        var self = this;
        var destroyDygraph = function(){
            if(self.graph && self.graph.destroy){
                self.graph.destroy();
            }
        };
        config = Ext.apply({
            width: 800,
            listeners: {
                beforedestroy: destroyDygraph
            }
        }, config);

        AFINCH.ui.StatsGraphPanel.superclass.constructor.call(this, config);
        LOG.info('AFINCH.ui.StatsGraphPanel::constructor(): Construction complete.');
    },
	
	
	/**
	* @param ajax - response
	* @param options - the options that initiated the Ajax request
	* @scope the window in which the data will be visualized
	*/
	sosCallback: function(response, options) {
		//establish scope
		var self = options.scope;

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

			self.graph = AFINCH.ui.FlowDygraph(
				self.getEl().dom, 
				self.labelPanel.getEl().dom,
				values);

			//attach the info to the graphPanel for easy access during data export
			self.graphPanel.data={
				values : values,
				headers: self.graphPanel.graph.getLabels()
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
			self.doLayout();
		}
	},
	   
	   /**
		*@param statsStores - array of StatStores
		*@param success - whether or not the request was successful
		*/
	statsCallback: function(statsStores, success) {
		var self = this;
		var win = self;

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
    }
});