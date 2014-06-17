package gov.usgs.cida.glri.afinch.netcdf;

import com.google.common.collect.Maps;
import gov.usgs.cida.glri.afinch.raw.Reach;
import gov.usgs.cida.glri.afinch.raw.ReachMap;
import gov.usgs.cida.netcdf.dsg.Station;
import gov.usgs.cida.watersmart.parse.StationLookup;
import java.io.File;
import java.io.IOException;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import javax.xml.stream.XMLStreamException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Jordan Walker <jiwalker@usgs.gov>
 */
public class AFINCHReachLookup implements StationLookup {
    private static final Logger log = LoggerFactory.getLogger(AFINCHReachLookup.class);
	
    private final LinkedHashMap<String, Station> stationLookupTable;
    
    public AFINCHReachLookup(ReachMap reachMap) throws IOException, XMLStreamException {

		stationLookupTable = Maps.newLinkedHashMap();
        float lat = 0f;
        float lon = 0f;

        int index = 0;

        for (Reach reach : reachMap.values()) {

			stationLookupTable.put(reach.getId().toString(), new Station(lat, lon, reach.getId().toString(), index));
			
			index++;
        }
    }
	
    public AFINCHReachLookup(Collection<File> allFiles, Pattern idFromFilenameRegexExtractor) throws Exception {

		stationLookupTable = Maps.newLinkedHashMap();
        float lat = 0f;
        float lon = 0f;

        int index = 0;

        for (File f : allFiles) {

			String name = f.getName();
			Matcher matcher = idFromFilenameRegexExtractor.matcher(name);
			matcher.find();
			String idStr = matcher.group(1);
			
			if (stationLookupTable.containsKey(idStr)) {
				throw new Exception("This shouldn't happen:  The station id '" + 
						idStr + "' extracted from the file name '" + name + 
						"' matches a station ID already in the stationLookupTable.");
			}
			
			stationLookupTable.put(idStr, new Station(lat, lon, idStr, index));
			
			index++;
        }
		
		log.debug("Created a station ID lookup based on file names with " + index + " unique entries.");
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
        } else {
			log.error("Unable to find reach {} among the source file names - what gives?", stationName);
			return null;
		}
    }
    
}
