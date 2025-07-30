import React, { useRef, useEffect, useState } from "react";

function hexToRgba(hex) {
  let c = hex.replace("#", "");
  if (c.length === 3) c = c[0]+c[0]+c[1]+c[1]+c[2]+c[2];
  const num = parseInt(c, 16);
  return [num >> 16, (num >> 8) & 255, num & 255, 255];
}

function colorMatch(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
}

function floodFill(ctx, x, y, fillColor) {
  const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
  const data = imageData.data;
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;
  const stack = [[x, y]];
  const targetColor = [
    data[(y * width + x) * 4],
    data[(y * width + x) * 4 + 1],
    data[(y * width + x) * 4 + 2],
    data[(y * width + x) * 4 + 3],
  ];
  if (colorMatch(targetColor, fillColor)) return;

  while (stack.length) {
    const [cx, cy] = stack.pop();
    const idx = (cy * width + cx) * 4;
    const currentColor = [
      data[idx], data[idx + 1], data[idx + 2], data[idx + 3]
    ];
    if (!colorMatch(currentColor, targetColor)) continue;
    data[idx] = fillColor[0];
    data[idx + 1] = fillColor[1];
    data[idx + 2] = fillColor[2];
    data[idx + 3] = fillColor[3];

    if (cx > 0) stack.push([cx - 1, cy]);
    if (cx < width - 1) stack.push([cx + 1, cy]);
    if (cy > 0) stack.push([cx, cy - 1]);
    if (cy < height - 1) stack.push([cx, cy + 1]);
  }
  ctx.putImageData(imageData, 0, 0);
}

export default function SimpleCanvas() {
  const canvasRef = useRef(null);
  const [color, setColor] = useState("#ff0000");
  const [tool, setTool] = useState("pencil");

  useEffect(() => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, 500, 500);
  }, []);

  const handleMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.floor(e.clientX - rect.left);
    const y = Math.floor(e.clientY - rect.top);
    const ctx = canvasRef.current.getContext("2d");
    if (tool === "bucket") {
      floodFill(ctx, x, y, hexToRgba(color));
    } else {
      ctx.strokeStyle = color;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x, y);
      const move = (ev) => {
        const nx = Math.floor(ev.clientX - rect.left);
        const ny = Math.floor(ev.clientY - rect.top);
        ctx.lineTo(nx, ny);
        ctx.stroke();
      };
      const up = () => {
        window.removeEventListener("mousemove", move);
        window.removeEventListener("mouseup", up);
      };
      window.addEventListener("mousemove", move);
      window.addEventListener("mouseup", up);
    }
  };

  return (
    <div>
      <div style={{marginBottom: 8}}>
        <button onClick={() => setTool("pencil")}>Pencil</button>
        <button onClick={() => setTool("bucket")}>Bucket</button>
        <input type="color" value={color} onChange={e => setColor(e.target.value)} />
      </div>
      <canvas
        ref={canvasRef}
        width={500}
        height={500}
        style={{border: "1px solid #ccc", background: "#fff"}}
        onMouseDown={handleMouseDown}
      />
    </div>
  );
}