import React, { useEffect, useRef } from "react";
import "./DustEffect.css";

interface DustEffectProps {
  onComplete: () => void;
}

const DustEffect: React.FC<DustEffectProps> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const touchCountRef = useRef<number>(0);
  const clearedAreaRef = useRef<number>(0);
  const maxSwipes = 3;
  const clearThreshold = 0.3;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let isDrawing = false;
    let animationFrameId: number;
    let fireworks: Firework[] = [];

    // 设置画布大小
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      drawDust();
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // 绘制初始灰尘层
    function drawDust() {
      ctx.fillStyle = "rgba(150, 150, 150, 0.8)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // 计算清除的面积占比
    const calculateClearedArea = () => {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const totalPixels = imageData.data.length / 4;
      let clearedPixels = 0;

      for (let i = 3; i < imageData.data.length; i += 4) {
        if (imageData.data[i] === 0) {
          clearedPixels++;
        }
      }
      clearedAreaRef.current = clearedPixels / totalPixels;
    };

    // 触摸开始
    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      isDrawing = true;
      touchCountRef.current += 1;

      const touch = e.touches[0];
      ctx.beginPath();
      ctx.moveTo(touch.clientX, touch.clientY);
      ctx.lineWidth = 40;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.globalCompositeOperation = "destination-out";
    };

    // 触摸移动
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (!isDrawing) return;

      const touch = e.touches[0];
      ctx.lineTo(touch.clientX, touch.clientY);
      ctx.stroke();
    };

    // 烟花粒子类
    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;
      life: number;
      maxLife: number;

      constructor(x: number, y: number, vx: number, vy: number, color: string) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.radius = Math.random() * 2 + 1;
        this.color = color;
        this.life = 0;
        this.maxLife = Math.random() * 30 + 30;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.02; // 重力
        this.life++;
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = 1 - this.life / this.maxLife;
        ctx.fill();
      }
    }

    // 烟花类
    class Firework {
      x: number;
      y: number;
      particles: Particle[];
      color: string;

      constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.color = `hsl(${Math.random() * 360}, 100%, 50%)`;
        this.particles = [];
        for (let i = 0; i < 30; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 5 + 2;
          this.particles.push(
            new Particle(
              x,
              y,
              Math.cos(angle) * speed,
              Math.sin(angle) * speed,
              this.color
            )
          );
        }
      }

      update() {
        this.particles = this.particles.filter((p) => p.life < p.maxLife);
        this.particles.forEach((p) => p.update());
      }

      draw(ctx: CanvasRenderingContext2D) {
        this.particles.forEach((p) => p.draw(ctx));
      }
    }

    // 检查是否是7月21日（上海时间）
    const isBirthday = () => {
      const shanghaiTime = new Date().toLocaleString("en-US", { timeZone: "Asia/Shanghai" });
      const date = new Date(shanghaiTime);
      return date.getMonth() === 6 && date.getDate() === 21; // 7月是6（0-based）
    };

    // 烟花动画
    const animateFireworks = () => {
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 随机添加烟花
      if (Math.random() < 0.1) {
        fireworks.push(
          new Firework(
            Math.random() * canvas.width,
            Math.random() * canvas.height * 0.5
          )
        );
      }

      fireworks.forEach((f) => {
        f.update();
        f.draw(ctx);
      });
      fireworks = fireworks.filter((f) => f.particles.length > 0);

      // 绘制生日快乐文字
      ctx.font = "bold 48px 'PingFang SC', -apple-system, sans-serif";
      ctx.fillStyle = "white";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.globalAlpha = 1;
      ctx.fillText("生日快乐！", canvas.width / 2, canvas.height / 2);

      animationFrameId = requestAnimationFrame(animateFireworks);
    };

    // 触摸结束
    const handleTouchEnd = () => {
      isDrawing = false;
      calculateClearedArea();

      if (touchCountRef.current >= maxSwipes || clearedAreaRef.current >= clearThreshold) {
        let opacity = 1;
        const fadeOut = () => {
          opacity -= 0.05;
          canvas.style.opacity = opacity.toString();
          if (opacity > 0) {
            animationFrameId = requestAnimationFrame(fadeOut);
          } else {
            canvas.style.display = "none";
            if (isBirthday()) {
              // 重置画布并开始烟花效果
              canvas.style.opacity = "1";
              canvas.style.display = "block";
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              animateFireworks();
              setTimeout(() => {
                cancelAnimationFrame(animationFrameId);
                canvas.style.display = "none";
                onComplete();
              }, 5000); // 烟花持续5秒
            } else {
              onComplete();
            }
          }
        };
        fadeOut();
      }
    };

    // 添加事件监听
    canvas.addEventListener("touchstart", handleTouchStart);
    canvas.addEventListener("touchmove", handleTouchMove);
    canvas.addEventListener("touchend", handleTouchEnd);

    // 清理
    return () => {
      window.removeEventListener("resize", resizeCanvas);
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("touchend", handleTouchEnd);
      cancelAnimationFrame(animationFrameId);
    };
  }, [onComplete]);

  return <canvas ref={canvasRef} className="dust-effect-canvas" />;
};

export default DustEffect;