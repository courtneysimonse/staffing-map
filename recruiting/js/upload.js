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
      let parsedata = d3.csvParse(csvdata);
      uploadData(parsedata);
  });

  reader.readAsBinaryString(file);
  console.log(file);

} // end getFile

async function uploadData(data) {
  console.log(data);
  const docList = await getDocIds("candidates");
  console.log(docList);
  let docCandidateIDs = [];
  docList.forEach((doc, i) => {
    docCandidateIDs.push(doc["CANDIDATEID"]);
  });


  for (const item of data) {
    console.log(item);
    console.log(item["CANDIDATEID"]);

    if (docCandidateIDs.includes(item["CANDIDATEID"])) {
      let docIndex = docList.findIndex((doc) => doc["CANDIDATEID"] = item["CANDIDATEID"]);
      console.log(docList[docIndex].id);
      const docRef = await updateDoc(doc(db, 'candidates', docList[docIndex].id), item)
      console.log(item["CANDIDATEID"]+" updated");

    } else {
      const docRef = await addDoc(collection(db, 'candidates'), item);
      console.log(item["CANDIDATEID"]+" added");
    }
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
