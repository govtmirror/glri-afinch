<div id="about-html">
	<a href="http://www.usgs.gov/" target="_blank"><img src="images/c_168_USGS.gif"></a>
	<a href="http://www.epa.gov/" target="_blank"><img src="images/EPA_logo.png"></a>
	<a href="http://www.horizon-systems.com/nhdplus/" target="_blank"><img id="smaller" src="images/NHDPlus_logo.png"></a>
	<a href="http://cida.usgs.gov/glri/#/Home" target="_blank"><img id="resize" src="images/glri_logo.svg"></a>
	<br />
	<p>This cooperative project was made possible by the Great Lakes Restoration Initiative</p>
	<h1>The Great Lakes Restoration Initiative (GLRI) Mapper for Monthly Streamflow and Yield of Catchments using Analysis of Flows in Networks of CHannels (AFINCH)</h1>
	<br />
	<p>The GLRI Mapper for Monthly Streamflow and Yields of Catchments using AFINCH provides access to estimated monthly water yields and corresponding flows for stream segments for 1951-2012 in the Great Lakes Basin in the United States. Yield is defined as the increment of streamflow contributed to a stream segment from a catchment divided by the catchment area and incorporates both runoff and baseflow from the catchment. Both sets of estimates were computed by using the AFINCH (Analysis of Flows in Networks of CHannels) application within the NHDPlus geospatial data framework. Estimates for mean (average) yield are derived from the linear regression step in AFINCH. Estimated monthly mean streamflows are determined from the monthly mean yields by multiplying mean yield by catchment area and accumulating these incremental flows down the stream channel. For stream segments with active streamgages that were included in the analysis, the ratios of measured to estimated accumulated flows are computed, and these ratios are applied to upstream estimated yields to proportionally constrain estimated flows to match measured flows. AFINCH provides a graphical user environment to develop regression models with flow estimates constrained to match measured monthly flow at active streamgages. Monthly water-use and climatic data also are used with basin characteristics data available within NHDPlus or supplied by the user in regression models to estimate water yields and flows.</p>
	<p>This regionally consistent estimate of streamflow provides unified information across the U.S. Great Lakes Basin for restoration, assessment, management, and conservation of stream ecosystems. Monthly flow time series for individual stream segments can be retrieved from the mapper and used to approximate monthly flow-duration characteristics and to identify possible trends. Mapper provided estimates for each selected reach or catchment include:</p>
	<ul>	
		<li>Monthly flow/yield</li>
		<li>Mean annual flow/yield</li>
		<li>Median annual flow/yield</li>
		<li>Mean monthly flow/yield</li>
		<li>Median monthly flow/yield</li>
		<li>Deciles of monthly or annual flow/yield</li>
	</ul>
	<br />
	<h2>Getting Started</h2>
	<p class="bold">How to view modeled catchment yield from AFINCH:</p>
	<ol>
		<li>Zoom and center to your area of interest using the map\'s "+" and "-" buttons and by dragging the map to the location you are interested in.</li>
		<li>Make sure the "Catchment Mean Yield, Constrained" layer is active by checking the box in the "Data Layers" part of the legend.</li>
		<li>See legend for meaning of color catchment colors.</li>
	</ol>
	<p class="bold">How to view and download data about an individual reach, catchment or streamgage:</p>
	<ol>
		<li>Make sure the "NHDPlus Flowlines" and/or "USGS Streamgages" layers are active by checking the box in the "Data Layers" part of the legend.</li>
		<li>Zoom and center to your area of interest using the map\'s "+" and "-" buttons and by dragging the map to the location you are interested in.</li>
		<li>Click on the reach or streamgage you are interested in on the map</li>
		<li>If multiple reaches or streamgages are close by, a list will appear. If the reach has a streamgage, a blue dot will be present in the "Streamgage Present" column. Double click the reach of interest from the list to view data.</li>
		<li>Click on the "Reach Flow Data" or "Catchment Yield Data (Constrained)" tab of the site pop-up to view a plot of the timeseries of streamflow or catchment yield respectively.</li>
		<li>At reaches with streamgages, the flow depicted on the plot will be the flow measured at the streamgage. Additional streamgage information may be viewed by clicking the "View Gage Details" button in the lower-left corner of the pop-up.</li>
		<li>Streamflow or catchment yield data may be downloaded for a reach or its corresponding catchment by clicking on either the "Download Reach Data" or "Download Catchment Data" buttons.</li>
	</ol>
	<p class="bold">Map Layers:</p>
	<ul>
		<li>Catchment Mean Yield, Constrained - Estimated mean yield, incremental flow divided by catchment area, adjusted to match observed monthly mean flow upstream of active streamgages</li>
		<li>NHDPlus Flowlines used to develop the AFINCH models</li>
		<li>USGS Streamgages used to develop the AFINCH models</li>
		<li>Map base layers - Using the layer switcher in the legend, you can change the map\'s base layer</li>
	</ul>
	<br />
	<h2>References</h2>
	<ul>
		<li><a href="http://dx.doi.org/10.3133/sir20145192" target="_blank">Report - Estimation of monthly water yields and flows for 1951-2012 for the United States portion of the Great Lakes Basin with AFINCH (Luukkonen and others, 2014)</a></li>
		<li><a href="http://pubs.er.usgs.gov/publication/sir20095188" target="_blank">Report - Application guide for AFINCH (Analysis of Flows in Networks of CHannels) described by NHDPlus (Holtschlag, 2009)</a></li>
		<li><a href="https://www.sciencebase.gov/catalog/item/53598190e4b0031b2f4a070a" target="_blank">ScienceBase Page</a></li>
	</ul>
</div>