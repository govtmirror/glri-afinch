<%@page import="org.slf4j.Logger"%>
<%@page import="org.slf4j.LoggerFactory"%>
<%@page import="gov.usgs.cida.config.DynamicReadOnlyProperties"%>
<%@page contentType="text/html" pageEncoding="UTF-8"%>
<!DOCTYPE html>

<%!    private static final Logger log = LoggerFactory.getLogger("index.jsp");
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
        <!-- Le HTML5 shim, for IE6-8 support of HTML5 elements -->
        <!--[if lt IE 9]>
        <script src="http://html5shim.googlecode.com/svn/trunk/html5.js"></script>
        <![endif]-->
        <jsp:include page="template/USGSHead.jsp">
            <jsp:param name="relPath" value="" />
            <jsp:param name="shortName" value="GLRI AFINCH Mapper" />
            <jsp:param name="title" value="GLRI AFINCH Mapper" />
            <jsp:param name="description" value="" />
            <jsp:param name="author" value="Ivan Suftin, Tom Kunicki, Jordan Walker, Carl Schroedl, Jessica Lucido" />
            <jsp:param name="keywords" value="" />
            <jsp:param name="publisher" value="Center for Integrated Data Analyltics" />
            <jsp:param name="revisedDate" value="" />
            <jsp:param name="nextReview" value="" />
            <jsp:param name="expires" value="never" />
            <jsp:param name="development" value="<%= development%>" />
        </jsp:include>
        <link type="text/css" rel="stylesheet" href="pages/index/index.css" />

        <jsp:include page="js/dygraphs/dygraphs.jsp">
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
        <jsp:include page="js/openlayers/flowlines.jsp" />
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
            var CONFIG = Object.extended();
            var AFINCH = Object.extended();
            CONFIG.endpoint = Object.extended();
            CONFIG.mapPanel = Object.extended();

            CONFIG.development = <%= development%>;
            CONFIG.LOG4JS_PATTERN_LAYOUT = '<%= props.getProperty("afinch.frontend.log4js.pattern.layout", "%rms - %-5p - %m%n")%>';
            CONFIG.LOG4JS_LOG_THRESHOLD = '<%= props.getProperty("afinch.frontend.log4js.threshold", "info")%>';

            CONFIG.endpoint.geoserver = '<%= props.getProperty("afinch.endpoint.geoserver", "http://localhost:8081/glri-geoserver/")%>';
            CONFIG.endpoint.geoserverProxy = 'geoserver/';

            //IE always taints the canvas with cross-origin images, even if their
            //cross origin keywords are set to prevent tainting.
            //Since this breaks things, we must use a GeoServer proxy instead of CORS
            if(Ext.isIE){
                CONFIG.endpoint.geoserver = CONFIG.endpoint.geoserverProxy;
            }

            CONFIG.endpoint.rwps = '<%= props.getProperty("afinch.endpoint.rwps", "http://cida-wiwsc-wsdev.er.usgs.gov:8080/wps/")%>';
            CONFIG.endpoint.rwpsProxy = 'rwps/';
            CONFIG.endpoint.thredds = '<%= props.getProperty("afinch.endpoint.thredds", "http://cida-wiwsc-wsdev.er.usgs.gov:8080/")%>';
            CONFIG.endpoint.threddsProxy = 'thredds/';
            CONFIG.endpoint.exporter = 'export';
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

        </script>

        <script type="text/javascript" src="js/Map/map.js"></script>
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
    </head>
    <body>
        <jsp:include page="template/USGSHeader.jsp">
            <jsp:param name="relPath" value="" />
            <jsp:param name="header-class" value="" />
            <jsp:param name="site-title" value="GLRI AFINCH Mapper" />
        </jsp:include>
        <div class="application-body">
        </div>
        <jsp:include page="template/USGSFooter.jsp">
            <jsp:param name="relPath" value="" />
            <jsp:param name="header-class" value="" />
            <jsp:param name="site-url" value= "<script type='text/javascript'>document.write(document.location.href);</script>" />
            <jsp:param name="contact-info" value= "<a href='mailto:glri-database@usgs.gov?subject=GLRI AFINCH Mapper Comments' title='Contact Email'>GLRI Help</a>" />
        </jsp:include>
        <form id="download_form" style="display:none;" action="export" method="post" target="download_iframe">
            <input id="filename_value" name="filename" type="text" value=""/>
            <input id="type_value" name="type" type="text" value=""/>
            <input id="data_value" name="data" type="text" value=""/>
            <input type ="submit"/>
        </form>
        <iframe name="download_iframe" id="download" style="display: none;"></iframe>
    </body>
</html>
