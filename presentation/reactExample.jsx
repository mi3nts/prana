import React, { useState } from "react";
import "./example.css";         // importing the CSS file

function MyFirstWebpage() {
  const [count, setCount] = useState(0);    // using JavaScript logic

  
  return (                          // all on top of an HTML structure
    <div className="container">
      <h1>My First Webpage!</h1>
      <p>This is a paragraph!</p>
      <button onClick={() => setCount(count + 1)}>
        Clicked {count} times
      </button>
    </div>
  );
}

export default MyFirstWebpage;
