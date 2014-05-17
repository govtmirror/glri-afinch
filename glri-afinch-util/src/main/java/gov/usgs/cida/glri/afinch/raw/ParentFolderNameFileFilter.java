package gov.usgs.cida.glri.afinch.raw;

import java.io.File;
import org.apache.commons.io.filefilter.AbstractFileFilter;
import org.apache.commons.io.filefilter.IOFileFilter;

/**
 * File filter that filters based on a filter applied to the parent directory.
 * 
 * In FileUtils.listFiles, a directory filter will block tree searching into a
 * directory based on that filter.  I want to filter based on the immediate parent,
 * regardless of the upper directories. So:
 * directory1
 * |-SubDirectory
 * . .|-Flowline	I want everything in directories called 'Flowline', regardless of upstream folder names.
 * @author eeverman
 */
public class ParentFolderNameFileFilter extends AbstractFileFilter {
	
	private final IOFileFilter filterForParentDirectory;
			
	public ParentFolderNameFileFilter(IOFileFilter filterForParentDirectory) {
		this.filterForParentDirectory = filterForParentDirectory;
	}
    /**
     * Checks to see if the File should be accepted by this filter.
     * 
     * @param file  the File to check
     * @return true if this file matches the test
     */
    public boolean accept(File file) {
        return accept(file.getParentFile(), file.getName());
    }

    /**
     * Checks to see if the File should be accepted by this filter.
     * 
     * @param dir  the directory File to check
     * @param name  the filename within the directory to check
     * @return true if this file matches the test
     */
    public boolean accept(File dir, String name) {
        return filterForParentDirectory.accept(dir);
    }

}
