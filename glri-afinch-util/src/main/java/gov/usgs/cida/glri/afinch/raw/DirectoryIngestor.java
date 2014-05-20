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

/**
 *
 * @author eeverman
 */
public class DirectoryIngestor {

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

	
	
	public void ingest() throws Exception {
		ExecutorService executor = Executors.newFixedThreadPool(1);
		ingest(executor);
		executor.shutdown();
		executor.awaitTermination(8, TimeUnit.HOURS);
	}
	
	public void ingest(ExecutorService executor) throws Exception {

		Collection<File> allFiles = FileUtils.listFiles(sourceDir, fileFilter, dirFilter);

		System.out.println("Found " + allFiles.size() + " files to process.");
		int current = 1;

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
	}

}
