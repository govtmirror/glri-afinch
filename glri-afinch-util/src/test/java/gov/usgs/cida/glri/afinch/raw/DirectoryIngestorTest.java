package gov.usgs.cida.glri.afinch.raw;

import org.apache.commons.io.filefilter.AncestorDirectoryNameFileFilter;
import java.io.File;
import java.nio.file.Files;
import java.util.NavigableSet;
import java.util.regex.Pattern;
import org.apache.commons.io.filefilter.FileFilterUtils;
import org.apache.commons.io.filefilter.IOFileFilter;
import org.apache.commons.io.filefilter.NameFileFilter;
import org.apache.commons.io.filefilter.SuffixFileFilter;
import org.junit.Test;

/**
 *
 * @author eeverman
 */
public class DirectoryIngestorTest {

	public DirectoryIngestorTest() {
	}
	
	

	
	//@Test This is system dependant, but provides a good template for how this is done.
	public void bigTest() throws Exception {
		ReachMap dataSet = new ReachMap("ComID", "QAccCon", "QAccWua");
		File srcDir = new File("/datausgs/project_workspaces/glri-afinch-data/from clluukkoo/AFinch");
		IOFileFilter actualFileFilter = new SuffixFileFilter(".csv");
		IOFileFilter fileParentDirFilter = new AncestorDirectoryNameFileFilter(new NameFileFilter("Flowlines"));
		IOFileFilter completeFileFilter = FileFilterUtils.and(actualFileFilter, fileParentDirFilter);
		IOFileFilter dirFilter = FileFilterUtils.trueFileFilter();
		Pattern yearFromNameExtractor = Pattern.compile(".*WY(\\d\\d\\d\\d).*");
		
		DirectoryIngestor din = new DirectoryIngestor(srcDir, dataSet, completeFileFilter, dirFilter, yearFromNameExtractor, 4);
		din.ingest();
		
		
		//
		//write out
		File outDir = Files.createTempDirectory("ReachFileWriterTest").toFile();
		
		NavigableSet<Long> set = dataSet.keySet();
		
		for (Long id : set) {
			Reach r = dataSet.get(id);
			ReachWriter w = new ReachWriter(outDir, r, "DateTime",
					ReachWriter.DEFAULT_DATE_FORMAT,
					ReachWriter.DEFAULT_NUMBER_FORMAT, false);
			w.call();
		}
		
		System.out.println("Write files to: " + outDir.getAbsoluteFile());
	}
	
}
