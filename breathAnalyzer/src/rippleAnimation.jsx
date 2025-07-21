import { useRef, useEffect, useState } from "react";
import ScrollList from "./components/listScroll";
import PranaReading from "./components/pranaReading";

export default function RippleParticles() {
  const co2Ref = useRef(0);
  const co2AvgRef = useRef(0);
  const humidRef = useRef(0);
  const tempRef = useRef(0);
  const canvasRef = useRef(null);
  
  const previousCo2Ref = useRef(0);
  const prevFilteredCo2Ref = useRef(0);
  const previousHumidityRef = useRef(0);
  const dFilteredCo2Ref = useRef(0);
  const dHumidityRef = useRef(0);
  const dCo2Ref = useRef(0);
  
  const numParticles = 35;
  const co2Threshold = 8;
  const timeElapsed = 6;

  const [showScroll, setShowScroll] = useState(false);
  const [showBlur, setShowBlur] = useState(false);
  const [showPranaReading, setShowPranaReading] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [maxdFco2, setMaxdFco2] = useState(0);
  const [lockedMaxdFco2, setLockedMaxdFco2] = useState(0);
  const [lockedCo2Threshold, setLockedCo2Threshold] = useState(co2Threshold);
  const maxdFco2Ref = useRef(0);
  
  const isActiveRef = useRef(false);
  
  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  // handle pressing space bar and starting timer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === "Space" && !isActive && countdown === 0) {
        let t = 3;
        setCountdown(t);
        const interval = setInterval(() => {
          t -= 1;
          setCountdown(t);
          if (t <= 0) {
            clearInterval(interval);
            setIsActive(true);
          }
        }, 1000);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isActive, countdown]);

  useEffect(() => {
    if (showScroll) {
      const timer = setTimeout(() => {
        // Lock the data when PranaReading becomes visible
        setLockedMaxdFco2(maxdFco2Ref.current);
        setLockedCo2Threshold(co2Threshold);
        setShowPranaReading(true);
      }, (timeElapsed + 1) * 1000); 

      return () => clearTimeout(timer);
    } else {
      setShowPranaReading(false);
    }
  }, [showScroll, timeElapsed]);

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
        if (isActiveRef.current) {
          previousCo2Ref.current = co2Ref.current;
          prevFilteredCo2Ref.current = co2AvgRef.current;
          previousHumidityRef.current = humidRef.current;
          
          setTimeout(sleep, 100);
        }
        
        co2Ref.current = payload.co2Latest ?? 0;
        co2AvgRef.current = payload.co2Filtered ?? 0;
        tempRef.current = payload.temperature ?? 0;
        humidRef.current = payload.humidity ?? 0;
      }
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
        if (isActiveRef.current) {
          dCo2Ref.current = co2Ref.current - previousCo2Ref.current;
          dFilteredCo2Ref.current = co2AvgRef.current - prevFilteredCo2Ref.current;
          dHumidityRef.current = humidRef.current - previousHumidityRef.current;

          if (dFilteredCo2Ref.current > maxdFco2Ref.current && dFilteredCo2Ref.current < 50) {
            maxdFco2Ref.current = dFilteredCo2Ref.current;
            setMaxdFco2(dFilteredCo2Ref.current);
          }

          this.targetRadius = 20;
          if (dFilteredCo2Ref.current >= co2Threshold) {
            this.targetRadius = 50;
          }
        } else {
          this.targetRadius = 20;
        }

        const lerpSpeed = 0.01;
        this.radius += (this.targetRadius - this.radius) * lerpSpeed;
        this.radius = Math.min(this.radius, 40);

        const speedMult = isActiveRef.current ? 0.5 + co2Ref.current / 100 : 0.5;
        this.x += this.vx * speedMult;
        this.y += this.vy * speedMult;

        if (this.x <= 0 + this.radius || this.x >= width - this.radius) this.vx *= -1;
        if (this.y <= 0 + this.radius || this.y >= height - this.radius) this.vy *= -1;
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
    let activeStartTime = null;

    const animate = () => {
      ctx.fillStyle = "rgba(65, 170, 245, 1)";
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = "white";
      ctx.font = "16px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`prev: ${prevFilteredCo2Ref.current.toFixed(1)}`, 10, 80);
      ctx.fillText(`curr: ${co2Ref.current.toFixed(1)}`, 10, 100);
      ctx.fillText(`maxFCo2: ${maxdFco2Ref.current.toFixed(1)}`, 10, 120);

      const now = Date.now();

      if (isActiveRef.current && !activeStartTime) {
        activeStartTime = now;
      }

      // Show blur 1 second before scroll appears
      if (isActiveRef.current && activeStartTime) {
        const elapsed = (now - activeStartTime) / 1000;
        if (elapsed >= timeElapsed - 1 && !showBlur) {
          setShowBlur(true);
        }
        if (elapsed >= timeElapsed && !showScroll) {
          setShowScroll(true);
        }
      }

      // Reset timing when not active
      if (!isActiveRef.current) {
        activeStartTime = null;
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

      {!isActive && countdown > 0 && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            fontSize: "4rem",
            color: "white",
            zIndex: 9999,
            pointerEvents: "none",
            userSelect: "none",
            fontWeight: "bold",
          }}
        >
          {countdown}
        </div>
      )}

      {showBlur && (
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
            animation: "blurFadeIn 1s ease-in-out",
          }}
        />
      )}

      {showScroll && <ScrollList />}
      
      {showPranaReading && (
        <div
          style={{
            animation: "fadeIn 1s ease-in-out",
          }}
        >
          <PranaReading maxdFCo2={lockedMaxdFco2} co2Threshold={lockedCo2Threshold} />
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes blurFadeIn {
          from {
            opacity: 0;
            backdropFilter: blur(0px);
            -webkit-backdrop-filter: blur(0px);
          }
          to {
            opacity: 1;
            backdropFilter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
          }
        }
      `}</style>
    </>
  );
}