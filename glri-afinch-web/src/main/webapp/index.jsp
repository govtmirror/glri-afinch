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
            <jsp:param name="shortName" value="GLRI AFINCH WEB" />
            <jsp:param name="title" value="GLRI AFINCH WEB" />
            <jsp:param name="description" value="" />
            <jsp:param name="author" value="Ivan Suftin, Tom Kunicki, Jordan Walker, Carl Schroedl" />
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
            CONFIG.endpoint.rwps = 'rwps/';
            CONFIG.mapLogoUrl = 'images/NHDPlus_logo.png';

        </script>

        <script type="text/javascript" src="js/Map/map.js"></script>
        <script type="text/javascript" src="js/Data/StatsStore.js"></script>
        <script type="text/javascript" src="js/Util/Util.js"></script>
        <script type="text/javascript" src="js/Ui/StatsGridPanel.js"></script>
        <script type="text/javascript" src="js/Ui/StatsGraphPanel.js"></script>
        <script type="text/javascript" src="js/Ui/DataDisplayPanel.js"></script>
        <script type="text/javascript" src="js/pages/index/onReady.js"></script>
    </head>
    <body>
        <jsp:include page="template/USGSHeader.jsp">
            <jsp:param name="relPath" value="" />
            <jsp:param name="header-class" value="" />
            <jsp:param name="site-title" value="GLRI AFINCH WEB" />
        </jsp:include>
        <div class="application-body">
        </div>
        <jsp:include page="template/USGSFooter.jsp">
            <jsp:param name="relPath" value="" />
            <jsp:param name="header-class" value="" />
            <jsp:param name="site-url" value="" />
            <jsp:param name="contact-info" value="" />
        </jsp:include>
    </body>
</html>
