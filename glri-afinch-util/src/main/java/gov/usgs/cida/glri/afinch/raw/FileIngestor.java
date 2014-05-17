package gov.usgs.cida.glri.afinch.raw;

import java.io.File;
import java.util.concurrent.Callable;

/**
 *
 * @author eeverman
 */
public class FileIngestor implements Callable<Integer> {
	
	private final PerReachDataset dataSet;
	private final int waterYear;	//The nominal wateryear for this file
	private final File sourceFile;
	
	/**
	 * Create a new instance.
	 * 
	 * @param sourceFile
	 * @param dataSet The collection of all data that is being accumulated
	 * @param waterYear 
	 */
	public FileIngestor(File sourceFile, PerReachDataset dataSet, int waterYear) {
		this.dataSet = dataSet;
		this.waterYear = waterYear;
		this.sourceFile = sourceFile;
	}
	
	public Integer call() throws Exception {
		
		String[] dataHeaders = dataSet.getPerMonthDataHeaders();
		int valueCount = 0;
		
		try (
				RawCsvFile file = new RawCsvFile(sourceFile, dataSet.getExplodedHeaders());
			) {
			
			while (file.next()) {
				Long reachId = file.getAsLong(dataSet.getReachHeaderName());
				
				for (WaterMonth month : WaterMonth.values()) {
					
					//Array of all values we are interested that occured during the same month
					double[] vals = new double[dataHeaders.length];
					
					for (int i = 0; i < dataHeaders.length; i++) {
						vals[i] = file.getAsDoubleByMonth(dataHeaders[i], month);
					}
					
					dataSet.put(reachId, month.getCalendarTimeInMillis(waterYear), vals);
					
					valueCount++;
				}
				
			}
			
			return valueCount;
			
		}
	}
}
