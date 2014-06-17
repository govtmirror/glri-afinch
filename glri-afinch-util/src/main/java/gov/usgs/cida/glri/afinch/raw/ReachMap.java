package gov.usgs.cida.glri.afinch.raw;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ConcurrentSkipListMap;
import java.util.concurrent.ConcurrentSkipListSet;
import java.util.concurrent.CopyOnWriteArrayList;


/**
 *
 * @author eeverman
 */
public class ReachMap extends ConcurrentSkipListMap<Long, Reach> {
	
	private String reachHeader;		//name of the column containing the reach ID
	private String[] perMonthDataHeaders;	//List of headers, in which item 0 is the reach ID and all others are data.
	
	private String[] explodedHeaders;	//All the headers, exploded by month
	
	public static final String DEFAULT_NULL_FILE_NAME = "Unknown Source File";
	
	private final ConcurrentSkipListMap<Reach, Set<String>> reachErrors;			//Reaches w/ values counts that don't match the file headers
	private final ConcurrentSkipListMap<Reach, Set<String>> duplicateReaches;	//marked w/ the file they came from 
	private final ConcurrentSkipListMap<Reach, Set<String>> containNanReaches;	//marked w/ the file they came from 
	
	public ReachMap(String reachHeaderName, String... perMonthDataHeaders) {
		super();
		
		this.reachHeader = reachHeaderName;
		this.perMonthDataHeaders = perMonthDataHeaders;
		
		reachErrors = new ConcurrentSkipListMap<Reach, Set<String>>();
		duplicateReaches = new ConcurrentSkipListMap<Reach, Set<String>>();
		containNanReaches = new ConcurrentSkipListMap<Reach, Set<String>>();
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
	
	public ConcurrentSkipListMap<Reach, Set<String>> getReachesWithErrors() {
		return reachErrors;
	}
	
	public ConcurrentSkipListMap<Reach, Set<String>> getReachesWithDupliates() {
		return duplicateReaches;
	}
	
	public ConcurrentSkipListMap<Reach, Set<String>> getReachesWithNaNs() {
		return containNanReaches;
	}
	
	/**
	 * Add a new data value, creating a station if needed
	 * @param reachId
	 * @param timestamp
	 * @param sourceFile Source file name - used for logging duplicate reaches and bad values.
	 * @param values 
	 */
	public void put(Long reachId, Long timestamp, String sourceFile, double... values) {
		
		if (sourceFile == null) sourceFile = DEFAULT_NULL_FILE_NAME;
		
		Reach reach = this.get(reachId);
		
		if (reach == null) {
			reach = new Reach(reachId, perMonthDataHeaders);
			Reach existingReach = this.putIfAbsent(reachId, reach);
			
			//This is the case if another thread slips in to insert this value
			//since we first decided it was missing
			if (existingReach != null) reach = existingReach;
		}
		
		try {
			if (reach.put(timestamp, values)) {
			
				//Added OK - check for NaN and Infinite values
				
				for (double v : values) {
					if (Double.isNaN(v) || Double.isInfinite(v)) {
						addError(containNanReaches, reach, sourceFile);
						break;
					}
				}
				
				
			} else {
				addError(duplicateReaches, reach, sourceFile);
			}
		} catch (Exception e) {
			addError(reachErrors, reach, sourceFile);
		}
	}
	
	protected void addError(ConcurrentSkipListMap<Reach, Set<String>> errors, Reach reach, String sourceFile) {
		Set<String> files = new ConcurrentSkipListSet<String>();
		files.add(sourceFile);
		files = errors.putIfAbsent(reach, files);
		if (files != null) {
			//The put method found an already existing entry, so add to that entry instead
			files.add(sourceFile);
		}
		
	}
}
