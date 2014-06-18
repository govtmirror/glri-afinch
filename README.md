glri-afinch
===========

Display the AFINCH monthly model results

Utilities
++++++++++

The Utilities Module creates a runnable jar file.  To process Reaches, run as:

java -Xmx12G -jar AfinchProcessor.jar -srcDir [pathToSourceDir] -dstDir [pathToDestDir] -idCol ComID -dataCols QAccCon -dataColAbbrs QAC -profile flow

To process catchments:

java -Xmx12G -jar AfinchProcessor.jar -srcDir [pathToSourceDir] -dstDir [pathToDestDir] -idCol GridCode -dataCols yieldCatchCon -dataColAbbrs YCC -profile catch


These switches can be added:
-limit 3 [limit to only processing x input files - useful for testing/debugging]
-ignore [If present, ignore non-fatal errors]
