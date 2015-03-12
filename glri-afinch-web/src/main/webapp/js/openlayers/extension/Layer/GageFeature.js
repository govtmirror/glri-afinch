/**
 * @requires OpenLayers/Layer/Vector.js
 */

/**
 * Class: OpenLayers.Layer.GageFeature
 *
 * Inherits from:
 *  - <OpenLayers.Layer.Vector>
 */
OpenLayers.Layer.GageFeature = OpenLayers.Class(OpenLayers.Layer.Vector, {
	minScale: 15000000,
	strategies: [
		new OpenLayers.Strategy.BBOX(), new OpenLayers.Strategy.Filter({
			filter: new OpenLayers.Filter.Comparison({
				type: OpenLayers.Filter.Comparison.GREATER_THAN_OR_EQUAL_TO,
				property: "StreamOrde",
				value: this.streamOrderClipValue
			})
		})
	],
	styleMap: new OpenLayers.StyleMap({
		'default': new OpenLayers.Style({
			'fillColor': '#558027',
			'fillOpacity': 0.4,
			'strokeColor': '#558027',
			'strokeOpacity': 1,
			'strokeWidth': 1,
			'graphicName': 'triangle'
		}, {
			rules: [
				new OpenLayers.Rule({
					minScaleDenominator: 8635665,
					symbolizer: {
						pointRadius: 3
					}
				}),
				new OpenLayers.Rule({
					maxScaleDenominator: 8635665,
					minScaleDenominator: 4267832,
					symbolizer: {
						pointRadius: 5
					}
				}),
				new OpenLayers.Rule({
					maxScaleDenominator: 4267832,
					minScaleDenominator: 991958,
					symbolizer: {
						pointRadius: 7
					}
				}),
				new OpenLayers.Rule({
					maxScaleDenominator: 991958,
					symbolizer: {
						pointRadius: 10
					}
				})
			]
		}),
		'select': new OpenLayers.Style({
			'fillColor': '#609428',
			'fillOpacity': 0.4,
			'strokeColor': '#ffffff',
			'strokeOpacity': 1,
			'strokeWidth': 3,
			'graphicName': 'triangle'
		}, {
			rules: [
				new OpenLayers.Rule({
					minScaleDenominator: 8635665,
					symbolizer: {
						pointRadius: 3
					}
				}),
				new OpenLayers.Rule({
					maxScaleDenominator: 8635665,
					minScaleDenominator: 4467832,
					symbolizer: {
						pointRadius: 5
					}
				}),
				new OpenLayers.Rule({
					maxScaleDenominator: 4467832,
					minScaleDenominator: 1191958,
					symbolizer: {
						pointRadius: 7
					}
				}),
				new OpenLayers.Rule({
					maxScaleDenominator: 1191958,
					symbolizer: {
						pointRadius: 10
					}
				})
			]
		})
	}),
	CLASS_NAME: "OpenLayers.Layer.GageFeature",
	initialize: function (name, options) {
		var newArguments = [];
		options = options || {};
		options.protocol = new OpenLayers.Protocol.WFS({
			url: options.url,
			featureType: "GageLoc",
			featureNS: CONFIG.endpoint.geoserverProjectNamespace
		});
		newArguments.push(name, options);
		OpenLayers.Layer.Vector.prototype.initialize.apply(this, newArguments);
	},
	updateGageStreamOrderFilter: function () {
		this.strategies[1].setFilter(new OpenLayers.Filter.Comparison({
			type: OpenLayers.Filter.Comparison.GREATER_THAN_OR_EQUAL_TO,
			property: "StreamOrde",
			value: this.streamOrderClipValue
		}));
	},
	updateFromClipValue: function (cv) {
		this.streamOrderClipValue = cv;
		if (this.getVisibility()) {
			this.updateGageStreamOrderFilter();
		}
	}
});