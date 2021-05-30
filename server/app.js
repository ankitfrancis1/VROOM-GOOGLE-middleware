const config = require("./config.json");
const express = require("express");
const cors = require("cors");
const utils = require("./utils.js");
const fs = require("fs");
const e = require("express");

const app = express();
const port = config.port;
app.use(cors()); //cross origin
app.use(express.json()); // enable content type json
app.use(express.static('public'));

app.get("/", (req, res) => {
  res.sendFile(`${__dirname}\\public\\index.html`);
});

app.post("/VROOM", async (req, res) => {
  try {
    let { coordinateArray, modifiedRequest } = await utils.extractRequestObjects(req.body); //Takes request with {vehicles, jobs}
    let { sections, customMatrix } = await utils.createDMRequests(coordinateArray);//Create structure for customMatrix
    if(config.async_call_mode === false) {//Fill customMatrix with actual duration data from Google API
      modifiedRequest.matrix = await utils.fillCustomMatrixSync(sections, customMatrix);
    } else {
      modifiedRequest.matrix = await utils.fillCustomMatrix(sections, customMatrix);
    }
    let VROOMrequestFile =await utils.saveTofile("VROOM_REQ", modifiedRequest);//Adds customMatrix to original request
    let VROOMResponse = await utils.runVROOM(VROOMrequestFile);//Call VROOM executable
    utils.saveTofile("VROOM_RESP", VROOMResponse);
    res.send(JSON.stringify(VROOMResponse));
  } catch (err) {
    res.send({"error":err});
  }
});


app.listen(port, () => {
  console.log(`Server is listening on http://127.0.0.1:${port}`);
});
