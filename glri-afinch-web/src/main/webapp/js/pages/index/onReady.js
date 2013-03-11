if (Ext.isIE) { // http://www.mail-archive.com/users@openlayers.org/msg01838.html
    document.namespaces;
}

Ext.onReady(function() {
    initializeLogging({
        LOG4JS_LOG_THRESHOLD: CONFIG.LOG4JS_LOG_THRESHOLD
    });
    LOG.info('onReady.js::Logging Initialized');

    initializeAjax();
    LOG.info('onReady.js::AJAX Initialized');

    initializeQuickTips();
    LOG.info('onReady.js::Quick Tips Initialized');

    initializeNotification();
    LOG.info('onReady.js::Notifications Initialized');

    CONFIG.mapPanel = new AFINCH.MapPanel({
        region: 'center'
    });

    var headerPanel = new Ext.Panel({
        id: 'header-panel',
        region: 'north',
        height: 'auto',
        border: false,
        autoShow: true,
        contentEl: 'usgs-header-panel'
    });
    var footerPanel = new Ext.Panel({
        id: 'footer-panel',
        region: 'south',
        height: 'auto',
        border: false,
        autoShow: true,
        contentEl: 'usgs-footer-panel'
    });

    var bodyPanel = new Ext.Panel({
        region: 'center',
        border: false,
        layout: 'border',
        autoShow: true,
        items: [
            CONFIG.mapPanel
        ]
    });

    VIEWPORT = new Ext.Viewport({
        renderTo: document.body,
        layout: 'border',
        items: [
            headerPanel,
            bodyPanel,
            footerPanel
        ]
    });
    
});

function initializeAjax() {

    Ext.Ajax.addEvents(
            "ajax-request-firing",
            "ajax-requests-complete",
            "ajax-request-exception"
            );

    Ext.Ajax.on('beforerequest', function(connection, options) {
        document.body.style.cursor = 'wait';
        CONFIG.mapPanel.map.div.style.cursor = 'wait'
        if (!Ext.Ajax.isLoading()) {
            Ext.Ajax.fireEvent('ajax-request-firing',
                    {
                        connection: connection,
                        options: options
                    });
        }
    }, this);

    Ext.Ajax.on('requestcomplete', function(connection, response, options) {
        document.body.style.cursor = 'default';
        CONFIG.mapPanel.map.div.style.cursor = 'default'
        if (!Ext.Ajax.isLoading()) {
            Ext.Ajax.fireEvent('ajax-requests-complete',
                    {
                        connection: connection,
                        response: response,
                        options: options
                    });
        }
    }, this);

    Ext.Ajax.on('requestexception', function(connection, response, options) {
        LOG.error(response);
        document.body.style.cursor = 'default';
        CONFIG.mapPanel.map.div.style.cursor = 'default'
        if (!Ext.Ajax.isLoading()) {
            Ext.Ajax.fireEvent('ajax-request-exception',
                    {
                        connection: connection,
                        response: response,
                        options: options
                    });
        }
    }, this);
}

function initializeQuickTips() {
    Ext.QuickTips.init();

    Ext.apply(Ext.QuickTips.getQuickTip(), {
        maxWidth: 200,
        minWidth: 100,
        showDelay: 50, // Show 50ms after entering target
        dismissDelay: 0,
        trackMouse: true
    });
}
