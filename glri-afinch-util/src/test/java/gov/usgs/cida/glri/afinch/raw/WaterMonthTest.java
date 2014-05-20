package gov.usgs.cida.glri.afinch.raw;

import java.util.GregorianCalendar;
import static org.junit.Assert.*;
import org.junit.Test;

/**
 *
 * @author eeverman
 */
public class WaterMonthTest {
	

	public WaterMonthTest() {
	}
	
	
	@Test
	public void getCalendarYearTest() throws Exception {

		assertEquals(1999, WaterMonth.OCT.getCalendarYear(2000));	//Oct
		assertEquals(1999, WaterMonth.DEC.getCalendarYear(2000));	//Dec
		assertEquals(2000, WaterMonth.JAN.getCalendarYear(2000));	//Jan
		assertEquals(2000, WaterMonth.SEP.getCalendarYear(2000));	//Sep
	}
	
	@Test
	public void getCalendarMonthTest() throws Exception {

		assertEquals(9, WaterMonth.OCT.getCalendarMonth());	//Oct
		assertEquals(11, WaterMonth.DEC.getCalendarMonth());	//Dec
		assertEquals(0, WaterMonth.JAN.getCalendarMonth());	//Jan
		assertEquals(8, WaterMonth.SEP.getCalendarMonth());	//Sep
	}
	
	@Test
	public void getCalendarTimeInMillisTest() throws Exception {

		GregorianCalendar day2000_09_01 = new GregorianCalendar(2000, 9, 1);
		GregorianCalendar day2001_01_01 = new GregorianCalendar(2001, 0, 1);
		
		assertEquals(day2000_09_01.getTimeInMillis(), WaterMonth.OCT.getCalendarTimeInMillis(2001));
		assertEquals(day2001_01_01.getTimeInMillis(), WaterMonth.JAN.getCalendarTimeInMillis(2001));
	}
	
}
