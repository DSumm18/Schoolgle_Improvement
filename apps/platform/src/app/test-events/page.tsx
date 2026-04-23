"use client";

import { useState } from "react";

export default function TestEventsPage() {
  const [value, setValue] = useState("");
  const [clicked, setClicked] = useState(false);

  return (
    <div style={{ padding: "50px" }}>
      <h1>Test Events Page (Root Level)</h1>
      <p>Value: <strong>{value}</strong></p>
      <p>Clicked: <strong>{clicked ? "YES" : "NO"}</strong></p>

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
    </div>
  );
}
