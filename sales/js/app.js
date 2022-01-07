// Import the functions you need from the SDKs you need

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
// import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-analytics.js";
import { getFirestore, collection, getDocs, doc, updateDoc, addDoc } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js'

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


// Get a list of candidates from your database
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
}

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
const submitNew = document.getElementById('submitNew');
// submitNew.addEventListener('click', submitNewCandidate);
const newCandidateForm = document.getElementById('newCandidateForm');
newCandidateForm.addEventListener('submit', function ( event ) {
  event.preventDefault();

  submitNewCandidate(event);
});

// disable map rotation using right click + drag
map.dragRotate.disable();

// disable map rotation using touch rotation gesture
map.touchZoomRotate.disableRotation();

// spiderifier
let spiderifier = new MapboxglSpiderifier(map, {
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
    popupContent._content.childNodes[5].addEventListener('click', flipToggle);

  },
  onClick: function (event, spiderLeg) {

  }
});
const SPIDERFY_FROM_ZOOM = 13;


const mapboxClient = mapboxSdk({ accessToken: 'pk.eyJ1IjoidGl0YW5tYXN0ZXIiLCJhIjoiY2t3dmNzbHhsMXl2MDJxanYwcmw0OHYzZCJ9.Rr2kb4WqAzr_5EgH8ZjK3A' });


const loadBtn = document.getElementById('geocode');
loadBtn.addEventListener('click', getData);

function getData() {

  // var candidatesCSV = d3.csv("../data/candidates.csv", init = {RequestCache: 'no-cache'});
  // var clientsCSV = d3.csv("../data/client-sites.csv", init = {RequestCache: 'no-cache'});
  // Promise.all([candidatesCSV,clientsCSV]).then(processData, error);

  const candidatesDB = getDB(db, 'candidates');
  const clientsDB = getDB(db, 'client-sites');
  Promise.all([candidatesDB,clientsDB]).then(processData, error);
  document.getElementById('geocode').style.visibility = 'hidden';
  addBtn.style.visibility = 'visible';

}  // end getData



// function fired if there is an error
function error(error) {
  console.log(error)
}

function processData(data) {
  var candidatesData = data[0],
      clientsData = data[1];

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
          'clusterMaxZoom': 14, // Max zoom to cluster points on
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

      // inspect a cluster on click
      map.on('click', 'candidates-clusters', (e) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: ['candidates-clusters']
        });
        const clusterId = features[0].properties.cluster_id;
        map.getSource('candidates').getClusterExpansionZoom(
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


        spiderifier.unspiderfy();
        if (!features.length) {
          return;
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
              spiderifier.spiderfy(features[0].geometry.coordinates, markers);
            }
          );
        }
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

        popupContent._content.childNodes[5].addEventListener('click', flipToggle);

        // console.log(popupContent._content.childNodes);

        const editLink = document.getElementById(props['id']+"-edit");
        console.log(editLink);
        editLink.addEventListener('click', editCandidate(props));
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


        spiderifier.unspiderfy();
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
              spiderifier.spiderfy(features[0].geometry.coordinates, markers);
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
        const description = createPopupClients(props);

        // Ensure that if the map is zoomed out such that
        // multiple copies of the feature are visible, the
        // popup appears over the copy being pointed to.
        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
          coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }

        new mapboxgl.Popup()
          .setLngLat(coordinates)
          .setHTML(description)
          .addTo(map);
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
  spiderifier.unspiderfy();
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
  let toggleStatus = '';
  if (props['STATUS'] == "ACTIVE") {
    toggleStatus = ' toggle-on';
  }
  const description = "<p><strong>" + props['FIRST NAME'] + " " + props['LAST NAME'] + "</strong></p>" +
    "<p><strong>Temp ID:</strong> " + props['TEMP ID'] + "</p>" +
    "<p><strong>Position:</strong> " + props['POSITION'] + "</p>" +
    "<p><strong>Pay:</strong> " + props['PAY'] + "  <strong>Shift:</strong> " + props['SHIFT'] + "  <strong>Car:</strong> " + props['CAR'] + "</p>" +
    "<div><a href='#' data-bs-toggle='modal' data-bs-target='#editModal' class='link-primary' id='"+props['id']+"-edit'>Edit</a> / <a href='#' class='link-primary' id='"+props['id']+"-delete'>Delete</a></div>"+
    "<div class='switch toggle" + toggleStatus +"' id=" + props['id'] + "><div class='toggle-text-off'>INACTIVE</div>"+
    "<div class='toggle-button'></div><div class='toggle-text-on'>ACTIVE</div></div>";
  return description;
}

function createPopupClients(props) {
  const description = "<strong>" + props['COMPANY'] + "</strong><br>" +
    "<strong>Position:</strong> " + props['POSITION'] + " <strong>Pay:</strong> " + props['PAY RATE'] + "<br>" +
    props['DESCRIPTION'] + "<br>" +
    props['SCHEDULE'] + "<br>" +
    "<strong>No. of People: </strong>" + props['NUMPEOPLE'] + " <strong>English Level:</strong> " + props['ENGLISHLEVEL'];
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

  // change geoJSON

  // refilter

  // save to database
  const docID = toggle.id;
  const docRef = doc(db, 'candidates', docID);
  await updateDoc(docRef, {
    "STATUS": docStatus
  });

}  //end flipToggle()

async function submitNewCandidate(e) {

  let formData = new FormData(e.target);
  const formProps = Object.fromEntries(formData);


  console.log(formProps);
  console.log('submit');

  formProps["PAY"] = +formProps["PAY"];
  formProps["SHIFT"] = +formProps["SHIFT"];
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

  const docRef = await addDoc(collection(db, 'candidates'), formProps);
  console.log(docRef.id);

  newCandidateForm.reset();  //reset after submission

  // const addDataModal = new bootstrap.Modal(document.getElementById('addDataModal'));
  // addDataModal.hide();
}  // end submitNewCandidate()

function editCandidate(props) {
  // const editModal = new bootstrap.Modal(document.getElementById('editModal'), {
  //   backdrop: 'static'
  // });
  // console.log(editModal);
  // editModal.show();

  document.getElementById('editFirstName').setAttribute('value',props["FIRST NAME"]);
  document.getElementById('editLastName').setAttribute('value',props["LAST NAME"]);
  document.getElementById('editTempID').setAttribute('value',props["TEMP ID"]);
  document.getElementById('editAddress').setAttribute('value',props["ADDRESS"]);
  document.getElementById('editCity').setAttribute('value',props["CITY"]);
  document.getElementById('editState').setAttribute('value',props["STATE"]);
  document.getElementById('editZip').setAttribute('value',props["ZIP"]);
  document.getElementById('editPay').setAttribute('value',props["PAY"]);
  document.getElementById('editPosition').setAttribute('value',props["POSITION"]);
  document.getElementById('editCar').setAttribute('value',props["CAR"]);
  document.getElementById('editStatus').setAttribute('value',props["STATUS"]);

  const ediCandidateForm = document.getElementById('ediCandidateForm');
  editCandidateForm.addEventListener('submit', async function (e) {

    e.preventDefault();

    let formData = new FormData(e.target);
    const formProps = Object.fromEntries(formData);

    console.log(formProps);
    console.log('submit');

    formProps["PAY"] = +formProps["PAY"];
    formProps["SHIFT"] = +formProps["SHIFT"];
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

    await updateDoc(doc(db, 'candidates', props.id), formProps);
    console.log(doc(db, 'candidates', props.id));

    updateMap(map);
  });


} // end editCandidate

async function updateMap() {
  const candidatesDB = await getDB(db, 'candidates');
  // console.log(candidatesDB);
  const newGeoJSON = await getCoords(candidatesDB);

  // console.log(newGeoJSON);
  map.getSource('candidates').setData(newGeoJSON);
}
