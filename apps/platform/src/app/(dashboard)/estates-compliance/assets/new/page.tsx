'use client';

/**
 * New Asset Page
 */

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NewAssetPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      asset_type: formData.get('asset_type'),
      name: formData.get('name'),
      category: formData.get('category'),
      building: formData.get('building'),
      floor: formData.get('floor'),
      room: formData.get('room'),
      manufacturer: formData.get('manufacturer'),
      model: formData.get('model'),
      serial_number: formData.get('serial_number'),
      compliance_domains: formData.getAll('compliance_domains'),
    };

    try {
      // TODO: Get organization_id from auth
      const response = await fetch('/api/estates/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: 'TODO-from-auth',
          ...data,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create asset');
      }

      router.push('/estates-compliance/assets');
    } catch (error) {
      console.error('Error creating asset:', error);
      alert(error instanceof Error ? error.message : 'Failed to create asset');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/estates-compliance/assets"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to Assets
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Add New Asset</h1>
        <p className="text-muted-foreground mt-1">
          Register a new asset in the compliance system
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border bg-card p-6">
        {/* Asset Type */}
        <div className="space-y-2">
          <label htmlFor="asset_type" className="text-sm font-medium">
            Asset Type <span className="text-red-500">*</span>
          </label>
          <select
            id="asset_type"
            name="asset_type"
            required
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="">Select type...</option>
            <option value="building">Building</option>
            <option value="room">Room</option>
            <option value="outlet">Outlet</option>
            <option value="equipment">Equipment</option>
            <option value="fire_extinguisher">Fire Extinguisher</option>
            <option value="emergency_light">Emergency Light</option>
            <option value="lift">Lift</option>
            <option value="playground_equipment">Playground Equipment</option>
            <option value="accessibility_equipment">Accessibility Equipment</option>
            <option value="vehicle">Vehicle</option>
          </select>
        </div>

        {/* Name */}
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium">
            Asset Name <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="e.g., Classroom 1 Cold Water Tap"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>

        {/* Category */}
        <div className="space-y-2">
          <label htmlFor="category" className="text-sm font-medium">Category</label>
          <input
            id="category"
            name="category"
            type="text"
            placeholder="e.g., cold_water_tap, fire_extinguisher_co2"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Optional category for grouping similar assets
          </p>
        </div>

        {/* Location */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <label htmlFor="building" className="text-sm font-medium">Building</label>
            <input
              id="building"
              name="building"
              type="text"
              placeholder="Main Building"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="floor" className="text-sm font-medium">Floor</label>
            <input
              id="floor"
              name="floor"
              type="text"
              placeholder="Ground"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="room" className="text-sm font-medium">Room</label>
            <input
              id="room"
              name="room"
              type="text"
              placeholder="Classroom 1"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>

        {/* Manufacturer & Model */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="manufacturer" className="text-sm font-medium">Manufacturer</label>
            <input
              id="manufacturer"
              name="manufacturer"
              type="text"
              placeholder="Manufacturer name"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="model" className="text-sm font-medium">Model</label>
            <input
              id="model"
              name="model"
              type="text"
              placeholder="Model number"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>

        {/* Serial Number */}
        <div className="space-y-2">
          <label htmlFor="serial_number" className="text-sm font-medium">Serial Number</label>
          <input
            id="serial_number"
            name="serial_number"
            type="text"
            placeholder="Asset serial number"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>

        {/* Compliance Domains */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Compliance Domains</label>
          <div className="grid gap-2 sm:grid-cols-3">
            {[
              { value: 'legionella', label: 'Legionella' },
              { value: 'fire', label: 'Fire Safety' },
              { value: 'asbestos', label: 'Asbestos' },
              { value: 'electrical', label: 'Electrical' },
              { value: 'mechanical', label: 'Mechanical' },
              { value: 'water', label: 'Water Quality' },
            ].map((domain) => (
              <label key={domain.value} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="compliance_domains"
                  value={domain.value}
                  className="rounded border-gray-300"
                />
                {domain.label}
              </label>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Select which compliance domains this asset applies to
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end pt-4 border-t">
          <Link
            href="/estates-compliance/assets"
            className="inline-flex items-center justify-center rounded-md border bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {isSubmitting ? 'Creating...' : 'Create Asset'}
          </button>
        </div>
      </form>
    </div>
  );
}
