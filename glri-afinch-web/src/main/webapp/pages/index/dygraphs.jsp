<%
	boolean isDebug = Boolean.parseBoolean(request.getParameter("debug-qualifier"));
	String debugPath = isDebug ? "lib/" : "";
    String debug = isDebug ? "dev" : "combined";
%>
<script type="text/javascript" src="${param['relPath']}js/dygraphs/<%= debugPath %>dygraph-<%= debug %>.js"></script>