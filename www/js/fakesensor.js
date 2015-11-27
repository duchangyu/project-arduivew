

$(function () {
  

       //get mqtt configuration from server
    $.getJSON('/api/mqttconfig',function(mqttconfig){

      var clientId = "ws" + Math.random();
      // Create a client instance
      var client = new Paho.MQTT.Client(
            mqttconfig.broker_url, 
            mqttconfig.websocket_port, 
            clientId);

      // set callback handlers
          client.onConnectionLost = onConnectionLost;
          client.onMessageArrived = onMessageArrived;

      // connect the client
      client.connect({
        useSSL: true,
        userName: mqttconfig.username,
        password: mqttconfig.password,
        onSuccess: onConnect
      });

      // called when the client connects
      function onConnect() {
        // Once a connection has been made, make a subscription and send a message.
        console.log("onConnect");
        client.subscribe(mqttconfig.topic);
      }




      // called when the client loses its connection
      function onConnectionLost(responseObject) {
        if (responseObject.errorCode !== 0) {
          console.log("onConnectionLost:", responseObject.errorMessage);
          setTimeout(function() { client.connect() }, 5000);
        }
      }

      // called when a message arrives
      function onMessageArrived(message) {

        var topic = message.destinationName;
        var temperature = message.payloadString;

        console.log('recieved on ' + topic + 'temperature : ' + temperature);


      }

      $('#btnSubmit').click(function(event) {
        /* Act on the event */

        var temp = $('#inputTemperature').val();

          message = new Paho.MQTT.Message(temp);
          message.destinationName = mqttconfig.topic;
          client.send(message);
        
      });

      var autoRandomTestValue ;

      $('#btnSubmitRandom').click(function(event) {
        /* Act on the event */

        function getRandom(min, max) {
          return Math.random() * (max - min) + min;
        }

        function getRandomInt(min, max) {
          return Math.floor(Math.random() * (max - min + 1) + min);
        }

        // //show a banner saying that the data is for testing
        // $('testSign').show();

       autoRandomTestValue = setInterval(function(){

         var temp = getRandomInt(15, 35).toString(); 

          message = new Paho.MQTT.Message(temp);
          message.destinationName = mqttconfig.topic;
          client.send(message);

        }, 1000);

       
        
      });


      $('#btnClearRandom').click(function(event) {
        /* Act on the event */

        clearInterval(autoRandomTestValue);
 
      });
      

      


    });



});

