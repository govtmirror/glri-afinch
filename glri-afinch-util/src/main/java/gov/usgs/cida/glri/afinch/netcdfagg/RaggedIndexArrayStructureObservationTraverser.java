package gov.usgs.cida.glri.afinch.netcdfagg;

import java.io.IOException;
import ucar.ma2.ArrayStructure;
import ucar.ma2.InvalidRangeException;
import ucar.ma2.StructureMembers;
import ucar.nc2.Variable;

/**
 *
 * @author tkunicki
 */
public class RaggedIndexArrayStructureObservationTraverser implements ObservationTraverser {
    private final Variable observationVariable;
	private final String observedValueName;

	/**
	 * 
	 * @param observationVariable The 'top level' variable that contains all observed data.
	 * @param observedValueName The specific name of the variable within the observed variable to build stats for.
	 */
    public RaggedIndexArrayStructureObservationTraverser(Variable observationVariable, String observedValueName) {
        this.observationVariable = observationVariable;
		this.observedValueName = observedValueName;
    }

    @Override
    public void traverse(ObservationVisitor visitor) throws IOException, InvalidRangeException {
        ArrayStructure array;
        final int oStep = 1 << 20;
        final int oTotal = observationVariable.getShape(0);
		
		System.out.println("Starting visitor with oTotal: " + oTotal);
		
        visitor.start(oTotal);
        for (int oIndex = 0; oIndex < oTotal; oIndex += oStep) {
            int oCount = oIndex + oStep > oTotal ? oTotal - oIndex : oStep;
            array = (ArrayStructure) observationVariable.read(new int[]{oIndex}, new int[]{oCount});
            StructureMembers.Member mTime = array.findMember("time");
            StructureMembers.Member mIndex = array.findMember("index");
            StructureMembers.Member mValue = array.findMember(observedValueName);
            for (int aIndex = 0; aIndex < array.getSize(); aIndex++) {
                visitor.observation(array.getScalarInt(aIndex, mIndex), array.getScalarInt(aIndex, mTime), array.getScalarFloat(aIndex, mValue));
            }
        }
        visitor.finish();
    }
    
}
