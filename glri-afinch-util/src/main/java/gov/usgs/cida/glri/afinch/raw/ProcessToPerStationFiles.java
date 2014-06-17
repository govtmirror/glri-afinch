package gov.usgs.cida.glri.afinch.raw;

import java.io.File;
import java.util.Set;
import java.util.concurrent.ConcurrentSkipListMap;
import java.util.concurrent.Future;
import java.util.concurrent.RunnableFuture;
import java.util.concurrent.TimeUnit;
import java.util.regex.Pattern;
import org.apache.commons.io.filefilter.FileFilterUtils;
import org.apache.commons.io.filefilter.IOFileFilter;
import org.java.util.concurrent.NotifyingBlockingThreadPoolExecutor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author eeverman
 */
public class ProcessToPerStationFiles {
	private static Logger log = LoggerFactory.getLogger(ProcessToPerStationFiles.class);
	
	private final File srcDir;
	private final File dstDir;
	private final Integer limitCount;
	private final boolean continueOnErrors;
	
	/** Filter applied to each file to determine inclusion in the process */
	private final IOFileFilter fileFilter;
	
	private final String idColumnName;
	private final String[] dataSeriesNames;	//Data series are expanded to be per month, seriesA --> seriesAOct, seriesANov...
	
	private ReachMap dataSet;	//all the data loaded, before it is written	
		
	public static void main(String[] args) throws Exception {
		String srcDirStr = args[0];
		String destDirStr = args[1];
		Integer limitCount = null;

		if (args.length > 2) {
			String str = args[2];
			limitCount = Integer.parseInt(str);
		}

		ProcessToPerStationFiles p = new ProcessToPerStationFiles(new File(srcDirStr), new File(destDirStr), limitCount, true, null, "ComID", "QAccCon");
		p.process();
	}
	
	
	public ProcessToPerStationFiles(File srcDir, File dstDir, Integer limitCount, boolean continueOnErrors, IOFileFilter fileFilter, String idColumnName, String... dataSeriesNames) {
		this.srcDir = srcDir;
		this.dstDir = dstDir;
		this.limitCount = limitCount;
		this.continueOnErrors = continueOnErrors;
		this.idColumnName = idColumnName;
		this.dataSeriesNames = dataSeriesNames;
		this.fileFilter = fileFilter;
	}
	
	public Boolean process() throws Exception {
		boolean hasErrors = false;
		
		//ReachMap dataSet = new ReachMap("ComID", "QAccCon", "QAccWua");
		
		dataSet = new ReachMap(idColumnName, dataSeriesNames);
		IOFileFilter dirFilter = FileFilterUtils.trueFileFilter();
		Pattern yearFromNameExtractor = Pattern.compile(".*WY(\\d\\d\\d\\d).*");

		DirectoryIngestor din = new DirectoryIngestor(srcDir, dataSet, fileFilter, dirFilter, yearFromNameExtractor, limitCount);
		
		int coreCount = Runtime.getRuntime().availableProcessors();
		int readThreadCount = coreCount;
		int writeThreadCount = coreCount;
		
		//Extra threads that are never started are not handled well by the thread pool await() method
		if (limitCount != null && readThreadCount > limitCount) readThreadCount = limitCount;
		
		log.info("Will read raw files with {} threads", readThreadCount);
		
		NotifyingBlockingThreadPoolExecutor executor = newFixedThreadPool(readThreadCount);
		
		
		long startAllTimeMs = System.currentTimeMillis();
		long startIngestTimeMs = startAllTimeMs;
		
		//Blocks until all tasks are at least submitted
		din.process(executor);
		
		//Blocks waiting for all tasks to be completed
		if (! executor.await(10, TimeUnit.SECONDS)) {
			//throw new Exception("The read executor failed to complete during the wait time.  Could be a real issue, or maybe the files are too big to read/parse during that time.");
		}
		executor.shutdown();
		
		long endIngestTimeMs = System.currentTimeMillis();
		log.debug("Read in all files in {} seconds", (Long)((endIngestTimeMs - startIngestTimeMs) / 1000));
		
		hasErrors = (
			reportErrorsIfAny(dataSet.getReachesWithErrors(), "likely due to the wrong number of values being found in a row (value count doesn't match header count)")
			| reportErrorsIfAny(dataSet.getReachesWithDupliates(), "The same reach/date combination was found in multiple files")
			| reportErrorsIfAny(dataSet.getReachesWithNaNs(), "These reaches contain NaN or infinite values (maybe not an error?)")
		);
		
		if (! hasErrors) {
			log.info("GOOD NEWS:  No duplicate entries, errors, or reaches with NaNs or Infinate values were found!");
		} else if (! continueOnErrors) {
			return false;
		}

		//
		//Write output
		log.info("Will write standardized CSV files with {} threads", writeThreadCount);
		executor = newFixedThreadPool(writeThreadCount);
		ReachMapWriter writer = new ReachMapWriter(dstDir, dataSet, "DateTime", 
			ReachWriter.DEFAULT_DATE_FORMAT, ReachWriter.DEFAULT_NUMBER_FORMAT, true);
		
		long startWriteTimeMs = System.currentTimeMillis();
		writer.write(executor);
		
		
		//Blocks waiting for all tasks to be completed
		if (! executor.await(2, TimeUnit.MINUTES)) {
			throw new Exception("The write executor failed to complete during the wait time.  Could be a real issue, or maybe the files are too big to write during that time.");
		}

		long endWriteTimeMs = System.currentTimeMillis();
		
		log.info("Wrote {} output files in {} seconds to {}", dataSet.size(), (Long)((endWriteTimeMs - startWriteTimeMs) / 1000), dstDir.getAbsolutePath());
		
		
		executor.shutdown();
		executor.awaitTermination(1, TimeUnit.SECONDS);
		
		log.info("Process Complete.");
		
		return ! hasErrors;
	}
	//like due to the wrong number of values being found in a row (value count doesn't match header count) :
	
	/**
	 * Print an error summary and returns true if there were any erros
	 * 
	 * @param errorMap
	 * @param description
	 * @return 
	 */
	protected boolean reportErrorsIfAny(ConcurrentSkipListMap<Reach, Set<String>> errorMap, String description) {
		if (errorMap.size() > 0) {
			log.error("Some reaches / catchments caused errors or have unexpected values:  " + description + " :");
			log.error(" | ID | source file (may be multiple files for a reach)");
			for (Reach r : errorMap.keySet()) {
				Set<String> files = errorMap.get(r);
				
				for (String file : files) {
					log.error(" | " + r.getId()+ " | " + file);
				}
				
			}
			
			return true;
		} else {
			return false;
		}
	}
	
	/**
	 * Access not really needed, but used for debuggin.
	 * Destroy the class after use, since this dataset is huge.
	 * @return 
	 */
	public ReachMap getDataSet() {
		return dataSet;
	}
	
	public static NotifyingBlockingThreadPoolExecutor newFixedThreadPool(int nThreads) {
		return new NotifyingBlockingThreadPoolExecutor(nThreads, nThreads * 4,
				1L, TimeUnit.SECONDS) {

					
			private int completeCount = 0;
			
			private final int READ_NOTICE_COUNT = 50;
			private final int WRITE_NOTICE_COUNT = 1000;
			
			@Override
			public void afterExecute(Runnable r, Throwable t) {
				super.afterExecute(r, t);
				
				if (r instanceof RunnableFuture) {
					Future f = (Future)r;
					
					try {
						Object ro = f.get();
						
						completeCount++;
						
						if (ro instanceof FileIngestor) {
							if ((double) (completeCount / READ_NOTICE_COUNT) == (((double) completeCount)) / (double)(READ_NOTICE_COUNT)) {
								log.debug("Completed input file {} of {}", this.getCompletedTaskCount(), this.getTaskCount());
							}
						} else if (ro instanceof ReachWriter) {
							if ((double) (completeCount / WRITE_NOTICE_COUNT) == (((double) completeCount)) / (double)(WRITE_NOTICE_COUNT)) {
								log.debug("Completed writing file {} of {}", this.getCompletedTaskCount(), this.getTaskCount());
							}
						} else {
							log.error("!! UNEXPECTED COMPLETED TASK of: " + ro.getClass().getCanonicalName());
						}
							
					} catch (Exception ex) {
						log.error("!! UNEXPECTED UNCOMPLETED TASK", ex);
					}
				}
				
			}
		};
			
	}

}
