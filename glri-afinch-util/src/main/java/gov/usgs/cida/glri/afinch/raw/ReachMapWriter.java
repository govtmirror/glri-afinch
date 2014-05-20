/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

package gov.usgs.cida.glri.afinch.raw;

import java.io.File;
import java.text.DecimalFormat;
import java.text.SimpleDateFormat;
import java.util.NavigableSet;
import java.util.concurrent.ExecutorService;

/**
 *
 * @author eeverman
 */
public class ReachMapWriter {
	
	private final File destinationDirectory;
	private final ReachMap reaches;
	private final String timeStampColName;
	private final String numberFormatStr;
	private final String dateFormatStr;
	private final boolean replaceIfExists;
	
	
	ReachMapWriter(File destinationDirectory, ReachMap reaches, String timeStampColName, 
			String dateFormatStr, String numberFormatStr, boolean replaceIfExists) throws Exception {
		
		this.destinationDirectory = destinationDirectory;
		this.reaches = reaches;
		this.timeStampColName = timeStampColName;
		this.numberFormatStr = numberFormatStr;
		this.dateFormatStr = dateFormatStr;
		this.replaceIfExists = replaceIfExists;
		
	}
	
	public void write(ExecutorService executor) throws Exception {

		//
		//Write output
		NavigableSet<Long> set = reaches.keySet();
		System.out.println("Begin writing " + set.size() + " output files.");

		for (Long id : set) {

			Reach r = reaches.get(id);
			ReachWriter w = new ReachWriter(destinationDirectory, r, timeStampColName,
					dateFormatStr,
					numberFormatStr, replaceIfExists);
			
			executor.submit(w);
		}
	}
}
