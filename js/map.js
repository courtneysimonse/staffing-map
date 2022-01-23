import { accessToken } from "./geocode.js";

const filterGroupClients = document.getElementById('filter-group-clients');
const filterHeadersClients = ['POSITION','NUMPEOPLE','ENGLISHLEVEL','STATUS'];
const filterGroupCandidates = document.getElementById('filter-group-candidates');
const filterHeadersCandidates = ['POSITION','CAR','STATUS'];

mapboxgl.accessToken = accessToken;
const map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [-74.5, 42.0],
      zoom: 6,
      maxZoom: 18
});

async function updateFeature(doc) {

  console.log(doc);
  const props = doc.properties

  if (props["CLIENTID"]) {
    console.log("Client updated");
    if (map.getSource('clients')) {
      const geoJSON = map.getSource('clients')._data;
      const featureIndex = geoJSON.features.findIndex( (feature) => feature.properties.id === props.id );
      geoJSON.features[featureIndex].properties = props;
      map.getSource('clients').setData(geoJSON);
    }
  } else if (props["TEMP ID"]) {
    if (map.getSource('candidates')) {
      console.log("Candidate updated");
      const geoJSON = map.getSource('candidates')._data;
      const featureIndex = geoJSON.features.findIndex( (feature) => feature.properties.id === props.id );
      geoJSON.features[featureIndex].properties = props;
      map.getSource('candidates').setData(geoJSON);
    }
  }

}  // end updateFeature

async function addFeature(doc) {
  console.log(doc);
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
      filterHeadersClients.forEach((header, i) => {
        createFilters(header, geoJSON, 'clients', filterGroupClients);

      });

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

      filterHeadersCandidates.forEach((header, i) => {
        createFilters(header, geoJSON, 'candidates', filterGroupCandidates);

      });
    } else {
      console.log("candidates not loaded");
    }

  }
}  // end addFeature

function createFilters(header, geoJSON, source, filterGroup) {
  // remove spaces in header text and append layer name
  const filterClass = header.replace(/\s/g, '')+"-"+source;
  var jobFilterHeader = undefined;

  // check if filter already exists
  if (document.getElementById(filterClass)) {
    console.log(document.getElementById(filterClass).parentNode);
    jobFilterHeader = document.getElementById(filterClass).parentNode;
  } else {
    // create details element for header and give id
    jobFilterHeader = document.createElement('details');
    jobFilterHeader.classList.add('filter-group-header');
    jobFilterHeader.innerHTML = "<summary id='"+filterClass+"'>"+header+"</summary>";
    filterGroup.appendChild(jobFilterHeader);
  }

  const existingTypes = [];
  // console.log([ ...jobFilterHeader.childNodes ]);
  // console.log(jobFilterHeader.getElementsByTagName('input'));
  let elements = [ ...jobFilterHeader.getElementsByTagName('input') ];
  elements.forEach((item, i) => {
    existingTypes.push(item.id);
  });

  const newTypes = [];
  // loop through features in layer
  geoJSON.features.forEach((item, i) => {
    // console.log(item.properties[header]);
    // console.log(header);
    // add the values for the selected property
    if (!newTypes.includes(item.properties[header]+"-"+source)) {
      newTypes.push(item.properties[header]+"-"+source);
    }
  });
  // console.log(jobTypes);

  let jobTypes = newTypes.filter(x => !existingTypes.includes(x));

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


async function updateMap() {
  const candidatesDB = await getDB(db, 'candidates');
  // console.log(candidatesDB);
  const newCandidatesGeoJSON = await getCoords(candidatesDB);

  map.getSource('candidates').setData(newCandidatesGeoJSON);

  const clientsDB = await getDB(db, 'client-sites');
  // console.log(clientsDB);
  const newClientsGeoJSON = await getCoords(clientsDB);

  map.getSource('clients').setData(newClientsGeoJSON);
}

export { map, addFeature, updateFeature, filterGroupClients, filterHeadersClients, filterGroupCandidates, filterHeadersCandidates, createFilters, updateMap }
