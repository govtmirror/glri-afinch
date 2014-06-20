<?xml version="1.0" encoding="UTF-8"?>
<StyledLayerDescriptor xmlns="http://www.opengis.net/sld" xmlns:ogc="http://www.opengis.net/ogc"
	xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	version="1.0.0" xsi:schemaLocation="http://www.opengis.net/sld StyledLayerDescriptor.xsd">
	<NamedLayer>
		<Name>afinch_catch_YCCMean</Name>
		<UserStyle>
			<Title>afinch_catch_yieldcon</Title>
			<FeatureTypeStyle>
				<Rule>
					<Name>Bin 1 of 5</Name>
					<ogc:Filter>
						<ogc:PropertyIsLessThan>
							<ogc:PropertyName>YCCMean</ogc:PropertyName>
							<ogc:Literal>1</ogc:Literal>
						</ogc:PropertyIsLessThan>
					</ogc:Filter>
					<PolygonSymbolizer>
						<Fill>
							<CssParameter name="fill">#FFE176</CssParameter>
							<CssParameter name="stroke">#FFE176</CssParameter>
						</Fill>
					</PolygonSymbolizer>
				</Rule>
			</FeatureTypeStyle>
			<FeatureTypeStyle>
				<Rule>
					<Name>Bin 2 of 5</Name>
					<ogc:Filter>
						<ogc:And>
							<ogc:PropertyIsGreaterThanOrEqualTo>
								<ogc:PropertyName>YCCMean</ogc:PropertyName>
								<ogc:Literal>1</ogc:Literal>
							</ogc:PropertyIsGreaterThanOrEqualTo>
							<ogc:PropertyIsLessThan>
								<ogc:PropertyName>YCCMean</ogc:PropertyName>
								<ogc:Literal>2</ogc:Literal>
							</ogc:PropertyIsLessThan>
						</ogc:And>
					</ogc:Filter>
					<PolygonSymbolizer>
						<Fill>
							<CssParameter name="fill">#0C7F5C</CssParameter>
							<CssParameter name="stroke">#0C7F5C</CssParameter>
						</Fill>
					</PolygonSymbolizer>
				</Rule>
			</FeatureTypeStyle>
			<FeatureTypeStyle>
				<Rule>
					<Name>Bin 3 of 5</Name>
					<ogc:Filter>
						<ogc:And>
							<ogc:PropertyIsGreaterThanOrEqualTo>
								<ogc:PropertyName>YCCMean</ogc:PropertyName>
								<ogc:Literal>2</ogc:Literal>
							</ogc:PropertyIsGreaterThanOrEqualTo>
							<ogc:PropertyIsLessThan>
								<ogc:PropertyName>YCCMean</ogc:PropertyName>
								<ogc:Literal>3</ogc:Literal>
							</ogc:PropertyIsLessThan>
						</ogc:And>
					</ogc:Filter>
					<PolygonSymbolizer>
						<Fill>
							<CssParameter name="fill">#201E87</CssParameter>
							<CssParameter name="stroke">#201E87</CssParameter>
						</Fill>
					</PolygonSymbolizer>
				</Rule>
			</FeatureTypeStyle>
			<FeatureTypeStyle>
				<Rule>
					<Name>Bin 4 of 5</Name>
					<ogc:Filter>
						<ogc:And>
							<ogc:PropertyIsGreaterThanOrEqualTo>
								<ogc:PropertyName>YCCMean</ogc:PropertyName>
								<ogc:Literal>3</ogc:Literal>
							</ogc:PropertyIsGreaterThanOrEqualTo>
							<ogc:PropertyIsLessThan>
								<ogc:PropertyName>YCCMean</ogc:PropertyName>
								<ogc:Literal>4</ogc:Literal>
							</ogc:PropertyIsLessThan>
						</ogc:And>
					</ogc:Filter>
					<PolygonSymbolizer>
						<Fill>
							<CssParameter name="fill">#C19612</CssParameter>
							<CssParameter name="stroke">#C19612</CssParameter>
						</Fill>
					</PolygonSymbolizer>
				</Rule>
			</FeatureTypeStyle>
			<FeatureTypeStyle>
				<Rule>
					<Name>Bin 5 of 5</Name>
					<ogc:Filter>
						<ogc:PropertyIsGreaterThanOrEqualTo>
							<ogc:PropertyName>YCCMean</ogc:PropertyName>
							<ogc:Literal>4</ogc:Literal>
						</ogc:PropertyIsGreaterThanOrEqualTo>
					</ogc:Filter>
					<PolygonSymbolizer>
						<Fill>
							<CssParameter name="fill">#C14F12</CssParameter>
							<CssParameter name="stroke">#C14F12</CssParameter>
						</Fill>
					</PolygonSymbolizer>
				</Rule>
			</FeatureTypeStyle>

		</UserStyle>
	</NamedLayer>
</StyledLayerDescriptor>
