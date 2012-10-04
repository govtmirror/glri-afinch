
package gov.usgs.cida.glri.afinch;

import gov.usgs.cida.netcdf.dsg.Observation;
import gov.usgs.cida.watersmart.parse.StationLookup;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import javax.xml.stream.XMLStreamException;
import org.apache.commons.io.IOUtils;
import static org.hamcrest.CoreMatchers.is;
import static org.hamcrest.MatcherAssert.assertThat;
import org.junit.BeforeClass;
import org.junit.Ignore;
import org.junit.Test;

/**
 *
 * @author Jordan Walker <jiwalker@usgs.gov>
 */
public class AFINCHMonthlyParserTest {

    public AFINCHMonthlyParserTest() {
    }
    
    private static File sampleFile = null;
    
    @BeforeClass
    public static void setupClass() throws IOException {
        sampleFile = new File(AFINCHMonthlyParserTest.class.getClassLoader()
                .getResource("gov/usgs/cida/glri/afinch/9862573.txt")
                .getFile());
    }

    // takes too long
    @Test
    @Ignore
    public void testParse() throws IOException, XMLStreamException {
        InputStream is = new FileInputStream(sampleFile);
        StationLookup lookup = new DummyStationLookup(
                "http://internal.cida.usgs.gov/lkm-geoserver/glri/ows",
                "glri:nhd-flowline",
                "COMID");
        AFINCHMonthlyParser parser = new AFINCHMonthlyParser(is, sampleFile.getName(), lookup);
        parser.parse();
        int index = 0;
        float value = 0f;
        while (parser.hasNext()) {
            Observation next = parser.next();
            if (next != null) {
                value = (Float) next.values[0];
                index++;
            }
        }
        assertThat(index, is(707));
        assertThat(value, is(1.25f));
        IOUtils.closeQuietly(is);
    }
    

}