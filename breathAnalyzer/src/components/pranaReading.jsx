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
  "ooga booga"
];

export default function PranaReading({ maxdFCo2, co2Threshold }) {
  const [pranaIndex, setPranaIndex] = useState(null);

  useEffect(() => {
    if (maxdFCo2 > co2Threshold + 10) {
      setPranaIndex(0);
    } else if (maxdFCo2 > co2Threshold + 8) {
      setPranaIndex(1);
    } else if (maxdFCo2 > co2Threshold + 6) {
      setPranaIndex(2);
    } else if (maxdFCo2 > co2Threshold + 4) {
      setPranaIndex(3);
    } else if (maxdFCo2 > co2Threshold + 2) {
      setPranaIndex(4);
    } else {
      setPranaIndex(5);
    }
  }, [maxdFCo2, co2Threshold]);

  return (
    <>
      {pranaIndex !== null && (
        <div>
          <h1>{pranaArray[pranaIndex]}</h1>
          <p>{pranaDesc[pranaIndex]}</p>
        </div>
      )}
    </>
  );
}
