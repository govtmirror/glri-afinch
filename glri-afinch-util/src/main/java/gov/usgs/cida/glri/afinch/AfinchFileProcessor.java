package gov.usgs.cida.glri.afinch;

import gov.usgs.cida.glri.afinch.SimpleCLIOptions.SoftRequiredOption;
import gov.usgs.cida.glri.afinch.netcdf.ProcessToNetCDF;
import gov.usgs.cida.glri.afinch.netcdfagg.ProcessToAddNCFAggValues;
import gov.usgs.cida.glri.afinch.raw.ProcessToPerStationFiles;
import java.io.File;
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
		options.addOption(new SoftRequiredOption("srcDir", "sourceDirectory", true, "The source directory to process from"));
		options.addOption(new SoftRequiredOption("dstDir", "destinationDirectory", true, "The directory where all output will be written to"));
		options.addOption(new Option("limit", "limitInputFiles", true, "Limit the number of imput files processed.  All files run if option is not specified."));
		options.addOption(new Option("idCol", "idColumnName", true, "Name of the id column in the raw files"));
		options.addOption(new Option("dataCol", "dataColumnName", true, "Name of one or more data columns.  This parameter can be repeated to create multiple values."));

		options.parse(args);
		
		if (!options.isHelpRequest()) {
			//Continue on
			
			CommandLine cl = options.getCommandLine();
			options.printEffectiveOptions(true);
			
			
			
			
			String limitStr = cl.getOptionValue("limit");
			Integer limitCount = null;
			if (limitStr != null) {
				limitCount = Integer.parseInt(limitStr);
			}
			
					
					
			File srcDirFile = new File(cl.getOptionValue("srcDir"));
			File dstDirFile = new File(cl.getOptionValue("dstDir"));
			File dstDirRaw;
			File dstDirNetCdf;
			File dstFileNetCdf;
			File dstDirNetCdfAgg;
			File dstFileNetCdfAgg;
			
			
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
			
			IOFileFilter fileFilter = new SuffixFileFilter(".csv");
			IOFileFilter parentDirFilter = new AncestorDirectoryNameFileFilter(new NameFileFilter("Flowlines"));
			//IOFileFilter hucNamesParentDirFilter = new AncestorDirectoryNameFileFilter(new RegexFileFilter("HR\\d\\d\\d\\d_.*"), 2);
			IOFileFilter filter = FileFilterUtils.and(fileFilter, parentDirFilter);
			
			
			ProcessToPerStationFiles processToPerStationFiles = new ProcessToPerStationFiles(srcDirFile, dstDirRaw, limitCount, filter, "ComID", "QAccCon");
			
			
			Boolean result = processToPerStationFiles.process();
			
			if (result == false) {
				//Bomb out
				log.error("Terminating the pipeline due to errors.");
				return;
			}
			
			ProcessToNetCDF processToNetCDF = new ProcessToNetCDF(dstDirRaw, dstFileNetCdf, null);
			result = processToNetCDF.process();
			
			if (result == false) {
				//Bomb out
				log.error("Terminating the pipeline due to errors.");
				return;
			}
			
			ProcessToAddNCFAggValues processToAddNCFAggValues = new ProcessToAddNCFAggValues(
					dstFileNetCdf, dstFileNetCdfAgg
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
	
	
}
