package gov.usgs.cida.glri.afinch;

import com.google.common.collect.Maps;
import gov.usgs.cida.netcdf.dsg.Observation;
import gov.usgs.cida.netcdf.dsg.RecordType;
import gov.usgs.cida.netcdf.dsg.Station;
import gov.usgs.cida.netcdf.dsg.StationTimeSeriesNetCDFFile;
import gov.usgs.cida.watersmart.common.RunMetadata;
import gov.usgs.cida.watersmart.parse.DSGParser;
import gov.usgs.cida.watersmart.parse.StationLookup;
import java.io.*;
import java.util.Collection;
import java.util.Date;
import java.util.Enumeration;
import java.util.Map;
import java.util.zip.ZipEntry;
import java.util.zip.ZipFile;
import javax.xml.stream.XMLStreamException;
import org.apache.commons.io.IOUtils;

/**
 *
 * @author Jordan Walker <jiwalker@usgs.gov>
 */
public class NetCDFWriter {

    public static void mkNetCDF(String infile, String outfile) throws
            FileNotFoundException, IOException, XMLStreamException {
        File sourceFile = new File(infile);
        File ncFile = new File(outfile);
        
        ZipFile zip = new ZipFile(sourceFile);
        StationTimeSeriesNetCDFFile nc = null;

        Map<String, String> globalAttrs = Maps.newLinkedHashMap();
        globalAttrs.put("title", "AFINCH Monthly Flow");
        globalAttrs.put("summary", "Modeled flow for NHD reaches");
        globalAttrs.put("naming_authority", "gov.usgs.cida");
        globalAttrs.put("cdm_data_type", "Station");
        globalAttrs.put("date_created", (new Date()).toString());
        globalAttrs.put("creator_name", "Howard W Reeves");
        globalAttrs.put("creator_email", "hwreeves@usgs.gov");
        globalAttrs.put("project", "Great Lakes Restoration Initiative");
        globalAttrs.put("processing_level", "Model Results");
        globalAttrs.put("standard_name_vocabulary", RecordType.CF_VER);

        StationLookup lookup = new DummyStationLookup(
                "http://internal.cida.usgs.gov/lkm-geoserver/glri/ows",
                "glri:nhd-flowline",
                "COMID");

        Enumeration<? extends ZipEntry> entries = zip.entries();
        while (entries.hasMoreElements()) {
            ZipEntry entry = entries.nextElement();
            if (!entry.isDirectory()) {
                InputStream inputStream = zip.getInputStream(entry);
                DSGParser dsgParse = new AFINCHMonthlyParser(inputStream,
                                                             entry.getName(),
                                                             lookup);
                RecordType meta = dsgParse.parse();

                // first file sets the rhythm
                if (nc == null) {
                    Collection<Station> stations = lookup.getStations();
                    Station[] stationArray = stations.toArray(
                            new Station[stations.size()]);

                    nc = new StationTimeSeriesNetCDFFile(ncFile, meta,
                                                         globalAttrs, true,
                                                         stationArray);
                }
                while (dsgParse.hasNext()) {
                    Observation ob = dsgParse.next();
                    if (null != ob) {
                        nc.putObservation(ob);
                    }
                    else {
                        IOUtils.closeQuietly(inputStream);
                        break;
                    }
                }
                IOUtils.closeQuietly(inputStream);
            }
        }
        
        try {
            zip.close(); 
        } catch (IOException ex) {
            // ignore
        }
        IOUtils.closeQuietly(nc);
    }
}
