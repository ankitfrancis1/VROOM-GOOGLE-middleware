"use strict";
/**
 * Google Distance Matrix limits 
 * number of elements in 1 request: 100, maxTileArea
 * number of origins/destination in one request: 25, maxSideLen
 */
const maxSideLen = 25; 
const maxTileArea = 100; 

/**
 * returns maximum integer side Length that can make the maximumTileArea
 * @param {number} length 
 * @returns {number} 
 */
function getMaxTileBreadth(length) {
  if (length <= maxSideLen) {
    return Math.floor(maxTileArea / length);
  } else {
    return Math.floor(maxTileArea / maxSideLen);
  }
}

/**
 * returns an object of sections of the distance Matrix that will constitute 1 distance matrix API call.
 * the function minimises the number of sections, using Greedy logic.
 * TODO: between size > 25 to size <= 40 the solution is not minimum, fix this.
 * @param {number} size 
 * @returns {Array({x1:number, x2:number, y1: number, y2: number}} sections
 */
function calcRequestNeeded(size) {
  let baseLengths = [];
  for (let i = size; i > 0; ) {
    if (i >= maxSideLen) {
      baseLengths.push(maxSideLen);
      i -= maxSideLen;
    } else {
      baseLengths.push(i);
      i = 0;
    }
  }

  let resultCount = 0;
  let x1 = 0,
    x2 = 0,
    y1 = 0,
    y2 = 0;
  let sections = new Array(); //store results for output

  for (let i = 0; i < baseLengths.length; i++) {
    let remainingFloorBreadth = size;
    let tileLength = baseLengths[i];
    x2 = x1 + baseLengths[i] - 1;
    while (remainingFloorBreadth > 0) {
      let maxTileBreadth = getMaxTileBreadth(tileLength);
      let deductFloorBreadth =
        maxTileBreadth <= remainingFloorBreadth ? maxTileBreadth : remainingFloorBreadth;
      y2 = y1 + deductFloorBreadth - 1;
      remainingFloorBreadth -= deductFloorBreadth;
      sections.push({ x1: x1, y1: y1, x2: x2, y2: y2 });
      y1 = y2 + 1;
      resultCount++;
    }
    x1 = x2 + 1;
    y1 = 0;
    y2 = 0;
  }

  return sections;
}

exports.calcRequestNeeded = calcRequestNeeded;
