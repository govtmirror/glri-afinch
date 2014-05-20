package gov.usgs.cida.glri.afinch.raw;

import au.com.bytecode.opencsv.BigBufferCSVReader;
import au.com.bytecode.opencsv.CSVParser;
import java.io.BufferedReader;
import java.io.Closeable;
import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.io.Reader;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 *
 * @author eeverman
 */
public class RawCsvFile implements Closeable {
	
	private String[] userDefinedHeaders;
	private String[] allHeaders;
	private Map<String, Integer> headerNameMap;	//map from column name to column index
	BigBufferCSVReader csvReader;
	private int headerRow;	//zero based header row
	
	private String[] currentLine;	//The line we are on
	
	public RawCsvFile(File sourceFile, String... expectedHeaders) throws Exception {
		this.userDefinedHeaders = expectedHeaders;
		
		
		BufferedReader br = null;
		
		try {
			br = new BufferedReader(new FileReader(sourceFile));
			headerRow = findHeaderRow(br, expectedHeaders);
		} catch (Exception e) {
			tryToClose(br);
		}
		
		if (headerRow > -1) {
			
			csvReader = new BigBufferCSVReader(new FileReader(sourceFile), 
					CSVParser.DEFAULT_SEPARATOR, 
					CSVParser.DEFAULT_QUOTE_CHARACTER,
					CSVParser.DEFAULT_ESCAPE_CHARACTER, 
					headerRow,
					CSVParser.DEFAULT_STRICT_QUOTES,
					BigBufferCSVReader.DEFAULT_BUFFER
			);
			allHeaders = readNext();
			headerNameMap = mapHeaders(allHeaders);
		} else {
			throw new Exception("A header row containing the expected headers could not be found in '" + sourceFile.getAbsolutePath() + "'");
		}
	}
	
	public int getHeaderRow() {
		return headerRow;
	}
	
	public String[] getMappedHeaders() {
		return userDefinedHeaders;
	}
	
	
	private Map<String, Integer> mapHeaders(String[] allHeads) throws Exception {
		HashMap<String, Integer> map = new HashMap<String, Integer>(allHeads.length * 2 + 1);
		
		for (int i = 0; i < allHeads.length; i++) {
			map.put(allHeads[i], i);
		}
		
		return map;
	}
	
	/**
	 * Finds the header row by finding a row that contains all of the expected
	 * header column names.
	 * 
	 * 
	 * @param reader BufferedReader pointing to the sourceFile or other implementation
	 * @param expectedHeaders Param array of the expected headers.
	 * @return The zero based line containing the headers, or -1 if not found.
	 * @throws Exception 
	 */
	private int findHeaderRow(BufferedReader br, String[] expectedHeaders) throws Exception {
		String line = br.readLine();
		int currentLine = 0;
		
		while (line != null) {
			
			if (containsAllHeaders(expectedHeaders, line)) return currentLine;
			
			line = br.readLine();
			currentLine++;
		}
		
		return -1;
	}
	
	/**
	 * Determines if the potential header line contains all the passed header names.
	 * This is intended to be used to find the header row in a file, based on 
	 * expected header names.  In the AFINCH files, lots of lines preceed the
	 * header line, so this method helps to fine it.
	 * 
	 * @param headerNames
	 * @param line
	 * @return 
	 */
	public static boolean containsAllHeaders(String[] headerNames, String line) {
		boolean hasHeaders = false;	//true if the row contains each header 
		for (String header : headerNames) {
			hasHeaders = containsHeader(header, line);
			if (! hasHeaders) break;
		}

		return hasHeaders;
	}
	
	/**
	 * Determines if the potential header line contains the specified header.
	 * 
	 * @param headerName
	 * @param line
	 * @return 
	 */
	public static boolean containsHeader(String headerName, String line) {
		
		headerName = headerName.trim();
		return line.matches("(?:(?:^)|(.*\\,))\\s*" + headerName + "\\s*(?:(?:\\,.*)|(?:$))");
	}
	
	/**
	 * Stems a header name into a list of headers w/ month abbreviation suffixes
	 * and adds them to the existing list.
	 * 
	 * If the existing list is null, a new one is created.
	 * 
	 * @param headerName
	 * @param existingList
	 * @return The list
	 */
	public static List<String> stemHeaderByMonth(String headerName, List<String> existingList) {
		if (existingList == null) {
			existingList = new ArrayList<String>(12);
		}
		
		existingList.addAll(stemHeaderByMonth(headerName));
		return existingList;
	}
	
	/**
	 * Stems a header name into a list of headers w/ month abbreviation suffixes.
	 * 
	 * For instance, "Data" would stem to "DataOct", DataNov", etc, in water year order.
	 * 
	 * @param headerName
	 * @return 
	 */
	public static List<String> stemHeaderByMonth(String headerName) {
		ArrayList<String> list = new ArrayList<String>(12);
		
		for (WaterMonth m : WaterMonth.values()) {
			list.add(headerName + m.getMonthAbbr());
		}
		
		return list;
	}
	
	/**
	 * Error free closing of a Reader.
	 * 
	 * @param reader 
	 */
	public void tryToClose(Reader reader) {
		if (reader != null) {
			try {
				reader.close();
			} catch (Exception e) {
				//ignore
			}
		}
	}
	
	//Iterator-ish
	public boolean next() throws IOException {
		try {
			currentLine = readNext();
		} catch (IOException ex) {
			close();
			throw ex;
		}
		return (currentLine != null);
	}
	
	/**
	 * Reads the next line and splits it into trimmed Strings.
	 * 
	 * When called on the last row, null is returned.
	 * @return
	 * @throws IOException 
	 */
	public String[] readNext() throws IOException {
		String[] line = csvReader.readNext();
		
		if (line != null) {
			for (int i =0; i < line.length; i++) {
				line[i] = line[i].trim();
			}
		}
		
		currentLine = line;
		return currentLine;
	}
	
	public String getAsString(String columnName) {
		return currentLine[headerNameMap.get(columnName)];
	}
	
	public Long getAsLong(String columnName) {
		return Long.parseLong(getAsString(columnName));
	}
	
	public Double getAsDouble(String columnName) {
		return Double.parseDouble(getAsString(columnName));
	}
	
	/**
	 * Returns the value of the column specified by appending a month abbr.
	 * to the column name, ie:  Name + "Oct" for water month 0.
	 * 
	 * @param columnName
	 * @param waterMonth
	 * @return 
	 */
	public String getAsStringByMonth(String columnName, WaterMonth waterMonth) {
		String name = columnName + waterMonth.getMonthAbbr();
		return getAsString(name);
	}
	
	/**
	 * Returns the Long value of the column specified by appending a month abbr.
	 * to the column name, ie:  Name + "Oct" for water month 0.
	 * 
	 * @param columnName
	 * @param waterMonth
	 * @return 
	 */
	public Long getAsLongByMonth(String columnName, WaterMonth waterMonth) {
		String name = columnName + waterMonth.getMonthAbbr();
		return getAsLong(name);
	}
	
	/**
	 * Returns the Long value of the column specified by appending a month abbr.
	 * to the column name, ie:  Name + "Oct" for water month 0.
	 * 
	 * @param columnName
	 * @param waterMonth Zero indexed water month, starting w/ Oct == 0
	 * @return 
	 */
	public Double getAsDoubleByMonth(String columnName, WaterMonth waterMonth) {
		String name = columnName + waterMonth.getMonthAbbr();
		return getAsDouble(name);
	}
	
	public void close() throws IOException {
		if (csvReader != null) csvReader.close();
	}
}
