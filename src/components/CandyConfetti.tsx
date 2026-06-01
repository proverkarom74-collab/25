import React, { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  shape: "circle" | "pill" | "star" | "wrapper";
  angle: number;
  spin: number;
  gravity: number;
  alpha: number;
  fadeSpeed: number;
}

interface CandyConfettiProps {
  trigger: number;
}

export function CandyConfetti({ trigger }: CandyConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (trigger === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];

    // Resize canvas to cover container
    const resizeCanvas = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        canvas.width = rect.width;
        canvas.height = rect.height || 400;
      }
    };
    resizeCanvas();

    // Sweet candy color palette
    const colors = [
      "#ff5e7e", // Strawberry pink
      "#ffcd3c", // Lemon yellow
      "#3cd6ff", // Sky blue mint
      "#a25eff", // Grape purple
      "#48f58b", // Lime green
      "#ff8e3c", // Orange cream
    ];

    const shapes: ("circle" | "pill" | "star" | "wrapper")[] = [
      "circle",
      "pill",
      "star",
      "wrapper",
    ];

    // Spawn burst from middle-bottom or hover area
    const spawnX = canvas.width / 2;
    const spawnY = canvas.height / 3; // burst near top/middle downwards

    for (let i = 0; i < 75; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 8;
      particles.push({
        x: spawnX,
        y: spawnY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1, // push slightly upwards
        size: 5 + Math.random() * 10,
        color: colors[Math.floor(Math.random() * colors.length)],
        shape: shapes[Math.floor(Math.random() * shapes.length)],
        angle: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.2,
        gravity: 0.18 + Math.random() * 0.15,
        alpha: 1.0,
        fadeSpeed: 0.008 + Math.random() * 0.008,
      });
    }

    const drawStar = (c: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number) => {
      let rot = (Math.PI / 2) * 3;
      let x = cx;
      let y = cy;
      const step = Math.PI / spikes;

      c.stroke();
      c.beginPath();
      c.moveTo(cx, cy - outerRadius);
      for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        c.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        c.lineTo(x, y);
        rot += step;
      }
      c.lineTo(cx, cy - outerRadius);
      c.closePath();
      c.fill();
    };

    const updateAndRender = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, index) => {
        // Physics update
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.vx *= 0.98; // air resistance
        p.angle += p.spin;
        p.alpha -= p.fadeSpeed;

        if (p.alpha <= 0) {
          return;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);

        // Draw custom candy wrapper, sweet, or starry shapes
        if (p.shape === "circle") {
          // Circular drop candy
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
          // Shiny white highlight
          ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
          ctx.beginPath();
          ctx.arc(-p.size / 5, -p.size / 5, p.size / 6, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === "pill") {
          // Jelly bean shape
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size / 1.5, p.size / 2.5, 0, 0, Math.PI * 2);
          ctx.fill();
          // Shiny gloss
          ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
          ctx.beginPath();
          ctx.ellipse(-p.size / 4, -p.size / 8, p.size / 4, p.size / 10, Math.PI / 4, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === "star") {
          // Starry sprinkles
          drawStar(ctx, 0, 0, 5, p.size / 1.2, p.size / 2.4);
        } else {
          // Wrapper candy tied on both sides
          ctx.beginPath();
          // Bowtie ends
          ctx.moveTo(-p.size / 1.2, -p.size / 3);
          ctx.lineTo(-p.size / 1.2, p.size / 3);
          ctx.lineTo(-p.size / 3, 0);
          ctx.closePath();
          ctx.fill();

          ctx.beginPath();
          ctx.moveTo(p.size / 1.2, -p.size / 3);
          ctx.lineTo(p.size / 1.2, p.size / 3);
          ctx.lineTo(p.size / 3, 0);
          ctx.closePath();
          ctx.fill();

          // Core oval sweet
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 3, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      });

      // Filter out dead particles
      particles = particles.filter(p => p.alpha > 0);

      if (particles.length > 0) {
        animationFrameId = requestAnimationFrame(updateAndRender);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    updateAndRender();

    window.addEventListener("resize", resizeCanvas);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [trigger]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-30"
      style={{ mixBlendMode: "screen" }}
    />
  );
}
