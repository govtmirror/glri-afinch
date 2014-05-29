/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

package gov.usgs.cida.glri.afinch.raw;

import au.com.bytecode.opencsv.CSVWriter;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileWriter;
import java.text.DecimalFormat;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Date;
import java.util.Iterator;
import java.util.Map;
import java.util.concurrent.Callable;

/**
 *
 * @author eeverman
 */
public class ReachWriter implements Callable<ReachWriter> {
	
	public final static String DEFAULT_DATE_FORMAT = "yyyy-MM-dd'T'HH:mm:ss'UTC'";
	public final static String DEFAULT_NUMBER_FORMAT = "#.##;-#.##";
	
	private final File outputFile;
	private final Reach reach;
	private final String timeStampColName;
	private final DecimalFormat numberFormat;
	private final SimpleDateFormat dateFormat;
	private final boolean replaceIfExists;
	private int valueCount = 0;
	
	/**
	 * Constructs a new writer that will write a file into the specified directory, which must exist.
	 * 
	 * The created file name will be the Reach id ".txt".  If that file already
	 * exists, an exception will be thrown when write() is called, unless replaceIfExists
	 * is true.
	 * 
	 * @param directory
	 * @param reach
	 * @param replaceIfExists If true, the output file (not the directory) will be replaced if it exists.
	 * @throws Exception 
	 */
	public ReachWriter(File directory, Reach reach, String timeStampColName, 
			String dateFormatStr, String numberFormatStr, boolean replaceIfExists) throws Exception {
		
		if (! directory.exists() || ! directory.canWrite()) {
			throw new Exception("The output directory '" + directory.getAbsolutePath() + "' does not exist or cannot be written to.");
		}
		
		outputFile = new File(directory,  reach.getId().toString() + ".csv");
		this.reach = reach;
		this.timeStampColName = timeStampColName;
		this.dateFormat = new SimpleDateFormat(dateFormatStr);
		this.numberFormat = new DecimalFormat(numberFormatStr);
		this.replaceIfExists = replaceIfExists;
	}
	
	public ReachWriter call() throws Exception {
		if (outputFile.exists()) {
			if (replaceIfExists) {
				outputFile.delete();
			} else {
				throw new Exception("The file '" + outputFile.getAbsolutePath() + "' already exists.");
			}
		}
		
		BufferedWriter fileWriter = new BufferedWriter(new FileWriter(outputFile), 1024 * 32);
		try (CSVWriter writer = new CSVWriter(fileWriter, ',', CSVWriter.NO_QUOTE_CHARACTER);) {

			
			//Write headers
			String[] dataHeaders = reach.getHeaders();	//Use now for headers, but keep re-using
			ArrayList<String> allHeaders = new ArrayList<String>(dataHeaders.length + 1);
			allHeaders.add(timeStampColName);
			Collections.addAll(allHeaders, dataHeaders);
			
			writer.writeNext(allHeaders.toArray(new String[allHeaders.size()]));
			
			
			//Write all data
			String[] out = new String[allHeaders.size()];
			Iterator<Map.Entry<Long, double[]>> i = reach.iterator();

			while (i.hasNext()) {
				Map.Entry<Long, double[]> entry = i.next();
				format(entry.getKey(), entry.getValue(), out);
				writer.writeNext(out);
				
				valueCount++;
			}
			
			return this;
		}
		
	}
	
	/**
	 * Formats and puts into a single string array the timestamp and all the data.
	 * 
	 * The passed out[] array is intended to reused.
	 * 
	 * @param timeStamp
	 * @param values
	 * @param out 
	 */
	private void format(Long timeStamp, double[] values, String[] out) {
		
		Date d = new Date(timeStamp);
		out[0] = dateFormat.format(d);
		
		for (int i = 0; i < values.length; i++) {
			out[i + 1] = numberFormat.format(values[i]);
		}
	}
	
	public String getDescription() {
		return "Reach " + reach.getId().toString() + " with " + valueCount + " values";
	}
}
