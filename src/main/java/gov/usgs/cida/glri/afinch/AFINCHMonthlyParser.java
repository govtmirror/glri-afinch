package gov.usgs.cida.glri.afinch;

import gov.usgs.cida.netcdf.dsg.RecordType;
import gov.usgs.cida.watersmart.parse.StationLookup;
import gov.usgs.cida.watersmart.parse.file.SYEParser;
import java.io.IOException;
import java.io.InputStream;
import java.util.regex.Pattern;
import javax.xml.stream.XMLStreamException;
import org.joda.time.Months;
import org.joda.time.ReadableInstant;
import org.joda.time.format.DateTimeFormatter;
import org.joda.time.format.DateTimeFormatterBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Jordan Walker <jiwalker@usgs.gov>
 */
public class AFINCHMonthlyParser extends SYEParser {
    
    private static final Logger LOG = LoggerFactory.getLogger(AFINCHMonthlyParser.class);
    
    private static final Pattern headerLinePattern = Pattern.compile("^DateTime((?:,\\w+)+)$");
    private static final Pattern headerVariablePattern = Pattern.compile(",(\\w+)");
    
    private static final Pattern stationIdPattern = Pattern.compile("^(?:[^/]*/)*(\\d+)\\.txt$");
    
    private static final Pattern dataLinePattern = Pattern.compile("^(\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}UTC)((?:,[^,]+)+)$");
    private static final Pattern dataValuePattern = Pattern.compile(",([^,]+)");

    //public static final DateTimeFormatter inputDateFormatter = ISODateTimeFormat.dateTimeParser();
    public static final DateTimeFormatter inputDateFormatter = new DateTimeFormatterBuilder()
            .appendYear(4,4)
            .appendLiteral('-')
            .appendMonthOfYear(2)
            .appendLiteral('-')
            .appendDayOfMonth(2)
            .appendLiteral('T')
            .appendHourOfDay(2)
            .appendLiteral(':')
            .appendMinuteOfHour(2)
            .appendLiteral(':')
            .appendSecondOfMinute(2)
            .appendLiteral("UTC")
            .toFormatter()
            .withZoneUTC();
        
    private String filename;
    
    public AFINCHMonthlyParser(InputStream is, String filename, StationLookup lookerUpper) throws IOException, XMLStreamException {
        super(is, filename, lookerUpper);
    }

    @Override
    protected Pattern getDataLinePattern() {
        return dataLinePattern;
    }
    
    @Override
    protected Pattern getDataValuePattern() {
        return dataValuePattern;
    }

    @Override
    protected Pattern getHeaderLinePattern() {
        return headerLinePattern;
    }

    @Override
    protected DateTimeFormatter getInputDateFormatter() {
        return inputDateFormatter;
    }
    
    @Override
    protected Pattern getHeaderVariablePattern() {
        return headerVariablePattern;
    }
    
    @Override
    protected Pattern getStationIdPattern() {
        return stationIdPattern;
    }
    
    @Override
    protected int calculateTimeOffset(ReadableInstant time) {
        // may want to support other units (hours, months, years, etc)
        int months = Months.monthsBetween(this.baseDate, time).getMonths();
        return months;
    }
    
    @Override
    protected RecordType getRecordType() {
        RecordType recordType = new RecordType("months since " + baseDate.toString());
        return recordType;
    }
}
