// Import the functions you need from the SDKs you need

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.5/firebase-app.js";
// import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-analytics.js";
import { getFirestore, collection, getDocs, getDoc, doc, updateDoc, addDoc, onSnapshot, deleteDoc } from 'https://www.gstatic.com/firebasejs/9.6.5/firebase-firestore.js'

import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/9.6.5/firebase-auth.js";

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

const auth = getAuth(app);
console.log(auth);

// if (auth.currentUser != null) {
//   document.getElementById('currentUser').innerText = auth.currentUser.email;
// }

document.getElementById('signOut').addEventListener('click', () => {
  signOut(auth);
});

const loginForm = document.getElementById('loginForm');
loginForm.addEventListener("submit", function (event) {
  event.preventDefault();
  let formData = new FormData(event.target);
  const formProps = Object.fromEntries(formData);

  signInWithEmailAndPassword(auth, formProps.email, formProps.password)
    .then((userCredential) => {
      // Signed in
      console.log(userCredential.user.uid);
      var user = userCredential.user;
      console.log(db);
      const docRef = doc(db, "admin", user.uid);
      console.log(docRef);
      const docSnap = getDoc(docRef).then((doc) => {
        const role = doc.data().role;
        if (role == "sales") {
          // document.getElementById('login').style.display = 'none';
          // document.getElementById('uiDiv').style.visibility = 'visible';
          // document.getElementById('geocode').style.visibility = 'visible';
          // document.getElementById('upload').style.visibility = 'visible';
          console.log("Go to ./sales");
          document.getElementById('login').innerHTML += "<a class='btn btn-secondary' href='../../"+role+"'>Go To "+role+"</a>";

        } else if (role == "recruiting") {
          document.getElementById('login').style.display = 'none';
          document.getElementById('uploadForm').style.visibility = 'visible';
          console.log("Go to ./recruiting");
          // document.getElementById('login').innerHTML += "<a class='btn btn-secondary' href='../../"+role+"'>Go To "+role+"</a>";
        }
      });

    })
    .catch((err) => {
      error(err);
    });
});

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
