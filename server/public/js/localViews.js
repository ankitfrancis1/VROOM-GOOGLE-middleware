const tableVehicle = document
  .querySelector("#vehicle-table")
  .getElementsByTagName("tbody")[0];
const tableJob = document
  .querySelector("#job-table")
  .getElementsByTagName("tbody")[0];
const toolTip = document.querySelector("#copyToolTip");
const outputScreen = document.querySelector("#output");

const showLoader = function () {
  document.querySelector("#loader").style.display = "block";
  document.querySelector(".panel").style.display = "none";
};
const hideLoader = function () {
  document.querySelector("#loader").style.display = "none";
  document.querySelector(".panel").style.display = "flex";
};
export {
  tableVehicle,
  tableJob,
  toolTip,
  outputScreen,
  showLoader,
  hideLoader,
};
