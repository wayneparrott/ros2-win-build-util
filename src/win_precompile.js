// Inspect <ROS_Install>/include/ folder
//

// const fs = require("fs");
const fs = require('fs-extra');
const path = require('path');

const LIFTED_DIR_SUFFIX = '__';

function main() {
  // find path to ROS includes
  let ROS_PATH = process.argv.length > 2 ? 
    process.argv[2] : process.env.AMENT_PREFIX_PATH;
  
  if (!ROS_PATH) {
    throw Error('Unable to locate ROS installation. AMENT_PREFIX_PATH not found and no commandline arg.');
  }

  // ensure the includes/ folder exists and is readable
  const includePath = path.join(ROS_PATH, 'include');
  console.log(`INCLUDES directory path to process: ${includePath}`);

  if (!fs.pathExistsSync(includePath)) {
    throw Error(`Directory does not exist (${includePath}.`);
  }

  // determine if folder has previously been processed, i.e. does there exist a dir with LIFTED_DIR_SUFFIX
  if (!fs.statSync(includePath).isDirectory()) {
    throw Error(`Path is not a directory, ${includePath}.`);
  }

  let dirEntries = fs.readdirSync(includePath, { withFileTypes: true });

  let alreadyProcessed = !!dirEntries.find((dirEntry) =>
    dirEntry.name.endsWith(LIFTED_DIR_SUFFIX)
  );

  if (alreadyProcessed) {
    throw Error('Directory has already been processed');
  }

  let liftCnt = 0;
  for (dirEntry of dirEntries) {
    // must be a dir
    if (!dirEntry.isDirectory()) continue;

    // looking for pattern  rcl/rcl/<header files>
    let subDirEntries = fs.readdirSync(path.join(includePath, dirEntry.name), {
      withFileTypes: true,
    });
    if (
      subDirEntries.length === 1 &&
      subDirEntries[0].isDirectory() &&
      subDirEntries[0].name == dirEntry.name
    ) {
      let dirName = dirEntry.name;
      let bakDirName = dirEntry.name + LIFTED_DIR_SUFFIX;

      // backup dir
      fs.moveSync(
        path.join(includePath, dirName),
        path.join(includePath, bakDirName)
      );

      // lift subdir
      fs.moveSync(
        path.join(includePath, bakDirName, dirName),
        path.join(includePath, dirName)
      );

      liftCnt++;
      console.log(`Lifted directory: ${dirName}`);
    }
  }

  console.log('ROS include directory processing completed');
  console.log(`Lifted ${liftCnt} directories`);
}

main();
