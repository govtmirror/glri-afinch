//this file duplicates (evil) part of the contents of "log4javascript.jsp""
//@todo split the jsp into multiple files so that functionality can be shared

    var LOG;
    /**
     * http://log4javascript.org/
     */
    function initializeLogging(params) {
		if (!params) {
			params = {};
		}
        LOG = log4javascript.getLogger();
    
        var LOG4JS_PATTERN_LAYOUT = params.LOG4JS_PATTERN_LAYOUT || "%rms - %-5p - %m%n";
        var LOG4JS_LOG_THRESHOLD = params.LOG4JS_LOG_THRESHOLD || "info"; // info will be default
    
        var appender = new log4javascript.BrowserConsoleAppender();
    
        appender.setLayout(new log4javascript.PatternLayout(LOG4JS_PATTERN_LAYOUT));
        var logLevel;
		switch (LOG4JS_LOG_THRESHOLD) {
			case "trace" :
				logLevel = log4javascript.Level.TRACE;
				break;
			case "debug" :
				logLevel = log4javascript.Level.DEBUG;
				break;
			case "info" :
				logLevel = log4javascript.Level.INFO;
				break; 
			case "warn" :
				logLevel = log4javascript.Level.WARN;
				break;
			case "error" :
				logLevel = log4javascript.Level.ERROR;
				break; 
			case "fatal" :
				logLevel = log4javascript.Level.FATAL;
				break; 
			case "off" :
				logLevel = log4javascript.Level.OFF;
				break; 
			default:
				logLevel = log4javascript.Level.INFO;
		}
        appender.setThreshold(logLevel);
    
        LOG.addAppender(appender);
    
        LOG.info('Log4javascript v.'+log4javascript.version+' initialized.');
        LOG.info('Logging Appender Pattern Set to: ' + LOG4JS_PATTERN_LAYOUT);
        LOG.info('Logging Threshold Set To: ' + logLevel);
    };
