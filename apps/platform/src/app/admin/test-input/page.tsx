"use client";

import { useState } from "react";

export default function TestInputPage() {
  const [value, setValue] = useState("");
  const [clicked, setClicked] = useState(false);

  return (
    <div style={{ padding: "50px" }}>
      <h1>Test Input Page</h1>
      <p>Value: {value}</p>
      <p>Clicked: {clicked ? "YES" : "NO"}</p>

      <input
        type="text"
        value={value}
        onChange={(e) => {
          console.log("onChange fired:", e.target.value);
          setValue(e.target.value);
        }}
        placeholder="Type here"
        style={{ padding: "10px", fontSize: "16px" }}
      />

      <button
        onClick={() => {
          console.log("Button clicked!");
          setClicked(true);
        }}
        style={{ padding: "10px", marginLeft: "10px", fontSize: "16px" }}
      >
        Click Me
      </button>

      <div style={{ marginTop: "20px" }}>
        <button
          onClick={() => {
            alert("Alert button works!");
          }}
        >
          Alert Test
        </button>
      </div>
    </div>
  );
}
