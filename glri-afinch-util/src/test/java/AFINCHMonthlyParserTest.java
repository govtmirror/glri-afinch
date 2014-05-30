


import gov.usgs.cida.glri.afinch.netcdf.AFINCHMonthlyParser;
import gov.usgs.cida.glri.afinch.netcdf.AFINCHReachLookup;
import gov.usgs.cida.glri.afinch.netcdf.DummyStationLookup;
import gov.usgs.cida.netcdf.dsg.Observation;
import gov.usgs.cida.watersmart.parse.StationLookup;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.regex.Pattern;
import javax.xml.stream.XMLStreamException;
import org.apache.commons.io.IOUtils;
import org.junit.BeforeClass;
import org.junit.Ignore;
import org.junit.Test;
import static org.junit.Assert.*;

/**
 *
 * @author Jordan Walker <jiwalker@usgs.gov>
 */
public class AFINCHMonthlyParserTest {

    public AFINCHMonthlyParserTest() {
    }
    
    private static File sampleFile = null;
    
    @BeforeClass
    public static void setupClass() throws Exception {
        sampleFile = new File(AFINCHMonthlyParserTest.class.getClassLoader()
                .getResource("9862573.csv").toURI());
    }

    @Test
    public void testParse() throws IOException, XMLStreamException, Exception {
        InputStream is = new FileInputStream(sampleFile);
		
		ArrayList<File> files = new ArrayList<File>();
		files.add(sampleFile);
		
		AFINCHReachLookup lu = new AFINCHReachLookup(files, Pattern.compile("(\\d+).csv"));

        AFINCHMonthlyParser parser = new AFINCHMonthlyParser(is, sampleFile.getName(), lu);
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
        assertEquals(708, index);
        assertEquals(.324f, value, .0001f);
        IOUtils.closeQuietly(is);
    }
    

}