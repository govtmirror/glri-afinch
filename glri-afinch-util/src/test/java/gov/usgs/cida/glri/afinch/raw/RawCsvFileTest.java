package gov.usgs.cida.glri.afinch.raw;

import java.io.File;
import java.util.ArrayList;
import java.util.List;
import org.junit.After;
import org.junit.AfterClass;
import static org.junit.Assert.*;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;
import static gov.usgs.cida.glri.afinch.raw.WaterMonth.*;

/**
 *
 * @author eeverman
 */
public class RawCsvFileTest {
	
	final String COMPLEX_SOURCE_FILE_PATH = "AccumFlowsWY1951.csv";
	final String SIMPLE_SOURCE_FILE_PATH = "simple.csv";
	final String SIMPLE_MONTH_SOURCE_FILE_PATH = "simpleMonth.csv";
	
	//Header line taken from sample file
	final String COMPLEX_HEADER_LINE = "ComID,QAccConOct,QAccConNov,QAccConDec,QAccConJan,"
			+ "QAccConFeb,QAccConMar,QAccConApr,QAccConMay,QAccConJun,QAccConJul,"
			+ "QAccConAug,QAccConSep,QAccWuaOct,QAccWuaNov,QAccWuaDec,QAccWuaJan,"
			+ "QAccWuaFeb,QAccWuaMar,QAccWuaApr,QAccWuaMay,QAccWuaJun,QAccWuaJul,"
			+ "QAccWuaAug,QAccWuaSep";
	
	//First, 2nd and last headers in the complex file
	final String CPX_HEADER_1 = "ComID";
	final String CPX_HEADER_2 = "QAccConOct";
	final String CPX_HEADER_3 = "QAccWuaSep";
	final String[] CPX_HEADERS = {CPX_HEADER_1, CPX_HEADER_2, CPX_HEADER_3};
	
	//First, 2nd and last headers in the simple file
	final String SIMP_HEADER_1 = "col0";
	final String SIMP_HEADER_2 = "col1";
	final String SIMP_HEADER_3 = "col3";
	final String[] SIMP_HEADERS = {SIMP_HEADER_1, SIMP_HEADER_2, SIMP_HEADER_3};
	
	File complexFile;
	File simpleFile;
	File simpleMonthFile;
	
	public RawCsvFileTest() {
	}
	
	@BeforeClass
	public static void setUpClass() {

		
	}
	
	@AfterClass
	public static void tearDownClass() {
	}
	
	@Before
	public void setUp() throws Exception {
		String fileName = RawCsvFileTest.class.getClassLoader().getResource(COMPLEX_SOURCE_FILE_PATH).getFile();
		complexFile = new File(fileName);
		
		fileName = RawCsvFileTest.class.getClassLoader().getResource(SIMPLE_SOURCE_FILE_PATH).getFile();
		simpleFile = new File(fileName);
		
		fileName = RawCsvFileTest.class.getClassLoader().getResource(SIMPLE_MONTH_SOURCE_FILE_PATH).getFile();
		simpleMonthFile = new File(fileName);
	}
	
	@After
	public void tearDown() {

	}
	
	@Test
	public void containsHeaderBasicTest() {
		
		assertTrue(RawCsvFile.containsHeader("a", "a"));
		assertTrue(RawCsvFile.containsHeader("a", " a "));
		assertTrue(RawCsvFile.containsHeader("a", "a,b,c"));
		assertTrue(RawCsvFile.containsHeader("a", " a ,b,c"));
		assertTrue(RawCsvFile.containsHeader("b", "a,b,c"));
		assertTrue(RawCsvFile.containsHeader("b", "a, b ,c"));
		assertTrue(RawCsvFile.containsHeader("b", "a, , b ,,,c"));
		assertTrue(RawCsvFile.containsHeader("c", "a,b,c"));
		
		assertFalse(RawCsvFile.containsHeader("d", "a,b,c"));
		assertFalse(RawCsvFile.containsHeader("b", "a,x b,c"));
		assertFalse(RawCsvFile.containsHeader("b", "a,b x,c"));
		
		assertFalse(RawCsvFile.containsHeader("", "a,b,c"));
	}
	
	@Test
	public void containsHeaderRealishTest() {
		
		assertTrue(RawCsvFile.containsHeader(CPX_HEADER_1, COMPLEX_HEADER_LINE));
		assertTrue(RawCsvFile.containsHeader(" \t" + CPX_HEADER_1 + "\t \t", COMPLEX_HEADER_LINE));
		assertTrue(RawCsvFile.containsHeader(CPX_HEADER_1, "\t \t" + COMPLEX_HEADER_LINE));
		assertTrue(RawCsvFile.containsHeader(" \t" + CPX_HEADER_1 + "\t \t", "\t \t" + COMPLEX_HEADER_LINE));
		assertFalse(RawCsvFile.containsHeader("Com", COMPLEX_HEADER_LINE));
		assertFalse(RawCsvFile.containsHeader("ID", COMPLEX_HEADER_LINE));
		assertFalse(RawCsvFile.containsHeader("ComId", COMPLEX_HEADER_LINE));
		
		assertTrue(RawCsvFile.containsHeader(CPX_HEADER_2, COMPLEX_HEADER_LINE));
		assertTrue(RawCsvFile.containsHeader(" \t" + CPX_HEADER_2 + "\t \t", COMPLEX_HEADER_LINE));
		assertTrue(RawCsvFile.containsHeader(CPX_HEADER_2, "\t \t" + COMPLEX_HEADER_LINE));
		assertTrue(RawCsvFile.containsHeader(" \t" + CPX_HEADER_2 + "\t \t", " " + COMPLEX_HEADER_LINE));
		assertTrue(RawCsvFile.containsHeader(CPX_HEADER_2, "h1 , " + CPX_HEADER_2 + " , h3"));
		assertFalse(RawCsvFile.containsHeader("QAccCon", COMPLEX_HEADER_LINE));
		assertFalse(RawCsvFile.containsHeader("Oct", COMPLEX_HEADER_LINE));
		assertFalse(RawCsvFile.containsHeader(CPX_HEADER_2, "h1 , x " + CPX_HEADER_2 + " , h3"));
		assertFalse(RawCsvFile.containsHeader(CPX_HEADER_2, "h1 , " + CPX_HEADER_2 + " x , h3"));
		
		assertTrue(RawCsvFile.containsHeader(CPX_HEADER_3, COMPLEX_HEADER_LINE));
		assertTrue(RawCsvFile.containsHeader(" \t" + CPX_HEADER_3 + "\t \t", COMPLEX_HEADER_LINE));
		assertTrue(RawCsvFile.containsHeader(CPX_HEADER_3, "\t \t" + COMPLEX_HEADER_LINE + " \t "));
		assertTrue(RawCsvFile.containsHeader(" \t" + CPX_HEADER_3 + "\t \t", " " + COMPLEX_HEADER_LINE));
		assertTrue(RawCsvFile.containsHeader(CPX_HEADER_3, "h1 , h2,  " + CPX_HEADER_3 + " \t "));
		assertTrue(RawCsvFile.containsHeader(CPX_HEADER_3, "h1 , h2,  " + CPX_HEADER_3 + " "));
		assertFalse(RawCsvFile.containsHeader("QAccWua", COMPLEX_HEADER_LINE));
		assertFalse(RawCsvFile.containsHeader("Sep", COMPLEX_HEADER_LINE));
		assertFalse(RawCsvFile.containsHeader(CPX_HEADER_3, "h1 , h2 " + CPX_HEADER_3 ));
		assertFalse(RawCsvFile.containsHeader(CPX_HEADER_3, "h1 , h2 ,, x" + CPX_HEADER_3 + " "));
		
	}


	@Test
	public void containsAllHeadersTest() {
		assertTrue(RawCsvFile.containsAllHeaders(CPX_HEADERS, COMPLEX_HEADER_LINE));
		assertFalse(RawCsvFile.containsAllHeaders(new String[] {""}, COMPLEX_HEADER_LINE));
		assertFalse(RawCsvFile.containsAllHeaders(new String[] {CPX_HEADER_1, "SomethingElse", CPX_HEADER_3}, COMPLEX_HEADER_LINE));
		
		//Month stemed headers
		List<String> qAccConList = RawCsvFile.stemHeaderByMonth("QAccCon");
		assertTrue(RawCsvFile.containsAllHeaders(qAccConList.toArray(new String[12]), COMPLEX_HEADER_LINE));
		
		List<String> qAccWuaList = RawCsvFile.stemHeaderByMonth("QAccWua");
		assertTrue(RawCsvFile.containsAllHeaders(qAccWuaList.toArray(new String[12]), COMPLEX_HEADER_LINE));
		
		List<String> combinedList = new ArrayList<String>(25);
		combinedList.addAll(qAccConList);
		combinedList.addAll(qAccWuaList);
		combinedList.add(CPX_HEADER_1);
		assertTrue(RawCsvFile.containsAllHeaders(combinedList.toArray(new String[25]), COMPLEX_HEADER_LINE));
	}
	
	@Test
	public void stemHeaderByMonthTest() {
		List<String> list = RawCsvFile.stemHeaderByMonth("Test");
		assertEquals("TestOct", list.get(0));
		assertEquals("TestNov", list.get(1));
		assertEquals("TestDec", list.get(2));
		assertEquals("TestJan", list.get(3));
		assertEquals("TestFeb", list.get(4));
		assertEquals("TestMar", list.get(5));
		assertEquals("TestApr", list.get(6));
		assertEquals("TestMay", list.get(7));
		assertEquals("TestJun", list.get(8));
		assertEquals("TestJul", list.get(9));
		assertEquals("TestAug", list.get(10));
		assertEquals("TestSep", list.get(11));
		assertEquals(12, list.size());
		
		List<String> list2 = RawCsvFile.stemHeaderByMonth("Test1", null);
		RawCsvFile.stemHeaderByMonth("Test2", list2);
		assertEquals("Test1Oct", list2.get(0));
		assertEquals("Test2Sep", list2.get(23));
		assertEquals(24, list2.size());
	}
	
	@Test
	public void FindHeaderRowInComplexFileTest() throws Exception {
		RawCsvFile csv = new RawCsvFile(complexFile, "ComID");
		assertEquals(19, csv.getHeaderRow());
	}
	
	@Test
	public void FindHeaderRowWithStemedHeadersInComplexFileTest() throws Exception {
		
		//Month stemed headers
		List<String> headers = RawCsvFile.stemHeaderByMonth("QAccCon");
		RawCsvFile.stemHeaderByMonth("QAccWua", headers);
		headers.add(CPX_HEADER_1);
		
		
		RawCsvFile csv = new RawCsvFile(complexFile, headers.toArray(new String[25]));
		assertEquals(19, csv.getHeaderRow());
	}
	
	@Test
	public void ReadValuesOutOfTheSimpleFile() throws Exception {
		RawCsvFile csv = new RawCsvFile(simpleFile, SIMP_HEADERS);
		
		//First data line
		assertTrue(csv.next());
		assertEquals("r0v0", csv.getAsString("col0"));
		assertEquals("r0v1", csv.getAsString("col1"));
		assertEquals("r0v2", csv.getAsString("col2"));
		assertEquals("r0v3", csv.getAsString("col3"));
		
		//Second line
		assertTrue(csv.next());
		assertEquals("r1v0", csv.getAsString("col0"));
		assertEquals("r1v3", csv.getAsString("col3"));
		
		//Third line
		assertTrue(csv.next());
		assertEquals("r2v0", csv.getAsString("col0"));
		assertEquals("r2v3", csv.getAsString("col3"));
		
		assertFalse(csv.next());	//all done
		
	}
	
	@Test
	public void ReadValuesFromTheSimpleMonthFile() throws Exception {
		RawCsvFile csv = new RawCsvFile(simpleMonthFile, "indexCol", "valDec");
		
		//First data line
		assertTrue(csv.next());
		assertEquals("r0v0", csv.getAsString("indexCol"));
		assertEquals("r0v1", csv.getAsStringByMonth("val", OCT));
		assertEquals("r0v2", csv.getAsStringByMonth("val", NOV));
		assertEquals("r0v3", csv.getAsStringByMonth("val", DEC));
		
		//Second line
		assertTrue(csv.next());
		assertEquals("r1v0", csv.getAsString("indexCol"));
		assertEquals("r1v3", csv.getAsStringByMonth("val", DEC));
		
		//Third line
		assertTrue(csv.next());
		assertEquals(new Long(99L), csv.getAsLong("indexCol"));
		assertEquals(new Double(100.1d), csv.getAsDoubleByMonth("val", OCT));
		assertEquals(new Double(100.2d), csv.getAsDoubleByMonth("val", NOV));
		assertEquals(new Double(.3d), csv.getAsDoubleByMonth("val", DEC));
		
		assertFalse(csv.next());	//all done
		
	}
	
	@Test
	public void ReadValuesFromTheComplexFile() throws Exception {
		RawCsvFile csv = new RawCsvFile(complexFile, CPX_HEADERS);
		
		int linesRead = 0;
		
		//First data line
		assertTrue(csv.next());
		linesRead++;
		assertEquals(new Long(1754888L), csv.getAsLong("ComID"));
		assertEquals(new Double(1.881797d), csv.getAsDoubleByMonth("QAccCon", OCT), .000001d);
		assertEquals(new Double(2.338974d), csv.getAsDoubleByMonth("QAccCon", NOV), .000001d);
		assertEquals(new Double(1.086326d), csv.getAsDoubleByMonth("QAccCon", DEC), .000001d);
		
		//Second line
		assertTrue(csv.next());
		linesRead++;
		assertEquals(new Long(1754890L), csv.getAsLong("ComID"));
		assertEquals(new Double(.339861d), csv.getAsDoubleByMonth("QAccCon", OCT), .000001d);
		assertEquals(new Double(.429507d), csv.getAsDoubleByMonth("QAccCon", NOV), .000001d);
		assertEquals(new Double(0.210442d), csv.getAsDoubleByMonth("QAccCon", DEC), .000001d);
		
		//Iterate thru end
		while (csv.next()) {
			linesRead++;
		}
		
		assertEquals(980, linesRead);	//Should be this many data lines
		
	}
}
