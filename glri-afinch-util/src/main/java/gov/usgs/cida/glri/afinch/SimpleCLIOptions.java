package gov.usgs.cida.glri.afinch;

import static java.lang.System.out;
import java.util.List;
import org.apache.commons.cli.BasicParser;
import org.apache.commons.cli.CommandLine;
import org.apache.commons.cli.CommandLineParser;
import org.apache.commons.cli.HelpFormatter;
import org.apache.commons.cli.MissingOptionException;
import org.apache.commons.cli.Option;
import org.apache.commons.cli.Options;
import org.apache.commons.cli.ParseException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Basic command line options that always includes a -help option.
 * 
 * Includes a subclass of a 'soft' required option that will not throw an error
 * if the option is missing but can be queried to find out if all soft req's are
 * present.
 * 
 * Some functionality relating to the CLI is bundled to simplify processing.
 * 
 * Not thread safe.
 * 
 * @author eeverman
 */
public class SimpleCLIOptions extends Options {
	private static Logger log = LoggerFactory.getLogger(SimpleCLIOptions.class);
	
	private CommandLine commandLine;
	private Class optionsForClass;
	
	public SimpleCLIOptions(Class optionsForClass) {
		this.optionsForClass = optionsForClass;
		addOption(new Option("help", "Print the help information"));
	}
	
	public CommandLine parse(String[] args) throws ParseException {

		CommandLineParser parser = new BasicParser();
		CommandLine cl = null;
		
		try {
			cl = parser.parse(this, args);

			
			if (cl.hasOption("help")) {
				printHelp();
			} else {
				//continue on...
				if (! SoftRequiredOption.softRequiredOptionsAreSet(this, cl)) {
					log.error("Some required arguments are missing.  Proper Usage:");
					printHelp();
				}
				
				//Everything is OK - continue
					
			}

		} catch (MissingOptionException ex) {
			List<Options> missingList = ex.getMissingOptions();
			
			if (cl != null && cl.hasOption("help")) {
				printHelp();
			} else {
				//continue on...
			}
			log.error("" + missingList.size() + " required arguments were missing.  Proper Usage:");
			printHelp();
		} catch (ParseException ex) {
			log.error("Unable to read the arguments.  Proper Usage:");
			printHelp();
		}
		
		this.commandLine = cl;
		return cl;
	}
	
	public boolean isHelpRequest() {
		return commandLine.hasOption("help");
	}
	
	public boolean isSoftRequiredOptionsSet() {
		return SoftRequiredOption.softRequiredOptionsAreSet(this, commandLine);
	}
	
	public CommandLine getCommandLine() {
		return commandLine;
	}
	
	public void printEffectiveOptions(boolean includeHeader) {
		
		if (includeHeader) {
			System.out.println(optionsForClass.getName() + " running with these options: ");
		}
		
		for (Option o : commandLine.getOptions()) {
			String s = ((o.getLongOpt() != null)?o.getLongOpt():o.getOpt()) +
					" : " + o.getValue() + " (" + o.getDescription() + ")";
			System.out.println(s);
		}
	}
	
	
	
	protected void printHelp() {
		HelpFormatter formatter = new HelpFormatter();
		formatter.printHelp(optionsForClass.getCanonicalName(), this);
	}

	
	/**
	 * A required Option, but will not throw an Exception during parsing so that
	 * we can find a request for -help.
	 */
	public static class SoftRequiredOption extends Option {

		public SoftRequiredOption(String opt, String description) throws IllegalArgumentException {
			super(opt, description);
		}

		public SoftRequiredOption(String opt, String longOpt, boolean hasArg, String description) {
			super(opt, longOpt, hasArg, description);
		}

		public SoftRequiredOption(String opt, boolean hasArg, String description) throws IllegalArgumentException {
			super(opt, hasArg, description);
		}
		
		public String getDescription() {
			return super.getDescription() + " (required)";
		}
		
		public static boolean softRequiredOptionsAreSet(Options options, CommandLine cl) {
			for (Object o : options.getOptions()) {
				
				if (o instanceof SoftRequiredOption) {
					SoftRequiredOption sro = (SoftRequiredOption)o;
					if (! cl.hasOption(sro.getOpt())) {
						return false;
					}
				}
				
			}
			
			return true;
		}
	}
}
