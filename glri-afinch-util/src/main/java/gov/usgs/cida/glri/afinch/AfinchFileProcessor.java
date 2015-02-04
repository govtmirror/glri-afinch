package gov.usgs.cida.glri.afinch;

import gov.usgs.cida.glri.afinch.SimpleCLIOptions.SoftRequiredOption;
import gov.usgs.cida.glri.afinch.netcdf.ProcessToNetCDF;
import gov.usgs.cida.glri.afinch.netcdfagg.ProcessToAddNCFAggValues;
import gov.usgs.cida.glri.afinch.raw.ProcessToPerStationFiles;
import gov.usgs.cida.netcdf.dsg.RecordType;
import java.io.File;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.Properties;
import org.apache.commons.cli.CommandLine;
import org.apache.commons.cli.Option;
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.filefilter.AncestorDirectoryNameFileFilter;
import org.apache.commons.io.filefilter.FileFilterUtils;
import org.apache.commons.io.filefilter.IOFileFilter;
import org.apache.commons.io.filefilter.NameFileFilter;
import org.apache.commons.io.filefilter.SuffixFileFilter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Complete pipeline processing for reading raw AFINCH files and generating
 * a NetCDF file with base and aggregate values.
 * 
 * Typical arguments for running flowline values:
 * <ul>
 * <li>-srcDir [Directory containing all AFINCH source files]</li>
 * <li>-dstDir [Any output directory (will be overwritten)]</li>
 * <li>-idCol ComID</li>
 * <li>-dataColPrefix QAccCon</li>
 * <li>-dataColAbbr QAC</li>
 * <li>-profile flow [or catch]</li>
 * <li>-</li>
 * <li>-</li>
 * </ul>
 * 
 * @author eeverman
 */
public class AfinchFileProcessor {

	private static Logger log = LoggerFactory.getLogger(AfinchFileProcessor.class);
	
	public static final String DIR_RAW_IMPORT = "1_raw_import";
	public static final String DIR_NETCDF_IMPORT = "2_netcdf_import";
	public static final String FILE_NETCDF_IMPORT = "out.nc";
	public static final String DIR_NETCDF_AGG = "3_final_with_aggregates";
	public static final String FILE_NETCDF_AGG = "agg_out.nc";
	
	public static void main(String[] args) throws Exception {
		
		System.out.println("Logging with: " + LoggerFactory.getILoggerFactory().getClass());
		
		
		SimpleCLIOptions options = new SimpleCLIOptions(AfinchFileProcessor.class);
		options.addOption(new SoftRequiredOption("srcDir", "sourceDirectory", true, 
				"The source directory to process from"));
		options.addOption(new SoftRequiredOption("dstDir", "destinationDirectory", true, 
				"The directory where all output will be written to.  It will append a subdirectory based on the profile: 'flow_out' or 'catch_out'"));
		options.addOption(new SoftRequiredOption("profile", "profile", true, 
				"'flow' or 'catch' to invoke the correct run profile"));
		options.addOption(new Option("limit", "limitInputFiles", true, 
				"Limit the number of imput files processed.  All files run if option is not specified."));
		options.addOption(new Option("ignore", "ignoreErrors", false, 
				"If specified, non-fatal errors will be ignored so that as much of the process runs as possible."));
		options.addOption(new Option("subDir", "subdirectoryName", true, 
				"Name of the source subdirectory containing the files to be processed, which must be .csv files.  Usually there are multiple of these directories in subfolders of the srcDir - the processor will find them all." +
						"If unspecified it uses these defaults based on profile:  flow:" + RUN_PROFILE.FLOW.getDefaultSrcSubDirectoryName() + " catch:" + RUN_PROFILE.CATCH.getDefaultSrcSubDirectoryName() + ".  "));
		options.addOption(new Option("idCol", "idColumnName", true, 
				"Name of the id column in the raw files.  If unspecified it uses these defaults based on profile:  flow:" + RUN_PROFILE.FLOW.getDefaultIdColumn() + " catch:" + RUN_PROFILE.CATCH.getDefaultIdColumn() + ".  " +
						"BE CAREFUL IF YOU FEEL THIS NEEDS TO CHANGE.  Processing assumes that the ID type (grid code and com id) are what is being used, regardless of name."));
		options.addOption(new Option("dataColPrefix", "dataColumnNamePrefix", true, 
				"Prefix of the data cols in the source CSV, which is expanded to include month suffixes.  " +
						"The name is also used to to write the data into the NetCDF file.  " +
						"If unspecified it uses these defaults based on profile:  flow:" + RUN_PROFILE.FLOW.getDefaultDataColumnPrefix() + " catch:" + RUN_PROFILE.CATCH.getDefaultDataColumnPrefix()));
		options.addOption(new Option("dataColAbbr", "dataColumnAbbreviation", true, 
				"Abbreviated name of the data column used as a prefix for aggregated values like [ABBR]AVG written into the final NetCDF file.  " +
						"If unspecified it uses these defaults based on profile:  flow:" + RUN_PROFILE.FLOW.getDefaultAbbr() + " catch:" + RUN_PROFILE.CATCH.getDefaultAbbr() + ".  " +
						"DO NOT MODIFY unless you know what you are doing.  Downstream app rely on the abbreviated stat names."));


		options.parse(args);
		
		if (!options.isHelpRequest()) {
			//Continue on
			
			CommandLine cl = options.getCommandLine();
			options.printEffectiveOptions(true);
			
			
			if (! options.isSoftRequiredOptionsSet()) {
				log.error("Stopping processing b/c not all required parameters are set");
				return;
			}
			
			
			//Misc switches
			String limitStr = cl.getOptionValue("limit");
			Integer limitCount = null;
			if (limitStr != null) {
				limitCount = Integer.parseInt(limitStr);
			}
			boolean ignoreErrors = cl.hasOption("ignore");
			
			//Profile dependant props
			String profileStr = cl.getOptionValue("profile").toUpperCase();
			RUN_PROFILE profile = RUN_PROFILE.valueOf(profileStr);
			
			if (profile == null) {
				log.error("The profile '" + profileStr + "' is not recognized.  Must be either '" + RUN_PROFILE.FLOW.toString().toLowerCase() + "' or '" + RUN_PROFILE.CATCH.toString().toLowerCase() + "'");
				return;
			}
			
			
			//Source column names
			String idCol = cl.getOptionValue("idCol");
			String dataColPrefix = cl.getOptionValue("dataColPrefix");
			String dataColAbbr = cl.getOptionValue("dataColAbbr");
			
			if (idCol == null) idCol = profile.getDefaultIdColumn();
			if (dataColPrefix == null) dataColPrefix = profile.getDefaultDataColumnPrefix();
			if (dataColAbbr == null) dataColAbbr = profile.getDefaultAbbr();
			
			
			//File Locations
			File srcDirFile = new File(cl.getOptionValue("srcDir"));
			File dstDirFile = new File(cl.getOptionValue("dstDir"));
			dstDirFile = new File(dstDirFile, profile.getDefaultOutSubDirectoryName());
			File dstDirRaw;
			File dstDirNetCdf;
			File dstFileNetCdf;
			File dstDirNetCdfAgg;
			File dstFileNetCdfAgg;
			
			//File filter
			String subDir = cl.getOptionValue("subDir");
			if (subDir == null) subDir = profile.getDefaultSrcSubDirectoryName();
			IOFileFilter rawFileFilter = createRawFileIOFileFilter(subDir);
			Map<String, String> netCdfFileProps = createNetCDFProperties(profile);
			
			if ((! srcDirFile.exists()) || (! srcDirFile.canRead())) {
				throw new Exception ("The source directory '" + srcDirFile.getAbsolutePath() + " does not exist or cannot be read");
			}
			
			if (dstDirFile.exists()) {
				FileUtils.cleanDirectory(dstDirFile);
			} else {
				dstDirFile.mkdirs();
			}
			
			dstDirRaw = new File(dstDirFile, DIR_RAW_IMPORT);
			dstDirNetCdf = new File(dstDirFile, DIR_NETCDF_IMPORT);
			dstDirNetCdfAgg = new File(dstDirFile, DIR_NETCDF_AGG);
			
			//Directories
			dstDirRaw.mkdirs();
			dstDirNetCdf.mkdirs();
			dstDirNetCdfAgg.mkdirs();
			
			//Destination NetCDF files
			dstFileNetCdf = new File(dstDirNetCdf, FILE_NETCDF_IMPORT);
			dstFileNetCdfAgg = new File(dstDirNetCdfAgg, FILE_NETCDF_AGG);
			
			ProcessToPerStationFiles processToPerStationFiles = new ProcessToPerStationFiles(srcDirFile, dstDirRaw, limitCount, ignoreErrors, rawFileFilter, idCol, dataColPrefix);
			Boolean result = processToPerStationFiles.process();
			
			if (result == false && (! ignoreErrors)) {
				//Bomb out
				log.error("Terminating the pipeline due to errors.");
				return;
			}
			
			ProcessToNetCDF processToNetCDF = new ProcessToNetCDF(dstDirRaw, dstFileNetCdf, netCdfFileProps, null);
			result = processToNetCDF.process();
			
			if (result == false && (! ignoreErrors)) {
				//Bomb out
				log.error("Terminating the pipeline due to errors.");
				return;
			}
			
			ProcessToAddNCFAggValues processToAddNCFAggValues = new ProcessToAddNCFAggValues(
					dstFileNetCdf, dstFileNetCdfAgg, dataColPrefix, dataColAbbr
			);
			
			result = processToAddNCFAggValues.process();
			
			if (result == false) {
				//Bomb out
				log.error("Terminating the pipeline due to errors.");
				return;
			}
			
			log.info("Import, NetCDF conversion and aggregate value calculation complete.");
		}
	}
	
	
	public static IOFileFilter createRawFileIOFileFilter(String subDirectoryName) throws Exception {
		IOFileFilter actualFileFilter = new SuffixFileFilter(".csv");
		IOFileFilter fileParentDirFilter = new AncestorDirectoryNameFileFilter(new NameFileFilter(subDirectoryName));
		
		return FileFilterUtils.and(actualFileFilter, fileParentDirFilter);
	}
	
	public static Map<String, String> createNetCDFProperties(RUN_PROFILE profile) throws Exception {
		Map<String, String> props = new HashMap<String, String>();
		
		switch (profile) {
			case FLOW:
				props.put("title", "AFINCH Monthly Flow");
				props.put("summary", "Modeled flow for NHD reaches");
				props.put("naming_authority", "gov.usgs.cida");
				props.put("cdm_data_type", "Station");
				props.put("date_created", (new Date()).toString());
				props.put("creator_name", "Howard W Reeves");
				props.put("creator_email", "hwreeves@usgs.gov");
				props.put("project", "Great Lakes Restoration Initiative");
				props.put("processing_level", "Model Results");
				props.put("standard_name_vocabulary", RecordType.CF_VER);
				break;
			case CATCH:
				props.put("title", "AFINCH XXX Flow");
				props.put("summary", "Modeled XXX for NHD reaches");
				props.put("naming_authority", "gov.usgs.cida");
				props.put("cdm_data_type", "Station");
				props.put("date_created", (new Date()).toString());
				props.put("creator_name", "Howard W Reeves");
				props.put("creator_email", "hwreeves@usgs.gov");
				props.put("project", "Great Lakes Restoration Initiative");
				props.put("processing_level", "Model Results");
				props.put("standard_name_vocabulary", RecordType.CF_VER);
				break;
			default:
				throw new Exception("Unrecognized profile: " + profile);
		}
		
		
		return props;
	}
	
}
