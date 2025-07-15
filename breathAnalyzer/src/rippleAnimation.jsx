import { useRef, useEffect } from "react";

export default function RippleParticles() {
  const canvasRef = useRef(null);
  const co2Ref = useRef(null);
  const tempRef = useRef(null);
  const pmRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // WebSocket connection
    const ws = new WebSocket("ws://localhost:8765");

    ws.onopen = () => {
      console.log("🌐 WebSocket connected to MQTT bridge");
    };

    ws.onmessage = (event) => {
      try {
        const { topic, message } = JSON.parse(event.data);
        const parsed = typeof message === "string" ? JSON.parse(message) : message;

        if (topic === "d83add73168b/BME280Test") {
          tempRef.current = parsed.temperature?.toFixed(1);
        } else if (topic === "d83add731615/COZIR001Test") {
          co2Ref.current = parsed.co2Filtered;
        } else if (topic === "d83add7316a5/IPS7100Test") {
          pmRef.current = parseFloat(parsed.pm2_5)?.toFixed(1);
        }
      } catch (err) {
        console.error("❌ Error parsing message:", err);
      }
    };

    class Particle {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.radius = 25;
        this.mass = 4;
        this.color = `hsl(${Math.floor(Math.random() * 360)}, 100%, 60%)`;
      }

      applyForce(fx, fy) {
        this.vx += fx;
        this.vy += fy;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
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
          y: u1.y
        };
        const v2 = {
          x: (u2.x * (m2 - m1) + 2 * m1 * u1.x) / (m1 + m2),
          y: u2.y
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
        y: velocity.x * Math.sin(angle) + velocity.y * Math.cos(angle)
      };
    }

    const particles = Array.from({ length: 60 }, () => new Particle());
    const ripples = [];

    const animate = () => {
      ctx.fillStyle = "rgba(0, 0, 0, 1)";
      ctx.fillRect(0, 0, width, height);

      // Particle-particle collisions
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

      // Text overlay for sensor values
      ctx.fillStyle = "white";
      ctx.font = "16px monospace";
      ctx.fillText(`CO₂: ${co2Ref.current ?? "---"} ppm`, 20, 30);
      ctx.fillText(`Temp: ${tempRef.current ?? "---"} °C`, 20, 50);
      ctx.fillText(`PM2.5: ${pmRef.current ?? "---"} µg/m³`, 20, 70);

      requestAnimationFrame(animate);
    };

    document.addEventListener("keydown", () => {
      ripples.push({ x: width / 2, y: height / 2, radius: 0, alpha: 1 });
    });

    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      if (ws) ws.close();
    };
  }, []);

  return <canvas ref={canvasRef} className="w-full h-full fixed top-0 left-0 z-[-1]" />;
}
