import { useEffect, useState } from "react";

const pranaArray = [
  "Radiant Overflow",
  "Expressive Prana",
  "Disciplined Pulse",
  "Conditioned Flow",
  "Dormant Vitality",
  "please try again"
];

const pranaDesc = [
  "Your breath just filled the room. And your inbox. Prāṇa is here to disrupt... respectfully, of course.",
  "This breath has feelings—and a to-do list. Prāṇa resists optimization. It wants to feel something.",
  "Structured like your project timeline—steady but uninspired. Prāṇa conforms to code... until debug mode is triggered.",
  "Measured and polite, this breath knows how to RSVP. Prāṇa adapts. Efficient. Predictable. Engineer-approved.",
  "Barely there, this breath stays hidden. Prāṇa is introverted today—maybe it skipped breakfast?",
  "Maybe blow harder?"
];

export default function PranaReading({ maxdFCo2, co2Threshold }) {
  const [pranaIndex, setPranaIndex] = useState(null);

  useEffect(() => {
    if (maxdFCo2 > co2Threshold + 15) {
      setPranaIndex(0);
    } else if (maxdFCo2 > co2Threshold + 11) {
      setPranaIndex(1);
    } else if (maxdFCo2 > co2Threshold + 7) {
      setPranaIndex(2);
    } else if (maxdFCo2 > co2Threshold + 3) {
      setPranaIndex(3);
    } else if (maxdFCo2 > co2Threshold) {
      setPranaIndex(4);
    } else {
      setPranaIndex(5);
    }
  }, [maxdFCo2, co2Threshold]);

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
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        border: "1px solid rgba(255, 255, 255, 0.1)"
      }}>
          <h1>{pranaArray[pranaIndex]}</h1>
          <p>{pranaDesc[pranaIndex]}</p>
        </div>
      )}
    </>
  );
}
