
# VROOM with Google Distance Matrix

## A POC middleware, that demonstrates that you can add realtime traffic duration provided by Google Distance Matrix for VROOM solver

[VROOM API project here(release 1.9)](https://github.com/VROOM-Project/vroom/blob/release/1.9/docs/API.md)

- Mitigates Google API's 100 element per request limit, by combining Distance Matrix responses.
- Minimizes number of Distance Matrix calls using greedy algorithm.
- can be extended to allow time windows, break, vehicle types etc. (all features of VROOM)

### Steps for installation (Windows)

- install VROOM dependencies using this [documentation](https://github.com/krandalf75/vroom/blob/kran_integrate_cmake/docs/building_cmake.md)
- install Node JS
- terminal: npm install
- inside config file
  - put "google_api_key": "key=***your-api-key***",
  - keep "async_call_mode": true, in case you need to measure peformance
- terminal: node app.js

### How to use

![Screenshot of Client]()

1. Inside \test directory you will find vehicle.csv and jobs.csv.
2. Upload the files using the ***Upload*** button.
3. You can preview the Request Body using ***Show Request*** and Send the Request.
4. The response will be the VROOM API call's response.
