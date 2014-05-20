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
public class ReachTest {
	
	@Test
	public void simpleTest() throws Exception {
		Reach s = new Reach(99L, "data1", "data2");
		s.put(1000L, 1000.1d, 1000.2d);
		s.put(999L, 999.1d, 999.2d);
		s.put(1001L, 1001.1d, 1001.2d);
		
		assertEquals(new Long(99L), s.getId());
		assertEquals("data1", s.getHeaders()[0]);
		assertEquals("data2", s.getHeaders()[1]);
		
		//The iterator of this set should be sorted and backed by the map
		Iterator<Map.Entry<Long, double[]>> di = s.iterator();
		
		//First entry (in sorted order)
		Map.Entry<Long, double[]> entry = di.next();
		assertEquals(new Long(999L), entry.getKey());
		assertEquals(999.1d, entry.getValue()[0], .000001d);
		assertEquals(999.2d, entry.getValue()[1], .000001d);
		
		//2nd entry
		entry = di.next();
		assertEquals(new Long(1000L), entry.getKey());
		assertEquals(1000.1d, entry.getValue()[0], .000001d);
		assertEquals(1000.2d, entry.getValue()[1], .000001d);
		
		//2nd entry
		entry = di.next();
		assertEquals(new Long(1001L), entry.getKey());
		assertEquals(1001.1d, entry.getValue()[0], .000001d);
		assertEquals(1001.2d, entry.getValue()[1], .000001d);
		
		
		assertFalse(di.hasNext());
	}
}
