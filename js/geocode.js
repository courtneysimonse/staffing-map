
const accessToken = 'pk.eyJ1IjoidGl0YW5tYXN0ZXIiLCJhIjoiY2t3dmNzbHhsMXl2MDJxanYwcmw0OHYzZCJ9.Rr2kb4WqAzr_5EgH8ZjK3A';

const mapboxClient = mapboxSdk({ accessToken: accessToken });

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

async function getCoordsIndiv(item) {

  const itemCoords = await mapboxClient.geocoding.forwardGeocode({
    query: '"'+item['ADDRESS']+", "+item['CITY']+", "+item["STATE"]+" "+item["ZIP"]+'"',
    proximity: [-74.5, 42.0],
    types: ['address']
  }).send();
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
  return dataFeature;

} // end getCoordsIndiv

export { accessToken, mapboxClient, getCoords, getCoordsIndiv }
