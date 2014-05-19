/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

package org.apache.commons.io.filefilter;

import java.io.File;
import java.util.Collection;
import org.apache.commons.io.FileUtils;
import org.junit.After;
import org.junit.AfterClass;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;
import static org.junit.Assert.*;

/**
 *
 * @author eeverman
 */
public class AncestorDirectoryNameFileFilterTest {
	
	File dir;
	File file;
	File unrelatedFile;
		
	public AncestorDirectoryNameFileFilterTest() {
	}
	
	@Before
	public void beforeTest() {
		dir = new File("/path/AFinch/LMBWOutput - 2011_12/Flowlines");
		file = new File("/path/AFinch/LMBWOutput - 2011_12/Flowlines/something.csv");
		unrelatedFile = new File("/path/to/something/else/text.csv");
	}

	@Test
	public void OneLevelDeepTest(){

		
		AncestorDirectoryNameFileFilter filter = new AncestorDirectoryNameFileFilter(new RegexFileFilter("LMBWOutput.*"), 1);
		
		assertTrue(filter.accept(dir));
		assertTrue(filter.accept(dir.getParentFile(), dir.getName()));
		
		assertFalse(filter.accept(unrelatedFile));
		assertFalse(filter.accept(unrelatedFile.getParentFile(), unrelatedFile.getName()));
		
		assertFalse(filter.accept(file));
		assertFalse(filter.accept(file.getParentFile(), file.getName()));
	}
	
	@Test
	public void TwoLevelDeepTest(){
		
		AncestorDirectoryNameFileFilter filter = new AncestorDirectoryNameFileFilter(new RegexFileFilter("LMBWOutput.*"), 2);
		
		assertTrue(filter.accept(dir));
		assertTrue(filter.accept(dir.getParentFile(), dir.getName()));
		
		assertFalse(filter.accept(unrelatedFile));
		assertFalse(filter.accept(unrelatedFile.getParentFile(), unrelatedFile.getName()));
		
		assertTrue(filter.accept(file));
		assertTrue(filter.accept(file.getParentFile(), file.getName()));
	}
	
	@Test
	public void complexWrappingTest() {
		
		File OkDir = new File("/path/AFinch/HR0412_15Output - 2011_12/Flowlines");
		File OkFile = new File("/path/AFinch/HR0412_15Output - 2011_12/Flowlines/test.csv");
		
		IOFileFilter actualFileFilter = new SuffixFileFilter(".csv");
		IOFileFilter fileParentDirFilter = new AncestorDirectoryNameFileFilter(new NameFileFilter("Flowlines"));
		IOFileFilter hucNamesParentDirFilter = new AncestorDirectoryNameFileFilter(new RegexFileFilter("HR\\d\\d\\d\\d_.*"), 2);
		IOFileFilter completeFileFilter = FileFilterUtils.and(actualFileFilter, fileParentDirFilter, hucNamesParentDirFilter);
		
		assertFalse(completeFileFilter.accept(dir));
		assertFalse(completeFileFilter.accept(dir.getParentFile(), dir.getName()));
		
		assertFalse(completeFileFilter.accept(unrelatedFile));
		assertFalse(completeFileFilter.accept(unrelatedFile.getParentFile(), unrelatedFile.getName()));
		
		assertFalse(completeFileFilter.accept(file));
		assertFalse(completeFileFilter.accept(file.getParentFile(), file.getName()));
		
		assertTrue(completeFileFilter.accept(OkFile));
		assertTrue(completeFileFilter.accept(OkFile.getParentFile(), OkFile.getName()));
	}
	
	//@Test
	public void localFileSystemTestNotForProdUse() {
		IOFileFilter actualFileFilter = new SuffixFileFilter(".csv");
		IOFileFilter fileParentDirFilter = new AncestorDirectoryNameFileFilter(new NameFileFilter("Flowlines"));
		IOFileFilter hucNamesParentDirFilter = new AncestorDirectoryNameFileFilter(new RegexFileFilter("HR\\d\\d\\d\\d_.*"), 2);
		IOFileFilter completeFileFilter = FileFilterUtils.and(actualFileFilter, fileParentDirFilter, hucNamesParentDirFilter);
		IOFileFilter dirFilter = FileFilterUtils.trueFileFilter();
		
		File sourceDir = new File("/datausgs/project_workspaces/glri-afinch-data/from clluukkoo/AFinch");
		Collection<File> allFiles = FileUtils.listFiles(sourceDir, completeFileFilter, dirFilter);
		
		System.out.println("Including these files: (" + allFiles.size() + ")");
		for (File f : allFiles) {
			System.out.println(f.getAbsoluteFile());
		}
	}

}
