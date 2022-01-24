// Import the functions you need from the SDKs you need

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
// import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-analytics.js";
import { getFirestore, collection, getDocs, doc, updateDoc, addDoc, onSnapshot, deleteDoc } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js'

import { app, db, getSnapshotDB, getDB, error } from "../../js/db.js";

import { accessToken, mapboxClient, getCoords, getCoordsIndiv } from "../../js/geocode.js";

import { map, removeInactive, filterGroupClients, filterHeadersClients, filterGroupCandidates, filterHeadersCandidates, createFilters, setFilters, filterList } from "../../js/map.js";


const nav = new mapboxgl.NavigationControl({showCompass: false});
map.addControl(nav, 'top-left');

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
    popupDiv._content.childNodes[17].addEventListener('click', flipToggle);
    popupContent._content.childNodes[16].addEventListener('click', (e) => {editClient(props);});

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

const loadBtn = document.getElementById('geocode');
loadBtn.addEventListener('click', getData);

async function getData() {

  const candidatesGeoJSON =  {
      "type": "FeatureCollection",
      "features": []
    };
  const clientsGeoJSON = {
      "type": "FeatureCollection",
      "features": []
    };
  loadBtn.style.cursor = "wait";
  await getSnapshotDB(db, 'client-sites');
  await getSnapshotDB(db, 'candidates');
  await processData([candidatesGeoJSON, clientsGeoJSON]);

  // add addEventListener to checkboxes
  setFilters(clientsGeoJSON,'clients');

  setFilters(candidatesGeoJSON,'candidates');

  document.getElementById('geocode').style.visibility = 'hidden';
  loadBtn.style.cursor = "pointer";
  addBtn.style.visibility = 'visible';
  radiusBtn.addEventListener('click', showRadius);

}  // end getData


async function processData(data) {

  var candidatesGeoJSON = data[0],
      clientsGeoJSON = data[1];

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
  map.on('click', 'candidates-unclustered-point', (e) => {addPopup(e, 'candidates');});

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
  map.on('click', 'clients-unclustered-point', (e) => {addPopup(e, 'client-sites')});

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
      link.className = 'btn btn-primary active';

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
            this.className = 'btn btn-primary';
          } else {
            this.className = 'btn btn-primary active';
            map.setLayoutProperty(
              layer,
              'visibility',
              'visible'
            );
          }

        });

      };

      const layers = document.getElementById('layerToggle');
      // console.log(layers.childNodes);
      layers.appendChild(link);
    }

  });


}  // end processData

map.on('zoomstart', () => {
  spiderifierCandidate.unspiderfy();
  spiderifierClients.unspiderfy();
});

function createPopupCandidates(props) {
  const description = "<strong>" + props['FIRST NAME'] + " " + props['LAST NAME'] + "</strong><br>" +
    "<strong>Temp ID:</strong> " + props['TEMP ID'] + "<br>" +
    "<strong>Position:</strong> " + props['POSITION'] + "<br>" +
    "<strong>Pay:</strong> " + props['PAY'] + "  <strong>Shift:</strong> " + props['SHIFT'] + "  <strong>Car:</strong> " + props['CAR'] +
    '<br>' + "<strong>Status:</strong> " + props['STATUS'];
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
    "<strong>No. of People: </strong>" + props['NUMPEOPLE'] + " <strong>English Level:</strong> " + props['ENGLISHLEVEL'] + "<br>" +
    "<button type='button' data-bs-toggle='modal' data-bs-target='#editModal' class='btn btn-primary' id='"+props['id']+"-edit'>Edit</button>"+
    "<div class='switch toggle" + toggleStatus +"' id=" + props['id'] + "><div class='toggle-text-off'>INACTIVE</div>"+
    "<div class='toggle-button'></div><div class='toggle-text-on'>ACTIVE</div></div>";
  return description;
}

async function flipToggle() {
  let toggle = document.getElementsByClassName('switch')[0];
  toggle.classList.toggle('toggle-on');

  // console.log(toggle);
  // console.log(toggle.id);

  let docStatus = true;

  if (toggle.classList.contains('toggle-on')) {
    // console.log('toggle-on');
    docStatus = "ACTIVE";
  } else {
    // console.log('toggle-off');
    docStatus = "INACTIVE";
  }

  // save to database
  const docID = toggle.id;
  const docRef = doc(db, 'client-sites', docID);
  await updateDoc(docRef, {
    "STATUS": docStatus
  });

  // change geoJSON
  // console.log(map.getSource('clients')._data);
  const geoJSON = map.getSource('clients')._data;
  // console.log(geoJSON.features.findIndex( (feature) => feature.properties.id === docID ));
  const featureIndex = geoJSON.features.findIndex( (feature) => feature.properties.id === docID );
  // geoJSON.features[featureIndex].properties["STATUS"] = docStatus;
  map.getSource('clients').setData(geoJSON);
  filterList(geoJSON, 'clients');

}  //end flipToggle()

async function submitNewClient(e) {

  let formData = new FormData(e.target);
  const formProps = Object.fromEntries(formData);


  // console.log(formProps);
  console.log('submit');

  // console.log(formProps);

  const docRef = await addDoc(collection(db, 'client-sites'), formProps);
  console.log(docRef.id);

  newClientForm.reset();  //reset after submission

  // updateMap();

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

  console.log('click');
  const deleteBtn = document.getElementById('deleteClient');
  // console.log(deleteBtn);
  deleteBtn.addEventListener('click', (e) => {deleteClient(props.id);});
  // console.log(deleteBtn);

  const ediClientForm = document.getElementById('ediClientForm');
  editClientForm.addEventListener('submit', async function (e) {

    e.preventDefault();

    let formData = new FormData(e.target);
    const formProps = Object.fromEntries(formData);

    // console.log(formProps);
    console.log('submit');

    await updateDoc(doc(db, 'client-sites', props.id), formProps);
    // console.log(doc(db, 'client-sites', props.id));

    // change geoJSON
    console.log(map.getSource('clients')._data);
    const geoJSON = map.getSource('clients')._data;
    console.log(geoJSON.features.findIndex( (feature) => feature.properties.id === props.id ));
    const featureIndex = geoJSON.features.findIndex( (feature) => feature.properties.id === props.id );
    geoJSON.features[featureIndex].properties["STATUS"] = docStatus;
    map.getSource('clients').setData(geoJSON);
    // updateMap();
  });


} // end editClient

async function deleteClient(id) {

  if (window.confirm("Do you really want to delete?")) {
    await deleteDoc(doc(db, 'client-sites', id));

    // updateMap();
  }

}  // end deleteClient

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
}  //end showRadius

function addPopup(e, source)  {
  const coordinates = e.features[0].geometry.coordinates.slice();
  const props = e.features[0].properties;
  console.log(props);
  let description = '';

  if (source == 'client-sites') {
    description = createPopupClients(props);
  } else if (source == 'candidates') {
    description = createPopupCandidates(props);
  }


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

  if (source == 'client-sites') {
    popupContent._content.childNodes[17].addEventListener('click', flipToggle);
    popupContent._content.childNodes[16].addEventListener('click', (e) => {editClient(props);});
  } else if (source == 'candidates') {
    // popupContent._content.childNodes[15].addEventListener('click', flipToggle);
    // popupContent._content.childNodes[14].addEventListener('click', (e) => {editCandidate(props);});
  }

  console.log(popupContent._content.childNodes);


  // console.log(popupContent._content.childNodes);
  console.log(popupContent);
  // const editBtn = document.getElementById(props['id']+"-edit");
  // console.log(editLink);



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

}  // end addPopup
