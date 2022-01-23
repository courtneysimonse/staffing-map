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

const headers = ["FIRST NAME","LAST NAME","ADDRESS","CITY","STATE","ZIP","TEMP ID","POSITION","PAY","SHIFT","CAR","ENGLISHLEVEL","STATUS"];

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
        const err = document.createElement("p");
        headers.forEach((item, i) => {
          if (d[item] == null) {
            console.log(item + " column not in csv");
            console.log(d);

            err.classList = "small mb-0 pb-0";
            err.innerText = item + " column not included for row " + row + ". Check your file for correct formatting.";
            errorLog.appendChild(err);
          } else {
            if (item == "ENGLISHLEVEL") {
              const englishLevel = d[item][0].toUpperCase() + d[item].substring(1);
              if (englishLevel == "None" || englishLevel == "Conversational" || englishLevel == "Fluent") {
                data[item] = englishLevel;
              } else {
                err.innerText = "Row " + row + " has English Level value of "+ d[item] +". Value should be Fluent, Conversational, or None. Check your file for correct formatting.";
                errorLog.appendChild(err);
              }
            } else if (item == "STATUS") {
              const status = d[item].toUpperCase();
              if (status == "ACTIVE" || status == "INACTIVE") {
                data[item] = status;
              } else {
                err.innerText = "Row " + row + " has Status value of "+ d[item] +". Value should be ACTIVE or INACTIVE. Check your file for correct formatting.";
                errorLog.appendChild(err);
              }
            } else if (item == "CAR") {
              const car = d[item][0].toUpperCase() + d[item].substring(1);
              if (car == "Yes" || car == "No") {
                data[item] = car;
              } else {
                err.innerText = "Row " + row + " has Car value of "+ d[item] +". Value should be Yes or No. Check your file for correct formatting.";
                errorLog.appendChild(err);
              }
            } else {
              data[item] = d[item];
            }

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
  const docList = await getDocIds("candidates");
  console.log(docList);
  let docIDs = [];
  docList.forEach((doc, i) => {
    docIDs.push(doc["TEMP ID"]);
  });

  for (const item of data) {
    console.log(item);
    console.log(item["TEMP ID"]);
    let output = document.createElement('p');
    output.classList = "small mb-0 pb-0";

    if (docIDs.includes(item["TEMP ID"])) {
      let docIndex = docList.findIndex((doc) => doc["TEMP ID"] == item["TEMP ID"]);
      console.log(docList[docIndex].id);
      const docRef = await updateDoc(doc(db, 'candidates', docList[docIndex].id), item)
      console.log(item["TEMP ID"]+" updated");
      output.innerText = item["TEMP ID"]+" - "+item["FIRST NAME"]+" "+item["LAST NAME"]+" updated";

    } else {
      const docRef = await addDoc(collection(db, 'candidates'), item);
      console.log(item["TEMP ID"]+" added");
      output.innerText = item["TEMP ID"]+" - "+item["FIRST NAME"]+" "+item["LAST NAME"]+" added";
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
