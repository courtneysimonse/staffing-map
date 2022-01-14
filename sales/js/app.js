// Import the functions you need from the SDKs you need

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
// import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-analytics.js";
import { getFirestore, collection, getDocs, doc, updateDoc, addDoc, onSnapshot, deleteDoc } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js'

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional

const firebaseConfig = {
  apiKey: "AIzaSyDd71-OrBUIUbczCorLdf0A_2cq6Yg69nI",
  authDomain: "staffing-map.firebaseapp.com",
  databaseURL: "https://staffing-map-default-rtdb.firebaseio.com",
  projectId: "staffing-map",
  storageBucket: "staffing-map.appspot.com",
  messagingSenderId: "145156413761",
  appId: "1:145156413761:web:f1469ccfb94df673e069c0",
  measurementId: "G-BTXXRX635C"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// const unsub = onSnapshot(doc(db, "client-sites", "9uhh21WDzNenLXwHpdDu"), (doc) => {
//   const source = doc.metadata.hasPendingWrites ? "Local" : "Server";
//   console.log(source, " data: ", doc.data());
// });

var toastLiveExample = document.getElementById('liveToast');
var dbNameToast = document.getElementById('db-name-toast');
var editTime = document.getElementById('edit-time');
var updatedData = document.getElementById('updated-doc');

// Get a list of documents from your database
function getSnapshotDB(db,dataset) {
  const col = collection(db, dataset);
  const snapshot = onSnapshot(col, (snap) => {
    const data = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    console.log("All data in ",dataset," collection", data);

    snap.docChanges().forEach((change) => {
    if (change.type === "added") {
        console.log("New client: ", change.doc.data());
    }
    if (change.type === "modified") {
        console.log("Modified client: ", change.doc.data());
        console.log(change);
        var toast = new bootstrap.Toast(toastLiveExample);
        // updatedData.innerText = JSON.stringify(change.doc.data());
        const description = "<strong>" + change.doc.data()['COMPANY'] + "</strong><br>" +
          "<strong>Position:</strong> " + change.doc.data()['POSITION'] + " <strong>Pay:</strong> " + change.doc.data()['PAY RATE'] +
          "<br>" + change.doc.data()['DESCRIPTION'] + "<br>" + change.doc.data()['SCHEDULE'] + "<br>" +
          "<strong>No. of People: </strong>" + change.doc.data()['NUMPEOPLE'] + " <strong>English Level:</strong> " +
          change.doc.data()['ENGLISHLEVEL'] + '<br>' + "<strong>Status:</strong> " + change.doc.data()['STATUS'];
        updatedData.innerHTML = description;
        editTime.innerText = new Date().toString();
        toast.show();
    }
    if (change.type === "removed") {
        console.log("Removed client: ", change.doc.data());
    }
  });

  });
  // const docList = snapshot.docs.map(doc => doc.data());
  // const docList = [];
  // snapshot.docs.forEach((doc, i) => {
  //   let docData = doc.data();
  //   docData.id = (doc.id);
  //   console.log(docData);
  //   docList.push(docData);
  // });

  return snapshot;
}  //end getSnapshotDB()

// Get a list of documents from your database
async function getDB(db,dataset) {
  const col = collection(db, dataset);
  const snapshot = await getDocs(col);
  // const docList = snapshot.docs.map(doc => doc.data());
  const docList = [];
  snapshot.docs.forEach((doc, i) => {
    let docData = doc.data();
    docData.id = (doc.id);
    console.log(docData);
    docList.push(docData);
  });

  return docList;
}  //end getDB()

mapboxgl.accessToken = 'pk.eyJ1IjoidGl0YW5tYXN0ZXIiLCJhIjoiY2t3dmNzbHhsMXl2MDJxanYwcmw0OHYzZCJ9.Rr2kb4WqAzr_5EgH8ZjK3A';
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v11',
  center: [-74.5, 42.0],
  zoom: 6,
  maxZoom: 18
});


const nav = new mapboxgl.NavigationControl({showCompass: false});
map.addControl(nav, 'top-left');

const filterGroupClients = document.getElementById('filter-group-clients');
const filterGroupCandidates = document.getElementById('filter-group-candidates');

const addBtn = document.getElementById('add-data');

const newClientForm = document.getElementById('newClientForm');
newClientForm.addEventListener('submit', function ( event ) {
  event.preventDefault();

  submitNewClient(event);
});

const radiusBtn = document.getElementById('showRadius');
let showRadiusToggle = false;
let circlesCandidates = [];
let circlesClients = [];

// disable map rotation using right click + drag
map.dragRotate.disable();

// disable map rotation using touch rotation gesture
map.touchZoomRotate.disableRotation();

// spiderifier
let spiderifierCandidate = new MapboxglSpiderifier(map, {
  markerWidth: 40,
  markerHeight: 40,
  customPin: true,
  initializeLeg: function (spiderLeg) {

    var content = createPopupCandidates(spiderLeg.feature);

    var popup = new mapboxgl.Popup({
        // closeOnClick: false,
        offset: MapboxglSpiderifier.popupOffsetForSpiderLeg(spiderLeg)
      }).setHTML(content);

    spiderLeg.mapboxMarker.setPopup(popup);
    popup.addTo(map);

    // find the toggle div and add function on click
    // const popupDiv = spiderLeg.mapboxMarker._popup;
    // popupDiv._content.childNodes[16].addEventListener('click', flipToggle);

  },
  onClick: function (e, spiderLeg) {

    // const editLink = document.getElementById(props['id']+"-edit");
    // console.log(editLink);
    // editLink.addEventListener('click', editCandidate(props));
    // console.log([spiderLeg.mapboxMarker._lngLat.lng,spiderLeg.mapboxMarker._lngLat.lat]);
    const coordinates = [spiderLeg.mapboxMarker._lngLat.lng,spiderLeg.mapboxMarker._lngLat.lat];
    const props = spiderLeg.feature;

    if (showRadiusToggle) {

      const radius = prompt("Enter circle radius in miles");
      const circleOpts = {units: 'miles'};
      const circle = turf.circle(coordinates, radius, circleOpts);
      console.log(circle);
      circlesCandidates.push(circle);

      map.getSource('radius-candidates').setData({
        "type": "FeatureCollection",
        "features": circlesCandidates
      });

    }
  }
});

// spiderifier
let spiderifierClients = new MapboxglSpiderifier(map, {
  markerWidth: 40,
  markerHeight: 40,
  customPin: true,
  initializeLeg: function (spiderLeg) {

    var content = createPopupClients(spiderLeg.feature);

    var popup = new mapboxgl.Popup({
        // closeOnClick: false,
        offset: MapboxglSpiderifier.popupOffsetForSpiderLeg(spiderLeg)
      }).setHTML(content);

    spiderLeg.mapboxMarker.setPopup(popup);
    popup.addTo(map);

    // find the toggle div and add function on click
    const popupDiv = spiderLeg.mapboxMarker._popup;
    popupDiv._content.childNodes[16].addEventListener('click', flipToggle);

  },
  onClick: function (e, spiderLeg) {

    const editLink = document.getElementById(props['id']+"-edit");
    // console.log(editLink);
    editLink.addEventListener('click', editClient(props));
    // console.log([spiderLeg.mapboxMarker._lngLat.lng,spiderLeg.mapboxMarker._lngLat.lat]);
    const coordinates = [spiderLeg.mapboxMarker._lngLat.lng,spiderLeg.mapboxMarker._lngLat.lat];
    const props = spiderLeg.feature;

    if (showRadiusToggle) {

      const radius = prompt("Enter circle radius in miles");
      const circleOpts = {units: 'miles'};
      const circle = turf.circle(coordinates, radius, circleOpts);
      console.log(circle);
      circlesCandidates.push(circle);

      map.getSource('radius-candidates').setData({
        "type": "FeatureCollection",
        "features": circlesCandidates
      });

    }
  }
});
const SPIDERFY_FROM_ZOOM = 14;


const mapboxClient = mapboxSdk({ accessToken: mapboxgl.accessToken });


const loadBtn = document.getElementById('geocode');
loadBtn.addEventListener('click', getData);

function getData() {

  // var candidatesCSV = d3.csv("../data/candidates.csv", init = {RequestCache: 'no-cache'});
  // var clientsCSV = d3.csv("../data/client-sites.csv", init = {RequestCache: 'no-cache'});
  // Promise.all([candidatesCSV,clientsCSV]).then(processData, error);

  const candidatesDB = getDB(db, 'candidates');
  const clientsDB = getDB(db, 'client-sites');
  const clientsSnapshot = getSnapshotDB(db, 'client-sites');
  Promise.all([candidatesDB,clientsDB,clientsSnapshot]).then(processData, error);
  document.getElementById('geocode').style.visibility = 'hidden';
  addBtn.style.visibility = 'visible';

}  // end getData



// function fired if there is an error
function error(error) {
  console.log(error)
}

function processData(data) {
  var candidatesData = data[0],
      clientsData = data[1],
      clientsSnapshot = data[2];

  console.log(data);

  var candidatesGeoJSON = getCoords(candidatesData);
  var clientsGeoJSON = getCoords(clientsData);

  Promise.all([candidatesGeoJSON,clientsGeoJSON]).then((response) => {
    candidatesGeoJSON = response[0];
    clientsGeoJSON = response[1];

      map.addSource('candidates', {
          'type': 'geojson',
          'data': candidatesGeoJSON,
          'cluster': true,
          'clusterMaxZoom': 19, // Max zoom to cluster points on
          'clusterRadius': 30 // Radius of each cluster when clustering points (defaults to 50)
      });
      // Add a layer showing the candidates.
      map.addLayer({
          'id': 'candidates-clusters',
          'type': 'circle',
          'source': 'candidates',
          'filter': ['has', 'point_count'],
          'paint': {
              'circle-color': '#fe9414',
              'circle-radius': [
                'step',
                ['get', 'point_count'],
                8,
                3,
                13,
                6,
                17
                ],
              'circle-stroke-width': 1,
              'circle-stroke-color': '#ffffff'
          }
      });
      map.addLayer({
        id: 'candidates-cluster-count',
        type: 'symbol',
        source: 'candidates',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 12
        },
        paint:{
          'text-color': 'white'
        }
      });

      map.addLayer({
        id: 'candidates-unclustered-point',
        type: 'circle',
        source: 'candidates',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': '#fe9414',
          'circle-radius': 4,
          'circle-stroke-width': 1,
          'circle-stroke-color': '#fff'
        }
      });

      map.addSource('radius-candidates', {
        type: 'geojson',
        data: {
          "type": "FeatureCollection",
          "features": []
        }
      }).addLayer({
        id: 'radius-candidates',
        source: 'radius-candidates',
        type: 'fill',
        paint: {
          'fill-color': '#fe9414',
          'fill-opacity': 0.5,
          'fill-outline-color': '#fff'
        }
      });

      // inspect a cluster on click
      map.on('click', 'candidates-clusters', (e) => {
        spiderifierCandidate.unspiderfy();

        const features = map.queryRenderedFeatures(e.point, {
          layers: ['candidates-clusters']
        });
        const clusterId = features[0].properties.cluster_id;
        map.getSource('candidates').getClusterExpansionZoom(
          clusterId,
          (err, zoom) => {
            if (err) return;

            // console.log("Current Zoom: "+map.getZoom());

            if (zoom < SPIDERFY_FROM_ZOOM) {
              map.easeTo({
                center: features[0].geometry.coordinates,
                zoom: zoom
              });
            } else if (map.getZoom() < SPIDERFY_FROM_ZOOM) {
              map.easeTo({center: e.lngLat, zoom: map.getZoom() + 2});
            } else {
              map.getSource('candidates').getClusterLeaves(
                features[0].properties.cluster_id,
                100,
                0,
                function(err, leafFeatures){
                  if (err) {
                    return console.error('error while getting leaves of a cluster', err);
                  }
                  var markers = leafFeatures.map(function(leafFeature){
                    // console.log(leafFeature.properties);
                    return leafFeature.properties;
                  });
                  spiderifierCandidate.spiderfy(features[0].geometry.coordinates, markers);
                }
              );

            }

            // console.log("Cluster Expansion Zoom: "+zoom);
            // spiderifier.spiderfy(e.lngLat, features);

          }
        );


      });

      // When a click event occurs on a feature in
      // the unclustered-point layer, open a popup at
      // the location of the feature, with
      // description HTML from its properties.
      map.on('click', 'candidates-unclustered-point', (e) => {
        const coordinates = e.features[0].geometry.coordinates.slice();
        const props = e.features[0].properties;
        const description = createPopupCandidates(props);

        // Ensure that if the map is zoomed out such that
        // multiple copies of the feature are visible, the
        // popup appears over the copy being pointed to.
        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
          coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }

        const popupContent = new mapboxgl.Popup()
          .setLngLat(coordinates)
          .setHTML(description)
          .addTo(map);

        // popupContent._content.childNodes[5].addEventListener('click', flipToggle);

        // console.log(popupContent._content.childNodes);

        // const editLink = document.getElementById(props['id']+"-edit");
        // console.log(editLink);
        // editLink.addEventListener('click', editClient(props));

        if (showRadiusToggle) {

          const radius = prompt("Enter circle radius in miles");
          const circleOpts = {units: 'miles'};
          const circle = turf.circle(coordinates, radius, circleOpts);
          console.log(circle);
          circlesCandidates.push(circle);

          map.getSource('radius-candidates').setData({
            "type": "FeatureCollection",
            "features": circlesCandidates
          });

        }
      });

      map.addSource('clients', {
          'type': 'geojson',
          'data': clientsGeoJSON,
          'cluster': true,
          'clusterMaxZoom': 14, // Max zoom to cluster points on
          'clusterRadius': 30 // Radius of each cluster when clustering points (defaults to 50)
      });
      // Add a layer showing the clients.
      map.addLayer({
          'id': 'clients-clusters',
          'type': 'circle',
          'source': 'clients',
          'filter': ['has', 'point_count'],
          'paint': {
              'circle-color': '#fcf424',
              'circle-radius': [
                'step',
                ['get', 'point_count'],
                8,
                3,
                13,
                6,
                17
                ],
              'circle-stroke-width': 1,
              'circle-stroke-color': 'black'
          }
      });
      map.addLayer({
        id: 'clients-cluster-count',
        type: 'symbol',
        source: 'clients',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 12
        },
        paint:{
          'text-color': 'black'
        }
      });

      map.addLayer({
        id: 'clients-unclustered-point',
        type: 'circle',
        source: 'clients',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': '#fcf424',
          'circle-radius': 4,
          'circle-stroke-width': 1,
          'circle-stroke-color': 'black'
        }
      });

      map.addSource('radius-clients', {
        type: 'geojson',
        data: {
          "type": "FeatureCollection",
          "features": []
        }
      }).addLayer({
        id: 'radius-clients',
        source: 'radius-clients',
        type: 'fill',
        paint: {
          'fill-color': '#fcf424',
          'fill-opacity': 0.5,
          'fill-outline-color': '#fff'
        }
      });

      // inspect a cluster on click
      map.on('click', 'clients-clusters', (e) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: ['clients-clusters']
        });
        const clusterId = features[0].properties.cluster_id;
        map.getSource('clients').getClusterExpansionZoom(
          clusterId,
          (err, zoom) => {
            if (err) return;

            // console.log(map.getZoom());

            map.easeTo({
              center: features[0].geometry.coordinates,
              zoom: zoom
            });

            // console.log(zoom);
            // spiderifier.spiderfy(e.lngLat, features);

          }
        );


        spiderifierClients.unspiderfy();
        if (!features.length) {
          return;
        } else if (map.getZoom() < SPIDERFY_FROM_ZOOM) {
          map.easeTo({center: e.lngLat, zoom: map.getZoom() + 2});
        } else {
          map.getSource('clients').getClusterLeaves(
            features[0].properties.cluster_id,
            100,
            0,
            function(err, leafFeatures){
              if (err) {
                return console.error('error while getting leaves of a cluster', err);
              }
              var markers = leafFeatures.map(function(leafFeature){
                // console.log(leafFeature.properties);
                return leafFeature.properties;
              });
              spiderifierClients.spiderfy(features[0].geometry.coordinates, markers);
            }
          );
        }
      });

      // When a click event occurs on a feature in
      // the unclustered-point layer, open a popup at
      // the location of the feature, with
      // description HTML from its properties.
      map.on('click', 'clients-unclustered-point', (e) => {
        const coordinates = e.features[0].geometry.coordinates.slice();
        const props = e.features[0].properties;
        console.log(props);
        const description = createPopupClients(props);

        // Ensure that if the map is zoomed out such that
        // multiple copies of the feature are visible, the
        // popup appears over the copy being pointed to.
        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
          coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }

        const popupContent = new mapboxgl.Popup()
          .setLngLat(coordinates)
          .setHTML(description)
          .addTo(map);

        console.log(popupContent._content.childNodes);
        popupContent._content.childNodes[16].addEventListener('click', flipToggle);

        // console.log(popupContent._content.childNodes);

        const editLink = document.getElementById(props['id']+"-edit");
        // console.log(editLink);
        editLink.addEventListener('click', editClient(props));

        const deleteLink = document.getElementById(props['id']+"-delete");
        // console.log(deleteLink);
        deleteLink.addEventListener('click', deleteClient(props['id']));

        if (showRadiusToggle) {

          const radius = prompt("Enter circle radius in miles");
          const circleOpts = {units: 'miles'};
          const circle = turf.circle(coordinates, radius, circleOpts);
          console.log(circle);
          circlesClients.push(circle);

          map.getSource('radius-clients').setData({
            "type": "FeatureCollection",
            "features": circlesClients
          });
        }

      });

      // Create a popup, but don't add it to the map yet.
      const popup = new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false
      });

      map.on('mouseenter', 'candidates-clusters' || 'candidates-cluster-count', (e) => {
          // Change the cursor style as a UI indicator.
          map.getCanvas().style.cursor = 'pointer';

      });

      map.on('mouseenter', 'candidates-unclustered-point', (e) => {
          // Change the cursor style as a UI indicator.
          map.getCanvas().style.cursor = 'pointer';

          const coordinates = e.features[0].geometry.coordinates.slice();
          const props = e.features[0].properties;
          const description = createPopupCandidates(props);

          // Ensure that if the map is zoomed out such that multiple
          // copies of the feature are visible, the popup appears
          // over the copy being pointed to.
          while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
              coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
          }

          // Populate the popup and set its coordinates
          // based on the feature found.
          popup.setLngLat(coordinates).setHTML(description).addTo(map);

      });

      map.on('mouseleave', 'candidates-clusters' || 'candidates-cluster-count', (e) => {
          // Change the cursor style as a UI indicator.
          map.getCanvas().style.cursor = '';
          popup.remove();

      });

      map.on('mouseenter', 'clients-unclustered-point', (e) => {
          // Change the cursor style as a UI indicator.
          map.getCanvas().style.cursor = 'pointer';

          // Copy coordinates array.
          const coordinates = e.features[0].geometry.coordinates.slice();
          const props = e.features[0].properties;
          const description = createPopupClients(props);

          // Ensure that if the map is zoomed out such that multiple
          // copies of the feature are visible, the popup appears
          // over the copy being pointed to.
          while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
              coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
          }

          // Populate the popup and set its coordinates
          // based on the feature found.
          popup.setLngLat(coordinates).setHTML(description).addTo(map);
      });

      map.on('mouseleave', 'clients-unclustered-point', () => {
          map.getCanvas().style.cursor = '';
          popup.remove();
      });

      map.on('mouseleave', 'candidates-unclustered-point', () => {
          map.getCanvas().style.cursor = '';
          popup.remove();
      });



      // After the last frame rendered before the map enters an "idle" state.
      map.on('idle', () => {
        radiusBtn.style.visibility = 'visible';
        // If these two layers were not added to the map, abort
        if (!map.getLayer('candidates-clusters') || !map.getLayer('clients-clusters')) {
          return;
        }

        // Enumerate ids of the layers.
        const toggleableLayerIds = [
          {'name': 'Candidates',
            'id': 'candidates',
            'layer': ['candidates-clusters','candidates-cluster-count','candidates-unclustered-point']
          },
          {'name': 'Clients',
            'id': 'clients',
            'layer': ['clients-clusters','clients-cluster-count','clients-unclustered-point']
          }
        ];

        // Set up the corresponding toggle button for each layer.
        for (const id of toggleableLayerIds) {
          // Skip layers that already have a button set up.
          if (document.getElementById(id.id)) {
            continue;
          }

          // Create a link.
          const link = document.createElement('a');
          link.id = id.id;
          link.href = '#';
          link.textContent = id.name;
          link.className = 'active';

          // Show or hide layer when the toggle is clicked.
          link.onclick = function (e) {
            const clickedLayer = toggleableLayerIds.find( ({ id }) => id === this.id );
            e.preventDefault();
            e.stopPropagation();

            // console.log(clickedLayer);
            clickedLayer.layer.forEach((layer, i) => {

              const visibility = map.getLayoutProperty(
                layer,
                'visibility'
              );

              // Toggle layer visibility by changing the layout object's visibility property.
              if (visibility === 'visible') {
                map.setLayoutProperty(layer, 'visibility', 'none');
                this.className = '';
              } else {
                this.className = 'active';
                map.setLayoutProperty(
                  layer,
                  'visibility',
                  'visible'
                );
              }

            });

          };

          const layers = document.getElementById('menu');
          layers.appendChild(link);
        }

        radiusBtn.addEventListener('click', showRadius);

      });

    const filterHeadersClients = ['POSITION','NUMPEOPLE','ENGLISHLEVEL','STATUS'];
    filterHeadersClients.forEach((header, i) => {
      createFilters(header, clientsGeoJSON, 'clients', filterGroupClients);

    });

    const filterHeadersCandidates = ['POSITION','CAR','STATUS'];
    filterHeadersCandidates.forEach((header, i) => {
      createFilters(header, candidatesGeoJSON, 'candidates', filterGroupCandidates);

    });

  });

}

function createFilters(header, geoJSON, source, filterGroup) {
  // remove spaces in header text and append layer name
  const filterClass = header.replace(/\s/g, '')+"-"+source;

  // create details element for header and give id
  const jobFilterHeader = document.createElement('details');
  jobFilterHeader.classList.add('filter-group-header');
  jobFilterHeader.innerHTML = "<summary id='"+filterClass+"'>"+header+"</summary>";
  filterGroup.appendChild(jobFilterHeader);

  const jobTypes = [];
  // loop through features in layer
  geoJSON.features.forEach((item, i) => {
    // console.log(item.properties[header]);
    // console.log(header);
    // add the values for the selected property
    if (!jobTypes.includes(item.properties[header]+"-"+source)) {
      jobTypes.push(item.properties[header]+"-"+source);
    }
  });
  // console.log(jobTypes);

  // create a copy of the list of values
  // let jobsFilter = jobTypes;


  const sourceID = map.getSource(source);


  // loop through values in list
  for (const job of jobTypes) {
    // Add checkbox and label elements for the layer.
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.id = job;
    input.checked = true;  // all values start on
    input.classList.add(filterClass, source+"Checks");
    jobFilterHeader.appendChild(input);

    const label = document.createElement('label');
    label.setAttribute('for', job);
    label.textContent = job.replace(/\-(.*)$/g, '');  //remove layer name from text content
    label.classList.add(filterClass);
    jobFilterHeader.appendChild(label);

    // When the checkbox changes, update the visibility of the layer.
    // doesn't consider the selections under other headers => FIX!!
    input.addEventListener('change', (e) => {
      // console.log(jobsFilter);
      let geoJSONFiltered = {};
      geoJSONFiltered.type = "FeatureCollection";
      geoJSONFiltered.features = [];

      let jobsFilter = {};

      // const filterGroupSelection = document.getElementById('filter-group-'+source);
      if (source == 'clients') {
        var filteredFile = filterGroupClients;
      } else if (source == 'candidates') {
        var filteredFile = filterGroupCandidates;
      }
      for (var category of filteredFile.childNodes) {
        // console.log(category.childNodes[0].id);
        // console.log(category);
        const values = category.getElementsByTagName('input');
        // console.log(values);
        for (var value of values) {
          // console.log(value);
          // console.log(value.id+": "+value.checked);
          if (value.checked == true) {
            // console.log([category.childNodes[0].id.replace(/\-(.*)$/g, ''),value.id.replace(/\-(.*)$/g, ''),value.checked]);
            // jobsFilter.push([category.childNodes[0].id.replace(/\-(.*)$/g, ''),value.id.replace(/\-(.*)$/g, '')]);
            if (jobsFilter[category.childNodes[0].id.replace(/\-(.*)$/g, '')] == undefined) {
              jobsFilter[category.childNodes[0].id.replace(/\-(.*)$/g, '')] = [value.id.replace(/\-(.*)$/g, '')]
            } else {
              jobsFilter[category.childNodes[0].id.replace(/\-(.*)$/g, '')].push(value.id.replace(/\-(.*)$/g, ''));
              // console.log(jobsFilter[category.childNodes[0].id.replace(/\-(.*)$/g, '')]);

            }
          }
        }

      }

    console.log(jobsFilter);

    // console.log(Object.keys(jobsFilter));
    var useConditions = search => a => Object.keys(search).every(k =>
          a.properties[k] === search[k] ||
          Array.isArray(search[k]) && search[k].includes(a.properties[k])
           // ||
          // typeof search[k] === 'object' && +search[k].min <= a[k] &&  a[k] <= +search[k].max ||
          // typeof search[k] === 'function' && search[k](a[k])
        );

    // console.log(geoJSON.features.filter(useConditions(jobsFilter)));
    geoJSONFiltered.features = geoJSON.features.filter(useConditions(jobsFilter));
    console.log(geoJSONFiltered);

    sourceID.setData(geoJSONFiltered);

  });

  }

}  // end createFilters

map.on('zoomstart', () => {
  spiderifierCandidate.unspiderfy();
  spiderifierClients.unspiderfy();
});

async function getCoords(data) {

  var dataJSON = {
      "type": "FeatureCollection",
      "features": []
    };

  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    const itemCoords = await mapboxClient.geocoding.forwardGeocode({
      query: '"'+item['ADDRESS']+", "+item['CITY']+", "+item["STATE"]+" "+item["ZIP"]+'"',
      proximity: [-74.5, 42.0],
      types: ['address']
    }).send()
    // console.log(itemCoords);
    const coords = itemCoords.body.features[0].center;
    const dataFeature = {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": coords
      },
      "properties": item
    };
    dataJSON.features.push(dataFeature);
  }

  console.log(dataJSON);
  return dataJSON;

} // end getCoords

function createPopupCandidates(props) {
  // let toggleStatus = '';
  // if (props['STATUS'] == "ACTIVE") {
  //   toggleStatus = ' toggle-on';
  // }
  const description = "<p><strong>" + props['FIRST NAME'] + " " + props['LAST NAME'] + "</strong></p>" +
    "<p><strong>Temp ID:</strong> " + props['TEMP ID'] + "</p>" +
    "<p><strong>Position:</strong> " + props['POSITION'] + "</p>" +
    "<p><strong>Pay:</strong> " + props['PAY'] + "  <strong>Shift:</strong> " + props['SHIFT'] + "  <strong>Car:</strong> " + props['CAR'] + "</p>";
  return description;
}

function createPopupClients(props) {
  let toggleStatus = '';
  if (props['STATUS'] == "ACTIVE") {
    toggleStatus = ' toggle-on';
  }
  const description = "<strong>" + props['COMPANY'] + "</strong><br>" +
    "<strong>Position:</strong> " + props['POSITION'] + " <strong>Pay:</strong> " + props['PAY RATE'] + "<br>" +
    props['DESCRIPTION'] + "<br>" +
    props['SCHEDULE'] + "<br>" +
    "<strong>No. of People: </strong>" + props['NUMPEOPLE'] + " <strong>English Level:</strong> " + props['ENGLISHLEVEL'] +
    "<div><a href='#' data-bs-toggle='modal' data-bs-target='#editModal' class='link-primary' id='"+props['id']+"-edit'>Edit</a> / <a href='#' class='link-primary' id='"+props['id']+"-delete'>Delete</a></div>"+
    "<div class='switch toggle" + toggleStatus +"' id=" + props['id'] + "><div class='toggle-text-off'>INACTIVE</div>"+
    "<div class='toggle-button'></div><div class='toggle-text-on'>ACTIVE</div></div>";
  return description;
}

async function flipToggle() {
  let toggle = document.getElementsByClassName('switch')[0];
  toggle.classList.toggle('toggle-on');

  console.log(toggle);
  console.log(toggle.id);

  let docStatus = true;

  if (toggle.classList.contains('toggle-on')) {
    console.log('toggle-on');
    docStatus = "ACTIVE";
  } else {
    console.log('toggle-off');
    docStatus = "INACTIVE";
  }

  // save to database
  const docID = toggle.id;
  const docRef = doc(db, 'client-sites', docID);
  await updateDoc(docRef, {
    "STATUS": docStatus
  });

  // change geoJSON
  console.log(map.getSource('clients')._data);
  const geoJSON = map.getSource('clients')._data;
  console.log(geoJSON.features.findIndex( (feature) => feature.properties.id === docID ));
  const featureIndex = geoJSON.features.findIndex( (feature) => feature.properties.id === docID );
  geoJSON.features[featureIndex].properties["STATUS"] = docStatus;
  map.getSource('clients').setData(geoJSON);

}  //end flipToggle()

async function submitNewClient(e) {

  let formData = new FormData(e.target);
  const formProps = Object.fromEntries(formData);


  console.log(formProps);
  console.log('submit');

  // formProps["PAY"] = +formProps["PAY"];
  // formProps["SHIFT"] = +formProps["SHIFT"];
  // if (formProps["CAR"] == "true") {
  //   formProps["CAR"] = true;
  // } else {
  //   formProps["CAR"] =false;
  // }
  // if (formProps["STATUS"] == "true") {
  //   formProps["STATUS"] = true;
  // } else {
  //   formProps["STATUS"] =false;
  // }
  console.log(formProps);

  const docRef = await addDoc(collection(db, 'client-sites'), formProps);
  console.log(docRef.id);

  newClientForm.reset();  //reset after submission

  updateMap();

  // const addDataModal = new bootstrap.Modal(document.getElementById('addDataModal'));
  // addDataModal.hide();
}  // end submitNewClient()

async function editClient(props) {
  // const editModal = new bootstrap.Modal(document.getElementById('editModal'), {
  //   backdrop: 'static'
  // });
  // console.log(editModal);
  // editModal.show();

  document.getElementById('editCompany').setAttribute('value',props["COMPANY"]);
  document.getElementById('editClientID').setAttribute('value',props["CLIENTID"]);
  document.getElementById('editAddress').setAttribute('value',props["ADDRESS"]);
  document.getElementById('editCity').setAttribute('value',props["CITY"]);
  document.getElementById('editState').setAttribute('value',props["STATE"]);
  document.getElementById('editZip').setAttribute('value',props["ZIP"]);
  document.getElementById('editPay').setAttribute('value',props["PAY RATE"]);
  document.getElementById('editPosition').setAttribute('value',props["POSITION"]);
  document.getElementById('editDescription').setAttribute('value',props["DESCRIPTION"]);
  document.getElementById('editEnglishLevel').setAttribute('value',props["ENGLISHLEVEL"]);
  document.getElementById('editNumPpl').setAttribute('value',props["NUMPEOPLE"]);
  document.getElementById('editStatus').setAttribute('value',props["STATUS"]);

  const ediClientForm = document.getElementById('ediClientForm');
  editClientForm.addEventListener('submit', async function (e) {

    e.preventDefault();

    let formData = new FormData(e.target);
    const formProps = Object.fromEntries(formData);

    console.log(formProps);
    console.log('submit');

    // formProps["PAY"] = +formProps["PAY"];
    // formProps["SHIFT"] = +formProps["SHIFT"];
    // if (formProps["CAR"] == "true") {
    //   formProps["CAR"] = true;
    // } else {
    //   formProps["CAR"] =false;
    // }
    // if (formProps["STATUS"] == "true") {
    //   formProps["STATUS"] = true;
    // } else {
    //   formProps["STATUS"] =false;
    // }
    console.log(formProps);

    await updateDoc(doc(db, 'client-sites', props.id), formProps);
    console.log(doc(db, 'client-sites', props.id));

    updateMap();
  });


} // end editClient

async function deleteClient(id) {
  if (window.confirm("Do you really want to delete?")) {

  }

  // await deleteDoc(doc(db, 'client-sites', id));
  //
  // updateMap();
}

async function updateMap() {
  const clientsDB = await getDB(db, 'clients');
  // console.log(candidatesDB);
  const newGeoJSON = await getCoords(clientsDB);

  // console.log(newGeoJSON);
  map.getSource('clients').setData(newGeoJSON);
}

function showRadius() {
  if (showRadiusToggle) {
    showRadiusToggle = false;
    radiusBtn.innerText = "Show Radius around Point";
    map.getSource('radius-clients').setData({
      "type": "FeatureCollection",
      "features": []
    });
    map.getSource('radius-candidates').setData({
      "type": "FeatureCollection",
      "features": []
    });
  } else {
    showRadiusToggle = true;
    circlesCandidates = [];
    circlesClients = [];
    radiusBtn.innerText = "Remove Radius";
  }
}
