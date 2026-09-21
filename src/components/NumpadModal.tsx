import React, { useState, useEffect } from 'react';
import { NumpadTarget } from '../types';
import { Delete, Check, RotateCcw, X, Plus, Minus, Move, Hash, Equal } from 'lucide-react';
import { haptics } from '../utils/haptics';

interface NumpadModalProps {
  target: NumpadTarget | null;
  onClose: () => void;
  theme?: 'light' | 'dark';
}

/**
 * Safely evaluates simple math expressions (+, -, *, /) without eval()
 */
function evaluateSimpleMath(expr: string): number | null {
  try {
    const sanitized = expr.replace(/[^0-9+\-*/.]/g, '');
    if (!sanitized) return null;

    if (/^[0-9+\-*/. ]+$/.test(sanitized)) {
      const cleanExpr = sanitized.replace(/[+\-*/]+$/, '');
      if (!cleanExpr) return null;
      // eslint-disable-next-line no-new-func
      const result = Function(`'use strict'; return (${cleanExpr})`)();
      if (typeof result === 'number' && Number.isFinite(result)) {
        return result;
      }
    }
    return null;
  } catch {
    return null;
  }
}

const NumpadModalContent: React.FC<{
  target: NumpadTarget;
  onClose: () => void;
  theme: 'light' | 'dark';
}> = ({
  target,
  onClose,
  theme,
}) => {
  const [inputStr, setInputStr] = useState<string>(String(target.value));
  const [position, setPosition] = useState<{ x: number; y: number }>({
    x: Math.min(window.innerWidth - 320, Math.max(20, window.innerWidth / 2 - 140)),
    y: Math.min(window.innerHeight - 440, Math.max(60, window.innerHeight / 2 - 200)),
  });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    setInputStr(String(target.value));
  }, [target]);

  const handleDigit = (digit: string) => {
    haptics.trigger('light');
    if (inputStr === '0' && digit !== '.') {
      setInputStr(digit);
      return;
    }
    if (digit === '.' && inputStr.includes('.')) {
      return;
    }
    setInputStr((prev) => prev + digit);
  };

  const handleOperator = (op: string) => {
    haptics.trigger('light');
    setInputStr((prev) => {
      const trimmed = prev.trim();
      if (['+', '-', '*', '/'].includes(trimmed.slice(-1))) {
        return trimmed.slice(0, -1) + op;
      }
      return trimmed + op;
    });
  };

  const handleBackspace = () => {
    haptics.trigger('light');
    setInputStr((prev) => {
      if (prev.length <= 1) return '0';
      return prev.slice(0, -1);
    });
  };

  const handleClear = () => {
    haptics.trigger('light');
    setInputStr('0');
  };

  const handleToggleSign = () => {
    haptics.trigger('light');
    setInputStr((prev) => {
      if (prev === '0' || prev === '') return '0';
      if (prev.startsWith('-')) return prev.slice(1);
      return '-' + prev;
    });
  };

  const handleCalculate = () => {
    const computed = evaluateSimpleMath(inputStr);
    if (computed !== null) {
      haptics.trigger('medium');
      const rounded = Number(computed.toFixed(target.step < 0.01 ? 3 : target.step < 0.1 ? 2 : 1));
      setInputStr(String(rounded));
    }
  };

  const handleStep = (multiplier: number) => {
    haptics.trigger('light');
    const computed = evaluateSimpleMath(inputStr);
    const current = computed !== null ? computed : (parseFloat(inputStr) || 0);
    const next = current + target.step * multiplier;
    const clamped = Math.max(target.min, Math.min(target.max, next));
    const rounded = Number(clamped.toFixed(target.step < 0.01 ? 3 : target.step < 0.1 ? 2 : 1));
    setInputStr(String(rounded));
  };

  const handleConfirm = () => {
    haptics.trigger('medium');
    const computed = evaluateSimpleMath(inputStr);
    let val = computed !== null ? computed : parseFloat(inputStr);
    if (isNaN(val)) val = target.min;
    val = Math.max(target.min, Math.min(target.max, val));
    target.onConfirm(val);
    onClose();
  };

  const handlePointerDownHeader = (e: React.PointerEvent) => {
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const nextX = Math.max(10, Math.min(window.innerWidth - 280, e.clientX - dragOffset.x));
    const nextY = Math.max(10, Math.min(window.innerHeight - 440, e.clientY - dragOffset.y));
    setPosition({ x: nextX, y: nextY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (_) {}
    }
  };

  const isDark = theme === 'dark';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={target.title}
      className="pr-surface fixed z-50 select-none shadow-2xl rounded-2xl overflow-hidden font-sans border animate-in fade-in zoom-in-95 duration-150"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: '280px',
        backgroundColor: isDark ? '#18191d' : '#ffffff',
        borderColor: isDark ? '#383a42' : '#e2e4ea',
        boxShadow: isDark
          ? '0 20px 50px rgba(0,0,0,0.6), 0 0 1px rgba(255,255,255,0.2)'
          : '0 20px 40px rgba(0,0,0,0.15), 0 0 1px rgba(0,0,0,0.1)',
      }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Header bar draggable */}
      <div
        onPointerDown={handlePointerDownHeader}
        className={`flex items-center justify-between px-3 py-2.5 cursor-grab active:cursor-grabbing border-b ${
          isDark ? 'border-neutral-800 bg-neutral-900/60 text-neutral-200' : 'border-neutral-200 bg-neutral-100/80 text-neutral-800'
        }`}
      >
        <div className="flex items-center gap-1.5 pointer-events-none">
          <Hash className="w-3.5 h-3.5 text-sky-400" />
          <span className="text-xs font-semibold tracking-wide truncate max-w-[170px]">
            {target.title}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onClose}
            className={`p-1 rounded-lg transition-colors ${
              isDark ? 'hover:bg-neutral-800 text-neutral-400 hover:text-white' : 'hover:bg-neutral-200 text-neutral-600'
            }`}
            title="Close Numpad"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Numerical Display Output */}
      <div className={`p-3 border-b flex flex-col gap-1 ${isDark ? 'border-neutral-800 bg-[#121316]' : 'border-neutral-200 bg-neutral-50'}`}>
        <div className="flex items-baseline justify-between">
          <div className="flex items-center gap-1">
            <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-400">Value</span>
            {target.unit && (
              <span className="text-[10px] font-mono px-1 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                {target.unit}
              </span>
            )}
          </div>
          <span className="text-[10px] font-mono text-neutral-500">
            [{target.min} ~ {target.max}]
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 overflow-hidden">
          <span
            className={`text-2xl font-bold font-mono tracking-tight truncate flex-1 text-right ${
              isDark ? 'text-white' : 'text-neutral-900'
            }`}
          >
            {inputStr || '0'}
          </span>
        </div>
      </div>

      {/* Keypad Grid */}
      <div className="p-3 flex flex-col gap-2">
        {/* Step increment & decrement row */}
        <div className="grid grid-cols-4 gap-1.5 text-xs">
          <button
            onClick={() => handleStep(-1)}
            className={`py-1.5 rounded-lg border font-medium flex items-center justify-center gap-0.5 transition-colors active:scale-95 ${
              isDark
                ? 'bg-neutral-800/80 border-neutral-700/60 text-neutral-200 hover:bg-neutral-700'
                : 'bg-neutral-100 border-neutral-200 text-neutral-700 hover:bg-neutral-200'
            }`}
            title={`Step -${target.step}`}
          >
            <Minus className="w-3 h-3" />
            <span className="text-[10px]">{target.step}</span>
          </button>
          <button
            onClick={() => handleStep(1)}
            className={`py-1.5 rounded-lg border font-medium flex items-center justify-center gap-0.5 transition-colors active:scale-95 ${
              isDark
                ? 'bg-neutral-800/80 border-neutral-700/60 text-neutral-200 hover:bg-neutral-700'
                : 'bg-neutral-100 border-neutral-200 text-neutral-700 hover:bg-neutral-200'
            }`}
            title={`Step +${target.step}`}
          >
            <Plus className="w-3 h-3" />
            <span className="text-[10px]">{target.step}</span>
          </button>
          <button
            onClick={handleToggleSign}
            className={`py-1.5 rounded-lg border font-mono text-xs transition-colors active:scale-95 ${
              isDark
                ? 'bg-neutral-800/80 border-neutral-700/60 text-neutral-200 hover:bg-neutral-700'
                : 'bg-neutral-100 border-neutral-200 text-neutral-700 hover:bg-neutral-200'
            }`}
            title="Toggle Positive / Negative"
          >
            ±
          </button>
          <button
            onClick={handleClear}
            className={`py-1.5 rounded-lg border font-semibold text-xs transition-colors active:scale-95 ${
              isDark
                ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
                : 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
            }`}
            title="Clear"
          >
            C
          </button>
        </div>

        {/* 4x4 Calculator Keypad */}
        <div className="grid grid-cols-4 gap-1.5 text-sm font-semibold font-mono">
          {/* Row 1 */}
          {['7', '8', '9'].map((d) => (
            <button
              key={d}
              onClick={() => handleDigit(d)}
              className={`py-2 rounded-xl border flex items-center justify-center transition-all active:scale-95 ${
                isDark
                  ? 'bg-neutral-900 border-neutral-800 text-neutral-100 hover:bg-neutral-800 hover:border-neutral-700'
                  : 'bg-white border-neutral-200 text-neutral-800 hover:bg-neutral-100 shadow-sm'
              }`}
            >
              {d}
            </button>
          ))}
          <button
            onClick={() => handleOperator('/')}
            className={`py-2 rounded-xl border flex items-center justify-center transition-all active:scale-95 ${
              isDark
                ? 'bg-neutral-800/60 border-neutral-700/50 text-sky-400 hover:bg-neutral-700'
                : 'bg-sky-50 border-sky-200 text-sky-700 hover:bg-sky-100'
            }`}
          >
            /
          </button>

          {/* Row 2 */}
          {['4', '5', '6'].map((d) => (
            <button
              key={d}
              onClick={() => handleDigit(d)}
              className={`py-2 rounded-xl border flex items-center justify-center transition-all active:scale-95 ${
                isDark
                  ? 'bg-neutral-900 border-neutral-800 text-neutral-100 hover:bg-neutral-800 hover:border-neutral-700'
                  : 'bg-white border-neutral-200 text-neutral-800 hover:bg-neutral-100 shadow-sm'
              }`}
            >
              {d}
            </button>
          ))}
          <button
            onClick={() => handleOperator('*')}
            className={`py-2 rounded-xl border flex items-center justify-center transition-all active:scale-95 ${
              isDark
                ? 'bg-neutral-800/60 border-neutral-700/50 text-sky-400 hover:bg-neutral-700'
                : 'bg-sky-50 border-sky-200 text-sky-700 hover:bg-sky-100'
            }`}
          >
            ×
          </button>

          {/* Row 3 */}
          {['1', '2', '3'].map((d) => (
            <button
              key={d}
              onClick={() => handleDigit(d)}
              className={`py-2 rounded-xl border flex items-center justify-center transition-all active:scale-95 ${
                isDark
                  ? 'bg-neutral-900 border-neutral-800 text-neutral-100 hover:bg-neutral-800 hover:border-neutral-700'
                  : 'bg-white border-neutral-200 text-neutral-800 hover:bg-neutral-100 shadow-sm'
              }`}
            >
              {d}
            </button>
          ))}
          <button
            onClick={() => handleOperator('-')}
            className={`py-2 rounded-xl border flex items-center justify-center transition-all active:scale-95 ${
              isDark
                ? 'bg-neutral-800/60 border-neutral-700/50 text-sky-400 hover:bg-neutral-700'
                : 'bg-sky-50 border-sky-200 text-sky-700 hover:bg-sky-100'
            }`}
          >
            -
          </button>

          {/* Row 4 */}
          <button
            onClick={() => handleDigit('0')}
            className={`py-2 rounded-xl border flex items-center justify-center transition-all active:scale-95 ${
              isDark
                ? 'bg-neutral-900 border-neutral-800 text-neutral-100 hover:bg-neutral-800 hover:border-neutral-700'
                : 'bg-white border-neutral-200 text-neutral-800 hover:bg-neutral-100 shadow-sm'
            }`}
          >
            0
          </button>
          <button
            onClick={() => handleDigit('.')}
            className={`py-2 rounded-xl border flex items-center justify-center transition-all active:scale-95 ${
              isDark
                ? 'bg-neutral-900 border-neutral-800 text-neutral-100 hover:bg-neutral-800 hover:border-neutral-700'
                : 'bg-white border-neutral-200 text-neutral-800 hover:bg-neutral-100 shadow-sm'
            }`}
          >
            .
          </button>
          <button
            onClick={handleBackspace}
            className={`py-2 rounded-xl border flex items-center justify-center transition-all active:scale-95 ${
              isDark
                ? 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800 hover:text-white'
                : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-100 shadow-sm'
            }`}
            title="Backspace"
          >
            <Delete className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleOperator('+')}
            className={`py-2 rounded-xl border flex items-center justify-center transition-all active:scale-95 ${
              isDark
                ? 'bg-neutral-800/60 border-neutral-700/50 text-sky-400 hover:bg-neutral-700'
                : 'bg-sky-50 border-sky-200 text-sky-700 hover:bg-sky-100'
            }`}
          >
            +
          </button>
        </div>

        {/* Action Controls: Calculate & Apply */}
        <div className="grid grid-cols-2 gap-2 mt-1 font-sans">
          <button
            onClick={handleCalculate}
            className={`py-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
              isDark
                ? 'bg-neutral-800 border-neutral-700 text-neutral-200 hover:bg-neutral-700'
                : 'bg-neutral-100 border-neutral-200 text-neutral-700 hover:bg-neutral-200'
            }`}
            title="Calculate Expression"
          >
            <Equal className="w-3.5 h-3.5" />
            <span>Calculate</span>
          </button>

          <button
            onClick={handleConfirm}
            className="py-2 rounded-xl bg-sky-600 hover:bg-sky-500 active:scale-95 text-white border border-sky-400/40 text-xs font-semibold flex items-center justify-center gap-1.5 shadow-lg shadow-sky-900/30 transition-all"
          >
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Apply</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export const NumpadModal: React.FC<NumpadModalProps> = ({
  target,
  onClose,
  theme = 'dark',
}) => {
  if (!target) return null;
  return <NumpadModalContent target={target} onClose={onClose} theme={theme} />;
};
