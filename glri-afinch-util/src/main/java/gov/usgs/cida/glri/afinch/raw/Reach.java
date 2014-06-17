package gov.usgs.cida.glri.afinch.raw;

import java.util.Arrays;
import java.util.Iterator;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentSkipListMap;

/**
 * One reach w/ all of its timestamped data.
 * 
 * NOTE:  The Comparable interface assumes that the IDs Globally unique.
 * Don't go making sets of Reaches with the same set of IDs and try to stick
 * them in the same collection or compare them.  Just sayin.
 * 
 * When constructed, the 
 * @author eeverman
 */
public class Reach implements Comparable<Reach> {
	
	private final Long id;
	private final String[] headers;
	private final ConcurrentSkipListMap<Long, double[]> entries;
	
	/**
	 * Construct with the station ID and the names of the data columns.
	 * 
	 * Note that the timestamp column name, "DateTime", should not be included in
	 * the headers array.
	 * 
	 * @param reachId
	 * @param headers 
	 */
	public Reach(Long reachId, String... headers) {
		this.id = reachId;
		this.headers = headers;
		entries = new ConcurrentSkipListMap<Long, double[]>();
	}
	
	/**
	 * Add a row of data.  The timestamp is passed separately from the data column values.
	 * 
	 * @param timeStamp
	 * @param values
	 * @throws Exception if the number of values do not match the value headers
	 * @return true if the values were added, false if the values would be a duplication
	 */
	public boolean put(long timeStamp, double... values) throws Exception {
		if (values.length != headers.length) {
			throw new Exception("Found " + values.length + " values, but " + headers.length + " values were expected.");
		}
		double[] existing = entries.putIfAbsent(timeStamp, values);
		
		return (existing == null);
	}
	
	/**
	 * Returns an entry set of timestamps and values arrays, in ascending timestamp order.
	 * 
	 * @return 
	 */
	public Iterator<Map.Entry<Long, double[]>> iterator() {
		return entries.entrySet().iterator();
	}
	
	/**
	 * The station ID.
	 * @return 
	 */
	public Long getId() {
		return id;
	}

	/**
	 * Returns a copy of the header array
	 * @return 
	 */
	public String[] getHeaders() {
		return Arrays.copyOf(headers, headers.length);
	}

	@Override
	public int compareTo(Reach o) {
		return id.compareTo(o.getId());
	}

}
