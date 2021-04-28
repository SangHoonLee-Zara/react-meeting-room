import React from 'react';
import './App.css';
import SignIn from './SignIn';
import Main from './Main';
import Calendar from './Calendar';
import { useStateValue } from './StateProvider';
import {auth} from "./firebase";
import { actionTypes } from './reducer';

function App() {
  const [{user}, dispatch] = useStateValue();
  auth.onAuthStateChanged((curruser)=>{
    if(curruser && !user){
      dispatch({
        type: actionTypes.SET_USER,
        user: curruser,
      })
    }
  });
  //console.log(user);
  return (
    <div className="App">
      {(!user)?(<SignIn/>):(<Calendar/>)}
    </div>
  );
}

export default App;
