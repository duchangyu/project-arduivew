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
    ' <canvas id="canvasChart" height="150" width="305"></canvas>',
    // '<img class="img" src="/images/red-button.png"/>',
    '<img class="img img-responsive" src="/images/arduino-lm35.png"></img>'
    ];
    $(_thisPanel.container).append(html.join('\n'));


    

    gernerateTempChart();



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



  ////////////////////////////////////
  ///Generate the chart
  ///
  ////////////////////////////////////
  var gernerateTempChart = function(){

    var lineChartData = {
          labels : [],
          datasets : [
            {
              label: "Temperatures",
              fillColor : "rgba(220,220,220,0.2)",
              strokeColor : "rgba(220,220,220,1)",
              pointColor : "rgba(220,220,220,1)",
              pointStrokeColor : "#fff",
              pointHighlightFill : "#fff",
              pointHighlightStroke : "rgba(220,220,220,1)",
              data : []
            }
          ]
        }

    var updateData = function(lineChartData){

      dataloader.getLast10Temperatures(function(tempItems){

        //clear first
        lineChartData.labels.length = 0;
        lineChartData.datasets[0].data.length = 0;

        

        tempItems.forEach(function(tempItem){
          //add time as label
          var timeStamp = tempItem.timestamp;
          var lbl = new Date(timeStamp).toLocaleTimeString();

          lineChartData.labels.push(lbl);

          //add temperature values
          var temperature = tempItem.value;
          lineChartData.datasets[0].data.push(temperature);

                          
        });



      });

    }


    var highTemperatureMonitor = function(){
      //hard coded 
      var alertTemperature = 40;

      //the sensor on roof, dbid = 1735, hardcoded for demo
      var sensorDbId = 1735;

      var alerting = false;


      dataloader.getLastTemperature(function(response){

        var lastTemp = response.temperatureItem.value;

        if(lastTemp > alertTemperature) {
          viewer.setColorMaterial(sensorDbId,0xff0000);
          viewer.fitToView(sensorDbId);

          alerting = true;
            
           

        }else if(alerting){

          //dismiss alert
            
          viewer.restoreColorMaterial(sensorDbId);
          viewer.fitToView();
          
          alerting = false;  
          

        }

      });

    }
    


    //generate the chart
    var ctx = document.getElementById("canvasChart").getContext("2d");

    setInterval(function(){

      updateData(lineChartData);

      window.myLine = new Chart(ctx).Line(lineChartData, {
        responsive: true
      });


      //start high temperature monitoring 
      highTemperatureMonitor();

    },
    5000  //5 seconds refresh
    );
        

  



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
      'height: 450px;',
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
