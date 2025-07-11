const ParticleCircle = ({ value = 1 }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    let animationFrameId;

    const drawParticles = (radius, count) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      for (let i = 0; i < count; i++) {
        const angle = (i / count) * 2 * Math.PI;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0, 200, 255, 0.8)";
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0, 255, 200, 0.2)";
      ctx.shadowBlur = 40;
      ctx.shadowColor = "cyan";
      ctx.fill();
      ctx.shadowBlur = 0; 
    };

    const animate = () => {
      const radius = value * 2;
      const particleCount = Math.floor(value * 1.2);
      drawParticles(radius, particleCount);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resize);
    };
  }, [value]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: "block",
        position: "absolute",
        top: 0,
        left: 0,
        backgroundColor: "#0f0f1f",
        zIndex: -1,
      }}
    />
  );
};

export default ParticleCircle;