package gov.usgs.cida.glri.afinch.raw;

import java.io.File;
import org.junit.After;
import static org.junit.Assert.*;
import org.junit.Before;
import org.junit.Test;
import java.util.Iterator;
import java.util.Map;

/**
 *
 * @author eeverman
 */
public class FileIngestorTest {
	
	final String SMALL_1951_PATH = "smallSample1951.csv";
	final String SMALL_1952_PATH = "smallSample1952.csv";
	
	File small1951File;
	File small1952File;
	
	public FileIngestorTest() {
	}
	
	
	@Before
	public void setUp() throws Exception {
		String fileName = FileIngestorTest.class.getClassLoader().getResource(SMALL_1951_PATH).getFile();
		small1951File = new File(fileName);
		fileName = FileIngestorTest.class.getClassLoader().getResource(SMALL_1952_PATH).getFile();
		small1952File = new File(fileName);
	}
	
	@After
	public void tearDown() {

	}
	
	@Test
	public void readSomeValuesFromSample1951() throws Exception {
		ReachMap dataSet = new ReachMap("ComID", "QAccCon", "QAccWua");
		FileIngestor fin = new FileIngestor(small1951File, dataSet, 1951);
		
		fin.call();
		
		Reach r1754888 = dataSet.get(1754888L);
		Reach r1754890 = dataSet.get(1754890L);
		Reach r1754896 = dataSet.get(1754896L);
		
		
		assertEquals(3, dataSet.size());
		
		//
		//First reach
		
		//headers
		assertEquals(1754888L, r1754888.getId().longValue());
		assertEquals("QAccCon", r1754888.getHeaders()[0]);
		assertEquals("QAccWua", r1754888.getHeaders()[1]);
		assertEquals(2, r1754888.getHeaders().length);
		
		Iterator<Map.Entry<Long, double[]>> di = r1754888.iterator();

		//First entry (in sorted order)
		Map.Entry<Long, double[]> entry = di.next();
		assertEquals(new Long(WaterMonth.OCT.getCalendarTimeInMillis(1951)), entry.getKey());
		assertEquals(new Double(1.881797d), entry.getValue()[0], .000001d);
		assertEquals(new Double(1.881797d), entry.getValue()[1], .000001d);
		
		entry = di.next();
		assertEquals(new Long(WaterMonth.NOV.getCalendarTimeInMillis(1951)), entry.getKey());
		assertEquals(new Double(2.338974d), entry.getValue()[0], .000001d);
		assertEquals(new Double(2.338974d), entry.getValue()[1], .000001d);
		
		entry = di.next();
		assertEquals(new Long(WaterMonth.DEC.getCalendarTimeInMillis(1951)), entry.getKey());
		assertEquals(new Double(1.086326d), entry.getValue()[0], .000001d);
		assertEquals(new Double(1.086326d), entry.getValue()[1], .000001d);
		
		entry = di.next();
		assertEquals(new Long(WaterMonth.JAN.getCalendarTimeInMillis(1951)), entry.getKey());
		assertEquals(new Double(.998462d), entry.getValue()[0], .000001d);
		assertEquals(new Double(.998462d), entry.getValue()[1], .000001d);
		
		//FLIP THROUGH A FEW MONTHS
		entry = di.next();
		assertEquals(new Long(WaterMonth.FEB.getCalendarTimeInMillis(1951)), entry.getKey());
		entry = di.next();
		assertEquals(new Long(WaterMonth.MAR.getCalendarTimeInMillis(1951)), entry.getKey());
		entry = di.next();
		assertEquals(new Long(WaterMonth.APR.getCalendarTimeInMillis(1951)), entry.getKey());
		entry = di.next();
		assertEquals(new Long(WaterMonth.MAY.getCalendarTimeInMillis(1951)), entry.getKey());
		entry = di.next();
		assertEquals(new Long(WaterMonth.JUN.getCalendarTimeInMillis(1951)), entry.getKey());
		entry = di.next();
		assertEquals(new Long(WaterMonth.JUL.getCalendarTimeInMillis(1951)), entry.getKey());
		entry = di.next();
		assertEquals(new Long(WaterMonth.AUG.getCalendarTimeInMillis(1951)), entry.getKey());
		
		//TEST THE LAST MONTH FROM THIS FILE
		entry = di.next();
		assertEquals(new Long(WaterMonth.SEP.getCalendarTimeInMillis(1951)), entry.getKey());
		assertEquals(new Double(3.143086d), entry.getValue()[0], .000001d);
		assertEquals(new Double(3.143086d), entry.getValue()[1], .000001d);

	}
	
	@Test
	public void readSomeValuesFromSample1951and1952() throws Exception {
		ReachMap dataSet = new ReachMap("ComID", "QAccCon", "QAccWua");
		FileIngestor fin1951 = new FileIngestor(small1951File, dataSet, 1951);
		FileIngestor fin1952 = new FileIngestor(small1952File, dataSet, 1952);
		
		fin1951.call();
		fin1952.call();
		
		Reach r1754888 = dataSet.get(1754888L);
		Reach r1754890 = dataSet.get(1754890L);
		Reach r1754896 = dataSet.get(1754896L);
		Reach r1754914 = dataSet.get(1754914L);
		
		
		assertEquals(4, dataSet.size());
		
		//
		//First reach
		
		//headers
		assertEquals(1754888L, r1754888.getId().longValue());
		assertEquals("QAccCon", r1754888.getHeaders()[0]);
		assertEquals("QAccWua", r1754888.getHeaders()[1]);
		assertEquals(2, r1754888.getHeaders().length);
		
		Iterator<Map.Entry<Long, double[]>> di = r1754888.iterator();

		//First entry (in sorted order)
		Map.Entry<Long, double[]> entry = di.next();
		assertEquals(new Long(WaterMonth.OCT.getCalendarTimeInMillis(1951)), entry.getKey());
		assertEquals(new Double(1.881797d), entry.getValue()[0], .000001d);
		assertEquals(new Double(1.881797d), entry.getValue()[1], .000001d);
		
		//FLIP THROUGH A FEW MONTHS
		entry = di.next();
		assertEquals(new Long(WaterMonth.NOV.getCalendarTimeInMillis(1951)), entry.getKey());
		entry = di.next();
		assertEquals(new Long(WaterMonth.DEC.getCalendarTimeInMillis(1951)), entry.getKey());
		entry = di.next();
		assertEquals(new Long(WaterMonth.JAN.getCalendarTimeInMillis(1951)), entry.getKey());
		entry = di.next();
		assertEquals(new Long(WaterMonth.FEB.getCalendarTimeInMillis(1951)), entry.getKey());
		entry = di.next();
		assertEquals(new Long(WaterMonth.MAR.getCalendarTimeInMillis(1951)), entry.getKey());
		entry = di.next();
		assertEquals(new Long(WaterMonth.APR.getCalendarTimeInMillis(1951)), entry.getKey());
		entry = di.next();
		assertEquals(new Long(WaterMonth.MAY.getCalendarTimeInMillis(1951)), entry.getKey());
		entry = di.next();
		assertEquals(new Long(WaterMonth.JUN.getCalendarTimeInMillis(1951)), entry.getKey());
		entry = di.next();
		assertEquals(new Long(WaterMonth.JUL.getCalendarTimeInMillis(1951)), entry.getKey());
		entry = di.next();
		assertEquals(new Long(WaterMonth.AUG.getCalendarTimeInMillis(1951)), entry.getKey());
		entry = di.next();
		assertEquals(new Long(WaterMonth.SEP.getCalendarTimeInMillis(1951)), entry.getKey());

		//This next entry for WY 1952 comes from the 2nd file
		entry = di.next();
		assertEquals(new Long(WaterMonth.OCT.getCalendarTimeInMillis(1952)), entry.getKey());
		assertEquals(new Double(.461351d), entry.getValue()[0], .000001d);
		assertEquals(new Double(99.999d), entry.getValue()[1], .000001d);	//Fake value thrown in file so it is distinct
		
		//FLIP THROUGH A FEW MONTHS
		entry = di.next();
		assertEquals(new Long(WaterMonth.NOV.getCalendarTimeInMillis(1952)), entry.getKey());
		entry = di.next();
		assertEquals(new Long(WaterMonth.DEC.getCalendarTimeInMillis(1952)), entry.getKey());
		entry = di.next();
		assertEquals(new Long(WaterMonth.JAN.getCalendarTimeInMillis(1952)), entry.getKey());
		entry = di.next();
		assertEquals(new Long(WaterMonth.FEB.getCalendarTimeInMillis(1952)), entry.getKey());
		entry = di.next();
		assertEquals(new Long(WaterMonth.MAR.getCalendarTimeInMillis(1952)), entry.getKey());
		entry = di.next();
		assertEquals(new Long(WaterMonth.APR.getCalendarTimeInMillis(1952)), entry.getKey());
		entry = di.next();
		assertEquals(new Long(WaterMonth.MAY.getCalendarTimeInMillis(1952)), entry.getKey());
		entry = di.next();
		assertEquals(new Long(WaterMonth.JUN.getCalendarTimeInMillis(1952)), entry.getKey());
		entry = di.next();
		assertEquals(new Long(WaterMonth.JUL.getCalendarTimeInMillis(1952)), entry.getKey());
		entry = di.next();
		assertEquals(new Long(WaterMonth.AUG.getCalendarTimeInMillis(1952)), entry.getKey());
		
		//Check the last value in 1952
		entry = di.next();
		assertEquals(new Long(WaterMonth.SEP.getCalendarTimeInMillis(1952)), entry.getKey());
		assertEquals(new Double(.785572d), entry.getValue()[0], .000001d);
		assertEquals(new Double(11.111d), entry.getValue()[1], .000001d);	//Fake value thrown in file so it is distinct
		
		assertFalse(di.hasNext());	//all done
		
		
		//
		//
		//Check some values in the reach that is only present in the 1952 file
		//headers
		assertEquals(1754914L, r1754914.getId().longValue());
		assertEquals("QAccCon", r1754914.getHeaders()[0]);
		assertEquals("QAccWua", r1754914.getHeaders()[1]);
		assertEquals(2, r1754914.getHeaders().length);
		
		di = r1754914.iterator();

		//First entry (in sorted order)
		entry = di.next();
		assertEquals(new Long(WaterMonth.OCT.getCalendarTimeInMillis(1952)), entry.getKey());
		assertEquals(new Double(1.740307d), entry.getValue()[0], .000001d);
		assertEquals(new Double(555.555d), entry.getValue()[1], .000001d);	//fake distinct value
		
		//FLIP THROUGH A FEW MONTHS
		entry = di.next();
		assertEquals(new Long(WaterMonth.NOV.getCalendarTimeInMillis(1952)), entry.getKey());
		entry = di.next();
		assertEquals(new Long(WaterMonth.DEC.getCalendarTimeInMillis(1952)), entry.getKey());
		entry = di.next();
		assertEquals(new Long(WaterMonth.JAN.getCalendarTimeInMillis(1952)), entry.getKey());
		entry = di.next();
		assertEquals(new Long(WaterMonth.FEB.getCalendarTimeInMillis(1952)), entry.getKey());
		entry = di.next();
		assertEquals(new Long(WaterMonth.MAR.getCalendarTimeInMillis(1952)), entry.getKey());
		entry = di.next();
		assertEquals(new Long(WaterMonth.APR.getCalendarTimeInMillis(1952)), entry.getKey());
		entry = di.next();
		assertEquals(new Long(WaterMonth.MAY.getCalendarTimeInMillis(1952)), entry.getKey());
		entry = di.next();
		assertEquals(new Long(WaterMonth.JUN.getCalendarTimeInMillis(1952)), entry.getKey());
		entry = di.next();
		assertEquals(new Long(WaterMonth.JUL.getCalendarTimeInMillis(1952)), entry.getKey());
		entry = di.next();
		assertEquals(new Long(WaterMonth.AUG.getCalendarTimeInMillis(1952)), entry.getKey());
		
		//Check the last value in 1952
		entry = di.next();
		assertEquals(new Long(WaterMonth.SEP.getCalendarTimeInMillis(1952)), entry.getKey());
		assertEquals(new Double(2.978357d), entry.getValue()[0], .000001d);
		assertEquals(new Double(888.888d), entry.getValue()[1], .000001d);	//Fake value thrown in file so it is distinct
		
		assertFalse(di.hasNext());	//all done
	}
	
	
}
