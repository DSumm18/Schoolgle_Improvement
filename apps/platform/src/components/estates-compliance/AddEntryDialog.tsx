'use client';

/**
 * AddEntryDialog Component
 *
 * Dialog for creating new diary entries with:
 * - Text area for notes
 * - Photo upload
 * - Tag selection
 * - Location (optional)
 * - Weather tracking (optional)
 * - Mood selection (optional)
 * - Visibility settings
 */

import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import {
  Plus,
  Image as ImageIcon,
  X,
  MapPin,
  Cloud,
  Smile,
  Meh,
  Frown,
  Lock,
  Users,
  Globe,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/SupabaseAuthContext';
import { useMediaQuery } from '@/hooks/use-media-query';

interface AddEntryDialogProps {
  onEntryAdded?: () => void;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

type MoodType = 'positive' | 'neutral' | 'negative' | null;
type VisibilityType = 'private' | 'team' | 'organization';

const COMMON_TAGS = [
  'heating', 'security', 'vandalism', 'contractor', 'maintenance',
  'inspection', 'asbestos', 'fire', 'legionella', 'electrical',
  'plumbing', 'roofing', 'flooring', 'cleaning', 'waste',
  'parking', 'playground', 'equipment', 'vehicle', 'safety',
  'accident', 'near-miss', 'weather', 'visitor', 'delivery',
  'alarm-test', 'emergency-drill',
];

const TAG_COLORS: Record<string, string> = {
  heating: 'bg-orange-100 text-orange-700 border-orange-300 hover:bg-orange-200',
  security: 'bg-red-100 text-red-700 border-red-300 hover:bg-red-200',
  vandalism: 'bg-purple-100 text-purple-700 border-purple-300 hover:bg-purple-200',
  contractor: 'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200',
  maintenance: 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200',
  inspection: 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200',
  asbestos: 'bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-200',
  fire: 'bg-red-100 text-red-700 border-red-300 hover:bg-red-200',
  legionella: 'bg-cyan-100 text-cyan-700 border-cyan-300 hover:bg-cyan-200',
  electrical: 'bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-200',
  plumbing: 'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200',
  roofing: 'bg-stone-100 text-stone-700 border-stone-300 hover:bg-stone-200',
  flooring: 'bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-200',
  cleaning: 'bg-teal-100 text-teal-700 border-teal-300 hover:bg-teal-200',
  waste: 'bg-lime-100 text-lime-700 border-lime-300 hover:bg-lime-200',
  parking: 'bg-indigo-100 text-indigo-700 border-indigo-300 hover:bg-indigo-200',
  playground: 'bg-pink-100 text-pink-700 border-pink-300 hover:bg-pink-200',
  equipment: 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200',
  vehicle: 'bg-violet-100 text-violet-700 border-violet-300 hover:bg-violet-200',
  safety: 'bg-rose-100 text-rose-700 border-rose-300 hover:bg-rose-200',
  accident: 'bg-red-100 text-red-700 border-red-300 hover:bg-red-200',
  'near-miss': 'bg-orange-100 text-orange-700 border-orange-300 hover:bg-orange-200',
  weather: 'bg-sky-100 text-sky-700 border-sky-300 hover:bg-sky-200',
  visitor: 'bg-emerald-100 text-emerald-700 border-emerald-300 hover:bg-emerald-200',
  delivery: 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-300 hover:bg-fuchsia-200',
  'alarm-test': 'bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-200',
  'emergency-drill': 'bg-red-100 text-red-700 border-red-300 hover:bg-red-200',
};

const getTagColor = (tag: string) => {
  return TAG_COLORS[tag] || 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200';
};

export function AddEntryDialog({
  onEntryAdded,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: AddEntryDialogProps) {
  const { organizationId, user } = useAuth();
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [entry, setEntry] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagSearch, setTagSearch] = useState('');
  const [location, setLocation] = useState('');
  const [mood, setMood] = useState<MoodType>(null);
  const [visibility, setVisibility] = useState<VisibilityType>('private');
  const [weather, setWeather] = useState({ conditions: '', temperature: '' });
  const [photos, setPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);

  // Handle controlled/uncontrolled state
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : open;
  const setIsOpen = (value: boolean) => {
    if (isControlled) {
      controlledOnOpenChange?.(value);
    } else {
      setOpen(value);
    }
  };

  const resetForm = () => {
    setEntry('');
    setTags([]);
    setTagSearch('');
    setLocation('');
    setMood(null);
    setVisibility('private');
    setWeather({ conditions: '', temperature: '' });
    setPhotos([]);
  };

  const handleClose = () => {
    resetForm();
    setIsOpen(false);
  };

  const handleAddTag = (tag: string) => {
    if (!tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setTagSearch('');
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newPhotos: string[] = [];

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;

      // Convert to base64 for now (in production, upload to storage)
      const reader = new FileReader();
      const promise = new Promise<string>((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });

      const base64 = await promise;
      newPhotos.push(base64);
    }

    setPhotos([...photos, ...newPhotos]);
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!entry.trim()) {
      toast.error('Please enter an entry');
      return;
    }

    if (!organizationId || !user?.id) {
      toast.error('Authentication required');
      return;
    }

    setIsSubmitting(true);

    try {
      const weatherData =
        weather.conditions || weather.temperature
          ? {
              ...(weather.conditions && { conditions: weather.conditions }),
              ...(weather.temperature && { temperature: parseInt(weather.temperature) }),
            }
          : undefined;

      const response = await fetch('/api/estates-compliance/diary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: organizationId,
          user_id: user.id,
          entry: entry.trim(),
          photos,
          tags,
          location: location || null,
          weather: weatherData,
          mood: mood || null,
          visibility,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create entry');
      }

      toast.success('Diary entry added');
      resetForm();
      setIsOpen(false);
      onEntryAdded?.();
    } catch (error) {
      console.error('Error creating entry:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTags = COMMON_TAGS.filter(
    tag => !tags.includes(tag) && tag.toLowerCase().includes(tagSearch.toLowerCase())
  );

  const defaultTrigger = (
    <Button size="lg" className="shadow-lg">
      <Plus className="w-5 h-5 mr-2" />
      New Entry
    </Button>
  );

  const TriggerComponent = isDesktop ? Dialog : Card;

  return (
    <TriggerComponent
      className={isDesktop ? undefined : 'border-2 border-dashed p-6 cursor-pointer hover:border-primary transition-colors'}
      onClick={isDesktop ? undefined : () => setIsOpen(true)}
    >
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild={isDesktop}>
          {trigger || defaultTrigger}
        </DialogTrigger>

        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              New Diary Entry
            </DialogTitle>
            <DialogDescription>
              Record your daily observations, notes, and activities
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Entry Text */}
            <div className="space-y-2">
              <Label htmlFor="entry">
                Entry <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="entry"
                placeholder="What did you observe or do today? Record any compliance-related notes, issues, or observations..."
                value={entry}
                onChange={(e) => setEntry(e.target.value)}
                rows={5}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground text-right">
                {entry.length} characters
              </p>
            </div>

            {/* Photos */}
            <div className="space-y-2">
              <Label>Photos (optional)</Label>
              <div className="grid grid-cols-4 gap-2">
                {photos.map((photo, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
                    <img src={photo} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1 h-6 w-6 p-0"
                      onClick={() => handleRemovePhoto(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                {photos.length < 10 && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-lg border-2 border-dashed hover:border-primary flex flex-col items-center justify-center text-muted-foreground hover:text-primary transition-colors"
                  >
                    <ImageIcon className="w-6 h-6 mb-1" />
                    <span className="text-xs">Add Photo</span>
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label>Tags (optional)</Label>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className={`${getTagColor(tag)} cursor-pointer`}
                    onClick={() => handleRemoveTag(tag)}
                  >
                    {tag}
                    <X className="w-3 h-3 ml-1" />
                  </Badge>
                ))}
              </div>
              <div className="relative">
                <Input
                  placeholder="Search or add tags..."
                  value={tagSearch}
                  onChange={(e) => {
                    setTagSearch(e.target.value);
                    setShowTagSuggestions(true);
                  }}
                  onFocus={() => setShowTagSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowTagSuggestions(false), 200)}
                />
                {showTagSuggestions && filteredTags.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {filteredTags.map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleAddTag(tag)}
                        className="w-full text-left px-3 py-2 hover:bg-muted text-sm"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                Location (optional)
              </Label>
              <Input
                id="location"
                placeholder="e.g., Main Hall, Block B, North Playground"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            {/* Weather */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Cloud className="w-4 h-4" />
                Weather (optional)
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <Select
                  value={weather.conditions}
                  onValueChange={(value) => setWeather({ ...weather, conditions: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Conditions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sunny">Sunny</SelectItem>
                    <SelectItem value="cloudy">Cloudy</SelectItem>
                    <SelectItem value="rainy">Rainy</SelectItem>
                    <SelectItem value="stormy">Stormy</SelectItem>
                    <SelectItem value="snowy">Snowy</SelectItem>
                    <SelectItem value="windy">Windy</SelectItem>
                    <SelectItem value="foggy">Foggy</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  placeholder="Temp (°C)"
                  value={weather.temperature}
                  onChange={(e) => setWeather({ ...weather, temperature: e.target.value })}
                />
              </div>
            </div>

            {/* Mood & Visibility */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  How are you feeling? (optional)
                </Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={mood === 'positive' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setMood(mood === 'positive' ? null : 'positive')}
                    className="flex-1"
                  >
                    <Smile className="w-4 h-4 mr-1" />
                    Good
                  </Button>
                  <Button
                    type="button"
                    variant={mood === 'neutral' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setMood(mood === 'neutral' ? null : 'neutral')}
                    className="flex-1"
                  >
                    <Meh className="w-4 h-4 mr-1" />
                    OK
                  </Button>
                  <Button
                    type="button"
                    variant={mood === 'negative' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setMood(mood === 'negative' ? null : 'negative')}
                    className="flex-1"
                  >
                    <Frown className="w-4 h-4 mr-1" />
                    Bad
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Who can see this?</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={visibility === 'private' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setVisibility('private')}
                    className="flex-1"
                    title="Only you"
                  >
                    <Lock className="w-4 h-4 mr-1" />
                    Private
                  </Button>
                  <Button
                    type="button"
                    variant={visibility === 'team' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setVisibility('team')}
                    className="flex-1"
                    title="Your team"
                  >
                    <Users className="w-4 h-4 mr-1" />
                    Team
                  </Button>
                  <Button
                    type="button"
                    variant={visibility === 'organization' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setVisibility('organization')}
                    className="flex-1"
                    title="Everyone in organization"
                  >
                    <Globe className="w-4 h-4 mr-1" />
                    All
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting || !entry.trim()}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Save Entry
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </TriggerComponent>
  );
}
