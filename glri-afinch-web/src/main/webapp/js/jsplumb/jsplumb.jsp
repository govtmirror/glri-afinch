
<%
    String debug = Boolean.parseBoolean(request.getParameter("debug-qualifier")) ? "" : "-min";
%>
<script type="text/javascript" src="${param['relPath']}js/jsplumb/jquery.jsPlumb-1.3.10-all<%= debug %>.js"></script>
