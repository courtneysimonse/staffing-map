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

const headers = ["COMPANY","CLIENTID","ADDRESS","CITY","STATE","ZIP","POSITION","PAY RATE","SCHEDULE","DESCRIPTION","NUMPEOPLE","ENGLISHLEVEL","STATUS"];

const outputLog = document.getElementById('outputLog');
const errorLog = document.getElementById('errorLog');

// form for file upload
const uploadForm = document.getElementById('uploadForm');
uploadForm.addEventListener('submit', function ( event ) {
  event.preventDefault();

  getFile(event);
});

async function getFile(event) {
  console.log(event);

  let file = event.target[0].files[0];
  const reader = new FileReader();

  reader.addEventListener('load', function (e) {

      let csvdata = e.target.result;
      let parsedata = d3.csvParse(csvdata, (d, j) => {
        let data = {};
        let row = j+1;
        headers.forEach((item, i) => {
          if (d[item] == null) {
            console.log(item + " column not in csv");
            console.log(d);
            const err = document.createElement("p");
            err.classList = "small mb-0 pb-0";
            err.innerText = item + " column not included for row " + row + ". Check your file for correct formatting.";
            errorLog.appendChild(err);
          } else {
            data[item] = d[item];
          }
        });
        console.log(data);
        return data;
      });
      uploadData(parsedata);
  });

  reader.readAsBinaryString(file);
  console.log(file);

} // end getFile

async function uploadData(data) {
  console.log(data);
  const docList = await getDocIds("client-sites");
  console.log(docList);
  let docClientIDs = [];
  docList.forEach((doc, i) => {
    docClientIDs.push(doc["CLIENTID"]);
  });


  // clientHeaders.forEach((item, i) => {
  //   if (data.columns.find(x => x == item)) {
  //     console.log(item);
  //   } else {
  //     console.log(item+" not in csv");
  //   }
  // });


  for (const item of data) {
    console.log(item);
    console.log(item["CLIENTID"]);
    let output = document.createElement('p');
    output.classList = "small mb-0 pb-0";

    if (docClientIDs.includes(item["CLIENTID"])) {
      let docIndex = docList.findIndex((doc) => doc["CLIENTID"] == item["CLIENTID"]);
      console.log(docList[docIndex].id);
      const docRef = await updateDoc(doc(db, 'client-sites', docList[docIndex].id), item)
      console.log(item["CLIENTID"]+" updated");
      output.innerText = item["CLIENTID"]+" - "+item["COMPANY"]+" updated";

    } else {
      const docRef = await addDoc(collection(db, 'client-sites'), item);
      console.log(item["CLIENTID"]+" added");
      output.innerText = item["CLIENTID"]+" - "+item["COMPANY"]+" added";
    }

    outputLog.appendChild(output);
  }

}  // end uploadData

async function getDocIds(coll) {
  const querySnapshot = await getDocs(collection(db, coll));
  const docList = [];
  querySnapshot.docs.forEach((doc, i) => {
    let docData = doc.data();
    docData.id = (doc.id);
    console.log(docData);
    docList.push(docData);
  });

  return docList;
}
