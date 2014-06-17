package gov.usgs.cida.glri.afinch.netcdf;

import com.google.common.collect.Maps;
import gov.usgs.cida.netcdf.dsg.Observation;
import gov.usgs.cida.netcdf.dsg.RecordType;
import gov.usgs.cida.netcdf.dsg.Station;
import gov.usgs.cida.netcdf.dsg.StationTimeSeriesNetCDFFile;
import gov.usgs.cida.watersmart.parse.StationLookup;
import java.io.*;
import java.util.Collection;
import java.util.Date;
import java.util.Map;
import java.util.regex.Pattern;
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.filefilter.FileFilterUtils;
import org.apache.commons.io.filefilter.IOFileFilter;
import org.apache.commons.io.filefilter.RegexFileFilter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Major update to enable pipelining the import of the NetCDF files with two other
 * processes.
 * 
 * @author Jordan Walker <jiwalker@usgs.gov>
 * @author Eric Everman <eeverman@usgs.gov>
 */
public class ProcessToNetCDF {
	private static Logger log = LoggerFactory.getLogger(ProcessToNetCDF.class);
	
	private final static Integer REPORT_INTERVAL = 4000;
	
	private final File inputDirectory;
	private final File outputNCDFFile;
	private final Integer limitCount;
	private final Map<String, String> fileProps;
			
	
	public ProcessToNetCDF(File inputDirectory, File outputNCDFFile, Map<String, String> fileProperties, Integer limitCount) {
		this.inputDirectory = inputDirectory;
		this.outputNCDFFile = outputNCDFFile;
		this.fileProps = fileProperties;
		this.limitCount = limitCount;
	}
	
	public Boolean process() throws Exception {
        
		StationTimeSeriesNetCDFFile netCdfOut = null;
		IOFileFilter fileFilter = new RegexFileFilter("\\d+\\.csv");
		Collection<File> allFiles = FileUtils.listFiles(inputDirectory, fileFilter, FileFilterUtils.trueFileFilter());
		
		log.info("Importing files from {} to {} and converting to NetCDF.", inputDirectory.getAbsolutePath(), outputNCDFFile.getAbsolutePath());
		log.info("Found {} reach files to process in the source diretory", allFiles.size());
		
		int processedFileCount = 0;
		StationLookup lookup = new AFINCHReachLookup(allFiles, Pattern.compile("(\\d+).csv"));
		
		
		//Get just the first file and read it for the metadata
		if (allFiles.size() > 0) {
			File file = allFiles.iterator().next();
			
			try (InputStream inputStream = new FileInputStream(file);) {
				netCdfOut =  createNetCDF(outputNCDFFile, inputStream, file.getName(), lookup, fileProps);
			}
		}
		
		//Start over and proccess all files for the data
		try {
			for (File file : allFiles) {

				if (limitCount == null || processedFileCount <= limitCount) {

					if ( (float)(processedFileCount / REPORT_INTERVAL) == (((float)processedFileCount / (float)REPORT_INTERVAL))) {
						log.debug("Pulling file {} of {} into NetCDF.", (processedFileCount + 1), allFiles.size());
					}


					try (InputStream inputStream = new FileInputStream(file);) {
						runOneFile(netCdfOut, inputStream, file.getName(), lookup);
					}
					processedFileCount++;
				} else if (limitCount != null && processedFileCount >= limitCount) {
					log.info("Stopping file processing b/c specified limit of {} files was reached", limitCount);
					break;
				}

			}
		} finally {
			netCdfOut.close();
		}
		
		
		log.info("Completed converting {} files to NetCDF", processedFileCount);
		return true;

	}
	
	public static void runOneFile(StationTimeSeriesNetCDFFile nc, InputStream inputStream, String filename, StationLookup lookerUpper) throws Exception {

		
		try (AFINCHMonthlyParser dsgParse = new AFINCHMonthlyParser(inputStream, filename, lookerUpper);) {
			
			//Just reads in the header and is assumed to have been called b/f iterating the data
			RecordType meta = dsgParse.parse();


			int obsCount = 0;
			
			while (dsgParse.hasNext()) {
				Observation ob = dsgParse.next();
				if (null != ob) {
					nc.putObservation(ob);
					obsCount++;
				} else {
					break;
				}
			}
			
			if (obsCount == 0) {
				log.warn("Found a station file with no observations: {}", filename);
			}
		}
	}
	
	/**
	 * Creates a new StationTimeSeriesNetCDFFile and closes the sampleSourceIputStream(!)
	 * You'll need another stream.
	 * 
	 * @param netCDFOutputFile
	 * @param sampleSourceIputStream
	 * @param fileName
	 * @param lookerUpper
	 * @param globalAttrs
	 * @return
	 * @throws Exception 
	 */
	public static StationTimeSeriesNetCDFFile createNetCDF(File netCDFOutputFile, 
			InputStream sampleSourceIputStream, String fileName, StationLookup lookerUpper, Map<String, String> globalAttrs) throws Exception {
		
		Collection<Station> stations = lookerUpper.getStations();
		Station[] stationArray = stations.toArray(new Station[stations.size()]);
		
		log.info("Creating a new netcdf file with max station length of {} characters ", Station.findMaxStationLength(stationArray));
		
		try (AFINCHMonthlyParser dsgParse = new AFINCHMonthlyParser(sampleSourceIputStream, fileName, lookerUpper);) {

			
			//Just reads in the header and is assumed to have been called b/f iterating the data
			RecordType meta = dsgParse.parse();
			
			StationTimeSeriesNetCDFFile nc = null;
			nc = new StationTimeSeriesNetCDFFile(netCDFOutputFile, meta, globalAttrs, true, stationArray);
			return nc;
		}

	}
}
