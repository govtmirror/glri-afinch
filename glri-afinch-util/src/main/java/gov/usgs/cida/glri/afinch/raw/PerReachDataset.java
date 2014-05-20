package gov.usgs.cida.glri.afinch.raw;

import java.util.Arrays;
import java.util.List;
import java.util.concurrent.ConcurrentSkipListMap;


/**
 *
 * @author eeverman
 */
public class PerReachDataset extends ConcurrentSkipListMap<Long, Reach> {
	
	private String reachHeader;		//name of the column containing the reach ID
	private String[] perMonthDataHeaders;	//List of headers, in which item 0 is the reach ID and all others are data.
	
	private String[] explodedHeaders;	//All the headers, exploded by month
	
	public PerReachDataset(String reachHeaderName, String... perMonthDataHeaders) {
		super();
		
		this.reachHeader = reachHeaderName;
		this.perMonthDataHeaders = perMonthDataHeaders;
	}
	
	public String getReachHeaderName() {
		return reachHeader;
	}

	public String[] getPerMonthDataHeaders() {
		return Arrays.copyOf(perMonthDataHeaders, perMonthDataHeaders.length);
	}
	
	public synchronized String[] getExplodedHeaders() {
		
		if (explodedHeaders == null) {
			//Create an exploded list of reach headers so that we ensure the file contains all of them.
			List<String> headers = null;
			for (String h : perMonthDataHeaders) {
				headers = RawCsvFile.stemHeaderByMonth(h, headers);
			}

			headers.add(reachHeader);
			explodedHeaders = headers.toArray(new String[headers.size()]);
		}
		
		return explodedHeaders;
	}
	
	/**
	 * Add a new data value, creating a station if needed
	 * @param reachId
	 * @param timestamp
	 * @param values 
	 */
	public void put(Long reachId, Long timestamp, double... values) throws Exception {
		
		Reach reach = this.get(reachId);
		
		if (reach == null) {
			reach = new Reach(reachId, perMonthDataHeaders);
			Reach existingReach = this.putIfAbsent(reachId, reach);
			
			//This is the case if another thread slips in to insert this value
			//since we first decided it was missing
			if (existingReach != null) reach = existingReach;
		}
		
		reach.put(timestamp, values);
	}
}
