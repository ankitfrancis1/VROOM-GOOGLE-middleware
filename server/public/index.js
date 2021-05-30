"use strict";
import * as localObjects from "./js/localObjects.js";
import * as localViews from "./js/localViews.js";
import * as utils from "./js/utilityFunctions.js";

const fileUploadVehicle = document.querySelector("#fileUpload-vehicle");
const fileUploadVehicleButton = document.querySelector("#upload-vehicle");
const fileUploadJob = document.querySelector("#fileUpload-job");
const fileUploadJobButton = document.querySelector("#upload-job");
const showButton = document.querySelector("#show-request");
const sendButton = document.querySelector("#send-request");
const copyTextButton = document.querySelector("#copy-button");

console.log("running");

sendButton.addEventListener("click", () => {
  localViews.showLoader();
  utils.FetchResponseOnScreen(
    localViews.outputScreen,
    {
      vehicles: localObjects.vehicleArray,
      jobs: localObjects.jobArray,
    },
    localViews.hideLoader
  );
  //localViews.hideLoader();
});

fileUploadVehicleButton.addEventListener("click", async () => {
  let dataTable = await utils.UploadFile(
    fileUploadVehicle,
    localViews.tableVehicle
  );
  localObjects.vehicleArray.length = 0;
  dataTable.forEach((row) => {
    localObjects.vehicleArray.push(
      new localObjects.vehicle(
        Number(row[0]),
        Number(row[1]),
        Number(row[2]),
        Number(row[3]),
        Number(row[4])
      )
    );
  });
  console.log(localObjects.vehicleArray);
});

fileUploadJobButton.addEventListener("click", async () => {
  let dataTable = await utils.UploadFile(fileUploadJob, localViews.tableJob);
  localObjects.jobArray.length = 0;
  dataTable.forEach((row) => {
    localObjects.jobArray.push(
      new localObjects.job(Number(row[0]), Number(row[1]), Number(row[2]))
    );
  });
  console.log(localObjects.jobArray);
});

showButton.addEventListener("click", () => {
  localViews.outputScreen.innerHTML = JSON.stringify({
    vehicles: localObjects.vehicleArray,
    jobs: localObjects.jobArray,
  });
});

copyTextButton.addEventListener("click", () => {
  let r = document.createRange();
  r.selectNode(localViews.outputScreen);
  window.getSelection().removeAllRanges();
  window.getSelection().addRange(r);
  document.execCommand("copy");
  window.getSelection().removeAllRanges();
  localViews.toolTip.innerHTML = "Copied! ";
});

copyTextButton.addEventListener("mouseout", () => {
  localViews.toolTip.innerHTML = "Copy to clipboard";
});
