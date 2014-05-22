package gov.usgs.cida.glri.afinch.netcdfagg;

import com.google.common.base.Joiner;
import gov.usgs.cida.glri.afinch.AfinchFileProcessor;
import gov.usgs.cida.glri.afinch.SimpleCLIOptions;
import gov.usgs.cida.glri.afinch.stats.Statistics1D;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import org.apache.commons.cli.CommandLine;
import org.joda.time.DateTime;
import org.joda.time.Days;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import ucar.ma2.Array;
import ucar.ma2.DataType;
import ucar.ma2.InvalidRangeException;
import ucar.nc2.Attribute;
import ucar.nc2.Dimension;
import ucar.nc2.NetcdfFile;
import ucar.nc2.NetcdfFileWriter;
import ucar.nc2.Variable;
import ucar.nc2.constants.CDM;
import ucar.nc2.constants.CF;

/**
 * Notes from Eric Everman 5/21/2014 (Originally writen by Tom K., but there are no docs).
 * 
 * It looks like this utility reads in a nc file and creates a new nc file with
 * aggregate stats.  Tom's version had hard-coded file locations, so I'll
 * make those configurable.
 * 
 */
public class ProcessToAddNCFAggValues {

	private static Logger log = LoggerFactory.getLogger(ProcessToAddNCFAggValues.class);
	
	//User specified
	private final File inputFile;			//File that will be read
	private final File outputFile;		//File to be writen
	
	
	//State
    private final NetcdfFile ncInput;
    private final Variable oVariable;
	private final int stationIdLength;	//Max number of characters in the station ID.
    
    public ProcessToAddNCFAggValues(File inputFile, File outputFile) throws Exception {
		
		this.inputFile = inputFile;
		this.outputFile = outputFile;
		
		this.ncInput = NetcdfFile.open(inputFile.getAbsolutePath());
        this.oVariable = ncInput.findVariable("record");
		this.stationIdLength = ncInput.findDimension("station_id_len").getLength();	//9

		//
		//Ref
		System.out.println("Station count: " + ncInput.findDimension("station").getLength());	//91168
		
		ncInput.findDimension("station").getLength();	//91168
		for (Variable v : ncInput.getVariables()) {
			System.out.println("+++++++++++++++++++++++++++++++++++++++++++++++++++");
			System.out.println("var name: " + v.getShortName());
			System.out.println("     element size: " + v.getElementSize());
			System.out.println("     Attributes: ");
			printAttributes(v.getAttributes());
			
		}
		
		for (Dimension d : ncInput.getDimensions()) {
			System.out.println("+++++++++++++++++++++++++++++++++++++++++++++++++++");
			System.out.println("dim name: " + d.getShortName());
			System.out.println("     len: " + d.getLength());
			System.out.println("     group: " + d.getGroup().getShortName());
			System.out.println("     group attribs: -------------------------------");
			printAttributes(d.getGroup().getAttributes());
		}
		
		
		
    }
	
	private static void printAttributes(List<Attribute> attribs) {
		for (Attribute a : attribs) {
			System.out.println("         name: " + a.getShortName() + " length: " + a.getLength());
			if (a.isString()) {
				System.out.println("         str val: " + a.getStringValue());
			} else if (a.isArray()) {
				System.out.println("         Its an array!");
			} else {
				System.out.println("         str val: " + a.getNumericValue());
			}

		}
	}
    
    public void pivot() throws IOException, InvalidRangeException {
        long start = System.currentTimeMillis();
        
        
		ReadObserationsVisitor vistor = new ReadObserationsVisitor();
		new RaggedIndexArrayStructureObservationTraverser(oVariable).traverse(vistor);
		Map<Integer, List<Float>> observationMap = vistor.getObservationMap();

		System.out.println(
				"Station Count: " + vistor.stationCount + 
				" : TimeCountMin " + vistor.stationTimeCountMin +
				" : TimeCountMax " + vistor.stationTimeCountMax +
				" : RecordCount " + vistor.recordCount
				);
		System.out.println("Read and pivoted the input file in " + (System.currentTimeMillis() - start) + "ms");
		start = System.currentTimeMillis();

		generatePivotFile(observationMap, vistor.stationCount, stationIdLength, vistor.stationTimeCountMax);
		System.out.println("Wrote output file in " + (System.currentTimeMillis() - start) + "ms");
    }
    
    
    protected void generatePivotFile(Map<Integer, List<Float>> observationMap,
			int stationCount, int StationIdLength, int timeStepCount) throws IOException, InvalidRangeException {
		
        NetcdfFileWriter ncWriter = NetcdfFileWriter.createNew(NetcdfFileWriter.Version.netcdf3, outputFile.getAbsolutePath());
        
        Dimension nStationDim = ncWriter.addDimension(null, "station", stationCount);
        Dimension nStationIdLenDim = ncWriter.addDimension(null, "station_id_len", StationIdLength);
        Dimension nTimeDim = ncWriter.addDimension(null, "time", timeStepCount);
        
        Variable nStationIdVar = ncWriter.addVariable(null, "station_id", DataType.CHAR, Arrays.asList(nStationDim, nStationIdLenDim));
        nStationIdVar.addAttribute(new Attribute(CF.STANDARD_NAME, CF.STATION_ID));
        nStationIdVar.addAttribute(new Attribute(CF.CF_ROLE, CF.TIMESERIES_ID));

        Variable nTimeVar = ncWriter.addVariable(null, "time", DataType.INT, Arrays.asList(nTimeDim));
        nTimeVar.addAttribute(new Attribute(CF.STANDARD_NAME, "time"));
        nTimeVar.addAttribute(new Attribute(CDM.UNITS, "days since 1950-10-01T00:00:00.000Z"));
        nTimeVar.addAttribute(new Attribute(CF.CALENDAR, "gregorian"));
        
        Variable nLatVar = ncWriter.addVariable(null, "lat", DataType.FLOAT, Arrays.asList(nStationDim));
        nLatVar.addAttribute(new Attribute(CF.STANDARD_NAME, "latitude"));
        nLatVar.addAttribute(new Attribute(CDM.UNITS, CDM.LAT_UNITS));
        
        Variable nLonVar = ncWriter.addVariable(null, "lon", DataType.FLOAT, Arrays.asList(nStationDim));
        nLonVar.addAttribute(new Attribute(CF.STANDARD_NAME, "longitude"));
        nLonVar.addAttribute(new Attribute(CDM.UNITS, CDM.LON_UNITS));
        
        Variable nQAccConVar = ncWriter.addVariable(null, "QAccCon", DataType.FLOAT, Arrays.asList(nStationDim, nTimeDim));
        nQAccConVar.addAttribute(new Attribute(CF.COORDINATES, "time lat lon"));
        nQAccConVar.addAttribute(new Attribute(CDM.FILL_VALUE, Float.valueOf(-1f)));
        
        // STATS!
        Variable nQAccConMeanVar = ncWriter.addVariable(null, "QACMean", DataType.FLOAT, Arrays.asList(nStationDim));
        nQAccConMeanVar.addAttribute(new Attribute(CF.COORDINATES, "lat lon"));
        nQAccConMeanVar.addAttribute(new Attribute(CDM.FILL_VALUE, Float.valueOf(-1f)));
        
        Variable nQAccConMinVar = ncWriter.addVariable(null, "QACMin", DataType.FLOAT, Arrays.asList(nStationDim));
        nQAccConMinVar.addAttribute(new Attribute(CF.COORDINATES, "lat lon"));
        nQAccConMinVar.addAttribute(new Attribute(CDM.FILL_VALUE, Float.valueOf(-1f)));
        
        Variable nQAccConMaxVar = ncWriter.addVariable(null, "QACMax", DataType.FLOAT, Arrays.asList(nStationDim));
        nQAccConMaxVar.addAttribute(new Attribute(CF.COORDINATES, "lat lon"));
        nQAccConMaxVar.addAttribute(new Attribute(CDM.FILL_VALUE, Float.valueOf(-1f)));
        
        Variable nQAccConCountVar = ncWriter.addVariable(null, "QACCount", DataType.FLOAT, Arrays.asList(nStationDim));
        nQAccConCountVar.addAttribute(new Attribute(CF.COORDINATES, "lat lon"));
        nQAccConCountVar.addAttribute(new Attribute(CDM.FILL_VALUE, Float.valueOf(-1f)));
        
        Variable nQAccConCountMedian = ncWriter.addVariable(null, "QACMedian", DataType.FLOAT, Arrays.asList(nStationDim));
        nQAccConCountMedian.addAttribute(new Attribute(CF.COORDINATES, "lat lon"));
        nQAccConCountMedian.addAttribute(new Attribute(CDM.FILL_VALUE, Float.valueOf(-1f)));
        
        Variable[] QAccConDecileUpperBound = new Variable[9];
        for (int i = 0; i < 9; i++) {
            QAccConDecileUpperBound[i] = ncWriter.addVariable(null, String.format("QACDecile%d", i+1), DataType.FLOAT, Arrays.asList(nStationDim));
            QAccConDecileUpperBound[i].addAttribute(new Attribute(CF.COORDINATES, "lat lon"));
            QAccConDecileUpperBound[i].addAttribute(new Attribute(CDM.FILL_VALUE, Float.valueOf(-1f)));
        }
        
        Variable nQaccConDecile = ncWriter.addVariable(null, "QACDecile", DataType.FLOAT, Arrays.asList(nStationDim, nTimeDim));
        nQaccConDecile.addAttribute(new Attribute(CF.COORDINATES, "time lat lon"));
        nQaccConDecile.addAttribute(new Attribute(CDM.FILL_VALUE, Float.valueOf(-1f)));
        
        ncWriter.addGroupAttribute(null, new Attribute(CDM.CONVENTIONS, "CF-1.6"));
        ncWriter.addGroupAttribute(null, new Attribute(CF.FEATURE_TYPE, "timeSeries"));
        
        ncWriter.setFill(true);
        
        ncWriter.create();
        
        ncWriter.write(nStationIdVar, ncInput.findVariable("station_id").read());
        ncWriter.write(nLonVar, ncInput.findVariable("lat").read());
        ncWriter.write(nLatVar, ncInput.findVariable("lon").read());
        
        Array nTimeArray = Array.factory(DataType.INT, new int[] { timeStepCount } );
        DateTime baseDateTime = DateTime.parse("1950-10-01T00:00:00.000Z");
        DateTime currentDateTime = baseDateTime;
        for (int tIndex = 0; tIndex < timeStepCount; ++tIndex) {
            nTimeArray.setInt(tIndex, Days.daysBetween(baseDateTime, currentDateTime).getDays());
            currentDateTime = currentDateTime.plusMonths(1);
        }
        ncWriter.write(nTimeVar, nTimeArray);
        
        for (Map.Entry<Integer, List<Float>> entry : observationMap.entrySet()) {
            int stationIndex = entry.getKey();
            List<Float> values = entry.getValue();
            int timeMissing = timeStepCount - values.size();
            
            Statistics1D statistics = new Statistics1D();
            Array valueArray = Array.factory(DataType.FLOAT, new int[] { 1, timeStepCount - timeMissing} );
            int valueArrayIndex = 0;
            for (float value : values) {
                valueArray.setFloat(valueArrayIndex++, value);
                statistics.accumulate(value);
            }
            ncWriter.write(nQAccConVar, new int[] { stationIndex, timeMissing }, valueArray);
            
            ncWriter.write(nQAccConMeanVar, new int[] { stationIndex }, Array.factory( new double[] { statistics.getMean() }));
            ncWriter.write(nQAccConMinVar, new int[] { stationIndex }, Array.factory( new double[] { statistics.getMinimum()}));
            ncWriter.write(nQAccConMaxVar, new int[] { stationIndex }, Array.factory( new double[] { statistics.getMaximum()}));
            ncWriter.write(nQAccConCountVar, new int[] { stationIndex }, Array.factory( new double[] { statistics.getCount()}));
            
            List<Float> sorted = new ArrayList<Float>(values);
            Collections.sort(sorted);
            ncWriter.write(nQAccConCountMedian, new int[] { stationIndex }, Array.factory( new double[] { sorted.get(sorted.size() / 2) }));
            float[] decileBounds = new float[11];
            decileBounds[0] = (float)statistics.getMinimum();
            for (int i = 0; i < 9; ++i ) {
                decileBounds[i+1] = sorted.get(sorted.size() * (i + 1) / 10);
                ncWriter.write(QAccConDecileUpperBound[i], new int[] { stationIndex }, Array.factory( new double[] { decileBounds[i+1] }));
            }
            decileBounds[10] = (float)statistics.getMaximum();
        
            Array decileArray = Array.factory(DataType.FLOAT, new int[] { 1, timeStepCount - timeMissing} );
            int decileArrayIndex = 0;
            for (float value : values) {
                float decile = Float.NaN;
                if (decileBounds[0] != decileBounds[10]) {
                    for (int i = 0; i < 10 && Float.isNaN(decile); i++) {
                        if (value >= decileBounds[i] && value <= decileBounds[i+1]) {
                            decile = (float)i + ((value - decileBounds[i]) / (decileBounds[i+1] - decileBounds[i]));
                            decile /= 10f; // pseudo percentile
                        }
                    }
                }
                if (decile != decile) {
                    decile = -1;
                }
                decileArray.setFloat(decileArrayIndex++, decile);
            }
            ncWriter.write(nQaccConDecile, new int[] { stationIndex, timeMissing }, decileArray);
            
        }
        
        ncWriter.close();
    }
    
    public static class ReadObserationsVisitor extends AbstractObservationVisitor {
        
        private int stationIndexLast;
        private int stationCount;
        
        private int stationTimeCountMin = Integer.MAX_VALUE;
        private int stationTimeCountMax = Integer.MIN_VALUE;
        private ArrayList<Float> stationTimeSeries = null;
        
        private int recordCount;
        
        private Map<Integer, List<Float>> observationMap = new TreeMap<Integer, List<Float>>();

        ObservationVisitor delgate = new PrimingVisitor();
        
        @Override public void observation(int stationIndex, int timeIndex, float value) {
            delgate.observation(stationIndex, timeIndex, value);
        }
        @Override public void finish() {
            delgate.finish();
        }
        
        public class PrimingVisitor extends AbstractObservationVisitor {
            @Override public void observation(int stationIndex, int timeIndex, float value) {
                initStationData(stationIndex);
                recordCount++;
                delgate = new CountingVisitor();
            }
        }
        public class CountingVisitor extends AbstractObservationVisitor {
            @Override public void observation(int stationIndex, int timeIndex, float value) {
                if (stationIndexLast != stationIndex) {
                    processStationData();
                    initStationData(stationIndex);
                }
                stationTimeSeries.add(value);
                recordCount++;
            }
            @Override public void finish() {
                processStationData();
            }
        }    
        private void processStationData() {
            stationTimeSeries.trimToSize();
            observationMap.put(stationIndexLast, stationTimeSeries);
            int stationTimeCount = stationTimeSeries.size();
            if (stationTimeCount < stationTimeCountMin) {
                stationTimeCountMin = stationTimeCount;
            }
            if (stationTimeCount > stationTimeCountMax) {
                stationTimeCountMax = stationTimeCount;
            }
        }
        private void initStationData(int stationIndex) {
            stationIndexLast = stationIndex;
            stationCount++;
            stationTimeSeries = new ArrayList<Float>();
        }
        
        Map<Integer, List<Float>> getObservationMap() {
            return observationMap;
        } 
    }

	public static void main(String[] args) throws Exception {
		SimpleCLIOptions options = new SimpleCLIOptions(AfinchFileProcessor.class);
		options.addOption(new SimpleCLIOptions.SoftRequiredOption("srcFile", "sourceFile", true, "The NetCDF file to read from"));
		options.addOption(new SimpleCLIOptions.SoftRequiredOption("destFile", "destinationFile", true, "The soon-to-be-created NetCDF file to write to"));
		
		options.parse(args);
		
		if (!options.isHelpRequest()) {
			//Continue on
			
			CommandLine cl = options.getCommandLine();
			options.printEffectiveOptions(true);

			ProcessToAddNCFAggValues pivoter = new ProcessToAddNCFAggValues(
				new File(cl.getOptionValue("srcFile")),
				new File(cl.getOptionValue("destFile"))
			);
			
			pivoter.pivot();
		}
	}
}
