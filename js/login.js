import { getAuth, onAuthStateChanged, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.6.4/firebase-auth.js";

import { app, db, error } from "./db.js";

const auth = getAuth(app);

export { auth };
