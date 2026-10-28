import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface TicketQRCodeProps {
  value: string;
  size?: number;
  className?: string;
}

export const TicketQRCode: React.FC<TicketQRCodeProps> = ({ value, size = 120, className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && value) {
      QRCode.toCanvas(
        canvasRef.current,
        value,
        {
          width: size,
          margin: 1,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
        },
        (error) => {
          if (error) console.error('Error generating QR code:', error);
        }
      );
    }
  }, [value, size]);

  return (
    <div className={`inline-flex flex-col items-center justify-center p-1.5 bg-white rounded-lg border border-slate-200 shadow-xs ${className}`}>
      <canvas ref={canvasRef} className="block" />
      <span className="text-[10px] text-slate-500 font-mono mt-1 tracking-wider">SCAN AT GATE</span>
    </div>
  );
};
