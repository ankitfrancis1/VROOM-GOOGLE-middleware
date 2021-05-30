function ReadFileAsync(objectFile) {
  return new Promise((resolve, reject) => {
    if (typeof FileReader == "undefined") {
      reject("This browser does not support HTML5.");
      return;
    }
    const regex = /^([a-zA-Z0-9\s_\\.\-:])+(.csv|.txt)$/;
    if (regex.test(objectFile.value.toLowerCase()) == false) {
      reject("Please upload a valid CSV file.");
      return;
    }
    let reader = new FileReader();
    reader.onload = (e) => {
      let dataTable = [];
      let rows = e.target.result.split("\r\n");
      for (let i = 1; i < rows.length; i++) {
        let cells = rows[i].split(",");
        if (cells.length > 0) dataTable.push(cells);
      }
      resolve(dataTable);
    };
    reader.onerror = () => reject("error reading file");
    reader.readAsText(objectFile.files[0]);
  });
}

function UpdateViewTable(objectView, dataTable) {
  objectView.innerHTML = "";
  dataTable.forEach((dataRow) => {
    let gridRow = objectView.insertRow(-1);
    dataRow.forEach((dataCell) => {
      let gridCell = gridRow.insertCell(-1);
      gridCell.innerHTML = dataCell;
    });
  });
}

async function UploadFile(objectFile, objectView) {
  try {
    let dataTable = await ReadFileAsync(objectFile);
    UpdateViewTable(objectView, dataTable);
    return dataTable;
  } catch (err) {
    alert(err);
  }
}

function FetchResponseOnScreen(outputDiv, requestJSON, callbackFunction) {
  outputDiv.innerHTML = "Clicked!";
  fetch("http://localhost:3000/VROOM", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestJSON),
  })
    .then((response) => response.json())
    .then((data) => {
      callbackFunction();
      outputDiv.textContent = JSON.stringify(data);
    })
    .catch((err) => {
      callbackFunction();
      outputDiv.textContent = err;
    });
}

export { UploadFile, FetchResponseOnScreen };
