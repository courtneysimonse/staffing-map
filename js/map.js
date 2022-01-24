import { accessToken } from "./geocode.js";

const filterGroupClients = document.getElementById('filter-group-clients-accordion');
const filterHeadersClients = ['POSITION','ENGLISHLEVEL','STATUS'];
const filterGroupCandidates = document.getElementById('filter-group-candidates-accordion');
const filterHeadersCandidates = ['POSITION','CAR','STATUS'];

var useConditions = search => a => Object.keys(search).every(k =>
      a.properties[k] === search[k] ||
      Array.isArray(search[k]) && search[k].includes(a.properties[k])
       // ||
      // typeof search[k] === 'object' && +search[k].min <= a[k] &&  a[k] <= +search[k].max ||
      // typeof search[k] === 'function' && search[k](a[k])
    );


mapboxgl.accessToken = accessToken;
const map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [-74.5, 42.0],
      zoom: 6,
      maxZoom: 18
});

async function updateFeature(doc) {

  // console.log(doc);
  const props = doc.properties

  if (props["CLIENTID"]) {
    console.log("Client updated");
    if (map.getSource('clients')) {
      const geoJSON = map.getSource('clients')._data;
      const featureIndex = geoJSON.features.findIndex( (feature) => feature.properties.id === props.id );
      geoJSON.features[featureIndex].properties = props;
      map.getSource('clients').setData(geoJSON);
      filterList(geoJSON, 'clients');
    }
  } else if (props["TEMP ID"]) {
    if (map.getSource('candidates')) {
      console.log("Candidate updated");
      const geoJSON = map.getSource('candidates')._data;
      const featureIndex = geoJSON.features.findIndex( (feature) => feature.properties.id === props.id );
      geoJSON.features[featureIndex].properties = props;
      map.getSource('candidates').setData(geoJSON);
      filterList(geoJSON, 'candidates');
    }
  }

}  // end updateFeature

async function addFeature(doc) {
  // console.log(doc);
  const props = doc.properties

  if (props["CLIENTID"]) {
    console.log("Client added");
    if (map.getSource('clients')) {
      const geoJSON = map.getSource('clients')._data;
      const featureIndex = geoJSON.features.findIndex( (feature) => feature.properties.id === props.id );
      if (featureIndex == -1) {
        geoJSON.features.push(doc);
      } else {
        geoJSON.features[featureIndex].properties = props;
      }

      map.getSource('clients').setData(geoJSON);
      // console.log(geoJSON);
      // filterList(geoJSON, 'clients');

    } else {
      console.log("clients not loaded");
    }
  } else if (props["TEMP ID"]) {
    if (map.getSource('candidates')) {
      console.log("Candidate added");
      const geoJSON = map.getSource('candidates')._data;
      const featureIndex = geoJSON.features.findIndex( (feature) => feature.properties.id === props.id );
      if (featureIndex == -1) {
        geoJSON.features.push(doc);
      } else {
        geoJSON.features[featureIndex].properties = props;
      }

      map.getSource('candidates').setData(geoJSON);
      // filterList(geoJSON, 'candidates');

    } else {
      console.log("candidates not loaded");
    }

  }
}  // end addFeature

function createFilters() {
  console.log('createFilters');
}

function setFilters(geoJSON, source) {
  console.log(geoJSON);
  const sourceID = map.getSource(source);
  const checkboxes = document.getElementsByClassName(source+'Checks');
  console.log(checkboxes);

  for (var input of checkboxes) {
    input.addEventListener('change', () => filterList(geoJSON, source) );
    // console.log(input);
  }
  // return source;
  // console.log(geoJSON);
  // removeInactive(source);
  // filterList(geoJSON, source);
} // end setFilters

function filterList(geoJSON, source) {
  const sourceID = map.getSource(source);
  // const geoJSON = sourceID._data;
  console.log(geoJSON);

  let geoJSONFiltered = {};
  geoJSONFiltered.type = "FeatureCollection";
  geoJSONFiltered.features = [];

  let jobsFilter = {};

  if (source == 'clients') {
    var filteredFile = filterGroupClients;
  } else if (source == 'candidates') {
    var filteredFile = filterGroupCandidates;
  }
  console.log(filteredFile.getElementsByTagName('input'));
  for (var value of filteredFile.getElementsByTagName('input')) {
    // console.log(value);
    console.log(value.id+": "+value.checked);
    const category = value.classList[1].replace(/\-(.*)$/g, '');
    // console.log(category);
    if (value.checked) {
      // console.log([category.childNodes[0].id.replace(/\-(.*)$/g, ''),value.id.replace(/\-(.*)$/g, ''),value.checked]);
      // jobsFilter.push([category.childNodes[0].id.replace(/\-(.*)$/g, ''),value.id.replace(/\-(.*)$/g, '')]);
      if (jobsFilter[category] == undefined) {
        jobsFilter[category] = [value.id.replace(/\-(.*)$/g, '')]
      } else {
        jobsFilter[category].push(value.id.replace(/\-(.*)$/g, ''));
        // console.log(jobsFilter[category].id.replace(/\-(.*)$/g, '')]);

      }
    }
  }

  // console.log(geoJSON.features.filter(useConditions(jobsFilter)));
  console.log(jobsFilter);
  geoJSONFiltered.features = geoJSON.features.filter(useConditions(jobsFilter));
  console.log(geoJSONFiltered);

  sourceID.setData(geoJSONFiltered);
}

async function updateMap() {
  const candidatesDB = await getDB(db, 'candidates');
  // console.log(candidatesDB);
  const newCandidatesGeoJSON = await getCoords(candidatesDB);

  map.getSource('candidates').setData(newCandidatesGeoJSON);
  filterList(newCandidatesGeoJSON, 'candidates');

  const clientsDB = await getDB(db, 'client-sites');
  // console.log(clientsDB);
  const newClientsGeoJSON = await getCoords(clientsDB);

  map.getSource('clients').setData(newClientsGeoJSON);
  filterList(newClientsGeoJSON, 'clients');

  // removeInactive('clients');
  // removeInactive('candidates');
}

function removeInactive(source) {
  console.log('INACTIVE-'+source);
  // console.log(document.getElementsByClassName(source+"Checks"));
  console.log(document.getElementById('INACTIVE-'+source).outerHTML);
  document.getElementById('INACTIVE-'+source).removeAttribute('checked');
  console.log(document.getElementById('INACTIVE-'+source).outerHTML);
}


export { map, removeInactive, addFeature, updateFeature, filterGroupClients, filterHeadersClients, filterGroupCandidates, filterHeadersCandidates, createFilters, setFilters, filterList, updateMap }
