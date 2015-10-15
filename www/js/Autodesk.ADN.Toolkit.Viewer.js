///////////////////////////////////////////////////////////////////////////////
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
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
// Namespace declaration
//
///////////////////////////////////////////////////////////////////////////////
AutodeskNamespace("Autodesk.ADN.Toolkit.Viewer");


///////////////////////////////////////////////////////////////////////////////
// Autodesk.ADN.Toolkit.Viewer.AdnViewerFactory
//
///////////////////////////////////////////////////////////////////////////////
Autodesk.ADN.Toolkit.Viewer.AdnViewerFactory = function (
    tokenOrUrl,
    factoryConfig) {

    ///////////////////////////////////////////////////////////////////////////
    // Check if string is a valid url
    //
    ///////////////////////////////////////////////////////////////////////////
    var _validateURL = function (str) {

        return (str.indexOf('http:') > -1 || str.indexOf('https:') > -1);
    }

    var _newGuid = function () {

        var d = new Date().getTime();

        var guid = 'xxxx-xxxx-xxxx-xxxx-xxxx'.replace(
            /[xy]/g,
            function (c) {
                var r = (d + Math.random() * 16) % 16 | 0;
                d = Math.floor(d / 16);
                return (c == 'x' ? r : (r & 0x7 | 0x8)).toString(16);
            });

        return guid;
    };

    var _addGetProperty = function (object) {

        object.getProperty = function (propName, defaultValue) {

            if (this && this.hasOwnProperty(propName)) {

                return this[propName];
            }

            return defaultValue;
        }
    }

    ///////////////////////////////////////////////////////////////////////////
    // Private Members
    //
    ///////////////////////////////////////////////////////////////////////////

    var _self = this;

    ///////////////////////////////////////////////////////////////////////////
    // Get 2d and 3d viewable path
    //
    ///////////////////////////////////////////////////////////////////////////
    this.getViewablePath = function (urn, onSuccess, onError) {

        var options = _initializeOptions();

        Autodesk.Viewing.Initializer(options, function () {

            if (urn.indexOf('urn:') !== 0)
                urn = 'urn:' + urn;

            Autodesk.Viewing.Document.load(
                urn,
                function (document) {

                    var pathCollection = {

                        path2d: [],
                        path3d: []
                    }

                    var items2d = Autodesk.Viewing.Document.getSubItemsWithProperties(
                        document.getRootItem(),
                        {
                            'type': 'geometry',
                            'role': '2d'
                        },
                        true);

                    for (var i =0; i<items2d.length; ++i) {

                        pathCollection.path2d.push({
                                name : items2d[i].name,
                                path: document.getViewablePath(items2d[i])
                            });
                    }

                    var items3d = Autodesk.Viewing.Document.getSubItemsWithProperties(
                        document.getRootItem(),
                        {
                            'type': 'geometry',
                            'role': '3d'
                        },
                        true);

                    for (var i =0; i<items3d.length; ++i) {

                        pathCollection.path3d.push({
                                name : items3d[i].name,
                                path: document.getViewablePath(items3d[i])
                            });
                    }

                    onSuccess(pathCollection);
                },
                function (error) {

                    onError(error);
                }
            );
        });
    };

    ///////////////////////////////////////////////////////////////////////////
    // Initializes options
    //
    ///////////////////////////////////////////////////////////////////////////
    function _initializeOptions() {

        var options = {

            env: factoryConfig.getProperty(
                'environment',
                'AutodeskProduction'),

            //UI language
            language : factoryConfig.getProperty(
                'language',
                'en')
        };

        // initialized with getToken callback
        if (_validateURL(tokenOrUrl)) {

            var getToken = function () {

                var xhr = new XMLHttpRequest();

                xhr.open("GET", tokenOrUrl, false);
                xhr.send(null);

                var response = JSON.parse(
                    xhr.responseText);

                return response.access_token;
            }

            options.getAccessToken = getToken;

            options.refreshToken = getToken;
        }

        // initialized with access token
        else {

            options.accessToken = tokenOrUrl;
        }

        return options;
    }

    ///////////////////////////////////////////////////////////////////////////
    // Creates new viewer div element
    //
    ///////////////////////////////////////////////////////////////////////////
    var _createViewerDiv = function (container) {

        var id = _newGuid();

        var viewerDiv = document.createElement("div");

        viewerDiv.id = id;
        //viewerDiv.setAttribute("id",id);
            
        container.appendChild(viewerDiv);
        //must append "px", without space 
        viewerDiv.style.height = container.scrollHeight + "px";
        viewerDiv.style.width = container.scrollWidth + "px";
       

        

        // disable default context menu on viewer div

        viewerDiv.addEventListener("contextmenu",
          function (e) {
                e.preventDefault();
            });

        // disable scrolling on DOM document
        // while mouse pointer is over viewer area

        viewerDiv.addEventListener("mouseover",
          function (e) {
              var x = window.scrollX;
              var y = window.scrollY;
              window.onscroll = function () {
                  window.scrollTo(x, y);
              };
          });

        viewerDiv.addEventListener("mouseout",
          function (e) {
              window.onscroll = null;
          });

        return viewerDiv;
    };

    ///////////////////////////////////////////////////////////////////////////
    //
    //
    ///////////////////////////////////////////////////////////////////////////
    this.createViewer = function (container, viewerConfig) {

        _addGetProperty(viewerConfig);

        var viewer = null;

        var viewerDiv = _createViewerDiv(container);

        switch(viewerConfig.getProperty('viewerType', 'GuiViewer3D')) {

            case 'GuiViewer3D':
                viewer = new Autodesk.Viewing.Private.GuiViewer3D(
                    viewerDiv);
                break;

            case 'Viewer3D':
                viewer = new Autodesk.Viewing.Viewer3D(
                    viewerDiv);
                break;

            default:

                console.log("Warning: viewerType not specified or incorrect in config, using Viewer3D");
                console.log("Valid values: {Viewer3D, GuiViewer3D}");

                viewer = new Autodesk.Viewing.Viewer3D(
                  viewerDiv);
                break;
        }

        viewer.start();

        viewer.setProgressiveRendering(
            viewerConfig.getProperty(
                'progressiveRendering',
                true)
        );

        var qualityLevel = viewerConfig.getProperty(
            'qualityLevel', [true, true]);

        viewer.setQualityLevel(
            qualityLevel[0],
            qualityLevel[1]);

        viewer.impl.setLightPreset(
            viewerConfig.getProperty(
                'lightPreset', 8)
        );

        var bkColor = viewerConfig.getProperty(
            'backgroundColor',
            [3,4,5, 250, 250, 250]);

        viewer.setBackgroundColor(
            bkColor[0], bkColor[1], bkColor[2],
            bkColor[3], bkColor[4], bkColor[5]);

        viewer.setDefaultNavigationTool(
            viewerConfig.getProperty(
            'navigationTool',
            'freeorbit'));

        viewer.addEventListener(

            Autodesk.Viewing.GEOMETRY_LOADED_EVENT,

            function(event) {

                viewer.fitToView(false);
            });

        return viewer;
    }
    
    _addGetProperty(factoryConfig);
}