package gov.usgs.cida.glri.afinch.raw;

import java.io.File;
import java.util.concurrent.Callable;
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

/**
 *
 * @author eeverman
 */
public class ProcessToPerStationFiles implements Callable<Boolean> {
	
	private final File srcDir;
	private final File dstDir;
	private final Integer limitCount;
		
		
	public static void main(String[] args) throws Exception {
		String srcDirStr = args[0];
		String destDirStr = args[1];
		Integer limitCount = null;

		if (args.length > 2) {
			String str = args[2];
			limitCount = Integer.parseInt(str);
		}

		ProcessToPerStationFiles p = new ProcessToPerStationFiles(new File(srcDirStr), new File(destDirStr), limitCount);
		p.call();
	}
	
	
	public ProcessToPerStationFiles(File srcDir, File dstDir, Integer limitCount) {
		this.srcDir = srcDir;
		this.dstDir = dstDir;
		this.limitCount = limitCount;
	}
	
	@Override
	public Boolean call() throws Exception {

		ReachMap dataSet = new ReachMap("ComID", "QAccCon", "QAccWua");
		IOFileFilter actualFileFilter = new SuffixFileFilter(".csv");
		IOFileFilter fileParentDirFilter = new AncestorDirectoryNameFileFilter(new NameFileFilter("Flowlines"));
		IOFileFilter hucNamesParentDirFilter = new AncestorDirectoryNameFileFilter(new RegexFileFilter("HR\\d\\d\\d\\d_.*"), 2);
		IOFileFilter completeFileFilter = FileFilterUtils.and(actualFileFilter, fileParentDirFilter, hucNamesParentDirFilter);
		IOFileFilter dirFilter = FileFilterUtils.trueFileFilter();
		Pattern yearFromNameExtractor = Pattern.compile(".*WY(\\d\\d\\d\\d).*");

		DirectoryIngestor din = new DirectoryIngestor(srcDir, dataSet, completeFileFilter, dirFilter, yearFromNameExtractor, limitCount);
		
		int coreCount = Runtime.getRuntime().availableProcessors();
		System.out.println("Will process with " + coreCount + " threads");
		NotifyingBlockingThreadPoolExecutor executor = newFixedThreadPool(coreCount);
		
		
		long startAllTimeMs = System.currentTimeMillis();
		long startIngestTimeMs = startAllTimeMs;
		
		//Blocks until all tasks are at least submitted
		din.ingest(executor);
		
		//Blocks waiting for all tasks to be completed
		executor.await();
		
		long endIngestTimeMs = System.currentTimeMillis();
		System.out.println("Read in all files in " + ((endIngestTimeMs - startIngestTimeMs) / 60) + " seconds");


		//
		//Write output
		
		ReachMapWriter writer = new ReachMapWriter(dstDir, dataSet, "DateTime", 
			ReachWriter.DEFAULT_DATE_FORMAT, ReachWriter.DEFAULT_NUMBER_FORMAT, true);
		
		long startWriteTimeMs = System.currentTimeMillis();
		writer.write(executor);
		
		
		//Blocks waiting for all tasks to be completed
		executor.await();
		long endWriteTimeMs = System.currentTimeMillis();
		
		System.out.println("Wrote in all files in " + ((endWriteTimeMs - startWriteTimeMs) / 60) + " seconds");
		
		
		executor.shutdown();
		executor.awaitTermination(1, TimeUnit.SECONDS);
		
		System.out.println("All Done!");
		
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
								System.out.println("Completed input file " + this.getCompletedTaskCount() + " of " + this.getTaskCount());
							}
						} else if (ro instanceof ReachWriter) {
							if ((double) (completeCount / WRITE_NOTICE_COUNT) == (((double) completeCount)) / (double)(WRITE_NOTICE_COUNT)) {
								System.out.println("Completed writing file " + this.getCompletedTaskCount() + " of " + this.getTaskCount());
							}
						} else {
							System.out.println("!! UNEXPECTED COMPLETED TASK of: " + ro.getClass().getCanonicalName());
						}
							
					} catch (Exception ex) {
						System.out.println("!! UNEXPECTED UNCOMPLETED TASK   Stacktrace follows:");
						ex.printStackTrace(System.out);
					}
				}
				
			}
		};
			
	}

}
