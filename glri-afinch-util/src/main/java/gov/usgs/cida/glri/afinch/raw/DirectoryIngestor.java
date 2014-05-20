package gov.usgs.cida.glri.afinch.raw;

import java.io.File;
import java.util.Collection;
import java.util.NavigableSet;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.filefilter.FileFilterUtils;
import org.apache.commons.io.filefilter.IOFileFilter;
import org.apache.commons.io.filefilter.NameFileFilter;
import org.apache.commons.io.filefilter.SuffixFileFilter;

/**
 *
 * @author eeverman
 */
public class DirectoryIngestor {
	
	
	private final PerReachDataset dataSet;
	private final File sourceDir;
	private final IOFileFilter dirFilter;
	private final IOFileFilter fileFilter;
	private final Pattern regexYearExtractor;
	private final Integer limitNumberOfFilesProcessed;	//If non-null, restrict the number of input files.
	
	public static void main(String[] args) throws Exception {
		String srcDirStr = args[0];
		String destDirStr = args[1];
		Integer limitCount = null;
		
		
		if (args.length > 2) {
			String str = args[2];
			limitCount = Integer.parseInt(str);
		}
		
		File sourceDir = new File(srcDirStr);
		File destDir = new File(destDirStr);
		
		
		PerReachDataset dataSet = new PerReachDataset("ComID", "QAccCon", "QAccWua");
		IOFileFilter actualFileFilter = new SuffixFileFilter(".csv");
		IOFileFilter fileParentDirFilter = new ParentFolderNameFileFilter(new NameFileFilter("Flowlines"));
		IOFileFilter completeFileFilter = FileFilterUtils.and(actualFileFilter, fileParentDirFilter);
		IOFileFilter dirFilter = FileFilterUtils.trueFileFilter();
		Pattern yearFromNameExtractor = Pattern.compile(".*WY(\\d\\d\\d\\d).*");
		
		DirectoryIngestor din = new DirectoryIngestor(sourceDir, dataSet, completeFileFilter, dirFilter, yearFromNameExtractor, limitCount);
		din.ingest();
		
		
		//
		//Write output
		NavigableSet<Long> set = dataSet.keySet();
		int outCount = 0;
		System.out.println("Begin writing " + set.size() + " output files.");
		
		for (Long id : set) {
			outCount++;
			
			if ((double)(outCount / 1000) == (((double)outCount)) / 1000d) {
				System.out.println("Begin writing output file " + outCount);
			}
			
			Reach r = dataSet.get(id);
			ReachFileWriter w = new ReachFileWriter(destDir, r, "DateTime",
					ReachFileWriter.DEFAULT_DATE_FORMAT,
					ReachFileWriter.DEFAULT_NUMBER_FORMAT, true);
			w.write();
		}
		
		System.out.println("All Done!");

	}

	public DirectoryIngestor(File sourceDir, PerReachDataset dataSet,
			IOFileFilter fileFilter, IOFileFilter dirFilter, Pattern regexYearExtractor, Integer limitNumberOfFilesProcessed) {
		
		this.sourceDir = sourceDir;
		this.dataSet = dataSet;
		this.dirFilter = dirFilter;
		this.fileFilter = fileFilter;
		this.regexYearExtractor = regexYearExtractor;
		this.limitNumberOfFilesProcessed = limitNumberOfFilesProcessed;
	}
	
	public void ingest() throws Exception {
			
		Collection<File> allFiles = FileUtils.listFiles(sourceDir, fileFilter, dirFilter);

		long startTimeMs = System.currentTimeMillis();
		
		System.out.println("Found " + allFiles.size() + " files to process.");
		int current = 1;
		
		int coreCount = Runtime.getRuntime().availableProcessors();
		System.out.println("Will process with " + coreCount + " threads");
		ExecutorService executor = newFixedThreadPool(coreCount);
		
		for (File f : allFiles) {
			
			if (limitNumberOfFilesProcessed == null || current < limitNumberOfFilesProcessed) {
				
				String name = f.getName();
				Matcher matcher = regexYearExtractor.matcher(name);
				matcher.find();
				String yearStr = matcher.group(1);
				
				try {
					
					int year = Integer.parseInt(yearStr);
					//System.out.println("Processing input file " + current + " of " + allFiles.size() + " (" + f.getAbsolutePath() + ") as year " + year);
					FileIngestor fi = new FileIngestor(f, dataSet, year);
					executor.submit(fi);
					
				} catch (Exception e) {
					//Go on
					System.out.println("!! FAILED TO SUBMIT INPUT FILE: " + f.getAbsolutePath() + "   Stacktrace follows:");
					e.printStackTrace(System.out);
				}
				current++;

			}
		}
		
		
		//Request a shutdown (non-blocking)
		executor.shutdown();
		
		//This will block and return true if it really completed.
		//If instead the timeout happens, false is returned
		if (executor.awaitTermination(8, TimeUnit.HOURS)) {
			long endTimeMs = System.currentTimeMillis();
			long durSec = (endTimeMs - startTimeMs) / 1000;
			System.out.println("Read in all files in " + (durSec / 60) + " minutes and " + (durSec % 60) + " seconds.");
		} else {
			//The time out happened - could not read all files
			executor.shutdownNow();
			System.out.println("!! AFTER WAITING FOR 8 HOURS FOR THE PROCESS TO COMPLETE, IT TIMED OUT");
			throw new Exception("!! AFTER WAITING FOR 8 HOURS FOR THE PROCESS TO COMPLETE, IT TIMED OUT");
		}
		
	}
	
	public ExecutorService newFixedThreadPool(int nThreads) {
        return new ThreadPoolExecutor(nThreads, nThreads,
                                      0L, TimeUnit.MILLISECONDS,
                                      new LinkedBlockingQueue<Runnable>(9999)) {
										  
			@Override
			public void afterExecute(Runnable r, Throwable t) {
				super.afterExecute(r, t);
				System.out.println("Completed input file " + this.getCompletedTaskCount() + " of " + this.getTaskCount());
			}	  
		};
    }
	
}
