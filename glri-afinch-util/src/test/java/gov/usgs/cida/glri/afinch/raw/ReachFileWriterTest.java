package gov.usgs.cida.glri.afinch.raw;

import java.io.File;
import java.nio.file.Files;
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
	
	File small1951File;
	File small1952File;
	
	public ReachFileWriterTest() {
	}
	
	
	@Before
	public void setUp() throws Exception {
		String fileName = ReachFileWriterTest.class.getClassLoader().getResource(SMALL_1951_PATH).getFile();
		small1951File = new File(fileName);
		fileName = ReachFileWriterTest.class.getClassLoader().getResource(SMALL_1952_PATH).getFile();
		small1952File = new File(fileName);
	}
	
	@After
	public void tearDown() {

	}
	
	
	@Test
	public void readSomeValuesFromSample1951and1952() throws Exception {
		PerReachDataset dataSet = new PerReachDataset("ComID", "QAccCon", "QAccWua");
		FileIngestor fin1951 = new FileIngestor(small1951File, dataSet, 1951);
		FileIngestor fin1952 = new FileIngestor(small1952File, dataSet, 1952);
		
		fin1951.call();
		fin1952.call();
		
		
		
		File dir = Files.createTempDirectory("ReachFileWriterTest").toFile();
		
		NavigableSet<Long> set = dataSet.keySet();
		
		for (Long id : set) {
			Reach r = dataSet.get(id);
			ReachFileWriter w = new ReachFileWriter(dir, r, "DateTime", ReachFileWriter.DEFAULT_DATE_FORMAT, ReachFileWriter.DEFAULT_NUMBER_FORMAT, false);
			w.write();
		}
		
		System.out.println("Write files to: " + dir.getAbsoluteFile());
	}
	
}
