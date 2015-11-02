var dataloader = {};

///////////////////////////////////////////////////////////////////////////
// get temperature from cloud server
//
///////////////////////////////////////////////////////////////////////////
dataloader.getLastTemperature = function(onSuccess) {

    var url = '/api/sensors/561083be06dd6162658ae8c8/values/last' ;
        


    $.getJSON(url, function(data){

        var response = {
            temperatureItem : data
        }

        onSuccess(response);
    });
}


dataloader.getLast10Temperatures = function(onSuccess) {

  //get last 10 temperature items
  var url = '/api/sensors/561083be06dd6162658ae8c8/values/10';

  $.getJSON(url, function(data){

        if(!Array.isArray(data)) return;

        //sort by timestamp
        data.sort(function(a,b){
            return parseInt(a.timeStamp) - parseInt(b.timeStamp);
        });



    onSuccess(data);

  });

}