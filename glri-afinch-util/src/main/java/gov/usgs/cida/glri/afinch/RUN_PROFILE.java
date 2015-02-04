package gov.usgs.cida.glri.afinch;

/**
 * 
 * @author eeverman
 */
public enum RUN_PROFILE {
	FLOW("Flowlines", "flow_out", "ComID", "QAccCon", "QAC"),
	CATCH("Catchments", "catch_out", "GridCode", "yieldCatchCon", "YCC");
	
	private final String srcSubDirectoryName;
	private final String outSubDirectoryName;
	private final String idColumn;
	private final String dataColumnPrefix;
	private final String abbreviation;
	
	
	private RUN_PROFILE(String srcSubDirectoryName, String outSubDirectoryName, String idColumn, String dataColumnPrefix, String abbreviation) {
		this.srcSubDirectoryName = srcSubDirectoryName;
		this.outSubDirectoryName = outSubDirectoryName;
		this.idColumn = idColumn;
		this.dataColumnPrefix = dataColumnPrefix;
		this.abbreviation = abbreviation;
	}

	public String getDefaultSrcSubDirectoryName() {
		return srcSubDirectoryName;
	}

	public String getDefaultOutSubDirectoryName() {
		return outSubDirectoryName;
	}

	public String getDefaultIdColumn() {
		return idColumn;
	}

	public String getDefaultDataColumnPrefix() {
		return dataColumnPrefix;
	}

	public String getDefaultAbbr() {
		return abbreviation;
	}
	
	
}
