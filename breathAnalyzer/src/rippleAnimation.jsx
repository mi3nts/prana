import { useRef, useEffect } from "react";

export default function RippleParticles() {
  const canvasRef = useRef(null);

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

    class Particle {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
        this.radius = 2 + Math.random() * 2;
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

    const particles = Array.from({ length: 300 }, () => new Particle());
    const ripples = [];

    const animate = () => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
      ctx.fillRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const p1 = particles[i];
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 20 && dist > 0.5) {
            const force = 0.02;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            p1.applyForce(fx, fy);
            p2.applyForce(-fx, -fy);
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

    document.addEventListener("keydown", () => {
      ripples.push({ x: width / 2, y: height / 2, radius: 0, alpha: 1 });
    });

    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="w-full h-full fixed top-0 left-0 z-[-1]" />;
}
