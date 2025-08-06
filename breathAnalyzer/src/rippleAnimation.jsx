import { useRef, useEffect, useState } from "react";
import PranaReading from "./components/pranaReading";

function LoadingAnimation(){
  return(
    <div style = {{textAlign: "center", color: 'white'}}>
      <div
      style = {{
      width: '60px',
      height: '60px',
      border: '4px solid rgba(255, 255, 255, 0.3)',
      borderTop: '4px solid white',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      margin: '0 auto 20px auto',
      }}
    />
      <div style = {{fontSize: '18px', fontWeight: 'bold'}}>
        Analyzing Breath...
      </div>
    </div>
  );
}


export default function RippleParticles() {
  const co2Ref = useRef(0);
  const co2AvgRef = useRef(0);
  const humidRef = useRef(0);
  const tempRef = useRef(0);
  const canvasRef = useRef(null);

  const activationTimeRef = useRef(0)
  const stabilizationPeriod = 2000;
  
  const previousCo2Ref = useRef(0);
  const prevFilteredCo2Ref = useRef(0);
  const previousHumidityRef = useRef(0);
  const dFilteredCo2Ref = useRef(0);
  const dHumidityRef = useRef(0);
  const dCo2Ref = useRef(0);
  const [maxCo2, setMaxCo2] = useState(0);
  
  const numParticles = 20;
  const co2Threshold = 8;
  const timeElapsed = 6;

  const [pranaIndex, setPranaIndex] = useState(0);  //default 0, but should change between 0-4
  const [showLoading, setShowLoading] = useState(false);
  const [showBlur, setShowBlur] = useState(false);
  const [showPranaReading, setShowPranaReading] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [mode, setMode] = useState('idle');
  const [maxdFco2, setMaxdFco2] = useState(0);
  const [lockedMaxdFco2, setLockedMaxdFco2] = useState(0);
  const [lockedCo2Threshold, setLockedCo2Threshold] = useState(co2Threshold);
  const ambientCo2Ref = useRef(null);
  const maxdFco2Ref = useRef(0);
  
  const isActiveRef = useRef(false);
  const wsRef = useRef(null);  

  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  useEffect(() => {
    if (mode !== 'countdown') return;
  
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 1) {
          clearInterval(timer);
          setIsActive(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  
    return () => clearInterval(timer);
  }, [mode]);

  // handle pressing space bar and starting timer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === "Space") {
        e.preventDefault();

        if(mode === 'idle'){
          //start the countdown
          setCountdown(3);
          setMode('countdown');
          activationTimeRef.current = 0;
          dFilteredCo2Ref.current = 0;
          dCo2Ref.current = 0;
          dHumidityRef.current = 0;
          ambientCo2Ref.current=co2AvgRef.current;
        } else if (mode === 'overlay'){
          //reset everything
          setMode('idle');
          setCountdown(3);
          setMaxCo2(0)
          setIsActive(false);
          setShowPranaReading(false);
          setShowLoading(false);
          setShowBlur(false);
          setMaxdFco2(0);
          ambientCo2Ref.current = null;
          maxdFco2Ref.current = 0;
          activationTimeRef.current = 0;
        };
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mode]);

  useEffect(() => {
    if (maxdFco2 > co2Threshold + 15) {
      setPranaIndex(0);
    } else if (maxdFco2 > co2Threshold + 11) {
      setPranaIndex(1);
    } else if (maxdFco2 > co2Threshold + 7) {
      setPranaIndex(2);
    } else if (maxdFco2 > co2Threshold + 3) {
      setPranaIndex(3);
    } else {
      setPranaIndex(4);
    }
  }, [maxdFco2, co2Threshold]);

  useEffect(() => {
    if (showLoading) {
      if(wsRef.current && wsRef.current.readyState === WebSocket.OPEN){
        wsRef.current.send(JSON.stringify({ action: 'run-script' }));
      }

      const timer = setTimeout(() => {
        // lock data when PranaReading becomes visible
        setLockedMaxdFco2(maxdFco2Ref.current);
        setLockedCo2Threshold(co2Threshold);
        setShowPranaReading(true);
        setMode('overlay');
        setIsActive(false);
        setShowLoading(false)
      }, (timeElapsed + 1) * 1000); 

      return () => clearTimeout(timer);
    } 
  }, [showLoading, timeElapsed]);

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
    wsRef.current = ws; 

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
          if (activationTimeRef.current === 0){
            activationTimeRef.current = Date.now();
            previousCo2Ref.current = payload.co2Latest ?? 0;
            prevFilteredCo2Ref.current = payload.co2Filtered ?? 0;
            previousHumidityRef.current = payload.humidity ?? 0;
          }
          const timeSinceActivation = Date.now() - activationTimeRef.current;

          if(timeSinceActivation > stabilizationPeriod){
            previousCo2Ref.current = co2Ref.current;
            prevFilteredCo2Ref.current = co2AvgRef.current;
            previousHumidityRef.current = humidRef.current;
          }
          
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
        this.gravity = 0.3;
        this.damping = .98;
      }

      update() {
        if (isActiveRef.current) {
          const timeSinceActivation = Date.now()- activationTimeRef.current;

          if(timeSinceActivation > stabilizationPeriod){
            dCo2Ref.current = co2Ref.current - previousCo2Ref.current;
            dFilteredCo2Ref.current = co2AvgRef.current - prevFilteredCo2Ref.current;
            dHumidityRef.current = humidRef.current - previousHumidityRef.current;
          }

          if (co2AvgRef.current > maxCo2) {
            setMaxCo2(co2AvgRef.current);
          }

          if (dFilteredCo2Ref.current > maxdFco2Ref.current && dFilteredCo2Ref.current < 50) {
            maxdFco2Ref.current = dFilteredCo2Ref.current;
            setMaxdFco2(dFilteredCo2Ref.current);
          }

          this.targetRadius = 20;
          if (dFilteredCo2Ref.current >= co2Threshold) {
            this.targetRadius = 35;
            this.vx += (Math.random() - 0.5) * 3;
            this.vy += (Math.random() - 0.5) * -4;
          }
        } else {
          this.targetRadius = 20;
          activationTimeRef.current = 0; //reset activation timer
        }

        this.vy += this.gravity;
        this.vx *= this.damping;
        this.vy *= this.damping;

        const lerpSpeed = 0.01;
        this.radius += (this.targetRadius - this.radius) * lerpSpeed;
        this.radius = Math.min(this.radius, 40);

        const speedMult = isActiveRef.current ? 0.3 + co2Ref.current / 200 : 0.3;
        this.x += this.vx * speedMult;
        this.y += this.vy * speedMult;

        if (this.x <= this.radius) {
          this.x = this.radius
          this.vx *= -0.7;
        }
        if (this.x >= width - this.radius){
          this.x = width - this.radius
          this.vx *= -0.7
        }
        if (this.y <= this.radius){
          this.y = this.radius;
          this.vy *= -0.6;
        }
        if (this.y >= height - this.radius){
          this.y = height - this.radius;
          this.vy *= -0.6
          this.vx += (Math.random() - 0.5) * 0.5;
        }
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
      let textY = 20

      if (ambientCo2Ref.current !== null) {
        ctx.fillText(`Initial CO2: ${ambientCo2Ref.current} ppm`, 10, 20);
        ctx.fillText(`Current CO2: ${co2AvgRef.current} ppm`, 10, 40)
      }
      else {
        ctx.fillText(`Ambient CO2: ${co2AvgRef.current} ppm`, 10, textY);
        textY += 20;
      }

      const now = Date.now();

      if (isActiveRef.current && !activeStartTime) {
        activeStartTime = now;
      }

      // show blur 1 second before scroll appears
      if (isActiveRef.current && activeStartTime) {
        const elapsed = (now - activeStartTime) / 1000;
        if (elapsed >= timeElapsed - 1 && !showBlur) {
          setShowBlur(true);
        }
        if (elapsed >= timeElapsed && !showLoading) {
          setShowLoading(true);
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

  useEffect(() => {
    if (showPranaReading) {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        const message = {
          action: 'run-prana-script',
          data: {
            maxCo2: maxCo2,
            pranaIndex: pranaIndex
          }
        };
        
        wsRef.current.send(JSON.stringify(message));
        console.log('Prana script service execution requested');
      } else {
        console.error('WebSocket not connected, cannot execute prana script');
      }
    }
  }, [showPranaReading, lockedMaxdFco2, lockedCo2Threshold]);

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

      {mode === 'countdown' && countdown > 0 && (
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
            transition: "opacity 0.3s ease",
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            zIndex: 1000,
            pointerEvents: "none",
            animation: "blurFadeIn 1s ease-in-out",
          }}
        />
      )}

      {showLoading && (
        <div
          style = {{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: showPranaReading ? 0 : 2000,
            animation: showPranaReading ? 'fadeOut 0.5s ease-in-out' : 'fadeIn 1s ease-in-out',
          }}
        >
            <LoadingAnimation/>
        </div>
      )}
      
      {showPranaReading && (
        <div
          style={{
            animation: "fadeIn 1s ease-in-out",
          }}
        >
          <PranaReading pranaIndex={pranaIndex} />
        </div>
      )}
      {mode === 'idle' && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            fontSize: "2rem",
            color: "white",
            zIndex: 9998,
            pointerEvents: "none",
            userSelect: "none",
            textAlign: "center",
            fontWeight: "bold",
          }}
        >
          Awaiting breath...
        </div>
      )}

      <style jsx>{`
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
    @keyframes fadeOut {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}
  
  @keyframes blurFadeIn {
    from {
      opacity: 0;
      backdropFilter: blur(0px);
      transform: scale(1.01);
    }
    to {
      opacity: 1;
      backdropFilter: blur(4px);
      transform: scale(1);
    }
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`}</style>
    </>
  );
}
