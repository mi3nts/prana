import { useRef, useEffect, useState } from "react";
import ScrollList from "./components/listScroll";

export default function RippleParticles() {
  const co2Ref = useRef(0);
  const co2AvgRef = useRef(0);
  const pressureRef = useRef(0);
  const pcRef = useRef(0);
  const humidRef = useRef(0);
  const canvasRef = useRef(null);
  const tempRef = useRef(0)
  const monitorFps = 120
  const numParticles = 35
  let frameCounter = 0
  let seconds = 0
  let previousCo2 = 0
  let prevFilteredCo2 = 0
  let previousPc0_5 = 0
  let previousHumidity = 0
  let dFilteredCo2 = 0
  let dHumidity = 0
  let dCo2 = 0
  let dPc0_5 = 0

  const [showScroll, setShowScroll] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    const ws = new WebSocket("ws://localhost:8765");

    ws.onopen = () => {
        console.log("WebSocket connected");
      };

    ws.onerror = (err) => {
    console.error("WebSocket error:", err);
    };

    ws.onmessage = (event) => {

      console.log("Incoming message:", event.data);

      const { topic, message } = JSON.parse(event.data);
      const payload = typeof message === "string" ? JSON.parse(message) : message;

      console.log(`[WebSocket] ${topic}:`, payload);

      if (topic === "d83add7316a5/COZIR001Test") {
        previousCo2 = co2Ref.current;
        prevFilteredCo2 = co2AvgRef.current
        previousHumidity = humidRef.current
        setTimeout(sleep(), 100)    //dont touch this DONT EVEN CHANGE THE NUMBER
        co2Ref.current = payload.co2Latest ?? 0;
        co2AvgRef.current = payload.co2Filtered ?? 0
        tempRef.current = (payload.temperature ?? 0);
        humidRef.current = (payload.humidity ?? 0 );
      }
      if (topic === "d83add7316a5/BME280Test") {
        pressureRef.current = (payload.pressure ?? 0) / 100;
      }
      if (topic === "d83add7316a5/IPS7100Test") {
        previousPc0_5 = pcRef.current
        setTimeout(sleep(), 100)    //dont touch this DONT EVEN CHANGE THE NUMBER
        pcRef.current = parseFloat(payload.pc0_5 ?? 0);
      }
    };

    function sleep() {
      console.log('sleep 100 ms')
    } 

    class Particle {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.radius = 20;
        this.targetRadius = 20;
        this.mass = 4;
        this.color = `#FFFFFF` //fill color = white
      }

      applyForce(fx, fy) {
        this.vx += fx;
        this.vy += fy;
      }

      update() {
        if (seconds >= 3 && !showScroll) {
          setShowScroll(true);
        }
        const speedMult = 0.5 + (co2Ref.current) / 100;
        if(this.targetRadius > 21 && !showScroll) {  // measuring the amount of time that the particles are expanded
          frameCounter++
          seconds = frameCounter / (monitorFps * numParticles)   
        }
        else {
          frameCounter = 0
          seconds = 0
        }
        // changes in readings
        dCo2 = co2Ref.current - previousCo2
        dFilteredCo2 = co2AvgRef.current - prevFilteredCo2
        dPc0_5 = pcRef.current - previousPc0_5
        

        //  interpolate current radius toward target
        const lerpSpeed = 0.01; // lower = slower transition

        this.targetRadius = 20
        
        if(dFilteredCo2 >= 10) {
          this.targetRadius = 50
        }


        this.radius += (this.targetRadius - this.radius) * lerpSpeed;
        this.radius = Math.min(this.radius, 40)

        this.x += this.vx * speedMult;
        this.y += this.vy * speedMult;
        if (this.x <= 0 || this.x >= width) this.vx *= -1;
        if (this.y <= 0 || this.y >= height) this.vy *= -1;

      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        ctx.fillStyle = this.color;
        ctx.fill();
      }
    }

    function resolveCollision(p1, p2) {
      const xVelocityDiff = p1.vx - p2.vx;
      const yVelocityDiff = p1.vy - p2.vy;
      const xDist = p2.x - p1.x;
      const yDist = p2.y - p1.y;

      if (xVelocityDiff * xDist + yVelocityDiff * yDist >= 0) {
        const angle = -Math.atan2(p2.y - p1.y, p2.x - p1.x);

        const m1 = p1.mass;
        const m2 = p2.mass;

        const u1 = rotate({ x: p1.vx, y: p1.vy }, angle);
        const u2 = rotate({ x: p2.vx, y: p2.vy }, angle);

        const v1 = {
          x: (u1.x * (m1 - m2) + 2 * m2 * u2.x) / (m1 + m2),
          y: u1.y,
        };
        const v2 = {
          x: (u2.x * (m2 - m1) + 2 * m1 * u1.x) / (m1 + m2),
          y: u2.y,
        };

        const vFinal1 = rotate(v1, -angle);
        const vFinal2 = rotate(v2, -angle);

        p1.vx = vFinal1.x;
        p1.vy = vFinal1.y;
        p2.vx = vFinal2.x;
        p2.vy = vFinal2.y;
      }
    }

    function rotate(velocity, angle) {
      return {
        x: velocity.x * Math.cos(angle) - velocity.y * Math.sin(angle),
        y: velocity.x * Math.sin(angle) + velocity.y * Math.cos(angle),
      };
    }

    const particles = Array.from({ length: numParticles }, () => new Particle());
    const ripples = [];

    const animate = () => {
      ctx.fillStyle = "rgba(0, 0, 0, 1)";
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = "white";
      ctx.font = "16px monospace";
      ctx.textAlign = "left";

      const co2AvgText = `CO2Avg: ${co2AvgRef.current.toFixed(1)} ppm`;
      const co2Text = `CO2: ${co2Ref.current.toFixed(1)} ppm`;
      const pressureText = `Pressure: ${pressureRef.current.toFixed(1)} Pa`;
      const tempText = `Temp: ${tempRef.current.toFixed(1)} °C`
      const pmText = `PM0.5: ${pcRef.current.toFixed(2)} µg/m³`;
      const humidText = `Humidity: ${humidRef.current.toFixed(5)} %`;
      const dCo2Text = `dCo2: ${dCo2.toFixed(1)}`;
      const dPcText = `dPc: ${dPc0_5.toFixed(1)}`;
      const dFilteredText = `dFCo2: ${dFilteredCo2.toFixed(1)}`;
      const dHumidityText = `dHumid: ${dHumidity.toFixed(1)}`;
      const secText = `${seconds}`
      const scrollText = `${showScroll}`

      ctx.fillText(co2Text, 10, 20);
      ctx.fillText(pressureText, 10, 40);
      ctx.fillText(tempText, 10, 60);
      ctx.fillText(pmText, 10, 80);
      ctx.fillText(humidText, 10, 100);
      ctx.fillText(co2AvgText, 10, 120);
      ctx.fillText(dCo2Text, 10, 140);
      ctx.fillText(dPcText, 10, 160);
      ctx.fillText(dFilteredText, 10, 180);
      ctx.fillText(dHumidityText, 10, 200);
      ctx.fillText(secText, 10, 220);
      ctx.fillText(scrollText, 10, 240)

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const p1 = particles[i];
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < p1.radius + p2.radius) {
            resolveCollision(p1, p2);
          }
        }
      }

      for (const p of particles) {
        p.update();
        p.draw();
      }

      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, 2 * Math.PI);
        ctx.strokeStyle = `rgba(255, 255, 255, ${r.alpha})`;
        ctx.lineWidth = 2;
        ctx.stroke();

        r.radius += 5;
        r.alpha -= 0.01;

        for (const p of particles) {
          const dx = p.x - r.x;
          const dy = p.y - r.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < r.radius + 20 && dist > r.radius - 20) {
            const force = 0.5;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            p.applyForce(fx, fy);
          }
        }

        if (r.alpha <= 0) {
          ripples.splice(i, 1);
        }
      }

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  function hexToRgb(hex) {
    hex = hex.replace(/^#/, "");
    const bigint = parseInt(hex, 16);
    return {
      r: (bigint >> 16) & 255,
      g: (bigint >> 8) & 255,
      b: bigint & 255,
    };
  }
  
  function rgbToHex({ r, g, b }) {
    return (
      "#" +
      [r, g, b]
        .map((x) => {
          const hex = x.toString(16);
          return hex.length === 1 ? "0" + hex : hex;
        })
        .join("")
    );
  }
  
  function lerpHex(hex1, hex2, t) {
    const rgb1 = hexToRgb(hex1);
    const rgb2 = hexToRgb(hex2);
    const lerped = {
      r: Math.round(rgb1.r + (rgb2.r - rgb1.r) * t),
      g: Math.round(rgb1.g + (rgb2.g - rgb1.g) * t),
      b: Math.round(rgb1.b + (rgb2.b - rgb1.b) * t),
    };
    return rgbToHex(lerped);
  }
  

return (
  <>
    <div
      style={{
        zIndex: 0,
        overflow: 'hidden',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 1,
        }}
      />
    </div>

    {seconds >= 3 && (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)", // safari support
          zIndex: 1000, // above canvas, below scroll text
          pointerEvents: "none",
        }}
      />
    )}
      {setShowScroll && <ScrollList/>}
  </>
);

}
