import firebase from "firebase";

const firebaseConfig = {
    apiKey: "AIzaSyAbap0S8u4fKizlcYfwXNcFILHhIyuiMGY",
    authDomain: "hoeuisil.firebaseapp.com",
    databaseURL: "https://hoeuisil-default-rtdb.firebaseio.com",
    projectId: "hoeuisil",
    storageBucket: "hoeuisil.appspot.com",
    messagingSenderId: "815565412576",
    appId: "1:815565412576:web:9fd1ddeecb467e05019885",
    measurementId: "G-QG3MF5E5T5"
};

// firebaseConfig 정보로 firebase 시작
const firebaseApp = firebase.initializeApp(firebaseConfig);
const db = firebaseApp.firestore();
const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();
const {email, password} = firebase.auth();
auth.setPersistence(firebase.auth.Auth.Persistence.SESSION).then(() => {
    // Existing and future Auth states are now persisted in the current
    // session only. Closing the window would clear any existing state even
    // if a user forgets to sign out.
    // ...
    // New sign-in will be persisted with session persistence.
    return firebase.auth().signInWithEmailAndPassword(email, password);
  })
  .catch((error) => {
    // Handle Errors here.
    //var errorCode = error.code;
    //var errorMessage = error.message;
  });

export {auth, provider};
export default db;