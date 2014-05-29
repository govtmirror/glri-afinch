package gov.usgs.cida.glri.afinch.raw;

import java.io.File;
import java.util.concurrent.Callable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Parses one AFINCH source file into a dataSet.
 * An AFINCH source file is specific to one water year.  It is CSV based with
 * one row per reach and a column for each month X data series combination.
 * For example, if there were two data series SeriesA and SeriesB, there would
 * be columns:
 * <ul>
 * <ul>SeriesAOct</ul>
 * <ul>SeriesANox</ul>
 * <ul>... Oct thru Sep, which is the water year month order</ul>
 * <ul>SeriesBOct</ul>
 * <ul>SeriesBNox</ul>
 * <ul>...</ul>
 * </ul>
 * 
 * The first column should be some type of reach ID.  Across a set of files, it
 * would be expected that the combination of a reach ID and a water year month
 * would be unique, i.e, there would be only one entry for July 2000 for a given
 * reach.
 * 
 * 
 * @author eeverman
 */
public class FileIngestor implements Callable<FileIngestor> {
	private static Logger log = LoggerFactory.getLogger(FileIngestor.class);
	
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
					
					try {
						dataSet.put(reachId, month.getCalendarTimeInMillis(waterYear), vals);
					} catch (Exception e) {
						log.error(getDescription() + " threw an excpetion.  Onward...", e);
					}
					
				}
				
				rowCount++;
				
			}
			
			return this;
			
		} catch (Exception e) {
			log.error(getDescription() + " threw an excpetion", e);
			throw e;
		}
	}
	
	public String getDescription() {
		return "Input file " + sourceFile.getAbsolutePath() + " with " + rowCount + " rows for water year " + waterYear;
	}
}
