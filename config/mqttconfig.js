var mqttconfig = {
  //https://api.cloudmqtt.com/sso/cloudmqtt/console
  
  broker_url : process.env.CLOUDMQTT_URL || 'm11.cloudmqtt.com',
  username : 'danieldu',
  password : 'Autodesk123',
  topic : 'temperature-center',
  websocket_port : 35521,
  mqtt_port : 15521,
  ssl_port : 2521

}



module.exports =mqttconfig ;