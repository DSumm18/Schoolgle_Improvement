'use client';

/**
 * DiaryEntry Component
 *
 * Displays a single diary entry with:
 * - Timestamp and user info
 * - Entry text with expand/collapse for long entries
 * - Photo gallery
 * - Tags
 * - Location
 * - Edit and delete options
 */

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Calendar,
  MapPin,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Edit,
  Trash2,
  Image as ImageIcon,
  Smile,
  Meh,
  Frown,
  Lock,
  Users,
  Globe,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/SupabaseAuthContext';

export interface DiaryEntryPhoto {
  url: string;
  caption?: string;
}

export interface DiaryEntryUser {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
}

export interface DiaryEntryData {
  id: string;
  organization_id: string;
  user_id: string;
  entry: string;
  photos: string[];
  tags: string[];
  location?: string;
  weather?: {
    temperature?: number;
    conditions?: string;
  };
  mood?: 'positive' | 'neutral' | 'negative';
  visibility: 'private' | 'team' | 'organization';
  attachments: string[];
  created_at: string;
  updated_at: string;
  user?: DiaryEntryUser;
}

interface DiaryEntryProps {
  entry: DiaryEntryData;
  onUpdate?: (id: string, updates: Partial<DiaryEntryData>) => void;
  onDelete?: (id: string) => void;
  isOwner?: boolean;
}

const TAG_COLORS: Record<string, string> = {
  heating: 'bg-orange-100 text-orange-700 border-orange-300',
  security: 'bg-red-100 text-red-700 border-red-300',
  vandalism: 'bg-purple-100 text-purple-700 border-purple-300',
  contractor: 'bg-blue-100 text-blue-700 border-blue-300',
  maintenance: 'bg-gray-100 text-gray-700 border-gray-300',
  inspection: 'bg-green-100 text-green-700 border-green-300',
  asbestos: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  fire: 'bg-red-100 text-red-700 border-red-300',
  legionella: 'bg-cyan-100 text-cyan-700 border-cyan-300',
  electrical: 'bg-amber-100 text-amber-700 border-amber-300',
  plumbing: 'bg-blue-100 text-blue-700 border-blue-300',
  roofing: 'bg-stone-100 text-stone-700 border-stone-300',
  flooring: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  cleaning: 'bg-teal-100 text-teal-700 border-teal-300',
  waste: 'bg-lime-100 text-lime-700 border-lime-300',
  parking: 'bg-indigo-100 text-indigo-700 border-indigo-300',
  playground: 'bg-pink-100 text-pink-700 border-pink-300',
  equipment: 'bg-slate-100 text-slate-700 border-slate-300',
  vehicle: 'bg-violet-100 text-violet-700 border-violet-300',
  safety: 'bg-rose-100 text-rose-700 border-rose-300',
  accident: 'bg-red-100 text-red-700 border-red-300',
  'near-miss': 'bg-orange-100 text-orange-700 border-orange-300',
  weather: 'bg-sky-100 text-sky-700 border-sky-300',
  visitor: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  delivery: 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-300',
  'alarm-test': 'bg-amber-100 text-amber-700 border-amber-300',
  'emergency-drill': 'bg-red-100 text-red-700 border-red-300',
};

const getTagColor = (tag: string) => {
  return TAG_COLORS[tag] || 'bg-gray-100 text-gray-700 border-gray-300';
};

export function DiaryEntry({ entry, onUpdate, onDelete, isOwner = false }: DiaryEntryProps) {
  const [expanded, setExpanded] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editedEntry, setEditedEntry] = useState(entry.entry);
  const [editedTags, setEditedTags] = useState(entry.tags);
  const [editedLocation, setEditedLocation] = useState(entry.location || '');
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuth();

  const isLongEntry = entry.entry.length > 300;
  const displayName = entry.user?.user_metadata?.full_name || entry.user?.email || 'Unknown';
  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const canEdit = isOwner || user?.id === entry.user_id;
  const canDelete = canEdit; // Same rules for now

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/estates-compliance/diary', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: entry.id,
          entry: editedEntry,
          tags: editedTags,
          location: editedLocation || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update entry');
      }

      toast.success('Entry updated');
      setEditDialogOpen(false);
      onUpdate?.(entry.id, {
        entry: editedEntry,
        tags: editedTags,
        location: editedLocation || undefined,
      });
    } catch (error) {
      console.error('Error updating entry:', error);
      toast.error('Failed to update entry');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this entry? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/estates-compliance/diary?id=${entry.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete entry');
      }

      toast.success('Entry deleted');
      onDelete?.(entry.id);
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete entry');
    }
  };

  const addTag = (tag: string) => {
    if (!editedTags.includes(tag)) {
      setEditedTags([...editedTags, tag]);
    }
  };

  const removeTag = (tag: string) => {
    setEditedTags(editedTags.filter(t => t !== tag));
  };

  const getMoodIcon = () => {
    switch (entry.mood) {
      case 'positive':
        return <Smile className="w-4 h-4 text-green-600" />;
      case 'negative':
        return <Frown className="w-4 h-4 text-red-600" />;
      default:
        return <Meh className="w-4 h-4 text-gray-600" />;
    }
  };

  const getVisibilityIcon = () => {
    switch (entry.visibility) {
      case 'organization':
        return <Globe className="w-4 h-4 text-blue-600" />;
      case 'team':
        return <Users className="w-4 h-4 text-purple-600" />;
      default:
        return <Lock className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <>
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                {initials}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-sm truncate">{displayName}</p>
                  {getMoodIcon()}
                  {getVisibilityIcon()}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  <time dateTime={entry.created_at}>
                    {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                  </time>
                  {entry.updated_at !== entry.created_at && (
                    <span className="italic">(edited)</span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            {canEdit && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  {canDelete && (
                    <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Entry Text */}
          <div className="prose prose-sm max-w-none">
            <p className="whitespace-pre-wrap break-words">
              {isLongEntry && !expanded ? (
                <>
                  {entry.entry.slice(0, 300)}
                  <span className="text-muted-foreground">...</span>
                </>
              ) : (
                entry.entry
              )}
            </p>
            {isLongEntry && (
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-primary"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? (
                  <>
                    Show less <ChevronUp className="h-3 w-3 ml-1" />
                  </>
                ) : (
                  <>
                    Show more <ChevronDown className="h-3 w-3 ml-1" />
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Photos */}
          {entry.photos && entry.photos.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {entry.photos.map((photo, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setSelectedImageIndex(index);
                    setImageDialogOpen(true);
                  }}
                  className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border hover:ring-2 hover:ring-primary transition-all"
                >
                  <img
                    src={photo}
                    alt={`Diary photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Tags */}
          {entry.tags && entry.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {entry.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className={`text-xs ${getTagColor(tag)}`}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Location & Weather */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {entry.location && (
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span>{entry.location}</span>
              </div>
            )}
            {entry.weather?.conditions && (
              <div className="flex items-center gap-1">
                <span>Weather: {entry.weather.conditions}</span>
                {entry.weather.temperature && (
                  <span>({entry.weather.temperature}°C)</span>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Image Dialog */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Photo Gallery</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <img
              src={entry.photos?.[selectedImageIndex]}
              alt="Enlarged diary photo"
              className="w-full max-h-[70vh] object-contain rounded-lg"
            />
            {entry.photos && entry.photos.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {entry.photos.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === selectedImageIndex ? 'bg-white scale-125' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
          {entry.photos && entry.photos.length > 1 && (
            <div className="flex justify-between mt-4">
              <Button
                variant="outline"
                onClick={() => setSelectedImageIndex(Math.max(0, selectedImageIndex - 1))}
                disabled={selectedImageIndex === 0}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground self-center">
                {selectedImageIndex + 1} of {entry.photos.length}
              </span>
              <Button
                variant="outline"
                onClick={() => setSelectedImageIndex(Math.min(entry.photos.length - 1, selectedImageIndex + 1))}
                disabled={selectedImageIndex === entry.photos.length - 1}
              >
                Next
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Diary Entry</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Entry</label>
              <Textarea
                value={editedEntry}
                onChange={(e) => setEditedEntry(e.target.value)}
                rows={6}
                className="mt-1.5"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Location</label>
              <Input
                value={editedLocation}
                onChange={(e) => setEditedLocation(e.target.value)}
                placeholder="e.g., Main Hall, Block B, Playground"
                className="mt-1.5"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Tags</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {editedTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className={`${getTagColor(tag)} cursor-pointer`}
                    onClick={() => removeTag(tag)}
                  >
                    {tag}
                    <span className="ml-1">&times;</span>
                  </Badge>
                ))}
              </div>
              <TagSelector onSelect={addTag} existingTags={editedTags} />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

const COMMON_TAGS = [
  'heating', 'security', 'vandalism', 'contractor', 'maintenance',
  'inspection', 'asbestos', 'fire', 'legionella', 'electrical',
  'plumbing', 'roofing', 'flooring', 'cleaning', 'waste',
  'parking', 'playground', 'equipment', 'vehicle', 'safety',
  'accident', 'near-miss', 'weather', 'visitor', 'delivery',
  'alarm-test', 'emergency-drill',
];

interface TagSelectorProps {
  onSelect: (tag: string) => void;
  existingTags: string[];
}

function TagSelector({ onSelect, existingTags }: TagSelectorProps) {
  const [search, setSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredTags = COMMON_TAGS.filter(
    tag => !existingTags.includes(tag) && tag.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative">
      <Input
        placeholder="Add a tag..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setShowSuggestions(true);
        }}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        className="mt-1.5"
      />
      {showSuggestions && filteredTags.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-48 overflow-y-auto">
          {filteredTags.map(tag => (
            <button
              key={tag}
              onClick={() => {
                onSelect(tag);
                setSearch('');
              }}
              className="w-full text-left px-3 py-2 hover:bg-muted text-sm"
            >
              {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
