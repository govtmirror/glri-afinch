package gov.usgs.cida.glri.afinch.raw;

import java.io.File;
import java.util.Collection;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.filefilter.IOFileFilter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author eeverman
 */
public class DirectoryIngestor {
	private static Logger log = LoggerFactory.getLogger(DirectoryIngestor.class);

	private final ReachMap dataSet;
	private final File sourceDir;
	private final IOFileFilter dirFilter;
	private final IOFileFilter fileFilter;
	private final Pattern regexYearExtractor;
	private final Integer limitNumberOfFilesProcessed;	//If non-null, restrict the number of input files.


	public DirectoryIngestor(File sourceDir, ReachMap dataSet,
			IOFileFilter fileFilter, IOFileFilter dirFilter, Pattern regexYearExtractor, Integer limitNumberOfFilesProcessed) {

		this.sourceDir = sourceDir;
		this.dataSet = dataSet;
		this.dirFilter = dirFilter;
		this.fileFilter = fileFilter;
		this.regexYearExtractor = regexYearExtractor;
		this.limitNumberOfFilesProcessed = limitNumberOfFilesProcessed;
	}

	
	/**
	 * Simple version that creates its own ExecutorService.
	 * @throws Exception 
	 */
	public void process() throws Exception {
		ExecutorService executor = Executors.newFixedThreadPool(1);
		process(executor);
		executor.shutdown();
		executor.awaitTermination(8, TimeUnit.HOURS);
	}
	
	public void process(ExecutorService executor) throws Exception {

		Collection<File> allFiles = FileUtils.listFiles(sourceDir, fileFilter, dirFilter);

		log.info("Found {} files to process.", allFiles.size());
		int current = 1;
		int errors = 0;

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
					log.error("!! FAILED TO SUBMIT INPUT FILE: " + f.getAbsolutePath(), e);
					errors++;
				}
				current++;

			} else if (limitNumberOfFilesProcessed != null && current >= limitNumberOfFilesProcessed) {
				log.info("Stopping directory processing b/c specified limit of {} files was reached", limitNumberOfFilesProcessed);
				break;
			}
			
		}
		
		log.info("Completed processing the raw {} source files with {} errors.", current, errors);
	}

}
