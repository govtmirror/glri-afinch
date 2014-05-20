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
	
	@Test
	public void simpleTest() throws Exception {
		ReachMap dataset = new ReachMap("ComID", "col1", "col2");
		
		//All different stations at a particular time '100000'
		dataset.put(1000L, 100000L, 1000.1d, 1000.2d);
		dataset.put(999L, 100000L, 999.1d, 999.2d);
		dataset.put(1001L, 100000L, 1001.1d, 1001.2d);
		
		//All different stations at a particular time '110000'
		dataset.put(1000L, 110000L, 1000.11d, 1000.22d);
		dataset.put(999L, 110000L, 999.11d, 999.22d);
		dataset.put(1001L, 110000L, 1001.11d, 1001.22d);
		
		//All different stations at a particular time '90000'
		dataset.put(1000L, 90000L, 1000.111d, 1000.222d);
		dataset.put(999L, 90000L, 999.111d, 999.222d);
		dataset.put(1001L, 90000L, 1001.111d, 1001.222d);
		
		
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
}
