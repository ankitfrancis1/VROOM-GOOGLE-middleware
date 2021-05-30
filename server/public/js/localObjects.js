class vehicle {
  constructor(id, start_lat, start_lon, end_lat, end_lon) {
    this.id = id;
    this.start = [start_lon, start_lat];
    this.end = [end_lon, end_lat];
    this.capacity = [100];
    this.skills = [1];
    this.time_window = [1600416000, 1600430400];
  }
}

class job {
  constructor(id, lat, lon) {
    this.id = id;
    this.service = 300;
    this.delivery = [1];
    this.skills = [1];
    this.location = [lon, lat];
    this.time_windows = [[1600416000, 1600430400]];
  }
}

let vehicleArray = [];
let jobArray = [];
export { vehicle, vehicleArray, job, jobArray };
