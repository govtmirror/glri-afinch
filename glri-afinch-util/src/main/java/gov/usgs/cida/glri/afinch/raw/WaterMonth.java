package gov.usgs.cida.glri.afinch.raw;

import java.util.GregorianCalendar;

/**
 * Represents the months in the order they occur in a water year.
 * 
 * In a water year, Oct, Nov and Dec are actually in the previous calendar year.
 * 
 * @author eeverman
 */
public enum WaterMonth {
	
	OCT(0, 9, "Oct", -1),
	NOV(1, 10, "Nov", -1),
	DEC(2, 11, "Dec", -1),
	JAN(3, 0, "Jan", 0),
	FEB(4, 1, "Feb", 0),
	MAR(5, 2, "Mar", 0),
	APR(6, 3, "Apr", 0),
	MAY(7, 4, "May", 0),
	JUN(8, 5, "Jun", 0),
	JUL(9, 6, "Jul", 0),
	AUG(10, 7, "Aug", 0),
	SEP(11, 8, "Sep", 0);
	
	
	private final int index;	//Zero based month index
	private final int calMonth;	//Zero based calendar month
	private final String abbr;	//abbreviated name
	private final int calWterYearAdj;	//Amount to add to the water year to determine the calendar year.
	
	private WaterMonth(int index, int zeroBasedCalMonth, String abbr, int calWterYearAdj) {
		this.index = index;
		calMonth = zeroBasedCalMonth;
		this.abbr = abbr;
		this.calWterYearAdj = calWterYearAdj;
	}
	
	/**
	 * Find an instance based on its zero based month index where Oct == 0.
	 * @param zeroBasedIndex
	 * @return An instance or null if a index < 0 or > 11 is provided.
	 */
	public static WaterMonth get(int zeroBasedIndex) {
		for (WaterMonth w : WaterMonth.values()) {
			if (w.index == zeroBasedIndex) return w;
		}
		return null;
	}
	
	public String getMonthAbbr() {
		return abbr;
	}
	
	/**
	 * Determines the calendar year based on the zero based index into the
	 * water months.
	 * 
	 * In the water month array, month 0 is October of the previous year.
	 * ref WATER_MONTHS and 'water year' in wikipedia.
	 * @param waterYear The nominal water year
	 * @return 
	 */
	public int getCalendarYear(int waterYear) {
		return waterYear + calWterYearAdj;
	}
	
	/**
	 * Determines the zero based calendar month (Jan == 0) of the specified
	 * zero based water year month index (index into WATER_MONTHS).
	 * 
	 * @return 
	 */
	public int getCalendarMonth() {
		return this.calMonth;
	}
	
	/**
	 * Returns the calendar time in MilliSeconds for the first day of the water month.
	 * 
	 * Corresponds to GregorianCalendar.getTimeInMillis().
	 * 
	 * @param waterYear
	 * @return 
	 */
	public long getCalendarTimeInMillis(int waterYear) {
		int y = getCalendarYear(waterYear);
		GregorianCalendar time = new GregorianCalendar(y, getCalendarMonth(), 1);
		return time.getTimeInMillis();
	}
}
