package gov.usgs.cida.glri.afinch.raw;

import java.io.File;
import java.util.concurrent.Callable;

/**
 *
 * @author eeverman
 */
public class FileIngestor implements Callable<FileIngestor> {
	
	private final ReachMap dataSet;
	private final int waterYear;	//The nominal wateryear for this file
	private final File sourceFile;
	int rowCount = 0;
	
	/**
	 * Create a new instance.
	 * 
	 * @param sourceFile
	 * @param dataSet The collection of all data that is being accumulated
	 * @param waterYear 
	 */
	public FileIngestor(File sourceFile, ReachMap dataSet, int waterYear) {
		this.dataSet = dataSet;
		this.waterYear = waterYear;
		this.sourceFile = sourceFile;
	}
	
	public FileIngestor call() throws Exception {
		
		String[] dataHeaders = dataSet.getPerMonthDataHeaders();
		
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
					
				}
				
				rowCount++;
				
			}
			
			return this;
			
		} catch (Exception e) {
			System.out.println(getDescription() + " threw an excpetion:");
			e.printStackTrace();
			throw e;
		}
	}
	
	public String getDescription() {
		return "Input file " + sourceFile.getAbsolutePath() + " with " + rowCount + " rows for water year " + waterYear;
	}
}
