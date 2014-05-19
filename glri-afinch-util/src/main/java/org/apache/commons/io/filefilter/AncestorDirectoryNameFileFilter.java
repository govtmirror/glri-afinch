package org.apache.commons.io.filefilter;

import java.io.File;

/**
 * File filter that filters based on a filter applied the parent or ancestor directory.
 * 
 * In FileUtils.listFiles, a directory filter will block tree searching into a
 * directory based on that filter.  I want to filter based on the immediate parent,
 * regardless of the upper directories. So:
 * directory1
 * |-SubDirectory
 * . .|-Flowline	I want everything in directories called 'Flowline', regardless of upstream folder names.
 * 
 * By default, the ancestor level is 1, meaning that only the parent directory of
 * the current file is considered.  A level of 2 would allow the great ancestor
 * to be considered, and so on.
 * 
 * @author eeverman
 */
public class AncestorDirectoryNameFileFilter extends AbstractFileFilter {
	
	private final IOFileFilter filterForParentDirectory;
	private final int limitAncestorLevel;
			
	public AncestorDirectoryNameFileFilter(IOFileFilter filterForParentDirectory) {
		this(filterForParentDirectory, 1);
	}
	
	public AncestorDirectoryNameFileFilter(IOFileFilter filterForParentDirectory, int limitAncestorLevel) {
		this.filterForParentDirectory = filterForParentDirectory;
		this.limitAncestorLevel = limitAncestorLevel;
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
	 * This method will hunt up the ancestry chain until it finds a match (or not)
	 * limited by  the limitAncestorLevel param, which is by default 1 (ie, only
	 * considering the parent directory)
     * 
     * @param dir  the directory File to check
     * @param name  the filename within the directory to check
     * @return true if this file matches the test
     */
    public boolean accept(File dir, String name) {
		
		int currentLevel = 1;
		
		while (dir != null && currentLevel <= limitAncestorLevel) {
			if (filterForParentDirectory.accept(dir)) {
				return true;
			} else {
				dir = dir.getParentFile();
			}
			
			currentLevel++;
		}
		
        return false;
    }

}
