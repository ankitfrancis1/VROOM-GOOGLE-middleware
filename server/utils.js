"use strict";
const config = require("./config.json");
config.port;
const distanceMatrixHelper = require("./distanceMatrixHelper.js");
const https = require("https");
const fs = require("fs");
const { exec } = require("child_process");

/**
 * Function to set a fixed wait, useful only if called inside async function.
 * @param {number} time in ms.
 * @returns
 */
async function waitBuffer(time) {
  return new Promise(() => {
    setTimeout(() => console.log("wait buffer."), time);
  })
}
/**
 * Create Distance Matrix request url
 * @param {Array({idx: number, lat: number, lon: number})} origins
 * @param {Array({idx: number, lat: number, lon: number})} destinations 
 * @returns {string}
 */
function constructDistanceMatrixRequest(origins, destinations) {
  return `https://maps.googleapis.com/maps/api/distancematrix/json?${origins}&${destinations}&travelMode=driving&departure_time=now&${config.google_api_key}`;
}

/** 
 * Send HTTP GET request for given url
 *@param {string} uri
 *@returns {Object} response body in JSON
 */
function sendRequest(uri) {
  return new Promise((resolve, reject) => {
    https
      .get(encodeURI(uri), (resp) => {
        let data = "";
        // A block of data has been received.
        resp.on("data", (block) => {
          data += block;
        });
        // The whole response has been received. send the result.
        resp.on("end", () => {
          resolve(JSON.parse(data));
        });
      })
      .on("error", (err) => {
        reject(err.message);
      });
  });
}

/**
 * Save JSON object to file, for Logging
 * @param {string} filename Prefix of the file
 * @param {Object} data  JSON
 * @returns {string} filePath
 */
function saveTofile(filename, data) {
  return new Promise((resolve, reject) => {
    try {
      let ds = new Date().toISOString().replace(/[^0-9]/g, "");
      let filePath = `.\\logs\\${filename}_${ds}.json`;
      fs.writeFile(filePath, JSON.stringify(data), function (err) {
        if (err) {
          reject(err);
        } else {
          console.log(`writing to ${filePath}`);
          resolve(filePath);
        }
      });
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * extract duration matrix from the Distance Matrix Response
 * @param {Object} data.rows The Distance Matrix response body JSON
 * @returns {Array(Array(number))} The duration_in_traffic matrix
 */
function extractDurationData(data) {
  return new Promise((resolve, reject) => {
    try {
      if (data.error_message != null) {
        reject(`extractDurationData():` + data.error_message);
      } else if (!data.rows === undefined || data.rows.length === undefined || data.rows.length === 0) {
        reject("extractDurationData(): missing rows object in distance matrix response");
      } else {
        let rowLen = data.rows.length;
        let colLen = data.rows[0].elements.length;
        let durationMatrix = new Array(rowLen);
        for (let i = 0; i < rowLen; i++) {
          durationMatrix[i] = new Array(colLen);
          for (let j = 0; j < colLen; j++) {
            durationMatrix[i][j] = data.rows[i].elements[j].duration_in_traffic.value;
          }
        }
        resolve(durationMatrix);
      }
    } catch (err) {
      reject(`extractDurationData(): issue with Google reponse - ${err.message}`);
    }
  });
}

/**
 * Takes RequestObject and modifies it to fit CustomMatrix format of VROOM
 * @param {Object} data.vehicles, the VROOM Object {vehicles, jobs}
 * @param {Object} data.jobs 
 * @returns {Promise<{coordinateArray: Array(Array(number)) ,modifiedRequest{vehicles:Object, jobs: Object}}>} modified request
 */
function extractRequestObjects(data) {
  let payload = data;
  return new Promise((resolve, reject) => {
    if (payload.vehicles == undefined || payload.jobs == undefined) {
      reject("extractRequestObjects(): missing vehicles/jobs object");
      return;
    }
    let vehicles = payload.vehicles;
    let jobs = payload.jobs;
    let coordinateArray = []; //idx,lat,long
    let idx = 0;
    vehicles.forEach((vehicle) => {
      vehicle.start_index = idx;
      coordinateArray.push({ idx: idx, lat: vehicle.start[1], lon: vehicle.start[0] });
      idx++;
      vehicle.end_index = idx;
      coordinateArray.push({ idx: idx, lat: vehicle.end[1], lon: vehicle.end[0] });
      delete vehicle.start;
      delete vehicle.end;
      idx++;
    });
    jobs.forEach((job) => {
      job.location_index = idx;
      coordinateArray.push({ idx: idx, lat: job.location[1], lon: job.location[0] });
      delete job.location;
      idx++;
    });
    resolve({
      coordinateArray: coordinateArray,
      modifiedRequest: { vehicles: vehicles, jobs: jobs },
    });
  });
}

/**Create custom Matrix Request based on coordinate Array. Return an Array of
 * Here (x1,y1) : bottom-left point, (x2, y2): top-right point,
 * x1 to x2 : origin coordinates (row-wise); y1 to y2: destination (column-wise)
 * @param {Array(Array(number)} coordinateArray
 * @returns {Promise<{sections: Array({x1:number, x2:number, y1: number, y2: number}), customMatrix: Array(Array(number))}>}
 */
function createDMRequests(coordinateArray) {
  return new Promise((resolve, reject) => {
    try {
      let size = coordinateArray.length;
      let customMatrix = new Array(size);
      for (let i = 0; i < size; i++) {
        customMatrix[i] = new Array(size);
      }
      let sections = distanceMatrixHelper.calcRequestNeeded(size);
      for (let j = 0; j < sections.length; j++) {
        let origins = `origins=`;
        for (let i = sections[j].x1; i <= sections[j].x2; i++) {
          origins += `${coordinateArray[i].lat},${coordinateArray[i].lon}|`;
        }
        origins = origins.slice(0, origins.length - 1);
        let destinations = `destinations=`;
        for (let i = sections[j].y1; i <= sections[j].y2; i++) {
          destinations += `${coordinateArray[i].lat},${coordinateArray[i].lon}|`;
        }
        destinations = destinations.slice(0, destinations.length - 1);
        let url = constructDistanceMatrixRequest(origins, destinations); //2a

        sections[j].url = url;
      }
      resolve({ sections, customMatrix });
    } catch (err) {
      reject("createDMRequests():" + err);
    }
  });
}

/**
 * Create custom Matrix from multiple Distance matrix API calls, Asynchronously.
 * Since parallel calls are made to Google API, hence faster,Use this for production.
 * Warning! Due to the parallel nature, in case one of the request fails, it will still execute for remaining calls.
 * @param {Array({x1:number, x2:number, y1: number, y2: number}} sections, array of section of coordinateArray matrix  
 * @param {Array(Array(number))} customMatrix, empty 2-D Array for storing distance matrix responses
 * @returns {Array(Array(number))} customMatrix 
 */
async function fillCustomMatrix(sections, customMatrix) {
  return new Promise(async (resolve, reject) => {
    try {
      let sectionsRequests = [];
      for (let i = 0; i < sections.length; i++) {
        sectionsRequests.push(
          (async function (section) {
            console.log(`Distance Matrix Request #${i} sent`);
            let data = await sendRequest(section.url);
            saveTofile(`DM_REQ#${i}`, data);
            let durationMatrix = await extractDurationData(data);
            for (let r = section.x1; r <= section.x2; r++) {
              for (let c = section.y1; c <= section.y2; c++) {
                customMatrix[r][c] = durationMatrix[r - section.x1][c - section.y1];
              }
            }
          })(sections[i]));
      }
      await Promise.all(sectionsRequests);
      resolve(customMatrix);
    } catch (err) {
      reject(`fillCustomMatrix():${err}`);
    }
  });
}

/**
 * Create custom Matrix from multiple Distance matrix API calls, Synchronously.
 * Useful for Dev mode, or in case for slow computation, in case your Google Account has exceeded rate-limit 
 * Minimises wasteful calls, since the function stops when it receives failure response.
 * @param {Array({x1:number, x2:number, y1: number, y2: number}} sections, array of section of coordinateArray matrix  
 * @param {Array(Array(number))} customMatrix, empty 2-D Array for storing distance matrix responses
 * @returns {Array(Array(number))} customMatrix 
 */
async function fillCustomMatrixSync(sections, customMatrix) {
  return new Promise(async (resolve, reject) => {
    try {
      for (let i = 0; i < sections.length; i++) {
        await (async function (section) {
          console.log(`Distance Matrix Request #${i} sent`);
          let data = await sendRequest(section.url);
          saveTofile(`DM_REQ#${i}`, data);
          let durationMatrix = await extractDurationData(data);
          for (let r = section.x1; r <= section.x2; r++) {
            for (let c = section.y1; c <= section.y2; c++) {
              customMatrix[r][c] = durationMatrix[r - section.x1][c - section.y1];
            }
          }
          await waitBuffer(200);
        })(sections[i]);

      }
      resolve(customMatrix);
    } catch (err) {
      reject(`fillCustomMatrixSync():${err}`);
    }
  });
}
/**
 * Calls VROOM executable, compiled version 1.9.0
 * for POC using file mode -i for input
 * @param {Object} requestFile 
 * @returns {Object} VROOM response
 */
function runVROOM(requestFile) {
  return new Promise((resolve, reject) => {
    exec(`.\\VROOM -i "${requestFile}"`, (error, stdout, stderr) => {
      if (error) {
        reject(`runVROOM(): ${error.message}`);
        return;
      }
      if (stderr) {
        reject(`runVROOM(): ${stderr}`);
        return;
      }
      resolve(JSON.parse(stdout));
    });
  });
}

exports.extractRequestObjects = extractRequestObjects;
exports.createDMRequests = createDMRequests;
exports.extractDurationData = extractDurationData;
exports.fillCustomMatrix = fillCustomMatrix;
exports.fillCustomMatrixSync = fillCustomMatrixSync;
exports.sendRequest = sendRequest;
exports.runVROOM = runVROOM;
exports.saveTofile = saveTofile;
