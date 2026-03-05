'use client';

/**
 * Site Manager's Daily Diary Page
 *
 * Features:
 * - Timeline view of diary entries
 * - Quick add floating action button
 * - Searchable by date, tags, text
 * - Mobile-friendly responsive design
 */

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { format, startOfDay, endOfDay, subDays, subMonths } from 'date-fns';
import { useAuth } from '@/context/SupabaseAuthContext';
import { BookOpen, Search, Filter, Calendar, Plus, Menu } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { DiaryEntry, DiaryEntryData } from '@/components/estates-compliance/DiaryEntry';
import { AddEntryDialog } from '@/components/estates-compliance/AddEntryDialog';
import { toast } from 'sonner';

type DateRangeType = 'today' | 'week' | 'month' | 'all' | 'custom';

interface FilterState {
  search: string;
  tags: string[];
  dateRange: DateRangeType;
  dateFrom?: string;
  dateTo?: string;
}

function SiteDiaryPageContent() {
  const { organizationId, user, session } = useAuth();
  const [entries, setEntries] = useState<DiaryEntryData[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<DiaryEntryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    tags: [],
    dateRange: 'month',
  });
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  // Fetch entries
  const fetchEntries = useCallback(async (signal?: AbortSignal) => {
    // Use a local controller to manage the fetch timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort('Diary fetch timed out'), 30000);

    // Link the passed signal to our local controller
    const onAbort = () => controller.abort(signal?.reason);
    if (signal) {
      if (signal.aborted) onAbort();
      else signal.addEventListener('abort', onAbort, { once: true });
    }

    try {
      setLoading(true);

      const params = new URLSearchParams({
        organization_id: organizationId || '',
        limit: '100',
      });

      if (filters.search) {
        params.append('search', filters.search);
      }

      if (filters.tags.length > 0) {
        params.append('tags', filters.tags.join(','));
      }

      if (filters.dateRange === 'today') {
        const today = new Date();
        params.append('date_from', startOfDay(today).toISOString());
        params.append('date_to', endOfDay(today).toISOString());
      } else if (filters.dateRange === 'week') {
        const weekAgo = subDays(new Date(), 7);
        params.append('date_from', startOfDay(weekAgo).toISOString());
      } else if (filters.dateRange === 'month') {
        const monthAgo = subMonths(new Date(), 1);
        params.append('date_from', startOfDay(monthAgo).toISOString());
      } else if (filters.dateRange === 'custom' && filters.dateFrom) {
        params.append('date_from', filters.dateFrom);
        if (filters.dateTo) {
          params.append('date_to', filters.dateTo);
        }
      }

      const response = await fetch(`/api/estates-compliance/diary?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error('Failed to fetch entries');
      }

      const data = await response.json();
      setEntries(data.entries || []);
      setFilteredEntries(data.entries || []);
    } catch (error: any) {
      const errorString = typeof error === 'string' ? error : error?.message || '';
      const isAbort = error.name === 'AbortError' || errorString.toLowerCase().includes('abort') || errorString.toLowerCase().includes('unmounted') || errorString.toLowerCase().includes('refreshed');

      if (isAbort) {
        console.info('[SiteDiary] Fetch aborted:', errorString);
      } else {
        console.error('Error fetching diary entries:', error);
        toast.error('Failed to load diary entries');
      }
    } finally {
      clearTimeout(timeoutId);
      if (signal) signal.removeEventListener('abort', onAbort);
      setLoading(false);
    }
  }, [organizationId, filters, session]);

  useEffect(() => {
    const controller = new AbortController();
    fetchEntries(controller.signal);
    return () => controller.abort('Component updated or unmounted');
  }, [fetchEntries]);

  // Handle entry added
  const handleEntryAdded = () => {
    fetchEntries();
  };

  // Handle entry updated
  const handleEntryUpdated = (id: string, updates: Partial<DiaryEntryData>) => {
    setEntries(entries.map(e => (e.id === id ? { ...e, ...updates } : e)));
    setFilteredEntries(filteredEntries.map(e => (e.id === id ? { ...e, ...updates } : e)));
  };

  // Handle entry deleted
  const handleEntryDeleted = (id: string) => {
    setEntries(entries.filter(e => e.id !== id));
    setFilteredEntries(filteredEntries.filter(e => e.id !== id));
    toast.success('Entry deleted');
  };

  // Toggle tag filter
  const toggleTagFilter = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag];
    setFilters({ ...filters, tags: newTags });
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      search: '',
      tags: [],
      dateRange: 'month',
      dateFrom: undefined,
      dateTo: undefined,
    });
  };

  // Get all unique tags from entries
  const allTags = Array.from(new Set(entries.flatMap(e => e.tags))).sort();

  // Group entries by date
  const groupedEntries = filteredEntries.reduce((groups, entry) => {
    const dateKey = format(new Date(entry.created_at), 'yyyy-MM-dd');
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(entry);
    return groups;
  }, {} as Record<string, DiaryEntryData[]>);

  const sortedDates = Object.keys(groupedEntries).sort((a, b) => b.localeCompare(a));

  // Stats
  const totalEntries = entries.length;
  const thisWeekEntries = entries.filter(
    e => new Date(e.created_at) > subDays(new Date(), 7)
  ).length;
  const uniqueLocations = Array.from(
    new Set(entries.map(e => e.location).filter(Boolean))
  ).length;

  return (
    <div className="space-y-6 p-4 md:p-6 pb-24 md:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b">
        <div>
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/estates-compliance" className="hover:text-foreground">
              Estates Compliance
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">Site Diary</span>
          </nav>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg shadow-lg">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Site Manager&apos;s Diary</h1>
              <p className="text-muted-foreground text-sm md:text-base">
                Daily log of observations, notes, and compliance activities
              </p>
            </div>
          </div>
        </div>

        {/* Desktop Add Button */}
        <div className="hidden md:block">
          <AddEntryDialog onEntryAdded={handleEntryAdded} />
        </div>

        {/* Mobile Filter Toggle */}
        <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="md:hidden">
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {(filters.search || filters.tags.length > 0) && (
                <Badge variant="secondary" className="ml-2 h-5">
                  {[filters.search ? 1 : 0, filters.tags.length].reduce((a, b) => a + b, 0)}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <FilterContent
              filters={filters}
              setFilters={setFilters}
              allTags={allTags}
              toggleTagFilter={toggleTagFilter}
              clearFilters={clearFilters}
              onClose={() => setFilterSheetOpen(false)}
            />
          </SheetContent>
        </Sheet>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl md:text-3xl font-bold">{totalEntries}</p>
            <p className="text-xs md:text-sm text-muted-foreground">Total Entries</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl md:text-3xl font-bold">{thisWeekEntries}</p>
            <p className="text-xs md:text-sm text-muted-foreground">This Week</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl md:text-3xl font-bold">{uniqueLocations}</p>
            <p className="text-xs md:text-sm text-muted-foreground">Locations</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters Row */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search entries..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="pl-9"
          />
        </div>
        <Select
          value={filters.dateRange}
          onValueChange={(value) => setFilters({ ...filters, dateRange: value as DateRangeType })}
        >
          <SelectTrigger className="w-full md:w-[160px]">
            <SelectValue placeholder="Date range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">Past Week</SelectItem>
            <SelectItem value="month">Past Month</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
        {(filters.search || filters.tags.length > 0) && (
          <Button variant="ghost" onClick={clearFilters} size="sm">
            Clear filters
          </Button>
        )}
      </div>

      {/* Active Tags Filter */}
      {filters.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-muted-foreground">Active tags:</span>
          {filters.tags.map(tag => (
            <Badge
              key={tag}
              variant="secondary"
              className="cursor-pointer"
              onClick={() => toggleTagFilter(tag)}
            >
              {tag}
              <span className="ml-1">&times;</span>
            </Badge>
          ))}
        </div>
      )}

      {/* Desktop Filter Sidebar */}
      <div className="hidden lg:grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FilterContent
                filters={filters}
                setFilters={setFilters}
                allTags={allTags}
                toggleTagFilter={toggleTagFilter}
                clearFilters={clearFilters}
              />
            </CardContent>
          </Card>
        </div>

        {/* Entries Timeline */}
        <div className="lg:col-span-3 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-10 h-10 border-4 border-muted border-t-primary rounded-full animate-spin" />
            </div>
          ) : sortedDates.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No diary entries yet</h3>
                <p className="text-muted-foreground mb-6">
                  {filters.search || filters.tags.length > 0
                    ? 'No entries match your filters. Try adjusting them.'
                    : 'Start recording your daily observations and activities.'}
                </p>
                <AddEntryDialog
                  onEntryAdded={handleEntryAdded}
                  trigger={
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Entry
                    </Button>
                  }
                />
              </CardContent>
            </Card>
          ) : (
            sortedDates.map(dateKey => (
              <div key={dateKey} className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                    {format(new Date(dateKey), 'dd')}
                  </div>
                  <div>
                    <h3 className="font-semibold">
                      {format(new Date(dateKey), 'EEEE, MMMM d, yyyy')}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {groupedEntries[dateKey].length} {groupedEntries[dateKey].length === 1 ? 'entry' : 'entries'}
                    </p>
                  </div>
                  <div className="flex-1 h-px bg-border ml-4" />
                </div>
                <div className="space-y-4 pl-13">
                  {groupedEntries[dateKey].map(entry => (
                    <DiaryEntry
                      key={entry.id}
                      entry={entry}
                      onUpdate={handleEntryUpdated}
                      onDelete={handleEntryDeleted}
                      isOwner={user?.id === entry.user_id}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Mobile Entries */}
      <div className="lg:hidden space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-10 h-10 border-4 border-muted border-t-primary rounded-full animate-spin" />
          </div>
        ) : sortedDates.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No diary entries yet</h3>
              <p className="text-muted-foreground mb-6">
                {filters.search || filters.tags.length > 0
                  ? 'No entries match your filters. Try adjusting them.'
                  : 'Start recording your daily observations and activities.'}
              </p>
              <AddEntryDialog
                onEntryAdded={handleEntryAdded}
                trigger={
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Entry
                  </Button>
                }
              />
            </CardContent>
          </Card>
        ) : (
          sortedDates.map(dateKey => (
            <div key={dateKey} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                  {format(new Date(dateKey), 'dd')}
                </div>
                <div>
                  <h3 className="font-semibold">
                    {format(new Date(dateKey), 'EEE, MMM d')}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {groupedEntries[dateKey].length} {groupedEntries[dateKey].length === 1 ? 'entry' : 'entries'}
                  </p>
                </div>
                <div className="flex-1 h-px bg-border ml-4" />
              </div>
              <div className="space-y-4 pl-13">
                {groupedEntries[dateKey].map(entry => (
                  <DiaryEntry
                    key={entry.id}
                    entry={entry}
                    onUpdate={handleEntryUpdated}
                    onDelete={handleEntryDeleted}
                    isOwner={user?.id === entry.user_id}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Mobile Floating Action Button */}
      <div className="md:hidden fixed bottom-20 right-4 z-40">
        <AddEntryDialog
          onEntryAdded={handleEntryAdded}
          trigger={
            <Button
              size="lg"
              className="h-14 w-14 rounded-full shadow-lg"
              onClick={() => setAddDialogOpen(true)}
            >
              <Plus className="w-6 h-6" />
            </Button>
          }
        />
      </div>
    </div>
  );
}

interface FilterContentProps {
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  allTags: string[];
  toggleTagFilter: (tag: string) => void;
  clearFilters: () => void;
  onClose?: () => void;
}

function FilterContent({
  filters,
  setFilters,
  allTags,
  toggleTagFilter,
  clearFilters,
  onClose,
}: FilterContentProps) {
  const TAG_COLORS: Record<string, string> = {
    heating: 'bg-orange-100 text-orange-700 border-orange-300',
    security: 'bg-red-100 text-red-700 border-red-300',
    vandalism: 'bg-purple-100 text-purple-700 border-purple-300',
    contractor: 'bg-blue-100 text-blue-700 border-blue-300',
    maintenance: 'bg-gray-100 text-gray-700 border-gray-300',
    inspection: 'bg-green-100 text-green-700 border-green-300',
  };

  const getTagColor = (tag: string) => {
    return TAG_COLORS[tag] || 'bg-gray-100 text-gray-700 border-gray-300';
  };

  return (
    <div className="space-y-6">
      {/* Date Range */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Date Range</label>
        <Select
          value={filters.dateRange}
          onValueChange={(value) => setFilters({ ...filters, dateRange: value as DateRangeType })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">Past Week</SelectItem>
            <SelectItem value="month">Past Month</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tags */}
      {allTags.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Filter by Tags</label>
          <div className="flex flex-wrap gap-2">
            {allTags.slice(0, 15).map(tag => (
              <Badge
                key={tag}
                variant={filters.tags.includes(tag) ? 'default' : 'outline'}
                className={`cursor-pointer ${filters.tags.includes(tag) ? '' : getTagColor(tag)
                  }`}
                onClick={() => toggleTagFilter(tag)}
              >
                {tag}
              </Badge>
            ))}
            {allTags.length > 15 && (
              <span className="text-sm text-muted-foreground">
                +{allTags.length - 15} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Common Tags Quick Add */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Quick Filter</label>
        <div className="flex flex-wrap gap-2">
          {['heating', 'security', 'maintenance', 'inspection'].map(tag => (
            <Badge
              key={tag}
              variant={filters.tags.includes(tag) ? 'default' : 'outline'}
              className={`cursor-pointer ${filters.tags.includes(tag) ? '' : getTagColor(tag)
                }`}
              onClick={() => toggleTagFilter(tag)}
            >
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-4 border-t">
        <Button variant="outline" size="sm" className="flex-1" onClick={clearFilters}>
          Clear All
        </Button>
        {onClose && (
          <Button size="sm" className="flex-1" onClick={onClose}>
            Apply
          </Button>
        )}
      </div>
    </div>
  );
}

// Wrapper with Suspense boundary
export default function SiteDiaryPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    }>
      <SiteDiaryPageContent />
    </Suspense>
  );
}
