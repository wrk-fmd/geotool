const fs = require('fs').promises;

/*
  This script can be used to transform POIs in the legacy Coceso format to GeoJSON
  Usage: node transform_poi.js input.json output.json
*/

async function main() {
  const args = process.argv.slice(2);
  if (args.length !== 2) {
    console.warn('Usage: node transform_poi.js input.json output.json');
    process.exit(1);
  }

  const data = await readJson(args[0]);
  if (!data.length) {
    console.warn(`No POIs found in ${args[1]}!`);
    process.exit(1);
  }

  console.log(`Processing ${data.length} POIs.`);
  const features = data.map(poi => transformPoi(poi));

  console.log(`Writing results to ${args[1]}.`);
  await fs.writeFile(args[1], JSON.stringify({type: 'FeatureCollection', features}));
}

async function readJson(path) {
  const buffer = await fs.readFile(path);
  return JSON.parse(buffer.toString());
}

function transformPoi(poi) {
  if (!poi.coordinates) {
    console.warn('Feature without coordinates: ', poi);
  }

  return {
    type: 'Feature',
    properties: {
      text: poi.text,
    },
    geometry: {
      type: 'Point',
      coordinates: [poi.coordinates?.lng, poi.coordinates?.lat],
    },
  };
}

main().then();
