package gov.usgs.cida.glri.afinch;

import com.ctc.wstx.stax.WstxInputFactory;
import com.google.common.collect.Maps;
import gov.usgs.cida.netcdf.dsg.Station;
import gov.usgs.cida.watersmart.parse.StationLookup;
import java.io.IOException;
import java.io.InputStream;
import java.util.Collection;
import java.util.LinkedHashMap;
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
public class DummyStationLookup implements StationLookup {

    private static final Logger LOG = LoggerFactory.getLogger(DummyStationLookup.class);
    private final LinkedHashMap<String, Station> stationLookupTable = Maps.newLinkedHashMap();
    
    public DummyStationLookup(String wfsUrl, String typeName, String nameAttr) throws IOException, XMLStreamException {
        String url = wfsUrl + "?service=WFS&version=1.1.0&request=GetFeature&typeName=" + typeName + "&outputFormat=text/xml; subtype=gml/3.2";

        HttpClient client = new HttpClient();
        GetMethod get = new GetMethod();
        URI uri = new URI(url, false);
        get.setURI(uri);
        int statusCode = client.executeMethod(get);
        if (statusCode != HttpStatus.SC_OK) {
            LOG.error("Bad request to wfs: " + wfsUrl);
        }
        InputStream response = get.getResponseBodyAsStream();

        XMLInputFactory factory = WstxInputFactory.newFactory();
        XMLStreamReader reader = factory.createXMLStreamReader(response);

        float lat = 0f;
        float lon = 0f;
        String stationId = null;

        // TODO not doing namespacing for now, might be important at some point
        int index = 0;
        while (reader.hasNext()) {
            int code = reader.next();
            if (code == START_ELEMENT
                && reader.getName().getLocalPart().equals("member")) {
                stationId = null;
            }
            else if (code == END_ELEMENT
                     && reader.getName().getLocalPart().equals("member")
                     && stationId != null) {
                stationLookupTable.put(stationId, new Station(lat, lon,
                                                              stationId, index));
                index++;
            }
            else if (code == START_ELEMENT
                     && reader.getName().getLocalPart().equals(nameAttr)) {
                stationId = reader.getElementText();
            }
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
