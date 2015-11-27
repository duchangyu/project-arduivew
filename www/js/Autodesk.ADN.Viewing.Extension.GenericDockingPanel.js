/////////////////////////////////////////////////////////////////////
// Autodesk.ADN.Viewing.Extension.GenericDockingPanel
// by Philippe Leefsma, May 2015
//
/////////////////////////////////////////////////////////////////////
AutodeskNamespace("Autodesk.ADN.Viewing.Extension");

Autodesk.ADN.Viewing.Extension.GenericDockingPanel = function (viewer, options) {

  Autodesk.Viewing.Extension.call(this, viewer, options);

  var _panel = null;

  /////////////////////////////////////////////////////////////////
  // Extension load callback
  //
  /////////////////////////////////////////////////////////////////
  this.load = function () {

    _panel = new Panel(
      viewer.container,
      guid());

    _panel.setVisible(true);

    console.log('Autodesk.ADN.Viewing.Extension.GenericDockingPanel loaded');

    return true;
  }

  /////////////////////////////////////////////////////////////////
  //  Extension unload callback
  //
  /////////////////////////////////////////////////////////////////
  this.unload = function () {

    _panel.setVisible(false);

    console.log('Autodesk.ADN.Viewing.Extension.GenericDockingPanel unloaded');

    return true;
  }

  /////////////////////////////////////////////////////////////////
  // Generates random guid to use as DOM id
  //
  /////////////////////////////////////////////////////////////////
  function guid() {

    var d = new Date().getTime();

    var guid = 'xxxx-xxxx-xxxx-xxxx'.replace(
      /[xy]/g,
      function (c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c == 'x' ? r : (r & 0x7 | 0x8)).toString(16);
      });

    return guid;
  }

  /////////////////////////////////////////////////////////////////
  // The demo Panel
  //
  /////////////////////////////////////////////////////////////////
  var Panel = function(
    parentContainer, id) {

    var _thisPanel = this;

    _thisPanel.content = document.createElement('div');

    Autodesk.Viewing.UI.DockingPanel.call(
      this,
      parentContainer,
      id,
      'Temperatures Curve',
      {shadow:true});

    $(_thisPanel.container).addClass('docking-panel');

    /////////////////////////////////////////////////////////////
    // Custom html
    //
    /////////////////////////////////////////////////////////////
    
    var html = [
    ' <p><div><canvas id="smoothie-chart" height="150" width="305"></canvas></div></p>',
    '<P><div id="tempStatus" class="dockingPanelTitle text-right">',
    '<img class="img" style="height:30px; width:30px" src="/images/green-button.png"/>  <span >Normal </span>',
    '</div></p>',
    '<p><img class="img img-responsive" src="/images/arduino-lm35.png"></img></p>'
    ];
    $(_thisPanel.container).append(html.join('\n'));



    //generate the chart
    var chart = new SmoothieChart({timestampFormatter:SmoothieChart.timeFormatter}),
    canvas = document.getElementById('smoothie-chart'),
    series = new TimeSeries();

    chart.addTimeSeries(
      series, 
      {lineWidth:2,
        strokeStyle:'#00ff00',
        fillStyle:'rgba(198,181,78,0.30)',
        minValue : 0,
        maxValue : 60
      });
    chart.streamTo(canvas, 1000 /* some time delay */);


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

        //console.log('recieved on ' + topic + 'temperature : ' + temperature);
        highTemperatureMonitor(temperature);
        series.append(new Date().getTime(), temperature);

      }


    });

    





    /////////////////////////////////////////////////////////////
    // setVisible override (not used in that sample)
    //
    /////////////////////////////////////////////////////////////
    _thisPanel.setVisible = function(show) {

      Autodesk.Viewing.UI.DockingPanel.prototype.
        setVisible.call(this, show);
    }

    /////////////////////////////////////////////////////////////
    // initialize override
    //
    /////////////////////////////////////////////////////////////
    _thisPanel.initialize = function() {

      this.title = this.createTitleBar(
        this.titleLabel ||
        this.container.id);

      this.closer = this.createCloseButton();

      this.container.appendChild(this.title);
      this.title.appendChild(this.closer);
      this.container.appendChild(this.content);

      this.initializeMoveHandlers(this.title);
      this.initializeCloseHandler(this.closer);
    };

    /////////////////////////////////////////////////////////////
    // onTitleDoubleClick override
    //
    /////////////////////////////////////////////////////////////
    var _isMinimized = false;

    _thisPanel.onTitleDoubleClick = function (event) {

      _isMinimized = !_isMinimized;

      if(_isMinimized) {

        $(_thisPanel.container).addClass(
          'docking-panel-minimized');
      }
      else {
        $(_thisPanel.container).removeClass(
          'docking-panel-minimized');
      }
    };
  };




  //whether an alert is going on
  var alerting = false;


  var highTemperatureMonitor = function(lastTemp){
    //hard coded 
    var alertTemperature = 40;

    //the sensor on roof, dbid = 1735, hardcoded for demo
    //an Array
    var sensorDbId = [1735];

    var raiseAlarm = function(){
      viewer.fitToView(sensorDbId);
      viewer.setColorMaterial(sensorDbId,0xff0000);

      //light up the red button
      var html = [
        '<img class="img" style="height:30px; width:30px" src="/images/red-button.png"/>  <span >Alarm! High Temperature! </span>',
        '<audio id="audioAlert" src="/images/fire-alarm.mp3" autoplay loop>',
        '  Your browser does not support the audio element.',
        '</audio>',
      ];
      $('#tempStatus').html(html.join('\n'));

    };

    var dismissAlerm = function(){
      viewer.fitToView();
      viewer.restoreColorMaterial(sensorDbId);

      //light up the green button
      var html = '<img class="img" style="height:30px; width:30px" src="/images/green-button.png"/>  <span >Normal </span>';
      $('#tempStatus').html(html);

    };


      //was normal  && exceed to high temperature 
      if(!alerting && lastTemp >= alertTemperature) {

        raiseAlarm();
        alerting = true;
          

      }
      //was abnormal && temperature back to normal, alert dissmissed
      else if(alerting && lastTemp < alertTemperature){
        
        dismissAlerm();
        alerting = false;  
        

      }

 

  }

  /////////////////////////////////////////////////////////////
  // Set up JS inheritance
  //
  /////////////////////////////////////////////////////////////
  Panel.prototype = Object.create(
    Autodesk.Viewing.UI.DockingPanel.prototype);

  Panel.prototype.constructor = Panel;

  /////////////////////////////////////////////////////////////
  // Add needed CSS
  //
  /////////////////////////////////////////////////////////////
  var css = [



    'div.docking-panel {',
      'top: 0px;',
      'left: 0px;',
      'width: 305px;',
      'height: 550px;',
      'resize: both;',
      'overflow: hidden;',
    '}',

    'div.docking-panel-minimized {',
      'height: 34px;',
      'min-height: 34px',
    '}'

  ].join('\n');

  $('<style type="text/css">' + css + '</style>').appendTo('head');
};

Autodesk.ADN.Viewing.Extension.GenericDockingPanel.prototype =
  Object.create(Autodesk.Viewing.Extension.prototype);

Autodesk.ADN.Viewing.Extension.GenericDockingPanel.prototype.constructor =
  Autodesk.ADN.Viewing.Extension.GenericDockingPanel;

Autodesk.Viewing.theExtensionManager.registerExtension(
  'Autodesk.ADN.Viewing.Extension.GenericDockingPanel',
  Autodesk.ADN.Viewing.Extension.GenericDockingPanel);
