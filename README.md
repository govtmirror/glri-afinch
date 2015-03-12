GLRI-AFINCH
===============
  [
    ![CC0](http://i.creativecommons.org/p/zero/1.0/88x31.png)
  ](http://creativecommons.org/publicdomain/zero/1.0/)

  To the extent possible under law,
  [
    <span property="dct:title">The Center for Integrated Data Analytics</span>](http://cida.usgs.gov/)
  has waived all copyright and related or neighboring rights to
  <span property="dct:title">The GLRI-AFINCH Mapper</span>.
This work is published from:
<span property="vcard:Country" datatype="dct:ISO3166"
      content="US" about="http://cida.usgs.gov/">
  United States</span>.

===============

Display the AFINCH monthly model results for flow and catchment yields in the Great Lakes Basin.

Utilities
++++++++++

The Utilities Module creates a runnable jar file. To process Reaches, run as:

java -Xmx12G -jar AfinchProcessor.jar -srcDir [pathToSourceDir] -dstDir [pathToDestDir] -idCol ComID -dataCols QAccCon -dataColAbbrs QAC -profile flow

To process catchments:

java -Xmx12G -jar AfinchProcessor.jar -srcDir [pathToSourceDir] -dstDir [pathToDestDir] -idCol GridCode -dataCols yieldCatchCon -dataColAbbrs YCC -profile catch


These switches can be added:
-limit 3 [limit to only processing x input files - useful for testing/debugging]
-ignore [If present, ignore non-fatal errors]
