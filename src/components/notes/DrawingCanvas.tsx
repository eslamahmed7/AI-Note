import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Pen, Eraser, Trash2, Download, Minus, Plus, X, 
  RotateCcw, Circle, Square, Minus as LineIcon,
} from 'lucide-react';

interface DrawingCanvasProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (dataUrl: string) => void;
  language: string;
}

const STROKE_COLORS = [
  '#ffffff', '#000000', '#1a1a1a', '#ef4444', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#3b82f6', '#6366f1',
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f59e0b',
  '#10b981', '#a855f7', '#d946ef', '#0ea5e9', '#e11d48',
];

type DrawTool = 'pen' | 'eraser' | 'line' | 'rect' | 'circle';

export default function DrawingCanvas({ isOpen, onClose, onInsert, language }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<DrawTool>('pen');
  const [color, setColor] = useState('#ffffff');
  const [lineWidth, setLineWidth] = useState(3);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const snapshotRef = useRef<ImageData | null>(null);
  const isRTL = language === 'ar';

  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [isOpen]);

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: ((e as React.MouseEvent).clientX - rect.left) * scaleX,
      y: ((e as React.MouseEvent).clientY - rect.top) * scaleY,
    };
  };

  const startDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e, canvas);
    setIsDrawing(true);
    setStartPos(pos);
    snapshotRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }, []);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e, canvas);

    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (tool === 'pen') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    } else if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    } else {
      // Restore snapshot for shape preview
      if (snapshotRef.current) {
        ctx.putImageData(snapshotRef.current, 0, 0);
      }
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
      ctx.fillStyle = color + '40';
      ctx.beginPath();

      if (tool === 'line') {
        ctx.moveTo(startPos.x, startPos.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      } else if (tool === 'rect') {
        ctx.strokeRect(startPos.x, startPos.y, pos.x - startPos.x, pos.y - startPos.y);
        ctx.fillRect(startPos.x, startPos.y, pos.x - startPos.x, pos.y - startPos.y);
      } else if (tool === 'circle') {
        const rx = Math.abs(pos.x - startPos.x) / 2;
        const ry = Math.abs(pos.y - startPos.y) / 2;
        const cx = startPos.x + (pos.x - startPos.x) / 2;
        const cy = startPos.y + (pos.y - startPos.y) / 2;
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fill();
      }
    }
  }, [isDrawing, tool, color, lineWidth, startPos]);

  const stopDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(false);
    snapshotRef.current = null;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.globalCompositeOperation = 'source-over';
  }, []);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const handleInsert = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    onInsert(dataUrl);
    onClose();
  };

  if (!isOpen) return null;

  const tools: { id: DrawTool; icon: React.ReactNode; label: string }[] = [
    { id: 'pen', icon: <Pen className="w-4 h-4" />, label: isRTL ? 'قلم' : 'Pen' },
    { id: 'eraser', icon: <Eraser className="w-4 h-4" />, label: isRTL ? 'ممحاة' : 'Eraser' },
    { id: 'line', icon: <LineIcon className="w-4 h-4 rotate-45" />, label: isRTL ? 'خط' : 'Line' },
    { id: 'rect', icon: <Square className="w-4 h-4" />, label: isRTL ? 'مربع' : 'Rect' },
    { id: 'circle', icon: <Circle className="w-4 h-4" />, label: isRTL ? 'دائرة' : 'Circle' },
  ];

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div
        className="relative bg-neutral-900 border border-neutral-700/60 rounded-3xl shadow-[0_30px_100px_rgba(0,0,0,0.8)] overflow-hidden animate-scale-in flex flex-col"
        style={{ width: '800px', maxWidth: '95vw', height: '90vh', maxHeight: '700px' }}
        onClick={(e) => e.stopPropagation()}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800/60 bg-neutral-950/50 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-purple-600/20 rounded-lg flex items-center justify-center">
              <Pen className="w-4 h-4 text-purple-400" />
            </div>
            <span className="font-semibold text-sm text-neutral-200">
              {isRTL ? 'لوحة الرسم الحر' : 'Free Drawing Canvas'}
            </span>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-500 hover:text-neutral-300">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-neutral-800/60 bg-neutral-900/80 flex-shrink-0 flex-wrap">
          {/* Tools */}
          <div className="flex items-center gap-1 bg-neutral-800/50 p-1 rounded-xl">
            {tools.map((t) => (
              <button
                key={t.id}
                onClick={() => setTool(t.id)}
                className={`p-1.5 rounded-lg transition-all text-xs flex items-center gap-1 ${
                  tool === t.id
                    ? 'bg-primary-600 text-white'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700'
                }`}
                title={t.label}
              >
                {t.icon}
              </button>
            ))}
          </div>

          {/* Stroke width */}
          <div className="flex items-center gap-2 bg-neutral-800/50 px-3 py-1.5 rounded-xl">
            <button onClick={() => setLineWidth(Math.max(1, lineWidth - 1))} className="text-neutral-400 hover:text-neutral-200">
              <Minus className="w-3 h-3" />
            </button>
            <div
              className="rounded-full bg-current transition-all"
              style={{ width: `${lineWidth * 2}px`, height: `${lineWidth * 2}px`, color, minWidth: '4px', minHeight: '4px' }}
            />
            <span className="text-xs text-neutral-500 w-4 text-center">{lineWidth}</span>
            <button onClick={() => setLineWidth(Math.min(50, lineWidth + 1))} className="text-neutral-400 hover:text-neutral-200">
              <Plus className="w-3 h-3" />
            </button>
          </div>

          {/* Colors */}
          <div className="flex items-center gap-1 flex-wrap max-w-[250px]">
            {STROKE_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`rounded-full transition-all hover:scale-110 flex-shrink-0 ${
                  color === c ? 'ring-2 ring-white ring-offset-1 ring-offset-neutral-900 scale-110' : ''
                }`}
                style={{ width: '18px', height: '18px', backgroundColor: c, border: c === '#ffffff' ? '1px solid #555' : 'none' }}
              />
            ))}
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-5 h-5 rounded-full cursor-pointer border-0 bg-transparent"
              title={isRTL ? 'لون مخصص' : 'Custom color'}
            />
          </div>

          {/* Line width slider */}
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="1"
              max="50"
              value={lineWidth}
              onChange={(e) => setLineWidth(Number(e.target.value))}
              className="w-20 accent-primary-500"
            />
          </div>

          {/* Actions */}
          <div className="ms-auto flex items-center gap-1.5">
            <button onClick={clearCanvas} className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-neutral-800 rounded-lg transition-colors" title={isRTL ? 'مسح الكل' : 'Clear'}>
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={handleInsert}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 hover:bg-primary-500 text-white text-xs rounded-xl font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              {isRTL ? 'إدراج في الملاحظة' : 'Insert into Note'}
            </button>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-hidden bg-[#1a1a2e] relative">
          <canvas
            ref={canvasRef}
            width={1600}
            height={900}
            className="w-full h-full"
            style={{ cursor: tool === 'eraser' ? 'cell' : 'crosshair', touchAction: 'none' }}
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={stopDraw}
            onMouseLeave={stopDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={stopDraw}
          />
        </div>
      </div>
    </div>
  );
}
