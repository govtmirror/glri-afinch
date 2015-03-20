<!DOCTYPE html>
<%@page import="org.slf4j.Logger"%>
<%@page import="org.slf4j.LoggerFactory"%>
<%@page import="gov.usgs.cida.config.DynamicReadOnlyProperties"%>
<%@page contentType="text/html" pageEncoding="UTF-8"%>
<% response.setHeader("X-UA-Compatible", "IE=Edge"); %>
<%!
    private static final Logger log = LoggerFactory.getLogger("index.jsp");
    protected DynamicReadOnlyProperties props = new DynamicReadOnlyProperties();

    {
        try {
            props = props.addJNDIContexts(new String[0]);
        } catch (Exception e) {
            log.error("Could not find JNDI");
        }
    }
    boolean development = Boolean.parseBoolean(props.getProperty("all.development"));
%>

<html lang="en">
    <head>
        <jsp:include page="template/USGSHead.jsp">
            <jsp:param name="relPath" value="" />
            <jsp:param name="shortName" value="GLRI AFINCH Mapper" />
            <jsp:param name="title" value="GLRI AFINCH Mapper" />
            <jsp:param name="description" value="" />
            <jsp:param name="author" value="Ivan Suftin, Tom Kunicki, Jordan Walker, Carl Schroedl, Jessica Lucido, Eric Everman" />
            <jsp:param name="keywords" value="" />
            <jsp:param name="publisher" value="Center for Integrated Data Analytics" />
            <jsp:param name="revisedDate" value="" />
            <jsp:param name="nextReview" value="" />
            <jsp:param name="expires" value="never" />
            <jsp:param name="development" value="<%= development%>" />
        </jsp:include>
        <link type="text/css" rel="stylesheet" href="pages/index/index.css" />

        <jsp:include page="pages/index/dygraphs.jsp">
            <jsp:param name="debug-qualifier" value="<%= development%>" />
        </jsp:include>
        <jsp:include page="js/log4javascript/log4javascript.jsp">
            <jsp:param name="relPath" value="" />
        </jsp:include>
        <jsp:include page="js/ext/ext.jsp">
            <jsp:param name="debug-qualifier" value="<%= development%>" />
        </jsp:include>
		<jsp:include page="js/sugar/sugar.jsp">
            <jsp:param name="relPath" value="" />
            <jsp:param name="debug-qualifier" value="<%= development%>" />
        </jsp:include>
        <jsp:include page="js/openlayers/openlayers.jsp">
            <jsp:param name="debug-qualifier" value="<%= development%>" />
        </jsp:include>
        <jsp:include page="js/openlayers/raster.jsp" />
        <jsp:include page="js/openlayers/script_imports.jsp" />
        <jsp:include page="js/geoext/geoext.jsp" >
            <jsp:param name="debug-qualifier" value="<%= development%>" />
        </jsp:include>
        <jsp:include page="js/geoext/ux/WPS/WPS.jsp"/>
        <jsp:include page="js/geoext/ux/SOS/SOS.jsp"/>
        <jsp:include page="js/ext/ux/notify/notify.jsp"/>
        <jsp:include page="js/gxp/gxp.jsp"/>
        <jsp:include page="js/jquery/jquery.jsp">
            <jsp:param name="debug-qualifier" value="<%= development%>" />
        </jsp:include>
        <script type="text/javascript">
            OpenLayers.ProxyHost = null;
            var CONFIG = new Object();
            var AFINCH = new Object();
            CONFIG.endpoint = new Object();
			CONFIG.metadata = new Object();
			CONFIG.userpref = new Object();
            CONFIG.mapPanel = new Object();
			CONFIG.maplayers = new Object();
			CONFIG.maplayers.flowline = new Object();
			CONFIG.maplayers.catchMean = new Object();
			CONFIG.maplayers.gage = new Object();
	
            CONFIG.development = <%= development%>;
            CONFIG.LOG4JS_PATTERN_LAYOUT = '<%= props.getProperty("afinch.frontend.log4js.pattern.layout", "%rms - %-5p - %m%n")%>';
            CONFIG.LOG4JS_LOG_THRESHOLD = '<%= props.getProperty("afinch.frontend.log4js.threshold", "info")%>';

			CONFIG.endpoint.geoserverProjectPrefix = "glri-afinch";	//Not needed in layer names if used in url as below
            CONFIG.endpoint.geoserver = '<%= props.getProperty("afinch.endpoint.geoserver", "http://localhost:8081/glri-geoserver/glri-afinch/")%>';
            CONFIG.endpoint.geoserverProxy = 'geoserver/';
			CONFIG.endpoint.geoserverProjectNamespace = "http://cida.usgs.gov/glri-afinch";
			

            //IE always taints the canvas with cross-origin images, even if their
            //cross origin keywords are set to prevent tainting.
            //Since this breaks things, we must use a GeoServer proxy instead of CORS
            if(Ext.isIE){
                CONFIG.endpoint.geoserver = CONFIG.endpoint.geoserverProxy;
            }

            CONFIG.endpoint.rwps = '<%= props.getProperty("afinch.endpoint.rwps", "http://cida-wiwsc-wsdev.er.usgs.gov:8080/wps/")%>';
            CONFIG.endpoint.rwpsProxy = 'rwps/';
            CONFIG.endpoint.thredds = '<%= props.getProperty("afinch.endpoint.thredds", "http://cida-wiwsc-wsdev.er.usgs.gov:8080/")%>';
			CONFIG.endpoint.reach_thredds_filename = '<%= props.getProperty("afinch.endpoint.reach_thredds_filename", "afinch_reach.nc")%>';
			CONFIG.endpoint.catch_thredds_filename = '<%= props.getProperty("afinch.endpoint.catch_thredds_filename", "afinch_catch.nc")%>';
            CONFIG.endpoint.threddsProxy = 'thredds/';
            CONFIG.endpoint.exporter = 'export';
			
			//General Metadata
			CONFIG.metadata.reach_observed_prop = "QAccCon";
			CONFIG.metadata.reach_id_prop = "COMID";
			CONFIG.metadata.catch_observed_prop = "yieldCatchCon";
			CONFIG.metadata.catch_id_prop = "GRIDCODE";
			
			//User Preferences
			CONFIG.userpref.graphTab = 0;	//open to first tab, but open new windows using the last
			
            CONFIG.attribution = {
                nhd:{
                    logo:'images/NHDPlus_logo.png',
                    link: 'http://www.horizon-systems.com/nhdplus/'
                },
                usgs:{
                    logo: 'images/c_168_USGS.gif',
                    link: 'http://www.usgs.gov/'
                },
                epa: {
                    logo: 'images/EPA_logo.png',
                    link: 'http://www.epa.gov/'
                }
            };
            CONFIG.attributionUrl = '';
            CONFIG.defaultExportFilename = 'nhd_flowlines_stats.csv';
			
			//Map layer config
			CONFIG.maplayers.flowline.layerName = 'nhd_v2_1_flowline_w_streamorder';	//old val: 'glri:NHDFlowline';
			CONFIG.maplayers.flowline.layerStyle = 'FlowlineStreamOrder';	//old val: 'FlowlineStreamOrder'
			CONFIG.maplayers.flowline.streamOrderAttribName = 'StrmOrder';	//old val: 'StreamOrde' - used to determine display at zoom levels
			CONFIG.maplayers.catchMean.layerName = 'nhd_v2_1_catch_w_afinch_data';
			CONFIG.maplayers.catchMean.layerStyle = 'afinch_catch_YCCMean';
			CONFIG.maplayers.gage.layerName = 'GageLoc';	//old val: glri:GageLoc
			CONFIG.maplayers.gage.layerStyle = 'GageLocStreamOrder';	//old val: 'FlowlineStreamOrder'
			CONFIG.maplayers.gage.streamOrderAttribName = 'StreamOrde';	//varies by layer...
        </script>

        <script type="text/javascript" src="js/Map/map.js"></script>
	<script type="text/javascript" src="js/openlayers/Control/CustomLayerSwitcher.js"></script>
        <script type="text/javascript" src="js/Data/StatsStore.js"></script>
        <script type="text/javascript" src="js/Data/ParseSosResponse.js"></script>
        <script type="text/javascript" src="js/Util/Util.js"></script>
        <script type="text/javascript" src="js/Ui/ErrorNotify.js"></script>
        <script type="text/javascript" src="js/Ui/DataExportToolbar.js"></script>
        <script type="text/javascript" src="js/Ui/SeriesToggleToolbar.js"></script>
        <script type="text/javascript" src="js/Ui/SeriesToggleMenu.js"></script>
        <script type="text/javascript" src="js/Ui/DataWindow.js"></script>
        <script type="text/javascript" src="js/Ui/StatsGridPanel.js"></script>
        <script type="text/javascript" src="js/Ui/StatsGraphPanel.js"></script>
        <script type="text/javascript" src="js/Ui/FlowDygraph.js"></script>
        <script type="text/javascript" src="js/Ui/StatsLabelPanel.js"></script>
        <script type="text/javascript" src="js/Ui/DataDisplayPanel.js"></script>
        <script type="text/javascript" src="js/pages/index/onReady.js"></script>
	<!-- app-specific Google Analytics -->
	<script>
	    (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
	    (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
	    m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
	    })(window,document,'script','//www.google-analytics.com/analytics.js','ga');

	    ga('create', 'UA-50454186-3', 'auto');
	    ga('send', 'pageview');
	</script>
	<!-- DOI foresee and GA -->
	<script type="application/javascript" src="http://www.usgs.gov/scripts/analytics/usgs-analytics.js"></script>
    </head>
    <body>
        <jsp:include page="template/USGSHeader.jsp">
            <jsp:param name="relPath" value="" />
            <jsp:param name="header-class" value="" />
            <jsp:param name="site-title" value="GLRI AFINCH Mapper" />
        </jsp:include>
        <div class="application-body">
            
            <div id="aboutContent">
                
                <ul id="tabs">
                    <li><a class="selected" href="index.jsp">About</a></li>
                    <li><a href="mapper.jsp">Mapper</a></li>
                </ul>
                
                
                <a target="_blank" class="no_hover_change" href="http://www.epa.gov/">
                    <img src="images/EPA_logo.png"/>
		</a>
                <a target="_blank" class="no_hover_change" href="http://www.horizon-systems.com/nhdplus/">
                    <img class="sizeChange" src="images/NHDPlus_logo.png"/>
		</a>
                <a target="_blank" class="no_hover_change" href="http://www.usgs.gov/">
                    <img src="images/c_168_USGS.gif"/>
		</a>
                <a target="_blank" class="no_hover_change" href="http://cida.usgs.gov/glri/#/Home">
                    <img class="glriLogo" src="images/glri_logo.svg"/>
		</a>
                
                <p id="topParagraph">
                    This cooperative project was made possible by the Great Lakes Restoration Initiative.
                </p>
                
                <h1>The GLRI AFINCH (Analysis of Flows in Networks of CHannels) Mapper</h1>
                
                <p>
                    The GLRI AFINCH Mapper provides access to estimated monthly water yields, 
                    defined as streamflow divided by catchment area, and corresponding flows for 
                    stream segments for 1951–2012 in the Great Lakes Basin in the United States. 
                    Both sets of estimates were computed by using the AFINCH (Analysis of Flows in 
                    Networks of CHannels) application within the NHDPlus geospatial data framework. 
                    AFINCH provides a graphical user environment to develop regression models with 
                    flow estimates constrained to match measured monthly flow at active streamgages. 
                    Monthly water-use and climatic data also are used with basin characteristics data 
                    available within NHDPlus or supplied by the user in regression models to estimate 
                    water yields and flows.
                </p>
                <p>
                    This regionally consistent estimate of streamflow provides unified information 
                    across the U.S. Great Lakes Basin for restoration, assessment, management, and 
                    conservation of stream ecosystems. Monthly flow time series for individual stream 
                    segments can be retrieved from the mapper and used to approximate monthly flow-duration 
                    characteristics and to identify possible trends. Mapper provided estimates for each selected 
                    reach or catchment include:
                </p>
                <ul>
                    <li>Monthly flow/yield</li>
                    <li>Mean annual flow/yield</li>
                    <li>Median annual flow/yield</li>
                    <li>Mean monthly flow/yield</li>
                    <li>Median monthly flow/yield</li>
                    <li>Deciles of monthly or annual flow/yield</li>
                </ul>
                
                
                <p class="bold">
                    Additional Resources
                    <ul>
                        <li>
                            Report – Estimation of monthly water yields and flows for 1951–2012 for 
                            the United States portion of the Great Lakes Basin with AFINCH 
                            (Luukkonen and others, 2014)
                        </li>
                        <li>
                            Report – Application guide for AFINCH (Analysis of Flows in Networks of CHannels) 
                            described by NHDPlus (Holtschlag, 2009)
                        </li>
                        <li>
                            ScienceBase page
                        </li>
                    </ul>
                </p>
                
                
                <p class="bold">
                    Please see below for a description of the various features.
                </p>
                
                <a href="images/AFINCH_Mapper_Controls_Image.png" class="no_hover_change">
                    <img id="tips" src="images/AFINCH_Mapper_Controls_Image.png"/>
		</a>
          
                
            </div>
            
        </div>
        <jsp:include page="custom_template/USGSFooter.jsp">
            <jsp:param name="relPath" value="" />
            <jsp:param name="header-class" value="" />
            <jsp:param name="site-url" value= "<script type='text/javascript'>document.write(document.location.href);</script>" />
            <jsp:param name="contact-info" value= "<a href='mailto:glri-database@usgs.gov?subject=GLRI AFINCH Mapper Comments' title='Contact Email'>GLRI Help</a>" />
			<jsp:param name="revisedDate" value="${timestamp}" />
			<jsp:param name="buildVersion" value="${project.version}" />
        </jsp:include>
        
    </body>
</html>
