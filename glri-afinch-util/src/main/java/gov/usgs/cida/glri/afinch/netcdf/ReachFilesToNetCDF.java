package gov.usgs.cida.glri.afinch.netcdf;

import com.google.common.collect.Maps;
import gov.usgs.cida.glri.afinch.raw.ReachMap;
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

/**
 *
 * @author Jordan Walker <jiwalker@usgs.gov>
 */
public class ReachFilesToNetCDF {
	
	public static void main(String[] args) throws Exception {
		String srcDirStr = args[0];
		String destDirStr = args[1];
		Integer limitCount = null;

		if (args.length > 2) {
			String str = args[2];
			limitCount = Integer.parseInt(str);
		}
		
		File sourceDir = new File(srcDirStr);
		File destDir = new File(destDirStr);
		
		System.out.println("Importing reach files from '" + sourceDir.getAbsolutePath() + "' to '" + destDir.getAbsolutePath() + "'");
		runSet(sourceDir, destDir, limitCount);
	}
	
	public static void runSet(File inputDirectory, File outputNCDFFile, Integer limitCount) throws Exception {

        Map<String, String> globalAttrs = Maps.newLinkedHashMap();
        globalAttrs.put("title", "AFINCH Monthly Flow");
        globalAttrs.put("summary", "Modeled flow for NHD reaches");
        globalAttrs.put("naming_authority", "gov.usgs.cida");
        globalAttrs.put("cdm_data_type", "Station");
        globalAttrs.put("date_created", (new Date()).toString());
        globalAttrs.put("creator_name", "Howard W Reeves");
        globalAttrs.put("creator_email", "hwreeves@usgs.gov");
        globalAttrs.put("project", "Great Lakes Restoration Initiative");
        globalAttrs.put("processing_level", "Model Results");
        globalAttrs.put("standard_name_vocabulary", RecordType.CF_VER);

        
		StationTimeSeriesNetCDFFile netCdfOut = null;
		IOFileFilter fileFilter = new RegexFileFilter("\\d+\\.txt");
		Collection<File> allFiles = FileUtils.listFiles(inputDirectory, fileFilter, FileFilterUtils.trueFileFilter());
		
		System.out.println("Found " + allFiles.size() + " reach files to process.");
		int processedFileCount = 0;
		StationLookup lookup = new ReachMapStationLookup(allFiles, Pattern.compile("(\\d+).txt"));
		
		if (allFiles.size() > 0) {
			//Get just the first one for the metadata
			File file = allFiles.iterator().next();
			
			try (InputStream inputStream = new FileInputStream(file);) {
				netCdfOut =  createNetCDF(outputNCDFFile, inputStream, file.getName(), lookup, globalAttrs);
			}
		}
		
		
        for (File file : allFiles) {

			if (limitCount == null || processedFileCount < limitCount) {
				System.out.println("Pulling file " + (processedFileCount + 1) + " of " + allFiles.size() + " into NetCDF.");
				
				try (InputStream inputStream = new FileInputStream(file);) {
					runOneFile(netCdfOut, inputStream, file.getName(), lookup);
				}
				processedFileCount++;
			} else {
				break;
			}

        }

	}
	
	public static void runOneFile(StationTimeSeriesNetCDFFile nc, InputStream inputStream, String filename, StationLookup lookerUpper) throws Exception {

		
		try (AFINCHMonthlyParser dsgParse = new AFINCHMonthlyParser(inputStream, filename, lookerUpper);) {
			
			//Just reads in the header and is assumed to have been called b/f iterating the data
			RecordType meta = dsgParse.parse();


			while (dsgParse.hasNext()) {
				Observation ob = dsgParse.next();
				if (null != ob) {
					nc.putObservation(ob);
				} else {
					break;
				}
			}	
		}
	}
	
	/**
	 * Creates a new StationTimeSeriesNetCDFFile and closes the sampleSourceIputStream(!)
	 * You'll need another stream.
	 * 
	 * @param netCDFOutputFile
	 * @param sampleSourceIputStream
	 * @param lookerUpper
	 * @param globalAttrs
	 * @return
	 * @throws Exception 
	 */
	public static StationTimeSeriesNetCDFFile createNetCDF(File netCDFOutputFile, 
			InputStream sampleSourceIputStream, String fileName, StationLookup lookerUpper, Map<String, String> globalAttrs) throws Exception {
		
		Collection<Station> stations = lookerUpper.getStations();
		Station[] stationArray = stations.toArray(new Station[stations.size()]);
		
		System.out.println("Creating a new netcdf file.  Max station length is: " + Station.findMaxStationLength(stationArray));
		
		try (AFINCHMonthlyParser dsgParse = new AFINCHMonthlyParser(sampleSourceIputStream, fileName, lookerUpper);) {

			
			//Just reads in the header and is assumed to have been called b/f iterating the data
			RecordType meta = dsgParse.parse();
			
			StationTimeSeriesNetCDFFile nc = null;
			nc = new StationTimeSeriesNetCDFFile(netCDFOutputFile, meta, globalAttrs, true, stationArray);
			return nc;
		}

	}
}
