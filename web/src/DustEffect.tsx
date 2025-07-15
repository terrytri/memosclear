import React, { useEffect, useRef } from "react";
import "./DustEffect.css";

interface DustEffectProps {
  onComplete: () => void;
}

const DustEffect: React.FC<DustEffectProps> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const touchCountRef = useRef<number>(0);
  const clearedAreaRef = useRef<number>(0); // 记录清除的面积占比
  const maxSwipes = 3; // 最大滑动次数
  const clearThreshold = 0.3; // 清除面积占比达到此值时触发完成

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let isDrawing = false;
    let animationFrameId: number;

    // 设置画布大小
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      drawDust(); // 调整大小时重新绘制灰尘
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // 绘制初始灰尘层
    function drawDust() {
      ctx.fillStyle = "rgba(150, 150, 150, 0.8)"; // 灰尘背景色
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // 计算清除的面积占比（粗略估计）
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
      ctx.lineWidth = 40; // 擦除区域的大小
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.globalCompositeOperation = "destination-out"; // 擦除模式
    };

    // 触摸移动
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (!isDrawing) return;

      const touch = e.touches[0];
      ctx.lineTo(touch.clientX, touch.clientY);
      ctx.stroke();
    };

    // 触摸结束
    const handleTouchEnd = () => {
      isDrawing = false;
      calculateClearedArea(); // 计算清除面积

      if (touchCountRef.current >= maxSwipes || clearedAreaRef.current >= clearThreshold) {
        // 淡出效果
        let opacity = 1;
        const fadeOut = () => {
          opacity -= 0.05;
          canvas.style.opacity = opacity.toString();
          if (opacity > 0) {
            animationFrameId = requestAnimationFrame(fadeOut);
          } else {
            canvas.style.display = "none";
            onComplete(); // 触发完成回调
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
