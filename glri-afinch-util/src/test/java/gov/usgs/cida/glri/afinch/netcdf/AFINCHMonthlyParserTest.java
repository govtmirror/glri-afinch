/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

package gov.usgs.cida.glri.afinch.netcdf;

import gov.usgs.cida.watersmart.parse.StationLookup;
import java.io.IOException;
import java.io.InputStream;
import java.util.LinkedList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import javax.xml.stream.XMLStreamException;
import org.joda.time.Instant;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;
import org.junit.Test;

/**
 *
 * @author eeverman
 */
public class AFINCHMonthlyParserTest {
	
	@Test
	public void tryToParseADateAndOneNumber() throws Exception {
		//LocalParser parser = new LocalParser(null, null, null);
		String line = "1950-10-01T00:00:00UTC,10.1";
		
		Matcher lineMatcher = LocalParser.dataLinePattern.matcher(line);
		
		assertTrue(lineMatcher.matches());
		
		String date = lineMatcher.group(1);
		String values = lineMatcher.group(2);
		
		assertEquals("1950-10-01T00:00:00UTC", date);
		
		
		Matcher valueMatcher = LocalParser.dataValuePattern.matcher(values);
		List<Float> floatVals = new LinkedList<Float>();
		
		while (valueMatcher.find()) {
			float value = Float.parseFloat(valueMatcher.group(1));
			floatVals.add(value);
		}
		
		assertEquals(1, floatVals.size());
		assertEquals(10.1f, (floatVals.get(0)), .000001f);
	}
	
	@Test
	public void tryToParseADateAndTwoNumbers() throws Exception {
		//LocalParser parser = new LocalParser(null, null, null);
		String line = "1950-10-01T00:00:00UTC,10.1,9.4";
		
		Matcher lineMatcher = LocalParser.dataLinePattern.matcher(line);
		
		assertTrue(lineMatcher.matches());
		
		String date = lineMatcher.group(1);
		String values = lineMatcher.group(2);
		
		assertEquals("1950-10-01T00:00:00UTC", date);
		
		
		Matcher valueMatcher = LocalParser.dataValuePattern.matcher(values);
		List<Float> floatVals = new LinkedList<Float>();
		
		while (valueMatcher.find()) {
			float value = Float.parseFloat(valueMatcher.group(1));
			floatVals.add(value);
		}
		
		assertEquals(2, floatVals.size());
		assertEquals(10.1f, (floatVals.get(0)), .000001f);
		assertEquals(9.4f, (floatVals.get(1)), .000001f);
	}
	
	@Test
	public void tryToParseADateAndOneNaN() throws Exception {

		String line = "1950-10-01T00:00:00UTC,NaN";
		
		Matcher lineMatcher = LocalParser.dataLinePattern.matcher(line);
		
		assertTrue(lineMatcher.matches());
		
		String date = lineMatcher.group(1);
		String values = lineMatcher.group(2);
		
		assertEquals("1950-10-01T00:00:00UTC", date);
		
		
		Matcher valueMatcher = LocalParser.dataValuePattern.matcher(values);
		List<Float> floatVals = new LinkedList<Float>();
		
		while (valueMatcher.find()) {
			float value = Float.parseFloat(valueMatcher.group(1));
			floatVals.add(value);
		}
		
		assertEquals(1, floatVals.size());
		assertTrue(Float.isNaN(floatVals.get(0)));
	}
	
	/**
	 * Subclass to give access to protected static vars.
	 */
	public static class LocalParser extends AFINCHMonthlyParser {
		public LocalParser(InputStream is, String filename, StationLookup lookerUpper) throws IOException, XMLStreamException {
			super(is, filename, lookerUpper);
		}
	}
}
