
<%
    String debug = Boolean.parseBoolean(request.getParameter("debug-qualifier")) ? "/lib" : "";
%>
<link rel="stylesheet" type="text/css" href="${param['relPath']}js/gxp/theme/all.css" />
<%-- <script type="text/javascript" src="${param['relPath']}js/geoext<%= debug %>/GeoExt.js"></script> --%>
<script type="text/javascript" src="${param['relPath']}js/gxp/lib/loader.js"></script>