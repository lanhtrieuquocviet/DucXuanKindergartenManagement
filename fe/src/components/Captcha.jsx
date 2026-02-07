import { useEffect, useRef, useState } from "react";

function randomText(length = 5) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join("");
}

export default function Captcha({ onValidate }) {
  const canvasRef = useRef(null);
  const [captcha, setCaptcha] = useState("");
  const [input, setInput] = useState("");

  const generateCaptcha = () => {
    const text = randomText();
    setCaptcha(text);
    drawCaptcha(text);
    setInput("");
    onValidate?.(false);
  };

  const drawCaptcha = (text) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#f3f4f6";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = "24px monospace";
    ctx.fillStyle = "#111827";

    [...text].forEach((char, i) => {
      const x = 15 + i * 22;
      const y = 30 + Math.random() * 5;
      const angle = (Math.random() - 0.5) * 0.4;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.fillText(char, 0, 0);
      ctx.restore();
    });

    // Nhiễu
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * 120, Math.random() * 40);
      ctx.lineTo(Math.random() * 120, Math.random() * 40);
      ctx.strokeStyle = "#9ca3af";
      ctx.stroke();
    }
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  useEffect(() => {
    onValidate?.(input.trim().toUpperCase() === captcha);
  }, [input, captcha, onValidate]);

  return (
    <div className="flex items-center gap-3">
      <canvas
        ref={canvasRef}
        width={120}
        height={40}
        className="border rounded bg-gray-100"
      />

      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Mã bảo mật"
        className="border rounded px-3 py-2 w-32 focus:ring-2 focus:ring-blue-400 outline-none"
      />

      <button
        type="button"
        onClick={generateCaptcha}
        className="text-sm text-blue-600 hover:underline"
      >
        Đổi mã
      </button>
    </div>
  );
}
