'use client';

/**
 * SignaturePad Component
 *
 * Provides a canvas-based digital signature input for compliance check sign-off.
 *
 * Features:
 * - Draw signature with mouse or touch
 * - Clear and redo signature
 * - Validate signature is present
 * - Export as base64 image data
 */

import { useRef, useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Pen, RotateCcw, Check, X } from 'lucide-react';

interface SignaturePadProps {
  value: string;
  onChange: (signatureData: string) => void;
  label?: string;
  required?: boolean;
  name?: string; // Pre-fill name for text-based signature
  mode?: 'draw' | 'type';
}

export function SignaturePad({
  value,
  onChange,
  label = 'Digital Signature',
  required = false,
  name = '',
  mode = 'draw',
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [typedName, setTypedName] = useState(name);
  const [currentMode, setCurrentMode] = useState<'draw' | 'type'>(mode);

  // Drawing state
  const lastPosition = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Set drawing style
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Load existing signature if provided
    if (value && currentMode === 'draw') {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
        setHasSignature(true);
      };
      img.src = value;
    }
  }, [value, currentMode]);

  useEffect(() => {
    if (currentMode === 'type' && typedName) {
      // Generate signature from typed name
      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="400" height="100">
          <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
                font-family="cursive" font-size="24" fill="#1a1a1a">
            ${typedName}
          </text>
        </svg>
      `;
      const dataUrl = 'data:image/svg+xml;base64,' + btoa(svg);
      onChange(dataUrl);
      setHasSignature(true);
    }
  }, [typedName, currentMode, onChange]);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    lastPosition.current = getCoordinates(e);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const currentPosition = getCoordinates(e);

    ctx.beginPath();
    ctx.moveTo(lastPosition.current.x, lastPosition.current.y);
    ctx.lineTo(currentPosition.x, currentPosition.y);
    ctx.stroke();

    lastPosition.current = currentPosition;
    setHasSignature(true);
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveSignature();
    }
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    onChange(dataUrl);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    setHasSignature(false);
    onChange('');
  };

  const handleTypedNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTypedName(e.target.value);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentMode('type')}
            className={currentMode === 'type' ? 'bg-primary text-primary-foreground' : ''}
          >
            Type Name
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentMode('draw')}
            className={currentMode === 'draw' ? 'bg-primary text-primary-foreground' : ''}
          >
            Draw
          </Button>
        </div>
      </div>

      {currentMode === 'draw' ? (
        <Card className="border-2 border-dashed">
          <CardContent className="p-0">
            <div className="relative">
              <canvas
                ref={canvasRef}
                className="w-full h-32 cursor-crosshair touch-none"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
              {!hasSignature && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center text-muted-foreground">
                    <Pen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Sign above</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between px-4 py-2 bg-muted/30 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {hasSignature ? (
                  <>
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Signature captured</span>
                  </>
                ) : (
                  <>
                    <X className="h-4 w-4" />
                    <span>Awaiting signature</span>
                  </>
                )}
              </div>

              {hasSignature && (
                <Button variant="ghost" size="sm" onClick={clearSignature}>
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-2 border-dashed">
          <CardContent className="p-4">
            <div className="space-y-3">
              <input
                type="text"
                value={typedName}
                onChange={handleTypedNameChange}
                placeholder="Type your full legal name"
                className="w-full px-4 py-3 text-lg font-signature border-2 border-dashed rounded-md focus:outline-none focus:border-primary"
                style={{ fontFamily: 'cursive' }}
              />
              <p className="text-xs text-muted-foreground text-center">
                By typing your name, you are signing this document digitally.
              </p>

              {typedName && (
                <div className="flex items-center justify-center gap-2 text-sm text-green-600">
                  <Check className="h-4 w-4" />
                  <span>Signature: {typedName}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {required && !hasSignature && !typedName && (
        <Alert variant="destructive">
          <AlertDescription>Digital signature is required to complete this check.</AlertDescription>
        </Alert>
      )}

      <Alert>
        <p className="text-xs text-muted-foreground">
          Your digital signature confirms that you have completed this compliance check accurately and that all
          information recorded is true to the best of your knowledge. This signature is legally binding.
        </p>
      </Alert>
    </div>
  );
}
