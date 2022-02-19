// Import the functions you need from the SDKs you need

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.5/firebase-app.js";
// import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-analytics.js";
import { getFirestore, collection, getDocs, getDoc, doc, updateDoc, addDoc, onSnapshot, deleteDoc } from 'https://www.gstatic.com/firebasejs/9.6.5/firebase-firestore.js'

import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/9.6.5/firebase-auth.js";

import { error } from "../../js/error.js";

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

const user = await new Promise((resolve, reject) => auth.onAuthStateChanged(resolve,error));
console.log(user);

if (auth.currentUser != null) {
  // document.getElementById('currentUser').innerText = auth.currentUser.email;
  console.log(auth.currentUser.uid);
  signIn(auth.currentUser.uid);
}

function signIn(user) {
  // console.log(user);
  // console.log(db);
  const docRef = doc(db, "admin", user);
  // console.log(docRef);
  const docSnap = getDoc(docRef).then((doc) => {
    const role = doc.data().role;
    console.log(role);
    if (role == "sales" || role == "admin") {
      document.getElementById('loginForm').style.display = 'none';
      document.getElementById('uploadForm').style.visibility = 'visible';
      document.getElementById('signOut').style.visibility = 'visible';
      console.log("Go to ./sales");
      // document.getElementById('login').innerHTML += "<a class='btn btn-secondary' href='../../"+role+"'>Go To "+role+"</a>";

    } else if (role == "recruiting") {
      document.getElementById('loginForm').style.display = 'none';
      document.getElementById('signOut').style.visibility = 'visible';
      // document.getElementById('uploadForm').style.visibility = 'visible';
      console.log("Go to ./recruiting");
      document.getElementById('login').innerHTML += "<a class='btn btn-secondary' href='../../"+role+"'>Go To "+role+"</a>";
    }
  });
}


document.getElementById('signOut').addEventListener('click', () => {
  signOut(auth);
  document.getElementById('loginForm').style.display = 'block';
  document.getElementById('loginForm').reset;
  document.getElementById('uploadForm').style.visibility = 'hidden';
  document.getElementById('signOut').style.visibility = 'hidden';
  console.log('signed out');
  console.log(auth);
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
      signIn(userCredential.user.uid)

    })
    .catch((err) => {
      error(err);
    });
});

const headers = ["COMPANY","CLIENTID","ADDRESS","CITY","STATE","ZIP","POSITION","PAY RATE","SCHEDULE","DESCRIPTION","NUMPEOPLE","ENGLISHLEVEL","CAR","STATUS"];

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
            } else if (item == "CAR") {
              const car = d[item][0].toUpperCase() + d[item].substring(1);
              if (car == "Yes" || car == "No") {
                data[item] = car;
              } else {
                err.innerText = "Row " + row + " has Car value of "+ d[item] +". Value should be Yes or No. Check your file for correct formatting.";
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
  const docList = await getDocIds("client-sites");
  console.log(docList);
  let docClientIDs = [];
  docList.forEach((doc, i) => {
    docClientIDs.push(doc["CLIENTID"]);
  });

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
