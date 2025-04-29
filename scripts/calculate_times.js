const fs = require('fs').promises;

/*
  This script can be used to calculate times at POIs based on distance and known waypoints
  Usage: node calculate_times.js config.json input.json output.json

  config.json contains an array of timeline specification objects.
  Each specification object has a `title` (string) used for output and an `waypoints` array.
  Each waypoint is a tuple (as array) of the time (hours as float) and distance (kilometers as float)
  Other properties are ignored and can be used as comment.

  Example:
  [{
    "_desc": "5km/h from 13:00 to 14:00, 10km/h from 14:00 to 15:30",
    "title": "Example timeline",
    "waypoints": [[13, 0], [14, 5], [15.5, 20]]
  }]

  input.json is a GeoJSON feature collection.
  The script will calculate a `times` property for all points with the `distance` property set (in meters).
  Additionally, the `popupTemplate` in `markerDefaults` will be set to `{{text}}\n{{times}}` (i.e., normal text followed by the times).
*/

async function main() {
  const args = process.argv.slice(2);
  if (args.length !== 3) {
    console.warn('Usage: node calculate_times.js config.json input.json output.json');
    process.exit(1);
  }

  const config = await readJson(args[0]);
  const data = await readJson(args[1]);

  if (!data.features) {
    console.warn(`No features found in ${args[1]}!`);
    process.exit(1);
  }

  console.log(`Processing ${data.features.length} features.`);
  data.features.forEach(feature => processFeature(config, feature));

  // Store template for popups including the times
  if (!data.markerDefaults) {
    data.markerDefaults = {};
  }
  data.markerDefaults.popupTemplate = '{{text}}\n{{times}}';

  console.log(`Writing results to ${args[2]}.`);
  await fs.writeFile(args[2], JSON.stringify(data));
}

async function readJson(path) {
  const buffer = await fs.readFile(path);
  return JSON.parse(buffer.toString());
}

function processFeature(config, feature) {
  if (!feature.properties) {
    console.debug('Ignoring feature without properties: ', feature);
    return;
  }

  const distance = feature.properties.distance;
  if (distance === undefined) {
    console.debug('Ignoring feature without distance: ', feature);
    return;
  }

  const times = config
    .map(item => [item.title, calculateTime(item.waypoints, distance)])
    .filter(([_, time]) => time !== undefined)
    .map(([title, time]) => `${title}: ${formatTime(time)}`)
    .join('\n');
  if (times) {
    feature.properties.times = times;
  }
}

function calculateTime(waypoints, distance) {
  if (!waypoints.length) {
    // No waypoints: Cannot calculate anything
    return undefined;
  }

  let timePrev = undefined, distPrev = undefined;
  for (let i = 0; i < waypoints.length; i++) {
    const timeNext = waypoints[i][0], distNext = 1000 * waypoints[i][1];
    if (distance === distNext) {
      // Waypoint matches distance exactly: Just return the waypoint
      return timeNext;
    }

    if (distance < distNext) {
      if (timePrev === undefined) {
        // First waypoint is after the requested distance: Cannot calculate anything
        return undefined;
      }

      // Distance is between previous and this waypoint: Calculate time as linear function
      return (distance * (timeNext - timePrev) + timePrev * distNext - timeNext * distPrev) / (distNext - distPrev);
    }

    // Move on to next interval
    timePrev = timeNext;
    distPrev = distNext;
  }

  // Distance is after last waypoint: Cannot calculate anything
  return undefined;
}

function formatTime(time, withSeconds) {
  // Add about half a second to prevent rounding errors
  time += 0.0001;

  const hours = Math.floor(time) % 24;

  time = (time - hours) * 60;
  const minutes = Math.floor(time);

  let result = `${pad(hours)}:${pad(minutes)}`;

  if (withSeconds) {
    time = (time - minutes) * 60;
    const seconds = Math.floor(time);
    result = `${result}:${pad(seconds)}`;
  }

  return result;
}

function pad(num) {
  return String(num).padStart(2, '0');
}

main().then();
