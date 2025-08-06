import { useEffect, useState } from "react";

const pranaArray = [
  "Radiant Overflow",
  "Expressive Prana",
  "Disciplined Pulse",
  "Conditioned Flow",
  "Dormant Vitality",
];

const pranaDesc = [
  "Your breath just filled the room. And your inbox. Prāṇa is here to disrupt... respectfully, of course.",
  "This breath has feelings—and a to-do list. Prāṇa resists optimization. It wants to feel something.",
  "Structured like your project timeline—steady but uninspired. Prāṇa conforms to code... until debug mode is triggered.",
  "Measured and polite, this breath knows how to RSVP. Prāṇa adapts. Efficient. Predictable. Engineer-approved.",
  "Barely there, this breath stays hidden. Prāṇa is introverted today—maybe it skipped breakfast?",
];

export default function PranaReading({pranaIndex}){
  return (
    <>
      {pranaIndex !== null && (
        <div style={{
        position: "fixed",
        bottom: "10%",
        left: "50%",
        transform: "translateX(-50%)",
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        color: "white",
        padding: "2rem",
        borderRadius: "12px",
        maxWidth: "600px",
        width: "90%",
        textAlign: "center",
        zIndex: 10000,
        pointerEvents: "none",
        border: "1px solid rgba(255, 255, 255, 0.1)"
      }}>
          <h1>{pranaArray[pranaIndex]}</h1>
          <p>{pranaDesc[pranaIndex]}</p>
        </div>
      )}
    </>
  );
}
