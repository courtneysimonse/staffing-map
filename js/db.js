// Import the functions you need from the SDKs you need

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";

import { getFirestore, collection, getDocs, doc, updateDoc, addDoc, onSnapshot, deleteDoc } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js'

import { getCoords, getCoordsIndiv } from "./geocode.js";

import { map, addFeature, updateFeature, updateMap } from "./map.js";

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
      let doc = change.doc.data();
      doc.id = change.doc.id;
      let description = '';

      var toast = new bootstrap.Toast(createToast());
      // console.log(toast);
      // console.log(toast._element.innerHTML);
      var dbNameToast = "";
      var editTime = new Date().toString();
      var changeType = "";

      if (dataset == 'client-sites') {
        dbNameToast = "Client"
        description = "<strong>" + doc['COMPANY'] + "</strong><br>" +
          "<strong>Position:</strong> " + doc['POSITION'] + " <strong>Pay:</strong> " + doc['PAY RATE'] +
          "<br>" + doc['DESCRIPTION'] + "<br>" + doc['SCHEDULE'] + "<br>" +
          "<strong>No. of People: </strong>" + doc['NUMPEOPLE'] + " <strong>English Level:</strong> " +
          doc['ENGLISHLEVEL'] + '<br>' + "<strong>Status:</strong> " + doc['STATUS'];

      } else if (dataset == 'candidates') {
        dbNameToast = "Candidate"
        description = "<strong>" + doc['FIRST NAME'] + " " + doc['LAST NAME'] + "</strong> " +
          "<strong>Temp ID:</strong> " + doc['TEMP ID'] + "<br>" +
          "<strong>Position:</strong> " + doc['POSITION'] + " " +
          "<strong>Pay:</strong> " + doc['PAY'] + "  <strong>Shift:</strong> " + doc['SHIFT'] + "  <strong>Car:</strong> " + doc['CAR'] +
          '<br>' + "<strong>Status:</strong> " + doc['STATUS'];
      }

      if (change.type === "added") {
          console.log("New: ", doc);
          changeType = 'Added';

          const feature = getCoordsIndiv(doc).then(addFeature, error);
      }
      if (change.type === "modified") {
          console.log("Modified: ", doc);
          console.log(change);
          changeType = 'Updated';

          const feature = getCoordsIndiv(doc).then(updateFeature, error);
      }
      if (change.type === "removed") {
          console.log("Removed: ", doc);
          changeType = 'Deleted';

          updateMap();
      }

      toast._element.innerHTML = '<div class="toast-header">' +
          '<strong class="me-auto"><span>'+dbNameToast+'</span> <span>'+changeType+'</span></strong>' +
          '<small><span>'+editTime+'</span></small>' +
          '<button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>' +
        '</div>' +
        '<div class="toast-body">' + description + '</div>';

      toast.show();

    });

  });

}  //end getSnapshotDB()


// Get a list of docs from your database
async function getDB(db,dataset) {
  const col = collection(db, dataset);
  const snapshot = await getDocs(col);
  // const docList = snapshot.docs.map(doc => doc.data());
  const docList = [];
  snapshot.docs.forEach((doc, i) => {
    let docData = doc.data();
    docData.id = (doc.id);
    // console.log(docData);
    docList.push(docData);
  });

  return docList;
} // end getDB()


function createToast() {
  var toastContainer = document.getElementsByClassName('toast-container')[0];

  var toastMsg = document.createElement('div');
  toastMsg.classList = "toast";
  toastMsg.style.zIndex = '200';

  toastMsg.innerHTML = '<div class="toast-header">' +
      '<strong class="me-auto"><span id="db-name-toast">Client</span> <span id="doc-change-type">Updated</span></strong>' +
      '<small><span id="edit-time">11 mins ago</span></small>' +
      '<button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>' +
    '</div>' +
    '<div class="toast-body" id="updated-doc"></div>';

  toastContainer.appendChild(toastMsg)
  return toastMsg;
}

// function fired if there is an error
function error(error) {
  console.log(error)
}

export { app, db, getSnapshotDB, getDB, error }
