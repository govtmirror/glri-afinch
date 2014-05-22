package gov.usgs.cida.glri.afinch;

import gov.usgs.cida.glri.afinch.SimpleCLIOptions.SoftRequiredOption;
import gov.usgs.cida.glri.afinch.raw.ProcessToPerStationFiles;
import java.io.File;
import org.apache.commons.cli.CommandLine;
import org.apache.commons.cli.Option;
import org.apache.commons.io.FileUtils;
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
	public static final String DIR_NETCDF_AGG = "3_final_with_aggregates";

	public static void main(String[] args) throws Exception {
		SimpleCLIOptions options = new SimpleCLIOptions(AfinchFileProcessor.class);
		options.addOption(new SoftRequiredOption("srcDir", "sourceDirectory", true, "The source directory to process from"));
		options.addOption(new SoftRequiredOption("dstDir", "destinationDirectory", true, "The directory where all output will be written to"));
		options.addOption(new Option("limit", "limitInputFiles", true, "Limit the number of imput files processed.  All files run if option is not specified."));

		options.parse(args);
		
		if (!options.isHelpRequest()) {
			//Continue on
			
			CommandLine cl = options.getCommandLine();
			options.printEffectiveOptions(true);
			
			
			
			
			String limitStr = options.getOption("limit").getValue();
			Integer limitCount = null;
			if (limitStr != null) {
				limitCount = Integer.parseInt(limitStr);
			}
			
			
					
					
			File srcDirFile = new File(options.getOption("srcDir").getValue());
			File dstDirFile = new File(options.getOption("dstDir").getValue());
			File dstDirRaw;
			File dstDirNetCdf;
			File dstDirNetCdfAgg;
			
			
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
			
			dstDirRaw.mkdirs();
			dstDirNetCdf.mkdirs();
			dstDirNetCdfAgg.mkdirs();
			
			ProcessToPerStationFiles processToPerStationFiles = new ProcessToPerStationFiles(srcDirFile, dstDirRaw, limitCount);
			Boolean result = processToPerStationFiles.call();
			
		}
	}
	
	
}
