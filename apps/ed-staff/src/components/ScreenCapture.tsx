"use client";

import { useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';

interface ScreenCaptureProps {
    onCapture: (imageData: string, prompt: string) => void;
}

export default function ScreenCapture({ onCapture }: ScreenCaptureProps) {
    const [isCapturing, setIsCapturing] = useState(false);

    const captureScreen = async () => {
        setIsCapturing(true);
        try {
            // Check if browser supports screen capture
            if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
                alert('Screen capture is not supported in your browser. Please use Chrome, Edge, or Firefox.');
                setIsCapturing(false);
                return;
            }

            // Request screen capture permission
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    mediaSource: 'screen',
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                } as any
            });

            // Create video element to capture frame
            const video = document.createElement('video');
            video.srcObject = stream;
            video.play();

            // Wait for video to load
            await new Promise((resolve) => {
                video.onloadedmetadata = resolve;
            });

            // Create canvas and capture frame
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');

            if (ctx) {
                ctx.drawImage(video, 0, 0);
                const imageData = canvas.toDataURL('image/png');

                // Stop the stream
                stream.getTracks().forEach(track => track.stop());

                // Prompt user for context
                const prompt = window.prompt(
                    'What do you need help with in this screenshot?',
                    'Help me navigate this screen to complete my task'
                );

                if (prompt) {
                    onCapture(imageData, prompt);
                }
            }
        } catch (error) {
            console.error('Screen capture error:', error);
            if ((error as Error).name !== 'NotAllowedError') {
                alert('Failed to capture screen. Please try again.');
            }
        } finally {
            setIsCapturing(false);
        }
    };

    return (
        <button
            onClick={captureScreen}
            disabled={isCapturing}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
            {isCapturing ? (
                <>
                    <Loader2 size={18} className="animate-spin" />
                    <span className="text-sm font-medium">Capturing...</span>
                </>
            ) : (
                <>
                    <Camera size={18} />
                    <span className="text-sm font-medium">Capture Screen</span>
                </>
            )}
        </button>
    );
}
