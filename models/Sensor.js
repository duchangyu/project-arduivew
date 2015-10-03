var mongoose = require('mongoose');

var sensorSchema = new mongoose.Schema({
  name: String,
  description : String,
  values : Array

});

var Sensor = mongoose.model('Sensor', sensorSchema);
module.exports = Sensor;