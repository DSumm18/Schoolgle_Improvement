'use client';

/**
 * PhotoCapture Component
 *
 * Provides camera functionality for capturing evidence photos during compliance checks.
 *
 * Features:
 * - Capture photo from device camera
 * - Upload existing photos from gallery
 * - Preview captured photos
 * - Add annotations/notes to photos
 * - Remove photos before submission
 */

import { useRef, useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Camera, X, Image as ImageIcon, Plus, RotateCw } from 'lucide-react';

interface Photo {
  id: string;
  url: string;
  file?: File;
  timestamp: Date;
  caption?: string;
  location?: string;
}

interface PhotoCaptureProps {
  photos: Photo[];
  onPhotosChange: (photos: Photo[]) => void;
  maxPhotos?: number;
  label?: string;
  required?: boolean;
}

export function PhotoCapture({
  photos,
  onPhotosChange,
  maxPhotos = 10,
  label = 'Evidence Photos',
  required = false,
}: PhotoCaptureProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [photoCaption, setPhotoCaption] = useState('');

  // Start camera stream
  useEffect(() => {
    if (showCamera) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [showCamera, facingMode]);

  const startCamera = async () => {
    try {
      setCameraError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setCameraError(
        'Unable to access camera. Please check permissions or use the file upload option instead.'
      );
      setShowCamera(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

    const newPhoto: Photo = {
      id: Date.now().toString(),
      url: dataUrl,
      timestamp: new Date(),
    };

    onPhotosChange([...photos, newPhoto]);
    setShowCamera(false);
    stopCamera();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newPhotos: Photo[] = [];

    Array.from(files).forEach((file) => {
      if (photos.length + newPhotos.length >= maxPhotos) return;

      const url = URL.createObjectURL(file);
      newPhotos.push({
        id: `${Date.now()}-${Math.random()}`,
        url,
        file,
        timestamp: new Date(),
      });
    });

    onPhotosChange([...photos, ...newPhotos]);
  };

  const removePhoto = (id: string) => {
    onPhotosChange(photos.filter((photo) => photo.id !== id));
    if (selectedPhotoId === id) {
      setSelectedPhotoId(null);
      setPhotoCaption('');
    }
  };

  const handleFileInputClick = () => {
    fileInputRef.current?.click();
  };

  const toggleCamera = () => {
    if (showCamera) {
      setShowCamera(false);
      stopCamera();
    } else {
      setShowCamera(true);
    }
  };

  const switchCamera = () => {
    setFacingMode(facingMode === 'environment' ? 'user' : 'environment');
  };

  const updatePhotoCaption = (id: string, caption: string) => {
    onPhotosChange(
      photos.map((photo) =>
        photo.id === id ? { ...photo, caption } : photo
      )
    );
  };

  const remainingSlots = maxPhotos - photos.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        <Badge variant="outline">
          {photos.length} / {maxPhotos}
        </Badge>
      </div>

      {/* Camera Modal */}
      {showCamera && (
        <Card className="border-2 border-primary">
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />
              </div>

              {cameraError && (
                <Alert variant="destructive">
                  <AlertDescription>{cameraError}</AlertDescription>
                </Alert>
              )}

              <div className="flex items-center justify-between">
                <Button variant="outline" onClick={toggleCamera}>
                  Cancel
                </Button>
                <div className="flex gap-2">
                  {hasMultipleCameras() && (
                    <Button variant="outline" onClick={switchCamera}>
                      <RotateCw className="h-4 w-4 mr-2" />
                      Switch Camera
                    </Button>
                  )}
                  <Button onClick={capturePhoto}>
                    <Camera className="h-4 w-4 mr-2" />
                    Capture
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Photo Grid */}
      {photos.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {photos.map((photo) => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              onRemove={() => removePhoto(photo.id)}
              onCaptionChange={(caption) => updatePhotoCaption(photo.id, caption)}
              isSelected={selectedPhotoId === photo.id}
              onSelect={() => setSelectedPhotoId(photo.id)}
            />
          ))}

          {/* Add Photo Buttons */}
          {remainingSlots > 0 && (
            <>
              <AddPhotoCard
                icon={<Camera className="h-6 w-6" />}
                label="Camera"
                onClick={toggleCamera}
              />
              <AddPhotoCard
                icon={<ImageIcon className="h-6 w-6" />}
                label="Upload"
                onClick={handleFileInputClick}
              />
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <AddPhotoCard
            icon={<Camera className="h-6 w-6" />}
            label="Take Photo"
            onClick={toggleCamera}
          />
          <AddPhotoCard
            icon={<ImageIcon className="h-6 w-6" />}
            label="Upload Photo"
            onClick={handleFileInputClick}
          />
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Selected Photo Details */}
      {selectedPhotoId && (
        <Card className="border-2 border-primary/50">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Photo Details</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedPhotoId(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <img
                src={photos.find((p) => p.id === selectedPhotoId)?.url}
                alt="Selected"
                className="w-full max-h-48 object-contain rounded border"
              />
              <div>
                <Label> Caption/Notes (Optional)</Label>
                <Textarea
                  placeholder="Add a description for this photo..."
                  value={photos.find((p) => p.id === selectedPhotoId)?.caption || ''}
                  onChange={(e) => updatePhotoCaption(selectedPhotoId, e.target.value)}
                  rows={2}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Captured: {new Date(photos.find((p) => p.id === selectedPhotoId)?.timestamp || Date.now()).toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {photos.length === 0 && (
        <Alert>
          <Camera className="h-4 w-4" />
          <AlertDescription>
            Add photos to document evidence during this compliance check. Photos can be captured using your
            device camera or uploaded from your gallery.
          </AlertDescription>
        </Alert>
      )}

      {required && photos.length === 0 && (
        <Alert variant="destructive">
          <AlertDescription>At least one evidence photo is required.</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

interface PhotoCardProps {
  photo: Photo;
  onRemove: () => void;
  onCaptionChange: (caption: string) => void;
  isSelected: boolean;
  onSelect: () => void;
}

function PhotoCard({ photo, onRemove, onCaptionChange, isSelected, onSelect }: PhotoCardProps) {
  return (
    <Card
      className={`overflow-hidden cursor-pointer transition-all ${
        isSelected ? 'ring-2 ring-primary' : ''
      }`}
      onClick={onSelect}
    >
      <div className="relative aspect-square">
        <img src={photo.url} alt="Evidence" className="w-full h-full object-cover" />
        <Button
          variant="destructive"
          size="sm"
          className="absolute top-1 right-1"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <X className="h-4 w-4" />
        </Button>
        {photo.caption && (
          <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 truncate">
            {photo.caption}
          </div>
        )}
      </div>
    </Card>
  );
}

interface AddPhotoCardProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

function AddPhotoCard({ icon, label, onClick }: AddPhotoCardProps) {
  return (
    <Card
      className="border-2 border-dashed hover:border-primary cursor-pointer transition-colors"
      onClick={onClick}
    >
      <div className="aspect-square flex flex-col items-center justify-center p-4 text-center">
        <div className="text-muted-foreground mb-2">{icon}</div>
        <span className="text-sm font-medium">{label}</span>
      </div>
    </Card>
  );
}

// Helper function to check if device has multiple cameras
function hasMultipleCameras(): boolean {
  // In a real implementation, you would enumerate available video devices
  // For now, we'll assume mobile devices have both front and back cameras
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}
