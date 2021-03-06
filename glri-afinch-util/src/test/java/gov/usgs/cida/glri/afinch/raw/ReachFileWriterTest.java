package gov.usgs.cida.glri.afinch.raw;

import java.io.File;
import java.nio.file.Files;
import java.text.DecimalFormat;
import org.junit.After;
import static org.junit.Assert.*;
import org.junit.Before;
import org.junit.Test;
import java.util.Iterator;
import java.util.Map;
import java.util.NavigableSet;

/**
 *
 * @author eeverman
 */
public class ReachFileWriterTest {
	
	final String SMALL_1951_PATH = "smallSample1951.csv";
	final String SMALL_1952_PATH = "smallSample1952.csv";
	final String NAN_1951_PATH = "smallSampleWithNaN1951.csv";	//First value is 'NaN'
	
	File small1951File;
	File small1952File;
	File nan1951File;
	
	public ReachFileWriterTest() {
	}
	
	
	@Before
	public void setUp() throws Exception {
		small1951File = new File(ReachFileWriterTest.class.getClassLoader().getResource(SMALL_1951_PATH).toURI());
		small1952File = new File(ReachFileWriterTest.class.getClassLoader().getResource(SMALL_1952_PATH).toURI());
		nan1951File = new File(FileIngestorTest.class.getClassLoader().getResource(NAN_1951_PATH).toURI());
	}
	
	@After
	public void tearDown() {

	}
	
	
	@Test
	public void readSomeValuesFromSample1951and1952() throws Exception {
		ReachMap dataSet = new ReachMap("ComID", "QAccCon", "QAccWua");
		FileIngestor fin1951 = new FileIngestor(small1951File, dataSet, 1951);
		FileIngestor fin1952 = new FileIngestor(small1952File, dataSet, 1952);
		
		fin1951.call();
		fin1952.call();
		
		
		
		File dir = Files.createTempDirectory("ReachFileWriterTest").toFile();
		
		NavigableSet<Long> set = dataSet.keySet();
		
		for (Long id : set) {
			Reach r = dataSet.get(id);
			ReachWriter w = new ReachWriter(dir, r, "DateTime", ReachWriter.DEFAULT_DATE_FORMAT, ReachWriter.DEFAULT_NUMBER_FORMAT, false);
			w.call();
		}
		
		System.out.println("Write files to: " + dir.getAbsoluteFile());
	}
	
	@Test
	public void readSomeValuesWithNanFromSample() throws Exception {
		ReachMap dataSet = new ReachMap("ComID", "QAccCon");
		FileIngestor fin1951 = new FileIngestor(nan1951File, dataSet, 1951);
		
		fin1951.call();
		
		File dir = Files.createTempDirectory("ReachFileWriterTest").toFile();
		
		NavigableSet<Long> set = dataSet.keySet();
		
		for (Long id : set) {
			Reach r = dataSet.get(id);
			ReachWriter w = new ReachWriter(dir, r, "DateTime", ReachWriter.DEFAULT_DATE_FORMAT, ReachWriter.DEFAULT_NUMBER_FORMAT, false);
			w.call();
		}
		
		System.out.println("Write files to: " + dir.getAbsoluteFile());
	}
	
	@Test
	public void verifyNaNBehavior() throws Exception {
		DecimalFormat df = new DecimalFormat("#.###;-#.###");

		//assertTrue(Double.isNaN(df.parse("NaN").doubleValue()));
		
		String nan = df.format(Double.NaN);
		assertTrue(Double.isNaN(df.parse(nan).doubleValue()));
		
	}
}
