package gov.usgs.cida.glri.afinch.netcdfagg;

/**
 *
 * @author tkunicki
 */
public interface ObservationVisitor {

    public void start(long observationCount);
    
    public void observation(int stationIndex, int timeIndex, float value);
    
    public void finish();
    
}
