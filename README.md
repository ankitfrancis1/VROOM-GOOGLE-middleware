
# VROOM with Google Distance Matrix

## A POC middleware, that demonstrates that you can add realtime traffic duration provided by Google Distance Matrix for VROOM solver

[VROOM API project here(release 1.9)](https://github.com/VROOM-Project/vroom/blob/release/1.9/docs/API.md)

### What it does

- Takes in the VROOM Request along with the location coordinates and generates the custom Matrix for traffic duration using Google Distance Matrix API
- Plugs in the custom Matrix in the original request and generates response from VROOM.

### Features

- Enables user to set a VROOM solver without routing engine.
- Google Distance Matrix API has 100 element per request limit, We bypass that here by combining Distance Matrix responses.
- Minimizes number of Distance Matrix calls to Google using greedy algorithm.

### Steps for installation (Windows)

- install VROOM dependencies using this [documentation](https://github.com/krandalf75/vroom/blob/kran_integrate_cmake/docs/building_cmake.md)
- install Node JS
- launch terminal in  /server folder.
- run on terminal: npm install
- inside config file
  - put "google_api_key": "key=***your-api-key***",
  - keep "async_call_mode": false,('false', makes sequential calls to Google; 'true', makes parallel calls which is faster, but in case of execution failure while testing, parallel calls will execute completely before terminating i.e. wasteful calls)
- run on terminal: node app.js

### How to use

![Screenshot of Client](https://user-images.githubusercontent.com/28080152/120088515-f770cd80-c10e-11eb-9c9d-e91e790b546b.png)

1. Inside \test directory you will find vehicle.csv and jobs.csv.
2. Upload the files using the ***Upload*** button.
3. You can preview the Request Body using ***Show Request*** and Send the Request.
4. The response will be the VROOM API call's response.
