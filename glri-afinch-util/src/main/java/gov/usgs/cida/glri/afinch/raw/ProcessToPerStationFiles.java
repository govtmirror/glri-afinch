package gov.usgs.cida.glri.afinch.raw;

import java.io.File;
import java.util.Collection;
import java.util.List;
import java.util.concurrent.Future;
import java.util.concurrent.RunnableFuture;
import java.util.concurrent.TimeUnit;
import java.util.regex.Pattern;
import org.apache.commons.io.filefilter.AncestorDirectoryNameFileFilter;
import org.apache.commons.io.filefilter.FileFilterUtils;
import org.apache.commons.io.filefilter.IOFileFilter;
import org.apache.commons.io.filefilter.NameFileFilter;
import org.apache.commons.io.filefilter.RegexFileFilter;
import org.apache.commons.io.filefilter.SuffixFileFilter;
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
	
	/** Filter applied to each file to determine inclusion in the process */
	private final IOFileFilter fileFilter;
	
	private final String idColumnName;
	private final String[] dataSeriesNames;	//Data series are expanded to be per month, seriesA --> seriesAOct, seriesANov...
		
		
	public static void main(String[] args) throws Exception {
		String srcDirStr = args[0];
		String destDirStr = args[1];
		Integer limitCount = null;

		if (args.length > 2) {
			String str = args[2];
			limitCount = Integer.parseInt(str);
		}

		ProcessToPerStationFiles p = new ProcessToPerStationFiles(new File(srcDirStr), new File(destDirStr), limitCount, null, "ComID", "QAccCon");
		p.process();
	}
	
	
	public ProcessToPerStationFiles(File srcDir, File dstDir, Integer limitCount, IOFileFilter fileFilter, String idColumnName, String... dataSeriesNames) {
		this.srcDir = srcDir;
		this.dstDir = dstDir;
		this.limitCount = limitCount;
		this.idColumnName = idColumnName;
		this.dataSeriesNames = dataSeriesNames;
		
		if (fileFilter != null) {
			this.fileFilter = fileFilter;
		} else {
			//create a default filter
			IOFileFilter actualFileFilter = new SuffixFileFilter(".csv");
			IOFileFilter fileParentDirFilter = new AncestorDirectoryNameFileFilter(new NameFileFilter("Flowlines"));
			//IOFileFilter hucNamesParentDirFilter = new AncestorDirectoryNameFileFilter(new RegexFileFilter("HR\\d\\d\\d\\d_.*"), 2);
			this.fileFilter = FileFilterUtils.and(actualFileFilter, fileParentDirFilter);
		}
		
	}
	
	public Boolean process() throws Exception {

		//ReachMap dataSet = new ReachMap("ComID", "QAccCon", "QAccWua");
		
		ReachMap dataSet = new ReachMap(idColumnName, dataSeriesNames);
		IOFileFilter dirFilter = FileFilterUtils.trueFileFilter();
		Pattern yearFromNameExtractor = Pattern.compile(".*WY(\\d\\d\\d\\d).*");

		DirectoryIngestor din = new DirectoryIngestor(srcDir, dataSet, fileFilter, dirFilter, yearFromNameExtractor, limitCount);
		
		int coreCount = Runtime.getRuntime().availableProcessors();
		
		log.info("Will process with {} threads", coreCount);
		
		NotifyingBlockingThreadPoolExecutor executor = newFixedThreadPool(coreCount);
		
		
		long startAllTimeMs = System.currentTimeMillis();
		long startIngestTimeMs = startAllTimeMs;
		
		//Blocks until all tasks are at least submitted
		din.process(executor);
		
		//Blocks waiting for all tasks to be completed
		executor.await();
		
		long endIngestTimeMs = System.currentTimeMillis();
		log.debug("Read in all files in {} seconds", (Long)((endIngestTimeMs - startIngestTimeMs) / 1000));
		
		Collection<Long> reachesWithErrors = dataSet.getReachesWithErrors();
		if (reachesWithErrors.size() > 0) {
			//Some reaches must have duplicate entries for time.
			
			log.error("Some reaches cause errors, likely due to duplicate reach/time combinations.  List of reach IDs follows:");
			for (Long id : reachesWithErrors) {
				log.error("   reach id: " + id.toString());
			}
			
			return false;
		}


		//
		//Write output
		
		ReachMapWriter writer = new ReachMapWriter(dstDir, dataSet, "DateTime", 
			ReachWriter.DEFAULT_DATE_FORMAT, ReachWriter.DEFAULT_NUMBER_FORMAT, true);
		
		long startWriteTimeMs = System.currentTimeMillis();
		writer.write(executor);
		
		
		//Blocks waiting for all tasks to be completed
		executor.await();
		long endWriteTimeMs = System.currentTimeMillis();
		
		log.info("Wrote {} output files in {} seconds to {}", dataSet.size(), (Long)((endWriteTimeMs - startWriteTimeMs) / 1000), dstDir.getAbsolutePath());
		
		
		executor.shutdown();
		executor.awaitTermination(1, TimeUnit.SECONDS);
		
		log.info("Process Complete.");
		
		return true;
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
