import { useRef, useEffect, useState } from "react";
import ScrollList from "./components/listScroll";

export default function RippleParticles() {
  const co2Ref = useRef(0);
  const co2AvgRef = useRef(0);
  // const pressureRef = useRef(0);
  // const pcRef = useRef(0);
  const humidRef = useRef(0);
  const tempRef = useRef(0);
  const canvasRef = useRef(null);
  const numParticles = 35;

  let previousCo2 = 0;
  let prevFilteredCo2 = 0;
  let previousHumidity = 0;
  let dFilteredCo2 = 0;
  let dHumidity = 0;
  let dCo2 = 0;
  let dPc0_5 = 0;

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
      const { topic, message } = JSON.parse(event.data);
      const payload = typeof message === "string" ? JSON.parse(message) : message;

      if (topic === "d83add7316a5/COZIR001Test") {
        previousCo2 = co2Ref.current;
        prevFilteredCo2 = co2AvgRef.current;
        previousHumidity = humidRef.current;
        setTimeout(sleep, 100);       // do NOT REMOVE THIS DONT EVEN CHANGE THE NUBMER
        co2Ref.current = payload.co2Latest ?? 0;
        co2AvgRef.current = payload.co2Filtered ?? 0;
        tempRef.current = payload.temperature ?? 0;
        humidRef.current = payload.humidity ?? 0;
      }

      // if (topic === "d83add7316a5/BME280Test") {
      //   pressureRef.current = (payload.pressure ?? 0) / 100;
      // }

      // if (topic === "d83add7316a5/IPS7100Test") {
      //   previousPc0_5 = pcRef.current;
      //   setTimeout(sleep, 100);
      //   pcRef.current = parseFloat(payload.pc0_5 ?? 0);
      // }
    };

    function sleep() {
      console.log("sleep 100 ms");
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
        this.color = "#FFFFFF";
      }

      update() {
        dCo2 = co2Ref.current - previousCo2;
        dFilteredCo2 = co2AvgRef.current - prevFilteredCo2;
        //dPc0_5 = pcRef.current - previousPc0_5;
        dHumidity = humidRef.current - previousHumidity;

        this.targetRadius = 20;
        if (dFilteredCo2 >= 8) {
          this.targetRadius = 50;
        }

        const lerpSpeed = 0.01;
        this.radius += (this.targetRadius - this.radius) * lerpSpeed;
        this.radius = Math.min(this.radius, 40);

        const speedMult = 0.5 + co2Ref.current / 100;
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
    let elevatedStartTime = null;

    const animate = () => {
      ctx.fillStyle = "rgba(65, 170, 245, 1)";
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = "white";
      ctx.font = "16px monospace";
      ctx.textAlign = "left";

      ctx.fillText(`CO2: ${co2Ref.current.toFixed(1)} ppm`, 10, 20);
      // ctx.fillText(`Pressure: ${pressureRef.current.toFixed(1)} Pa`, 10, 40);
      ctx.fillText(`Temp: ${tempRef.current.toFixed(1)} °C`, 10, 40);
      // ctx.fillText(`PC0.5: ${pcRef.current.toFixed(2)} µg/m³`, 10, 80);
      ctx.fillText(`Humidity: ${humidRef.current.toFixed(1)} %`, 10, 60);
      ctx.fillText(`CO2Avg: ${co2AvgRef.current.toFixed(1)} ppm`, 10, 80);
      ctx.fillText(`dCo2: ${dCo2.toFixed(1)}`, 10, 100);
      // ctx.fillText(`dPc: ${dPc0_5.toFixed(1)}`, 10, 160);
      ctx.fillText(`dFCo2: ${dFilteredCo2.toFixed(1)}`, 10, 120);

      // Track elevated condition
      const now = Date.now();
      const isElevated = dFilteredCo2 >= 10;

      if (isElevated) {
        if (!elevatedStartTime) elevatedStartTime = now;
        const elapsed = (now - elevatedStartTime) / 1000;
        if (elapsed >= 5 && !showScroll) {
          setShowScroll(true);
        }
      } else {
        elevatedStartTime = null;
        if (showScroll) setShowScroll(false);
      }

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

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <>
      <div style={{ zIndex: 0, overflow: "hidden" }}>
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

      {showScroll && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            zIndex: 1000,
            pointerEvents: "none",
          }}
        />
      )}

      {showScroll && <ScrollList />}
    </>
  );
}
