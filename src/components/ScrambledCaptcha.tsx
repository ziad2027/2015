import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { RotateCcw, Sparkles } from 'lucide-react';

export interface ScrambledCaptchaRef {
  validate: (input: string) => boolean;
  refresh: () => void;
  getCode: () => string;
}

interface ScrambledCaptchaProps {
  onCodeChange?: (code: string) => void;
}

export const ScrambledCaptcha = forwardRef<ScrambledCaptchaRef, ScrambledCaptchaProps>(
  ({ onCodeChange }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [currentCode, setCurrentCode] = useState<string>('');

    // Generate random 4-5 digits
    const generateRandomCode = (): string => {
      // 4 to 5 digit number
      const num = Math.floor(1000 + Math.random() * 9000).toString();
      return num;
    };

    // Draw scrambled numbers with noise, angle rotation, disturbance lines
    const drawCaptcha = (code: string) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;

      // Clear & Background gradient
      ctx.clearRect(0, 0, width, height);
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, '#fef2f2'); // light red
      bgGrad.addColorStop(1, '#fff7ed'); // light orange
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Random background dots / noise
      for (let i = 0; i < 60; i++) {
        ctx.fillStyle = `rgba(${Math.floor(Math.random() * 200)}, ${Math.floor(
          Math.random() * 50
        )}, ${Math.floor(Math.random() * 50)}, ${Math.random() * 0.4 + 0.1})`;
        ctx.beginPath();
        ctx.arc(
          Math.random() * width,
          Math.random() * height,
          Math.random() * 2.5 + 0.5,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }

      // Wavy disturbance lines across canvas (الخطوط المخربشة)
      for (let i = 0; i < 4; i++) {
        ctx.strokeStyle = `rgba(${180 + Math.random() * 70}, ${Math.random() * 80}, ${
          Math.random() * 80
        }, 0.6)`;
        ctx.lineWidth = Math.random() * 2 + 1;
        ctx.beginPath();
        ctx.moveTo(Math.random() * 20, Math.random() * height);
        ctx.bezierCurveTo(
          width * 0.3,
          Math.random() * height,
          width * 0.7,
          Math.random() * height,
          width - Math.random() * 20,
          Math.random() * height
        );
        ctx.stroke();
      }

      // Draw each digit distorted & scrambled
      const digits = code.split('');
      const charWidth = width / (digits.length + 1);

      digits.forEach((digit, idx) => {
        ctx.save();

        const x = (idx + 1) * charWidth - 10 + (Math.random() * 8 - 4);
        const y = height / 2 + (Math.random() * 8 - 4);

        // Move to character position
        ctx.translate(x, y);

        // Random rotation angle between -25deg and +25deg
        const angle = ((Math.random() * 50 - 25) * Math.PI) / 180;
        ctx.rotate(angle);

        // Font styling
        const fonts = ['Cairo', 'Arial', 'Impact', 'Trebuchet MS', 'Verdana'];
        const fontName = fonts[Math.floor(Math.random() * fonts.length)];
        const fontSize = Math.floor(Math.random() * 8 + 26);
        ctx.font = `bold ${fontSize}px ${fontName}, sans-serif`;

        // Color
        const colors = ['#dc2626', '#b91c1c', '#991b1b', '#c2410c', '#475569'];
        ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];

        // Text shadow
        ctx.shadowColor = 'rgba(0,0,0,0.2)';
        ctx.shadowBlur = 3;
        ctx.shadowOffsetX = Math.random() * 2 - 1;
        ctx.shadowOffsetY = Math.random() * 2 - 1;

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(digit, 0, 0);

        ctx.restore();
      });

      // Crossing strike-through line
      ctx.strokeStyle = 'rgba(220, 38, 38, 0.45)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(10, height / 2 + Math.random() * 10 - 5);
      ctx.lineTo(width - 10, height / 2 + Math.random() * 10 - 5);
      ctx.stroke();
    };

    const refreshCode = () => {
      const code = generateRandomCode();
      setCurrentCode(code);
      drawCaptcha(code);
      if (onCodeChange) onCodeChange(code);
    };

    useEffect(() => {
      refreshCode();
    }, []);

    useImperativeHandle(ref, () => ({
      validate: (input: string) => {
        return input.trim() === currentCode.trim();
      },
      refresh: () => {
        refreshCode();
      },
      getCode: () => currentCode,
    }));

    return (
      <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-200">
        <div className="relative rounded-lg overflow-hidden border border-red-200 shadow-inner bg-white shrink-0">
          <canvas
            ref={canvasRef}
            width={170}
            height={52}
            className="block select-none"
            title="الأرقام المخربشة لتأكيد الأمان"
          />
        </div>

        <button
          type="button"
          onClick={refreshCode}
          className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-red-600 transition-colors flex items-center gap-1 text-xs font-bold"
          title="تغيير الأرقام المخربشة"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="hidden sm:inline">أرقام جديدة</span>
        </button>
      </div>
    );
  }
);
