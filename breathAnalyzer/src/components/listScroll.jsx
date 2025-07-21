// taken from https://codepen.io/hoqqanen/pen/zvqGEG

import { useEffect, useRef } from "react";
import './listScroll.scss'

const phrases = [
  'example phrase', 'example phrase2','example phrase3','example phrase4', 
  'example phrase5', 'example phrase6', 'example phrase7','example phrase8'];

const checkmarkIdPrefix = "loadingCheckSVG-";
const checkmarkCircleIdPrefix = "loadingCheckCircleSVG-";
const verticalSpacing = 50;

function shuffleArray(array) {
  return array.sort(() => Math.random() - 0.5);
}

function createSVG(tag, properties, children = []) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const prop in properties) el.setAttribute(prop, properties[prop]);
  children.forEach(child => el.appendChild(child));
  return el;
}

function createPhraseSvg(phrase, yOffset) {
  const text = createSVG("text", {
    fill: "white", x: 50, y: yOffset,
    "font-size": 18, "font-family": "Arial"
  });
  text.appendChild(document.createTextNode(phrase + "..."));
  return text;
}

function createCheckSvg(yOffset, index) {
  const check = createSVG("polygon", {
    points: "21.661,7.643 13.396,19.328 9.429,15.361 7.075,17.714 13.745,24.384 24.345,9.708",
    fill: "rgba(255,255,255,1)",
    id: checkmarkIdPrefix + index
  });
  const circle_outline = createSVG("path", {
    d: "M16,0C7.163,0,0,7.163,0,16s7.163,16,16,16s16-7.163,16-16S24.837,0,16,0z M16,30C8.28,30,2,23.72,2,16C2,8.28,8.28,2,16,2 c7.72,0,14,6.28,14,14C30,23.72,23.72,30,16,30z",
    fill: "white"
  });
  const circle = createSVG("circle", {
    id: checkmarkCircleIdPrefix + index,
    fill: "rgba(255,255,255,0)",
    cx: 16, cy: 16, r: 15
  });
  return createSVG("g", {
    transform: `translate(10 ${yOffset - 20}) scale(.9)`
  }, [circle, check, circle_outline]);
}

function easeInOut(t) {
  const period = 200;
  return (Math.sin(t / period + 100) + 1) / 2;
}

export default function ScrollList() {
  const groupRef = useRef(null);
  console.log("ScrollList mounted")

  useEffect(() => {
    const shuffled = shuffleArray([...phrases]);
    const group = groupRef.current;
    shuffled.forEach((phrase, index) => {
      const yOffset = 30 + verticalSpacing * index;
      group.appendChild(createPhraseSvg(phrase, yOffset));
      group.appendChild(createCheckSvg(yOffset, index));
    });

    const checks = shuffled.map((_, i) => ({
      check: document.getElementById(checkmarkIdPrefix + i),
      circle: document.getElementById(checkmarkCircleIdPrefix + i)
    }));

    const start_time = Date.now();
    group.currentY = 0;

    function animateLoading() {
      const now = Date.now();
      group.setAttribute("transform", `translate(0 ${group.currentY})`);
      group.currentY -= 1.35 * easeInOut(now);

      checks.forEach((check, i) => {
        const boundary = -i * verticalSpacing + verticalSpacing + 15;
        if (group.currentY < boundary) {
          const alpha = Math.max(Math.min(1 - (group.currentY - boundary + 15) / 30, 1), 0);
          check.circle.setAttribute("fill", `rgba(255, 255, 255, ${alpha})`);
          const green = Math.round(255 * (1 - alpha) + 120 * alpha);
          const blue = Math.round(255 * (1 - alpha) + 154 * alpha);
          check.check.setAttribute("fill", `rgba(255, ${green}, ${blue}, 1)`);
        }
      });

      if (now - start_time < 30000 && group.currentY > -710) {
        requestAnimationFrame(animateLoading);
      }
    }

    requestAnimationFrame(animateLoading);
  }, []);

  return (
      <div style={{
          position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",  // center the icon
        width: "400px",  
        height: "200px", 
        zIndex: 9999,
        pointerEvents: "none",
      }}>
      <svg width="100%" height="100%">
        <defs>
          <mask id="mask" maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse">
            <linearGradient id="linearGradient" gradientUnits="objectBoundingBox" x2="0" y2="1">
              <stop stopColor="white" stopOpacity="0" offset="0%" />
              <stop stopColor="white" stopOpacity="1" offset="30%" />
              <stop stopColor="white" stopOpacity="1" offset="70%" />
              <stop stopColor="white" stopOpacity="0" offset="100%" />
            </linearGradient>
            <rect width="100%" height="100%" fill="url(#linearGradient)" />
          </mask>
        </defs>
        <g style={{ mask: "url(#mask)" }}>
          <g id="phrases" ref={groupRef}></g>
        </g>
      </svg>
    </div>
  );
}
