package gov.usgs.cida.glri.afinch.raw;

import java.util.Iterator;
import java.util.Map;
import java.util.Set;
import static org.junit.Assert.*;
import org.junit.Test;

/**
 *
 * @author eeverman
 */
public class PerReachDatasetTest {
	
	private static final String FILE1 = "fake_file_name1.csv";
	private static final String FILE2 = "fake_file_name2.csv";
	private static final String FILE3 = "fake_file_name3.csv";
	private static final String FILE4 = "fake_file_name4.csv";
	
	@Test
	public void simpleTest() throws Exception {
		ReachMap dataset = new ReachMap("ComID", "col1", "col2");
		
		//All different stations at a particular time '100000'
		dataset.put(1000L, 100000L, FILE1, 1000.1d, 1000.2d);
		dataset.put(999L, 100000L, FILE1, 999.1d, 999.2d);
		dataset.put(1001L, 100000L, FILE1, 1001.1d, 1001.2d);
		
		//All different stations at a particular time '110000'
		dataset.put(1000L, 110000L, FILE1, 1000.11d, 1000.22d);
		dataset.put(999L, 110000L, FILE1, 999.11d, 999.22d);
		dataset.put(1001L, 110000L, FILE1, 1001.11d, 1001.22d);
		
		//All different stations at a particular time '90000'
		dataset.put(1000L, 90000L, FILE1, 1000.111d, 1000.222d);
		dataset.put(999L, 90000L, FILE1, 999.111d, 999.222d);
		dataset.put(1001L, 90000L, FILE1, 1001.111d, 1001.222d);
		
		
		assertEquals(3, dataset.size());	//should have three reaches
		
		Reach reach999 = dataset.get(999L);
		Reach reach1000 = dataset.get(1000L);
		Reach reach1001 = dataset.get(1001L);
		
		//
		//Look at reach999
		//The iterator of this set should be sorted and backed by the map
		Iterator<Map.Entry<Long, double[]>> di = reach999.iterator();
		
		//First entry (in sorted order)
		Map.Entry<Long, double[]> entry = di.next();
		assertEquals(new Long(90000L), entry.getKey());
		assertEquals(999.111d, entry.getValue()[0], .000001d);
		assertEquals(999.222d, entry.getValue()[1], .000001d);
		
		//2nd entry (in sorted order)
		entry = di.next();
		assertEquals(new Long(100000L), entry.getKey());
		assertEquals(999.1d, entry.getValue()[0], .000001d);
		assertEquals(999.2d, entry.getValue()[1], .000001d);
		
		//3rd entry (in sorted order)
		entry = di.next();
		assertEquals(new Long(110000L), entry.getKey());
		assertEquals(999.11d, entry.getValue()[0], .000001d);
		assertEquals(999.22d, entry.getValue()[1], .000001d);
		
		
		//
		//Look at reach1000
		di = reach1000.iterator();
		
		//First entry (in sorted order)
		entry = di.next();
		assertEquals(new Long(90000L), entry.getKey());
		assertEquals(1000.111d, entry.getValue()[0], .000001d);
		assertEquals(1000.222d, entry.getValue()[1], .000001d);
		
		//2nd entry (in sorted order)
		entry = di.next();
		assertEquals(new Long(100000L), entry.getKey());
		assertEquals(1000.1d, entry.getValue()[0], .000001d);
		assertEquals(1000.2d, entry.getValue()[1], .000001d);
		
		//3rd entry (in sorted order)
		entry = di.next();
		assertEquals(new Long(110000L), entry.getKey());
		assertEquals(1000.11d, entry.getValue()[0], .000001d);
		assertEquals(1000.22d, entry.getValue()[1], .000001d);
		
		
		//
		//Look at reach1001
		di = reach1001.iterator();
		
		//First entry (in sorted order)
		entry = di.next();
		assertEquals(new Long(90000L), entry.getKey());
		assertEquals(1001.111d, entry.getValue()[0], .000001d);
		assertEquals(1001.222d, entry.getValue()[1], .000001d);
		
		//2nd entry (in sorted order)
		entry = di.next();
		assertEquals(new Long(100000L), entry.getKey());
		assertEquals(1001.1d, entry.getValue()[0], .000001d);
		assertEquals(1001.2d, entry.getValue()[1], .000001d);
		
		//3rd entry (in sorted order)
		entry = di.next();
		assertEquals(new Long(110000L), entry.getKey());
		assertEquals(1001.11d, entry.getValue()[0], .000001d);
		assertEquals(1001.22d, entry.getValue()[1], .000001d);
	}
	

	@Test
	public void putDuplicateValuesTest() throws Exception {
		ReachMap dataset = new ReachMap("ComID", "col1", "col2");
		
		//All different stations at a particular time '100000'
		dataset.put(1000L, 100000L, FILE1, 1000.1d, 1000.2d);
		dataset.put(999L, 100000L, FILE1, 999.1d, 999.2d);
		dataset.put(1001L, 100000L, FILE1, 1001.1d, 1001.2d);
		
		//All different stations at a particular time '110000'
		dataset.put(1000L, 110000L, FILE1, 1000.11d, 1000.22d);
		dataset.put(999L, 110000L, FILE1, 999.11d, 999.22d);
		dataset.put(1001L, 110000L, FILE1, 1001.11d, 1001.22d);
		
		//Three duplicate entries
		dataset.put(1000L, 100000L, FILE2, 99999d, 99999d);
		dataset.put(1000L, 100000L, FILE3, 99999d, 99999d);
		dataset.put(999L, 110000L, FILE3, 99999d, 99999d);
		dataset.put(1001L, 110000L, FILE4, 99999d, 99999d);
		
		
		assertEquals(3, dataset.size());	//should have three reaches
		
		Reach reach999 = dataset.get(999L);
		Reach reach1000 = dataset.get(1000L);
		Reach reach1001 = dataset.get(1001L);
		
		//
		//Look at reach999
		//The iterator of this set should be sorted and backed by the map
		Iterator<Map.Entry<Long, double[]>> di = reach999.iterator();
		
		//First entry (in sorted order)
		Map.Entry<Long, double[]> entry = di.next();
		assertEquals(new Long(100000L), entry.getKey());
		assertEquals(999.1d, entry.getValue()[0], .000001d);
		assertEquals(999.2d, entry.getValue()[1], .000001d);
		
		//2nd entry (in sorted order)
		entry = di.next();
		assertEquals(new Long(110000L), entry.getKey());
		assertEquals(999.11d, entry.getValue()[0], .000001d);
		assertEquals(999.22d, entry.getValue()[1], .000001d);
		
		//only two entries
		assertFalse(di.hasNext());
		
		
		//
		//Look at reach1000
		di = reach1000.iterator();
		
		//First entry (in sorted order)
		entry = di.next();
		assertEquals(new Long(100000L), entry.getKey());
		assertEquals(1000.1d, entry.getValue()[0], .000001d);
		assertEquals(1000.2d, entry.getValue()[1], .000001d);
		
		//2nd entry (in sorted order)
		entry = di.next();
		assertEquals(new Long(110000L), entry.getKey());
		assertEquals(1000.11d, entry.getValue()[0], .000001d);
		assertEquals(1000.22d, entry.getValue()[1], .000001d);
		
		//only two entries
		assertFalse(di.hasNext());
		
		
		//
		//Look at reach1001
		di = reach1001.iterator();
		
		//First entry (in sorted order)
		entry = di.next();
		assertEquals(new Long(100000L), entry.getKey());
		assertEquals(1001.1d, entry.getValue()[0], .000001d);
		assertEquals(1001.2d, entry.getValue()[1], .000001d);
		
		//2nd entry (in sorted order)
		entry = di.next();
		assertEquals(new Long(110000L), entry.getKey());
		assertEquals(1001.11d, entry.getValue()[0], .000001d);
		assertEquals(1001.22d, entry.getValue()[1], .000001d);
		
		//only two entries
		assertFalse(di.hasNext());
		
		
		//Check for error reporting
		assertEquals(3, dataset.getReachesWithDupliates().size());
		assertEquals(1, dataset.getReachesWithDupliates().get(reach999).size());
		assertEquals(2, dataset.getReachesWithDupliates().get(reach1000).size());
		assertEquals(1, dataset.getReachesWithDupliates().get(reach1001).size());
		
		assertTrue(dataset.getReachesWithDupliates().get(reach1000).contains(FILE2));
		assertTrue(dataset.getReachesWithDupliates().get(reach1000).contains(FILE3));
		
	}
	

	@Test
	public void putNanAndInfiniteValuesTest() throws Exception {
		ReachMap dataset = new ReachMap("ComID", "col1", "col2");
		
		//All different stations at a particular time '90000'
		dataset.put(1000L, 90000L, FILE3, 1000.111d, 1000.222d);
		dataset.put(999L, 90000L, FILE3, 999.111d, 999.222d);
		dataset.put(1001L, 90000L, FILE3, 1001.111d, 1001.222d);
		
		//All different stations at a particular time '100000'
		dataset.put(1000L, 100000L, FILE1, Double.NaN, 1000.2d);
		dataset.put(999L, 100000L, FILE1, 999.1d, Double.POSITIVE_INFINITY);
		dataset.put(1001L, 100000L, FILE1, Double.NEGATIVE_INFINITY, 1001.2d);
		
		//All different stations at a particular time '110000'
		dataset.put(1000L, 110000L, FILE2, 1000.11d, Double.NaN);
		dataset.put(999L, 110000L, FILE2, 999.11d, 999.22d);
		dataset.put(1001L, 110000L, FILE2, 1001.11d, 1001.22d);
		
		
		assertEquals(3, dataset.size());	//should have three reaches
		
		Reach reach999 = dataset.get(999L);
		Reach reach1000 = dataset.get(1000L);
		Reach reach1001 = dataset.get(1001L);
		
		//
		//Look at reach999
		//The iterator of this set should be sorted and backed by the map
		Iterator<Map.Entry<Long, double[]>> di = reach999.iterator();
		
		//First entry (in sorted order)
		Map.Entry<Long, double[]> entry = di.next();
		assertEquals(new Long(90000L), entry.getKey());
		assertEquals(999.111d, entry.getValue()[0], .000001d);
		assertEquals(999.222d, entry.getValue()[1], .000001d);
		
		//2nd entry (in sorted order)
		entry = di.next();
		assertEquals(new Long(100000L), entry.getKey());
		assertEquals(999.1d, entry.getValue()[0], .000001d);
		assertTrue(Double.isInfinite(entry.getValue()[1]));
		
		//3rd entry (in sorted order)
		entry = di.next();
		assertEquals(new Long(110000L), entry.getKey());
		assertEquals(999.11d, entry.getValue()[0], .000001d);
		assertEquals(999.22d, entry.getValue()[1], .000001d);
		
		
		//
		//Look at reach1000
		di = reach1000.iterator();
		
		//First entry (in sorted order)
		entry = di.next();
		assertEquals(new Long(90000L), entry.getKey());
		assertEquals(1000.111d, entry.getValue()[0], .000001d);
		assertEquals(1000.222d, entry.getValue()[1], .000001d);
		
		//2nd entry (in sorted order)
		entry = di.next();
		assertEquals(new Long(100000L), entry.getKey());
		assertTrue(Double.isNaN(entry.getValue()[0]));
		assertEquals(1000.2d, entry.getValue()[1], .000001d);
		
		//3rd entry (in sorted order)
		entry = di.next();
		assertEquals(new Long(110000L), entry.getKey());
		assertEquals(1000.11d, entry.getValue()[0], .000001d);
		assertTrue(Double.isNaN(entry.getValue()[1]));
		
		
		//
		//Look at reach1001
		di = reach1001.iterator();
		
		//First entry (in sorted order)
		entry = di.next();
		assertEquals(new Long(90000L), entry.getKey());
		assertEquals(1001.111d, entry.getValue()[0], .000001d);
		assertEquals(1001.222d, entry.getValue()[1], .000001d);
		
		//2nd entry (in sorted order)
		entry = di.next();
		assertEquals(new Long(100000L), entry.getKey());
		assertTrue(Double.isInfinite(entry.getValue()[0]));
		assertEquals(1001.2d, entry.getValue()[1], .000001d);
		
		//3rd entry (in sorted order)
		entry = di.next();
		assertEquals(new Long(110000L), entry.getKey());
		assertEquals(1001.11d, entry.getValue()[0], .000001d);
		assertEquals(1001.22d, entry.getValue()[1], .000001d);
		
		//Check for error reporting
		assertEquals(3, dataset.getReachesWithNaNs().size());
		assertEquals(1, dataset.getReachesWithNaNs().get(reach999).size());
		assertEquals(2, dataset.getReachesWithNaNs().get(reach1000).size());
		assertEquals(1, dataset.getReachesWithNaNs().get(reach1001).size());
		
		assertTrue(dataset.getReachesWithNaNs().get(reach1000).contains(FILE1));
		assertTrue(dataset.getReachesWithNaNs().get(reach1000).contains(FILE2));
	}
	

	@Test
	public void testForReachesWithWrongNumberOfValuse() throws Exception {
		ReachMap dataset = new ReachMap("ComID", "col1", "col2");
		
		//All different stations at a particular time '90000'
		dataset.put(1000L, 90000L, FILE1, 1000.111d, 1000.222d);
		dataset.put(999L, 90000L, FILE1, 999.111d, 999.222d);
		dataset.put(1001L, 90000L, FILE1, 1001.111d, 1001.222d);
		
		//All different stations at a particular time '100000'
		dataset.put(1000L, 100000L, FILE2, 1000.1d);
		dataset.put(999L, 100000L, FILE2, 999.1d);
		dataset.put(1001L, 100000L, FILE2, 1001.1d);

		

		
		
		assertEquals(3, dataset.size());	//should have three reaches
		
		Reach reach999 = dataset.get(999L);
		Reach reach1000 = dataset.get(1000L);
		Reach reach1001 = dataset.get(1001L);
		
		//
		//Look at reach999
		//The iterator of this set should be sorted and backed by the map
		Iterator<Map.Entry<Long, double[]>> di = reach999.iterator();
		
		//First entry (in sorted order)
		Map.Entry<Long, double[]> entry = di.next();
		assertEquals(new Long(90000L), entry.getKey());
		assertEquals(999.111d, entry.getValue()[0], .000001d);
		assertEquals(999.222d, entry.getValue()[1], .000001d);
		
		//only one entry
		assertFalse(di.hasNext());
		
		
		//
		//Look at reach1000
		di = reach1000.iterator();
		
		//First entry (in sorted order)
		entry = di.next();
		assertEquals(new Long(90000L), entry.getKey());
		assertEquals(1000.111d, entry.getValue()[0], .000001d);
		assertEquals(1000.222d, entry.getValue()[1], .000001d);
		
		//only one entry
		assertFalse(di.hasNext());
		
		
		//
		//Look at reach1001
		di = reach1001.iterator();
		
		//First entry (in sorted order)
		entry = di.next();
		assertEquals(new Long(90000L), entry.getKey());
		assertEquals(1001.111d, entry.getValue()[0], .000001d);
		assertEquals(1001.222d, entry.getValue()[1], .000001d);
		
		//only one entry
		assertFalse(di.hasNext());
		
		//Check for error reporting
		assertEquals(3, dataset.getReachesWithErrors().size());
		assertEquals(1, dataset.getReachesWithErrors().get(reach999).size());
		assertEquals(1, dataset.getReachesWithErrors().get(reach1000).size());
		assertEquals(1, dataset.getReachesWithErrors().get(reach1001).size());

	}
}
