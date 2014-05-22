package gov.usgs.cida.glri.afinch.netcdf;

import com.ctc.wstx.stax.WstxInputFactory;
import com.google.common.collect.Maps;
import gov.usgs.cida.glri.afinch.raw.Reach;
import gov.usgs.cida.glri.afinch.raw.ReachMap;
import gov.usgs.cida.netcdf.dsg.Station;
import gov.usgs.cida.watersmart.parse.StationLookup;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import javax.xml.stream.XMLInputFactory;
import static javax.xml.stream.XMLStreamConstants.END_ELEMENT;
import static javax.xml.stream.XMLStreamConstants.START_ELEMENT;
import javax.xml.stream.XMLStreamException;
import javax.xml.stream.XMLStreamReader;
import org.apache.commons.httpclient.HttpClient;
import org.apache.commons.httpclient.HttpStatus;
import org.apache.commons.httpclient.URI;
import org.apache.commons.httpclient.methods.GetMethod;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Jordan Walker <jiwalker@usgs.gov>
 */
public class ReachMapStationLookup implements StationLookup {

    private static final Logger LOG = LoggerFactory.getLogger(ReachMapStationLookup.class);
    private final LinkedHashMap<String, Station> stationLookupTable;
    
    public ReachMapStationLookup(ReachMap reachMap) throws IOException, XMLStreamException {

		stationLookupTable = Maps.newLinkedHashMap();
        float lat = 0f;
        float lon = 0f;

        int index = 0;

        for (Reach reach : reachMap.values()) {

			stationLookupTable.put(reach.getId().toString(), new Station(lat, lon, reach.getId().toString(), index));
			
			index++;
        }
    }
	
    public ReachMapStationLookup(Collection<File> allFiles, Pattern idFromFilenameRegexExtractor) throws Exception {

		stationLookupTable = Maps.newLinkedHashMap();
        float lat = 0f;
        float lon = 0f;

        int index = 0;

        for (File f : allFiles) {

			String name = f.getName();
			Matcher matcher = idFromFilenameRegexExtractor.matcher(name);
			matcher.find();
			String idStr = matcher.group(1);
				
			stationLookupTable.put(idStr, new Station(lat, lon, idStr, index));
			
			index++;
        }
    }

    @Override
    public Collection<Station> getStations() {
        return stationLookupTable.values();
    }

   /**
     * Looks up the station id by station name
     *
     * @param stationName name or number of station
     * @return index of station for referencing in NetCDF file, -1 if not found
     */
    @Override
    public int lookup(String stationName) {
        Station station = this.get(stationName);
        if (null != station) {
            return station.index;
        }
        else {
            return -1;
        }
    }

    /**
     * Returns station object
     *
     * @param stationName station name or number
     * @return Station or null if not found
     */
    @Override
    public Station get(String stationName) {
        Station station = stationLookupTable.get(stationName);
        if (null != station) {
            return station;
        }
        // sometimes leading zero may be dropped
        station = stationLookupTable.get("0" + stationName);
        return station;
    }
    
}
