/////////////////////////////////////////////////////////////////////////////////
// Copyright (c) Autodesk, Inc. All rights reserved
// Written by Philippe Leefsma 2014 - ADN/Developer Technical Services
//
// Permission to use, copy, modify, and distribute this software in
// object code form for any purpose and without fee is hereby granted,
// provided that the above copyright notice appears in all copies and
// that both that copyright notice and the limited warranty and
// restricted rights notice below appear in all supporting
// documentation.
//
// AUTODESK PROVIDES THIS PROGRAM "AS IS" AND WITH ALL FAULTS.
// AUTODESK SPECIFICALLY DISCLAIMS ANY IMPLIED WARRANTY OF
// MERCHANTABILITY OR FITNESS FOR A PARTICULAR USE.  AUTODESK, INC.
// DOES NOT WARRANT THAT THE OPERATION OF THE PROGRAM WILL BE
// UNINTERRUPTED OR ERROR FREE.
/////////////////////////////////////////////////////////////////////////////////
var defaultUrn = 'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6bW9kZWwyMDE1LTEwLTIzLTA4LTEyLTEzLTR5dnJzcTVtZTd5MW50aDB3ZjRsczVncnE5b28vR2F0ZUhvdXNlLm53ZA==';

$(document).ready(function () {
    var tokenurl = 'http://' + window.location.host + '/api/token';
    var config = {
        language : 'zh-cn',
        environment : 'AutodeskProduction'
		//environment : 'AutodeskStaging'
    };

    // Instantiate viewer factory
    var viewerFactory = new Autodesk.ADN.Toolkit.Viewer.AdnViewerFactory(
        tokenurl,
        config);

    // Allows different urn to be passed as url parameter
    var paramUrn = Autodesk.Viewing.Private.getParameterByName('urn');
    var urn = (paramUrn !== '' ? paramUrn : defaultUrn);

    viewerFactory.getViewablePath (urn,
        function(pathInfoCollection) {
            var viewerConfig = {
                viewerType: 'GuiViewer3D'
            };

            var viewer = viewerFactory.createViewer(
                $('#viewerDiv')[0],
                viewerConfig);



            viewer.addEventListener(
                    Autodesk.Viewing.GEOMETRY_LOADED_EVENT,
                    function(event) {
                        loadExtensions(viewer);
                });



            viewer.load(pathInfoCollection.path3d[0].path);
        },
        onError);

});

function loadExtensions(viewer) {

        //load measure extension
        viewer.loadExtension("Autodesk.Measure");

        viewer.loadExtension('Autodesk.ADN.Viewing.Extension.Color');

        viewer.loadExtension('Viewing.Extension.Workshop');

        var dockingPanelOptions = {
          
        };
        viewer.loadExtension('Autodesk.ADN.Viewing.Extension.GenericDockingPanel',dockingPanelOptions);
        

        // //build option 
        // var options = {};
        // // load the PropertyPanel extension
        // viewer.loadExtension('Autodesk.ADN.Viewing.Extension.PropertyPanel',options);

    }


function onError(error) {
    console.log('Error: ' + error);
};

/*
// The following code does not rely on Autodesk.ADN.Toolkit.Viewer.AdnViewerManager
// and uses the Autodesk API directly.

       $(document).ready(function () {
           var getToken =  function() {
               var xhr = new XMLHttpRequest();
               xhr.open("GET", 'http://' + window.location.host + '/api/token', false);
               xhr.send(null);

               var response = JSON.parse(
                    xhr.responseText);

                return response.access_token;
           }

           function initializeViewer(containerId, documentId, role) {
               var viewerContainer = document.getElementById(containerId);
               var viewer = new Autodesk.Viewing.Private.GuiViewer3D(
                       viewerContainer);
               viewer.start();

               Autodesk.Viewing.Document.load(documentId,
                       function (document) {
                           var rootItem = document.getRootItem();
                           var geometryItems = Autodesk.Viewing.Document.getSubItemsWithProperties(
                                   rootItem,
                                   { 'type': 'geometry', 'role': role },
                                   true);

                           viewer.load(document.getViewablePath(geometryItems[0]));
                       },

                       // onErrorCallback
                       function (msg) {
                           console.log("Error loading document: " + msg);
                       }
               );
           }

           function initialize() {
               var options = {
                   env: "AutodeskProduction",
                   getAccessToken: getToken,
                   refreshToken: getToken,
                   language : 'zh-HANS' //Simplified Chinese
               };

                // Allows different urn to be passed as url parameter
                var paramUrn = Autodesk.Viewing.Private.getParameterByName('urn');
                var urn = (paramUrn !== '' ? paramUrn : defaultUrn);

                if (urn.indexOf('urn:') !== 0)
                urn = 'urn:' + urn;

               Autodesk.Viewing.Initializer(options, function () {
                   initializeViewer('viewerDiv', urn, '3d');
               });
           }

           initialize();
       });

*/