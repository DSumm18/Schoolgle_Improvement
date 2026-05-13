"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { CheckCircle2, Copy, Download, Eye, FileUp, Loader2, Lock, Printer, RefreshCw, Shield, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/SupabaseAuthContext";
import { supabase } from "@/lib/supabase";
import { LOCATION_TYPES } from "@/lib/location-upload";
import { reviewLocationUploadCsv, type LocationUploadReview } from "@/lib/location-upload-review";
import { PASS_ANIMALS, PASS_BADGES, PASS_COLOURS } from "@/lib/pupil-pass";
import { reviewPupilUploadCsv, type PupilUploadReview } from "@/lib/pupil-upload-review";

type Pupil = {
  id: string;
  pupil_id: string;
  first_name: string;
  last_name: string;
  year_group: string;
  current_class: string;
  pass_codename: string | null;
  pass_colour: string | null;
  pass_animal: string | null;
  pass_badge: string | null;
  pass_url: string | null;
  send_status: string | null;
  ehcp: boolean;
  eal: boolean;
  pupil_premium: boolean;
};

type PassCard = Pupil & { qrDataUrl: string };

type PrintFormat = "card" | "book-sticker" | "register";

type PassDraft = {
  colour: string;
  animal: string;
  badge: string;
};

type TemplatePreview = {
  title: string;
  filename: string;
  csv: string;
};

type SetupCounts = {
  locations: number;
  assets: number;
  staff: number;
  pupils: number;
  classes: number;
};

type SetupArea = "locations" | "assets" | "staff" | "pupils" | "classes";

type LocationRecord = {
  id: string;
  location_code: string | null;
  location_name: string;
  location_type: string;
  broad_type: string;
  current_use: string | null;
  area_sqm: number | null;
  capacity: number | null;
};

type AssetRecord = {
  id: string;
  code: string | null;
  name: string;
  category: string | null;
  subcategory: string | null;
  asset_type: string | null;
  status: string | null;
  room: string | null;
  building: string | null;
  floor: string | null;
};

type StaffRecord = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  employee_id: string | null;
  job_title: string | null;
  role_category: string | null;
  is_active: boolean;
};

type ClassRecord = {
  id: string;
  year_group: string;
  class_name: string;
  key_stage: string | null;
  room: string | null;
  academic_year: string | null;
  pupil_count: number | null;
  staff_class_assignments?: Array<{
    id: string;
    staff_name: string | null;
    role: string | null;
    is_primary_teacher: boolean | null;
  }>;
};

type SaveFilePickerHandle = {
  createWritable: () => Promise<{
    write: (contents: Blob | string) => Promise<void>;
    close: () => Promise<void>;
  }>;
};

type WindowWithSavePicker = Window & {
  showSaveFilePicker?: (options: {
    suggestedName: string;
    types: Array<{
      description: string;
      accept: Record<string, string[]>;
    }>;
  }) => Promise<SaveFilePickerHandle>;
};

export default function DataUploadPage() {
  const { organizationId } = useAuth();
  const [pupils, setPupils] = useState<Pupil[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [locationImporting, setLocationImporting] = useState(false);
  const [assetImporting, setAssetImporting] = useState(false);
  const [staffImporting, setStaffImporting] = useState(false);
  const [classImporting, setClassImporting] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [setupRequired, setSetupRequired] = useState(false);
  const [setupMessage, setSetupMessage] = useState("");
  const [lastDownloadName, setLastDownloadName] = useState("");
  const [templatePreview, setTemplatePreview] = useState<TemplatePreview | null>(null);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [localSavedPath, setLocalSavedPath] = useState("");
  const [pupilUploadReview, setPupilUploadReview] = useState<PupilUploadReview | null>(null);
  const [locationUploadReview, setLocationUploadReview] = useState<LocationUploadReview | null>(null);
  const [setupCounts, setSetupCounts] = useState<SetupCounts | null>(null);
  const [openArea, setOpenArea] = useState<SetupArea | null>("locations");
  const [locations, setLocations] = useState<LocationRecord[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [assets, setAssets] = useState<AssetRecord[]>([]);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [staffRecords, setStaffRecords] = useState<StaffRecord[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [classRecords, setClassRecords] = useState<ClassRecord[]>([]);
  const [classesLoading, setClassesLoading] = useState(false);
  const [setupLoadErrors, setSetupLoadErrors] = useState<string[]>([]);
  const [locationSearch, setLocationSearch] = useState("");
  const [showTbcOnly, setShowTbcOnly] = useState(false);
  const [editingPassId, setEditingPassId] = useState<string | null>(null);
  const [passDraft, setPassDraft] = useState<PassDraft>({ colour: "Blue", animal: "Fox", badge: "" });

  const classes = useMemo(
    () => [...new Set(pupils.map((pupil) => pupil.current_class).filter(Boolean))].sort(),
    [pupils],
  );

  const fetchPupils = useCallback(async (includePassUrls = false) => {
    if (!organizationId) return [];
    setLoading(true);
    const params = new URLSearchParams({ organizationId });
    if (includePassUrls) params.set("includePassUrls", "true");
    const res = await fetch(`/api/data-upload/pupils?${params.toString()}`, {
      headers: await authHeaders(),
    });
    const data = await res.json();
    if (res.ok) {
      setPupils(data.pupils ?? []);
      setSetupRequired(Boolean(data.setupRequired));
      setSetupMessage(data.message || "");
    }
    else toast.error(data.error || "Could not load pupils");
    setLoading(false);
    return data.pupils ?? [];
  }, [organizationId]);

  const fetchLocations = useCallback(async () => {
    if (!organizationId) return [];
    setLocationsLoading(true);
    setSetupLoadErrors((current) => current.filter((error) => !error.startsWith("Locations:")));
    try {
      const params = new URLSearchParams({ organizationId });
      const res = await fetch(`/api/data-upload/locations?${params.toString()}`, {
        headers: await authHeaders(),
      });
      const data = await res.json();
      if (res.ok) {
        const loadedLocations = data.locations ?? [];
        setLocations(loadedLocations);
        return loadedLocations;
      }
      toast.error(data.error || "Could not load locations");
      setSetupLoadErrors((current) => [...current, `Locations: ${data.error || res.statusText}`]);
      return [];
    } catch {
      toast.error("Could not load locations");
      setSetupLoadErrors((current) => [...current, "Locations: request failed"]);
      return [];
    } finally {
      setLocationsLoading(false);
    }
  }, [organizationId]);

  const fetchAssets = useCallback(async () => {
    if (!organizationId) return [];
    setAssetsLoading(true);
    setSetupLoadErrors((current) => current.filter((error) => !error.startsWith("Assets:")));
    try {
      const params = new URLSearchParams({ organizationId });
      const res = await fetch(`/api/data-upload/assets?${params.toString()}`, {
        headers: await authHeaders(),
      });
      const data = await res.json();
      if (res.ok) {
        const loadedAssets = data.assets ?? [];
        setAssets(loadedAssets);
        return loadedAssets;
      }
      toast.error(data.error || "Could not load assets");
      setSetupLoadErrors((current) => [...current, `Assets: ${data.error || res.statusText}`]);
      return [];
    } catch {
      toast.error("Could not load assets");
      setSetupLoadErrors((current) => [...current, "Assets: request failed"]);
      return [];
    } finally {
      setAssetsLoading(false);
    }
  }, [organizationId]);

  const fetchStaffRecords = useCallback(async () => {
    if (!organizationId) return [];
    setStaffLoading(true);
    setSetupLoadErrors((current) => current.filter((error) => !error.startsWith("Staff:")));
    try {
      const params = new URLSearchParams({ organizationId, source: "db" });
      const res = await fetch(`/api/staff?${params.toString()}`, {
        headers: await authHeaders(),
      });
      const data = await res.json();
      if (res.ok) {
        const loadedStaff = data.staff ?? [];
        setStaffRecords(loadedStaff);
        return loadedStaff;
      }
      toast.error(data.error || "Could not load staff");
      setSetupLoadErrors((current) => [...current, `Staff: ${data.error || res.statusText}`]);
      return [];
    } catch {
      toast.error("Could not load staff");
      setSetupLoadErrors((current) => [...current, "Staff: request failed"]);
      return [];
    } finally {
      setStaffLoading(false);
    }
  }, [organizationId]);

  const fetchClassRecords = useCallback(async () => {
    if (!organizationId) return [];
    setClassesLoading(true);
    setSetupLoadErrors((current) => current.filter((error) => !error.startsWith("Classes:")));
    try {
      const params = new URLSearchParams({ organizationId });
      const res = await fetch(`/api/data-upload/classes?${params.toString()}`, {
        headers: await authHeaders(),
      });
      const data = await res.json();
      if (res.ok) {
        const loadedClasses = data.classes ?? [];
        setClassRecords(loadedClasses);
        return loadedClasses;
      }
      toast.error(data.error || "Could not load classes");
      setSetupLoadErrors((current) => [...current, `Classes: ${data.error || res.statusText}`]);
      return [];
    } catch {
      toast.error("Could not load classes");
      setSetupLoadErrors((current) => [...current, "Classes: request failed"]);
      return [];
    } finally {
      setClassesLoading(false);
    }
  }, [organizationId]);

  const fetchSetupStatus = useCallback(async () => {
    if (!organizationId) return;
    const params = new URLSearchParams({ organizationId });
    const res = await fetch(`/api/data-upload/setup-status?${params.toString()}`, {
      headers: await authHeaders(),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setSetupCounts(data.counts ?? null);
    } else {
      setSetupLoadErrors((current) => [
        ...current.filter((error) => !error.startsWith("Setup counts:")),
        `Setup counts: ${data.error || res.statusText}`,
      ]);
    }
  }, [organizationId]);

  useEffect(() => {
    if (organizationId) {
      fetchPupils();
      fetchLocations();
      fetchAssets();
      fetchStaffRecords();
      fetchClassRecords();
      fetchSetupStatus();
    }
  }, [organizationId, fetchPupils, fetchLocations, fetchAssets, fetchStaffRecords, fetchClassRecords, fetchSetupStatus]);

  useEffect(() => {
    if (openArea === "locations") fetchLocations();
    if (openArea === "assets") fetchAssets();
    if (openArea === "staff") fetchStaffRecords();
    if (openArea === "classes") fetchClassRecords();
  }, [openArea, fetchLocations, fetchAssets, fetchStaffRecords, fetchClassRecords]);

  async function updateLocationType(locationId: string, locationType: string) {
    const res = await fetch("/api/data-upload/locations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify({ organizationId, id: locationId, location_type: locationType }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Could not update location type");
      return;
    }
    setLocations((current) =>
      current.map((location) => (location.id === locationId ? data.location : location)),
    );
    toast.success("Location type updated");
    await fetchSetupStatus();
  }

  async function reviewPupilCsv(file: File) {
    const csvText = await readTemplateFile(file);
    const review = reviewPupilUploadCsv(csvText, file.name);
    setPupilUploadReview(review);
    if (review.errors.length > 0) {
      toast.error(`Found ${review.errors.length} issue${review.errors.length === 1 ? "" : "s"} to fix before import`);
      return;
    }
    toast.success(`Ready to import ${review.validRows} pupil row${review.validRows === 1 ? "" : "s"}`);
  }

  async function importCsv(review = pupilUploadReview) {
    if (!review) return;
    if (review.errors.length > 0) {
      toast.error("Fix the CSV issues before importing");
      return;
    }
    setImporting(true);
    try {
      const res = await fetch("/api/data-upload/pupils", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await authHeaders()) },
        body: JSON.stringify({ organizationId, csvText: review.csvText }),
      });
      const data = await res.json();
      if (!res.ok) {
        const errors = data.details?.errors || [data.error || "Upload failed"];
        toast.error(errors.join(" "));
        if (data.code === "PUPIL_STORAGE_NOT_READY") {
          setSetupRequired(true);
          setSetupMessage(data.error);
        }
        return;
      }
      toast.success(`Imported ${data.imported} pupils and created Pupil Passes`);
      setPupilUploadReview(null);
      await fetchPupils();
      await fetchSetupStatus();
    } catch {
      toast.error("Could not upload pupil CSV");
    } finally {
      setImporting(false);
    }
  }

  async function reviewLocationCsv(file: File) {
    const csvText = await readTemplateFile(file);
    const review = reviewLocationUploadCsv(csvText, file.name);
    setLocationUploadReview(review);
    if (review.errors.length > 0) {
      toast.error(`Found ${review.errors.length} location issue${review.errors.length === 1 ? "" : "s"} to fix before import`);
      return;
    }
    toast.success(`Checked ${review.validRows} location row${review.validRows === 1 ? "" : "s"} — ready to import`);
  }

  async function downloadLocationExport() {
    const filename = "schoolgle-locations-current.xlsx";
    try {
      const res = await fetch("/api/data-upload/locations/export", {
        headers: await authHeaders(),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(data?.error || "Could not download current locations");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setLastDownloadName(filename);
      toast.success(`Downloaded current locations: ${filename}`);
    } catch {
      toast.error("Could not download current locations");
    }
  }

  async function importLocationCsv(review = locationUploadReview) {
    if (!organizationId || !review) return;
    if (review.errors.length > 0) {
      toast.error("Fix the location file issues before importing");
      return;
    }
    setLocationImporting(true);
    try {
      const res = await fetch("/api/data-upload/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await authHeaders()) },
        body: JSON.stringify({ organizationId, csvText: review.csvText }),
      });
      const data = await res.json();
      if (!res.ok) {
        const errors = data.details?.errors || [data.error || "Location upload failed"];
        toast.error(errors.join(" "));
        return;
      }
      toast.success(`Locations import complete: ${data.imported || 0} added, ${data.updated || 0} updated`);
      if (data.warnings?.length) toast.warning(data.warnings.slice(0, 2).join(" "));
      setLocationUploadReview(null);
      if (openArea === "locations") await fetchLocations();
      await fetchSetupStatus();
    } catch {
      toast.error("Could not upload locations file");
    } finally {
      setLocationImporting(false);
    }
  }

  async function importAssetCsv(file: File) {
    if (!organizationId) return;
    setAssetImporting(true);
    try {
      const csvText = await readTemplateFile(file);
      const res = await fetch("/api/data-upload/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await authHeaders()) },
        body: JSON.stringify({ organizationId, csvText }),
      });
      const data = await res.json();
      if (!res.ok) {
        const errors = data.details?.errors || [data.error || "Asset upload failed"];
        toast.error(errors.join(" "));
        return;
      }
      toast.success(`Assets import complete: ${data.imported || 0} added, ${data.updated || 0} updated`);
      if (data.warnings?.length) toast.warning(data.warnings.slice(0, 2).join(" "));
      await fetchSetupStatus();
    } catch {
      toast.error("Could not upload assets file");
    } finally {
      setAssetImporting(false);
    }
  }

  async function importStaffCsv(file: File) {
    if (!organizationId) return;
    setStaffImporting(true);
    try {
      const csvData = await readTemplateFile(file);
      const res = await fetch("/api/staff/import", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await authHeaders()) },
        body: JSON.stringify({ organizationId, csvData }),
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        const errors = data.errors?.map((error: { error: string }) => error.error) || [
          data.error || "Staff upload failed",
        ];
        toast.error(errors.join(" "));
        return;
      }
      toast.success(
        `Staff import complete: ${data.imported || 0} added, ${data.updated || 0} updated, ${data.archived || 0} archived`,
      );
      await fetchSetupStatus();
    } catch {
      toast.error("Could not upload staff CSV");
    } finally {
      setStaffImporting(false);
    }
  }

  async function importClassCsv(file: File) {
    if (!organizationId) return;
    setClassImporting(true);
    try {
      const csvText = await readTemplateFile(file);
      const res = await fetch("/api/data-upload/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await authHeaders()) },
        body: JSON.stringify({ organizationId, csvText }),
      });
      const data = await res.json();
      if (!res.ok) {
        const errors = data.details?.errors || [data.error || "Class upload failed"];
        toast.error(errors.join(" "));
        return;
      }
      toast.success(
        `Class import complete: ${data.imported || 0} classes, ${data.assignments || 0} staff assignments`,
      );
      if (data.warnings?.length) toast.warning(data.warnings.slice(0, 2).join(" "));
      await fetchSetupStatus();
    } catch {
      toast.error("Could not upload class CSV");
    } finally {
      setClassImporting(false);
    }
  }

  async function showTemplate(title: string, filename: string, url: string) {
    setLoadingTemplate(true);
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) {
        toast.error("Could not open the template");
        return;
      }
      const csv = await res.text();
      setTemplatePreview({ title, filename, csv });
      toast.success("Template opened on this page");
    } catch {
      toast.error("Could not open the template");
    } finally {
      setLoadingTemplate(false);
    }
  }

  async function saveTemplateFile(filename: string, url: string) {
    try {
      const savePicker = (window as WindowWithSavePicker).showSaveFilePicker;
      const handle = savePicker
        ? await savePicker({
            suggestedName: filename,
            types: [
              {
                description: "CSV spreadsheet",
                accept: { "text/csv": [".csv"] },
              },
            ],
          })
        : null;

      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) {
        toast.error("Could not prepare the template");
        return;
      }
      const csv = await res.text();

      if (handle) {
        const writable = await handle.createWritable();
        await writable.write(new Blob([csv], { type: "text/csv;charset=utf-8" }));
        await writable.close();
        toast.success(`Saved ${filename}`);
        return;
      }

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
      toast.success(`Download started: ${filename}`);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      toast.error("Could not save the template file");
    }
  }

  async function savePupilTemplateToLocalDownloads() {
    try {
      const res = await fetch("/api/data-upload/pupils/template/save-local", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Could not create the template file");
        return;
      }
      setLocalSavedPath(data.path);
      toast.success(`Created ${data.filename} in Downloads`);
    } catch {
      toast.error("Could not create the template file");
    }
  }

  async function copyTemplate() {
    if (!templatePreview) return;
    try {
      await navigator.clipboard.writeText(templatePreview.csv);
      toast.success("Template copied. Paste it into Excel or Google Sheets.");
    } catch {
      toast.error("Could not copy the template");
    }
  }

  async function regeneratePass(pupil: Pupil) {
    const res = await fetch(`/api/data-upload/pupils/${pupil.id}/pass`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify({ organizationId, regenerateToken: true }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || "Could not regenerate pass");
      return;
    }
    toast.success(`Regenerated ${pupil.pass_codename || pupil.first_name}'s pass`);
    await fetchPupils();
  }

  function startEditingPass(pupil: Pupil) {
    setEditingPassId(pupil.id);
    setPassDraft({
      colour: pupil.pass_colour || "Blue",
      animal: pupil.pass_animal || "Fox",
      badge: pupil.pass_badge || "",
    });
  }

  async function savePassCharacter(pupil: Pupil) {
    const res = await fetch(`/api/data-upload/pupils/${pupil.id}/pass`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify({
        organizationId,
        passColour: passDraft.colour,
        passAnimal: passDraft.animal,
        passBadge: passDraft.badge || null,
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || "Could not update pass character");
      return;
    }
    toast.success(`Updated ${pupil.first_name}'s pass character`);
    setEditingPassId(null);
    await fetchPupils();
  }

  async function printPasses(format: PrintFormat = "card", className?: string) {
    setPrinting(true);
    try {
      const list = (await fetchPupils(true)).filter((pupil: Pupil) =>
        className ? pupil.current_class === className : true,
      );
      const cards: PassCard[] = [];
      for (const pupil of list) {
        if (!pupil.pass_url) continue;
        cards.push({
          ...pupil,
          qrDataUrl: await QRCode.toDataURL(pupil.pass_url, {
            errorCorrectionLevel: "H",
            margin: 1,
            width: 260,
            color: { dark: "#020617", light: "#ffffff" },
          }),
        });
      }
      openPrintWindow(cards, className, format);
    } finally {
      setPrinting(false);
    }
  }

  const counts = {
    locations: Math.max(setupCounts?.locations ?? 0, locations.length),
    assets: Math.max(setupCounts?.assets ?? 0, assets.length),
    staff: Math.max(setupCounts?.staff ?? 0, staffRecords.length),
    pupils: Math.max(setupCounts?.pupils ?? 0, pupils.length),
    classes: Math.max(setupCounts?.classes ?? 0, classRecords.length),
  };
  const setupSteps = [
    {
      key: "locations" as const,
      step: 1,
      title: "Locations",
      count: counts.locations,
      description: "Sites, buildings, floors, classrooms, toilets, boiler rooms and outdoor spaces.",
      filename: "schoolgle-locations-current.xlsx",
      downloadLabel: "Download current locations",
      onDownload: downloadLocationExport,
      onUpload: reviewLocationCsv,
      busy: locationImporting,
      locked: false,
    },
    {
      key: "assets" as const,
      step: 2,
      title: "Assets",
      count: counts.assets,
      description: "Equipment and physical assets linked back to the rooms and areas you uploaded.",
      downloadHref: "/api/data-upload/assets/template",
      excelHref: "/api/data-upload/assets/template?format=excel",
      filename: "schoolgle-assets-template-styled.xls",
      downloadLabel: "Download asset import template",
      onUpload: importAssetCsv,
      busy: assetImporting,
      locked: counts.locations === 0,
      lockedReason: "Upload locations first so assets can be placed correctly.",
    },
    {
      key: "staff" as const,
      step: 3,
      title: "Staff",
      count: counts.staff,
      description: "Staff records for responsibilities, HR workflows, class assignments and module routing.",
      downloadHref: "/api/staff/import/template",
      excelHref: "/api/staff/import/template?format=excel",
      filename: "staff_directory_template_styled.xls",
      onUpload: importStaffCsv,
      busy: staffImporting,
      locked: counts.assets === 0,
      lockedReason: "Upload assets first, even if it is just the starter essentials.",
    },
    {
      key: "pupils" as const,
      step: 4,
      title: "Pupils",
      count: counts.pupils || pupils.length,
      description: "Pupil roll, class, SEND/EHCP, EAL, PP and child-friendly QR pass preferences.",
      downloadHref: "/api/data-upload/pupils/template",
      excelHref: "/api/data-upload/pupils/template?format=excel",
      filename: "schoolgle-pupil-upload-template-styled.xls",
      onUpload: reviewPupilCsv,
      busy: importing,
      locked: counts.staff === 0,
      lockedReason: "Upload staff first so class ownership is clear.",
    },
    {
      key: "classes" as const,
      step: 5,
      title: "Classes",
      count: counts.classes,
      description: "Classes/groups connected to pupils, rooms and staff email or employee ID.",
      downloadHref: "/api/data-upload/classes/template",
      excelHref: "/api/data-upload/classes/template?format=excel",
      filename: "schoolgle-class-upload-template-styled.xls",
      onUpload: importClassCsv,
      busy: classImporting,
      locked: (counts.pupils || pupils.length) === 0,
      lockedReason: "Upload pupils first so class lists have people to attach to.",
    },
  ];
  const activeStep = setupSteps.find((step) => step.key === openArea) ?? setupSteps[0];

  return (
    <div className="min-h-screen p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-primary">Settings</p>
        <h1 className="text-3xl font-black text-foreground">School Foundations Setup</h1>
        <p className="text-sm text-muted-foreground max-w-3xl">
          A guided setup wizard for the core data Schoolgle relies on: locations, assets, staff,
          pupils and classes. Bulk upload gets the school running; maintenance editing comes next for day-to-day tweaks.
        </p>
      </div>

      <SetupWizardSummary counts={counts} />
      <UploadExplainer />
      <ImportBehaviourNote />

      {setupLoadErrors.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">Some setup data could not be loaded</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {[...new Set(setupLoadErrors)].map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[290px_1fr] lg:items-start">
        <Card className="lg:sticky lg:top-4">
          <CardHeader>
            <CardTitle className="text-base">Setup order</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {setupSteps.map((step) => (
              <button
                key={step.key}
                type="button"
                onClick={() => setOpenArea(step.key)}
                className={`w-full rounded-xl border p-3 text-left transition ${
                  openArea === step.key ? "border-primary bg-primary/5 shadow-sm" : "hover:bg-accent"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 font-semibold">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-black text-primary">
                      {step.step}
                    </span>
                    {step.title}
                  </span>
                  {step.count > 0 ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : step.locked ? <Lock className="h-4 w-4 text-muted-foreground" /> : null}
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <Badge variant={step.count > 0 ? "default" : "secondary"}>{step.count} in system</Badge>
                  <span className="text-xs text-muted-foreground">{step.locked ? "Locked" : "Ready"}</span>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-4">
          {activeStep && (
            <UploadTile
              key={activeStep.key}
              step={activeStep.step}
              title={activeStep.title}
              description={activeStep.description}
              count={activeStep.count}
              active={!activeStep.locked}
              isOpen
              locked={activeStep.locked}
              lockedReason={activeStep.lockedReason}
              downloadHref={activeStep.downloadHref}
              excelHref={activeStep.excelHref}
              downloadFilename={activeStep.filename}
              downloadLabel={activeStep.downloadLabel}
              onDownload={activeStep.onDownload || (() => {
                setLastDownloadName(activeStep.filename);
                toast.success(`Download started: ${activeStep.filename}`);
              })}
              onUpload={activeStep.onUpload}
              busy={activeStep.busy}
              onManage={() => setOpenArea(activeStep.key)}
              compact
            />
          )}

          {openArea === "assets" && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
              <p className="font-semibold">Assets use the live Estates Asset Register.</p>
              <p className="mt-1">
                This setup step is only the bulk import doorway. It writes to <code>estates_assets</code>, the same live register used by Estates, Pathfinder, compliance checks and asset tags.
                For day-to-day edits, open the Asset Register app and manage the record there.
              </p>
            </div>
          )}

          {locationUploadReview && (
            <LocationUploadReviewPanel
              review={locationUploadReview}
              importing={locationImporting}
              onCancel={() => setLocationUploadReview(null)}
              onConfirm={() => importLocationCsv(locationUploadReview)}
            />
          )}

          {openArea === "locations" && (
            <LocationMaintenancePanel
              locations={locations}
              loading={locationsLoading}
              search={locationSearch}
              showTbcOnly={showTbcOnly}
              onSearchChange={setLocationSearch}
              onShowTbcOnlyChange={setShowTbcOnly}
              onTypeChange={updateLocationType}
              onRefresh={fetchLocations}
              onClose={() => setOpenArea("locations")}
            />
          )}

          {openArea === "assets" && (
            <SimpleDataPanel
              title="Assets"
              heading="Live Asset Register preview"
              description="This is a read-only preview of the live Estates Asset Register. Use the Asset Register app for individual edits, history and full compliance fields."
              loading={assetsLoading}
              count={assets.length}
              columns={["Code", "Asset", "Category", "Location", "Status"]}
              rows={assets.map((asset) => [
                asset.code || "No code",
                asset.name,
                [asset.category, asset.subcategory].filter(Boolean).join(" / ") || asset.asset_type || "Not set",
                [asset.building, asset.floor, asset.room].filter(Boolean).join(" · ") || "Not placed",
                asset.status || "Not set",
              ])}
              onRefresh={fetchAssets}
              onClose={() => setOpenArea("assets")}
              primaryActionHref="/estates-compliance/assets"
              primaryActionLabel="Open live Asset Register"
            />
          )}

          {openArea === "staff" && (
            <SimpleDataPanel
              title="Staff"
              loading={staffLoading}
              count={staffRecords.length}
              columns={["Name", "Role", "Email", "Employee ID", "Status"]}
              rows={staffRecords.map((staffMember) => [
                `${staffMember.first_name} ${staffMember.last_name}`,
                staffMember.job_title || staffMember.role_category || "Not set",
                staffMember.email || "No email",
                staffMember.employee_id || "No ID",
                staffMember.is_active ? "Active" : "Inactive",
              ])}
              onRefresh={fetchStaffRecords}
              onClose={() => setOpenArea("staff")}
            />
          )}

          {openArea === "pupils" && (
            <SimpleDataPanel
              title="Pupils"
              loading={loading}
              count={pupils.length}
              columns={["Pupil", "Class", "Pass", "Key fields"]}
              rows={pupils.map((pupil) => [
                `${pupil.first_name} ${pupil.last_name}`,
                pupil.current_class || `Year ${pupil.year_group}`,
                pupil.pass_codename || "Basic QR pass",
                [
                  pupil.send_status ? `SEND ${pupil.send_status}` : "",
                  pupil.ehcp ? "EHCP" : "",
                  pupil.eal ? "EAL" : "",
                  pupil.pupil_premium ? "PP" : "",
                ].filter(Boolean).join(", ") || "None",
              ])}
              onRefresh={() => fetchPupils()}
              onClose={() => setOpenArea("pupils")}
            />
          )}

          {openArea === "classes" && (
            <SimpleDataPanel
              title="Classes"
              loading={classesLoading}
              count={classRecords.length}
              columns={["Class", "Year", "Room", "Staff linked", "Academic year"]}
              rows={classRecords.map((classRecord) => [
                classRecord.class_name,
                classRecord.year_group,
                classRecord.room || "No room",
                (classRecord.staff_class_assignments ?? [])
                  .map((assignment) => `${assignment.staff_name || "Staff"} (${assignment.role || "role"})`)
                  .join(", ") || "No staff linked",
                classRecord.academic_year || "Not set",
              ])}
              onRefresh={fetchClassRecords}
              onClose={() => setOpenArea("classes")}
            />
          )}
        </div>
      </div>

      {lastDownloadName && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Download started: <span className="font-semibold">{lastDownloadName}</span>. It should save to your browser Downloads folder.
        </div>
      )}

      {localSavedPath && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          Template file created here: <span className="font-semibold">{localSavedPath}</span>
        </div>
      )}

      {pupilUploadReview && (
        <PupilUploadReviewPanel
          review={pupilUploadReview}
          importing={importing}
          onCancel={() => setPupilUploadReview(null)}
          onConfirm={() => importCsv(pupilUploadReview)}
        />
      )}

      {templatePreview && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Eye className="h-5 w-5" />
              {templatePreview.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              If the browser download is blocked, copy this CSV and paste it into Excel, Numbers or Google Sheets,
              then save it as <span className="font-semibold">{templatePreview.filename}</span>.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={copyTemplate}>
                <Copy className="h-4 w-4 mr-2" />
                Copy CSV template
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  saveTemplateFile(
                    templatePreview.filename,
                    templatePreview.filename.includes("staff")
                      ? "/api/staff/import/template?inline=true"
                      : "/api/data-upload/pupils/template?inline=true",
                  )
                }
              >
                <Download className="h-4 w-4 mr-2" />
                Save CSV file
              </Button>
              <Button variant="outline" asChild>
                <a
                  href={templatePreview.filename.includes("staff") ? "/api/staff/import/template" : "/api/data-upload/pupils/template"}
                  download={templatePreview.filename}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Try download again
                </a>
              </Button>
            </div>
            <textarea
              className="h-64 w-full rounded-xl border bg-background p-3 font-mono text-xs"
              readOnly
              value={templatePreview.csv}
            />
          </CardContent>
        </Card>
      )}

      {openArea === "pupils" && (
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Pupils & Pupil Passes
            </span>
            <Button size="sm" variant="outline" onClick={() => setOpenArea(null)}>
              Hide section
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {setupRequired && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="font-semibold">Database setup needed before pupil import</p>
              <p className="mt-1">
                {setupMessage ||
                  "The pupil upload screen is ready, but the Supabase tables for pupils and Pupil Passes have not been applied yet."}
              </p>
              <p className="mt-2 text-xs">
                Apply migration: <code>apps/platform/supabase/migrations/20260427_class_builder.sql</code>
              </p>
            </div>
          )}
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
            <div className="flex gap-3">
              <Shield className="mt-0.5 h-5 w-5 shrink-0" />
              <p>
                Each pass uses an encrypted, reprintable QR token. The QR identifies the pupil in the
                backend, while the visible pass name can be child-friendly, like Purple Panda or Blue Fox.
                If preference fields are blank, Schoolgle creates a basic pass automatically.
              </p>
            </div>
          </div>

          <div className="rounded-xl border p-4">
            <p className="text-sm font-semibold">Print options</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Use full cards for lanyards/trays, book stickers for exercise books, or register sheets so staff can match names to QR identities.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button onClick={() => printPasses("card")} disabled={printing || pupils.length === 0}>
                {printing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Printer className="h-4 w-4 mr-2" />}
                Print card passes
              </Button>
              <Button variant="outline" onClick={() => printPasses("book-sticker")} disabled={printing || pupils.length === 0}>
                Book stickers
              </Button>
              <Button variant="outline" onClick={() => printPasses("register")} disabled={printing || pupils.length === 0}>
                Class register sheet
              </Button>
              {classes.map((className) => (
                <Button key={className} variant="ghost" onClick={() => printPasses("card", className)} disabled={printing}>
                  Print {className}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => printPasses("card")} disabled={printing || pupils.length === 0}>
              {printing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Printer className="h-4 w-4 mr-2" />}
              Quick print all cards
            </Button>
            {classes.map((className) => (
              <Button key={className} variant="outline" onClick={() => printPasses("card", className)} disabled={printing}>
                Print {className}
              </Button>
            ))}
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground">Loading pupils...</p>
          ) : pupils.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pupils uploaded yet. Download the template, complete it, then upload the CSV.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-muted-foreground">
                  <tr>
                    <th className="py-2">Pupil</th>
                    <th>Class</th>
                    <th>Pupil Pass</th>
                    <th>Key fields</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pupils.map((pupil) => (
                    <Fragment key={pupil.id}>
                    <tr className="border-t">
                      <td className="py-3 font-medium">{pupil.first_name} {pupil.last_name}</td>
                      <td>{pupil.current_class || `Year ${pupil.year_group}`}</td>
                      <td>
                        <span className="font-semibold">{pupil.pass_codename || "Basic QR pass"}</span>
                        <span className="ml-2 text-muted-foreground">
                          {[pupil.pass_colour, pupil.pass_animal, pupil.pass_badge].filter(Boolean).join(" · ")}
                        </span>
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {pupil.send_status && <Badge variant="secondary">SEND {pupil.send_status}</Badge>}
                          {pupil.ehcp && <Badge variant="secondary">EHCP</Badge>}
                          {pupil.eal && <Badge variant="secondary">EAL</Badge>}
                          {pupil.pupil_premium && <Badge variant="secondary">PP</Badge>}
                        </div>
                      </td>
                      <td className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => startEditingPass(pupil)}>
                            Edit pass
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => regeneratePass(pupil)}>
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Regenerate QR
                          </Button>
                        </div>
                      </td>
                    </tr>
                    {editingPassId === pupil.id && (
                      <tr className="border-t bg-muted/30">
                        <td colSpan={5} className="p-4">
                          <div className="grid gap-3 md:grid-cols-5 md:items-end">
                            <div>
                              <label className="text-xs font-semibold text-muted-foreground">Colour</label>
                              <select
                                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                                value={passDraft.colour}
                                onChange={(event) => setPassDraft((draft) => ({ ...draft, colour: event.target.value }))}
                              >
                                {PASS_COLOURS.map((colour) => <option key={colour}>{colour}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-muted-foreground">Animal</label>
                              <select
                                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                                value={passDraft.animal}
                                onChange={(event) => setPassDraft((draft) => ({ ...draft, animal: event.target.value }))}
                              >
                                {PASS_ANIMALS.map((animal) => <option key={animal}>{animal}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-muted-foreground">Badge</label>
                              <select
                                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                                value={passDraft.badge}
                                onChange={(event) => setPassDraft((draft) => ({ ...draft, badge: event.target.value }))}
                              >
                                <option value="">No badge</option>
                                {PASS_BADGES.map((badge) => <option key={badge}>{badge}</option>)}
                              </select>
                            </div>
                            <div className="rounded-xl border bg-background p-3 text-sm font-bold">
                              Preview: {[passDraft.colour, passDraft.animal, passDraft.badge].filter(Boolean).join(" ")}
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => savePassCharacter(pupil)}>Save</Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingPassId(null)}>Cancel</Button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      )}
    </div>
  );
}

function UploadExplainer() {
  const steps = [
    {
      title: "1. Download",
      detail: "Download the Excel template for the setup step you are working on.",
      icon: "⬇️",
    },
    {
      title: "2. Update",
      detail: "Add or amend the data in the template using the guidance row.",
      icon: "✍️",
    },
    {
      title: "3. Upload",
      detail: "Upload the completed template to populate Schoolgle.",
      icon: "⬆️",
    },
  ];

  return (
    <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-sky-50 via-white to-emerald-50 dark:from-sky-950/20 dark:via-background dark:to-emerald-950/20">
      <CardContent className="p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-md">
            <p className="text-xs font-bold uppercase tracking-wide text-primary">How it works</p>
            <h2 className="text-xl font-black mt-1">Download, complete, upload — done.</h2>
            <p className="text-sm text-muted-foreground mt-2">
              The template is the contract. If the school fills those columns, the data lands in the
              right place and powers Class Builder, Pupil Passes, seating plans, Pathfinder, assets and future assessment tools.
            </p>
          </div>

          <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-3">
            {steps.map((step) => (
              <div
                key={step.title}
                className="rounded-2xl border bg-background/80 p-4 shadow-sm"
              >
                <div className="text-2xl">{step.icon}</div>
                <p className="font-bold mt-2">{step.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{step.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ImportBehaviourNote() {
  return (
    <Card className="border-amber-200 bg-amber-50/70">
      <CardContent className="p-4">
        <div className="flex gap-3">
          <Shield className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
          <div className="space-y-2 text-sm text-amber-950">
            <p className="font-bold">How uploads update existing data</p>
            <p>
              Uploads currently work as a safe update, not a full replacement. If a row has the same stable ID
              already in Schoolgle, allowed fields are updated. New IDs are added. Missing rows are not deleted
              automatically.
            </p>
            <p className="text-xs text-amber-900">
              Recommended next control: download the current Schoolgle data, review new/changed/missing records before
              saving, and only archive missing people after staff confirm it.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MaintenancePlaceholder({
  title,
  onClose,
}: {
  title: string;
  onClose: () => void;
}) {
  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center justify-between gap-3 text-base">
          <span>{title} maintenance</span>
          <Button size="sm" variant="outline" onClick={onClose}>
            Hide section
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-2xl border bg-muted/30 p-4 text-sm text-muted-foreground">
          This section will become the manual maintenance view: search what is already in Schoolgle,
          add one record, edit a record, or archive it without using a spreadsheet. For now, the clean
          bulk setup route is the template download and upload above.
        </div>
      </CardContent>
    </Card>
  );
}

function SimpleDataPanel({
  title,
  heading,
  description,
  loading,
  count,
  columns,
  rows,
  onRefresh,
  onClose,
  primaryActionHref,
  primaryActionLabel,
}: {
  title: string;
  heading?: string;
  description?: string;
  loading: boolean;
  count: number;
  columns: string[];
  rows: string[][];
  onRefresh: () => void;
  onClose: () => void;
  primaryActionHref?: string;
  primaryActionLabel?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center justify-between gap-3 text-base">
          <span>{heading || `${title} maintenance`}</span>
          <span className="flex flex-wrap gap-2">
            {primaryActionHref ? (
              <Button size="sm" asChild>
                <Link href={primaryActionHref}>
                  <Eye className="h-4 w-4 mr-2" />
                  {primaryActionLabel || `Open ${title}`}
                </Link>
              </Button>
            ) : null}
            <Button size="sm" variant="outline" onClick={onRefresh} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Refresh
            </Button>
            <Button size="sm" variant="outline" onClick={onClose}>
              Hide section
            </Button>
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {description ? (
          <p className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
            {description}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{count} in system</Badge>
          <Badge variant="outline">{rows.length} shown</Badge>
        </div>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading {title.toLowerCase()}...</p>
        ) : rows.length === 0 ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            No {title.toLowerCase()} records are showing here yet. If the setup count says records exist, click Refresh.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                <tr>
                  {columns.map((column) => (
                    <th key={column} className="px-3 py-2 font-semibold">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={`${title}-${index}`} className="border-t">
                    {row.map((cell, cellIndex) => (
                      <td key={`${title}-${index}-${cellIndex}`} className="px-3 py-2">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LocationMaintenancePanel({
  locations,
  loading,
  search,
  showTbcOnly,
  onSearchChange,
  onShowTbcOnlyChange,
  onTypeChange,
  onRefresh,
  onClose,
}: {
  locations: LocationRecord[];
  loading: boolean;
  search: string;
  showTbcOnly: boolean;
  onSearchChange: (value: string) => void;
  onShowTbcOnlyChange: (value: boolean) => void;
  onTypeChange: (locationId: string, locationType: string) => void;
  onRefresh: () => void;
  onClose: () => void;
}) {
  const filtered = locations.filter((location) => {
    const haystack = [
      location.location_code,
      location.location_name,
      location.location_type,
      location.current_use,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    const matchesSearch = haystack.includes(search.trim().toLowerCase());
    const matchesTbc = !showTbcOnly || location.location_type === "TBC / Other";
    return matchesSearch && matchesTbc;
  });

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center justify-between gap-3 text-base">
          <span>Locations maintenance</span>
          <span className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={onRefresh} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Refresh
            </Button>
            <Button size="sm" variant="outline" onClick={onClose}>
              Hide section
            </Button>
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">
          Location type is controlled. Use the dropdown to classify rooms cleanly; anything blank or odd from upload lands as
          <span className="font-semibold"> TBC / Other</span> so it can be filtered and fixed later.
        </div>
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search by room, code, type or use..."
            className="md:max-w-sm"
          />
          <label className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
            <input
              type="checkbox"
              checked={showTbcOnly}
              onChange={(event) => onShowTbcOnlyChange(event.target.checked)}
            />
            Show TBC only
          </label>
          <Badge variant="secondary">{locations.length} in system</Badge>
          <Badge variant="outline">{filtered.length} shown</Badge>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading locations...</p>
        ) : locations.length === 0 ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            No locations are showing here yet. If the count above says locations exist, click Refresh; otherwise use
            Download current locations / Upload completed Excel to create the first rooms.
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            {locations.length} location{locations.length === 1 ? "" : "s"} are in the system, but none match the current
            search/filter. Clear the search or untick Show TBC only.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="p-2">Code</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Use</th>
                  <th>Size</th>
                  <th>Capacity</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((location) => (
                  <tr key={location.id} className="border-t">
                    <td className="p-2 font-semibold">{location.location_code || "—"}</td>
                    <td>{location.location_name}</td>
                    <td className="min-w-56">
                      <select
                        className="w-full rounded-md border bg-background px-2 py-1 text-sm"
                        value={location.location_type || "TBC / Other"}
                        onChange={(event) => onTypeChange(location.id, event.target.value)}
                      >
                        {LOCATION_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>{location.current_use || "—"}</td>
                    <td>{location.area_sqm ? `${location.area_sqm} sqm` : "—"}</td>
                    <td>{location.capacity ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LocationUploadReviewPanel({
  review,
  importing,
  onCancel,
  onConfirm,
}: {
  review: LocationUploadReview;
  importing: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const canImport = review.errors.length === 0 && review.validRows > 0;

  return (
    <Card className="border-sky-300 bg-sky-50/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Shield className="h-5 w-5" />
          Review locations import before saving
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl border border-sky-200 bg-white p-4 text-sm">
          <p className="font-semibold">{review.filename}</p>
          <p className="mt-1 text-muted-foreground">
            The file has been checked but not saved yet. Confirm below to add new rooms and update matching location codes.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-5">
          <ReviewStat label="File rows" value={review.totalRows} />
          <ReviewStat label="Valid locations" value={review.validRows} />
          <ReviewStat label="Header row" value={review.headerRow || "Not found"} />
          <ReviewStat label="TBC types" value={review.stats.tbcCount} tone={review.stats.tbcCount ? undefined : "good"} />
          <ReviewStat label="Issues" value={review.errors.length} tone={review.errors.length ? "danger" : "good"} />
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <ReviewBreakdown title="Location types found" items={review.stats.types} />
          <div className="rounded-xl border bg-white p-4">
            <p className="font-semibold">Parent links found</p>
            <p className="mt-2 text-2xl font-black">{review.stats.parentLinks}</p>
            <p className="mt-1 text-sm text-muted-foreground">Rows with a parent location code, e.g. a room linked to a floor or building.</p>
          </div>
        </div>

        {(review.errors.length > 0 || review.warnings.length > 0) && (
          <div className="grid gap-3 lg:grid-cols-2">
            {review.errors.length > 0 && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
                <p className="font-semibold">Fix before import</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {review.errors.slice(0, 8).map((error) => <li key={error}>{error}</li>)}
                </ul>
                {review.errors.length > 8 && <p className="mt-2 text-xs">+ {review.errors.length - 8} more issues</p>}
              </div>
            )}
            {review.warnings.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <p className="font-semibold">Warnings / tidy-up notes</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {review.warnings.slice(0, 8).map((warning) => <li key={warning}>{warning}</li>)}
                </ul>
                {review.warnings.length > 8 && <p className="mt-2 text-xs">+ {review.warnings.length - 8} more warnings</p>}
              </div>
            )}
          </div>
        )}

        <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
              <tr>
                <th className="p-2">Spreadsheet row</th>
                <th>Code</th>
                <th>Name</th>
                <th>Type</th>
                <th>Parent</th>
                <th>Use</th>
                <th>Area</th>
                <th>Capacity</th>
              </tr>
            </thead>
            <tbody>
              {review.sampleRows.map((row) => (
                <tr key={`${row.rowNumber}-${row.location_code}`} className="border-t">
                  <td className="p-2 font-semibold">Row {row.rowNumber}</td>
                  <td>{row.location_code || "—"}</td>
                  <td>{row.location_name || "—"}</td>
                  <td>
                    <Badge variant={row.location_type === "TBC / Other" ? "outline" : "secondary"}>{row.location_type || "—"}</Badge>
                  </td>
                  <td>{row.parent_location_code || "—"}</td>
                  <td>{row.current_use || "—"}</td>
                  <td>{row.area_sqm || "—"}</td>
                  <td>{row.capacity || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-muted-foreground">
          Showing {review.sampleRows.length} sample row{review.sampleRows.length === 1 ? "" : "s"} from across the file so you can check the mapping before it touches the database.
        </p>

        <div className="flex flex-wrap gap-2">
          <Button onClick={onConfirm} disabled={!canImport || importing}>
            {importing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileUp className="h-4 w-4 mr-2" />}
            Confirm import to database
          </Button>
          <Button variant="outline" onClick={onCancel} disabled={importing}>
            Cancel / choose another file
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function PupilUploadReviewPanel({
  review,
  importing,
  onCancel,
  onConfirm,
}: {
  review: PupilUploadReview;
  importing: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const canImport = review.errors.length === 0 && review.validRows > 0;

  return (
    <Card className="border-primary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Shield className="h-5 w-5" />
          Review pupil import before saving
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-4">
          <ReviewStat label="File rows" value={review.totalRows} />
          <ReviewStat label="Valid pupil rows" value={review.validRows} />
          <ReviewStat label="Header row" value={review.headerRow || "Not found"} />
          <ReviewStat label="Issues" value={review.errors.length} tone={review.errors.length ? "danger" : "good"} />
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <ReviewStat label="SEND rows" value={review.stats.sendCount} />
          <ReviewStat label="EHCP rows" value={review.stats.ehcpCount} />
          <ReviewStat label="EAL rows" value={review.stats.ealCount} />
          <ReviewStat label="Pupil Premium rows" value={review.stats.pupilPremiumCount} />
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <ReviewBreakdown title="Year groups found" items={review.stats.yearGroups} />
          <ReviewBreakdown title="Classes found" items={review.stats.classes} />
        </div>

        {(review.errors.length > 0 || review.warnings.length > 0) && (
          <div className="grid gap-3 lg:grid-cols-2">
            {review.errors.length > 0 && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
                <p className="font-semibold">Fix before import</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {review.errors.slice(0, 8).map((error) => <li key={error}>{error}</li>)}
                </ul>
                {review.errors.length > 8 && <p className="mt-2 text-xs">+ {review.errors.length - 8} more issues</p>}
              </div>
            )}
            {review.warnings.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <p className="font-semibold">Warnings</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {review.warnings.slice(0, 8).map((warning) => <li key={warning}>{warning}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
              <tr>
                <th className="p-2">Spreadsheet row</th>
                <th>Pupil ID</th>
                <th>Name</th>
                <th>Year</th>
                <th>Class</th>
                <th>SEND</th>
                <th>EHCP</th>
                <th>EAL</th>
                <th>PP</th>
              </tr>
            </thead>
            <tbody>
              {review.sampleRows.map((row) => (
                <tr key={`${row.rowNumber}-${row.pupil_id}`} className="border-t">
                  <td className="p-2 font-semibold">Row {row.rowNumber}</td>
                  <td>{row.pupil_id || "—"}</td>
                  <td>{[row.first_name, row.last_name].filter(Boolean).join(" ") || "—"}</td>
                  <td>{row.year_group || "—"}</td>
                  <td>{row.current_class || "—"}</td>
                  <td>{row.send_status || "—"}</td>
                  <td>{row.ehcp || "—"}</td>
                  <td>{row.eal || "—"}</td>
                  <td>{row.pupil_premium || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-muted-foreground">
          Showing {review.sampleRows.length} sample row{review.sampleRows.length === 1 ? "" : "s"} from across the file,
          including row five where available, so you can check the mapping before saving anything.
        </p>

        <div className="flex flex-wrap gap-2">
          <Button onClick={onConfirm} disabled={!canImport || importing}>
            {importing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileUp className="h-4 w-4 mr-2" />}
            Confirm import
          </Button>
          <Button variant="outline" onClick={onCancel} disabled={importing}>
            Cancel / choose another file
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ReviewStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone?: "good" | "danger";
}) {
  return (
    <div className={`rounded-xl border p-4 ${tone === "danger" ? "border-red-200 bg-red-50" : tone === "good" ? "border-emerald-200 bg-emerald-50" : "bg-card"}`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
    </div>
  );
}

function ReviewBreakdown({
  title,
  items,
}: {
  title: string;
  items: Array<{ value: string; count: number }>;
}) {
  return (
    <div className="rounded-xl border p-4">
      <p className="font-semibold">{title}</p>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">None found</p>
      ) : (
        <div className="mt-2 flex flex-wrap gap-2">
          {items.slice(0, 10).map((item) => (
            <Badge key={item.value} variant="secondary">
              {item.value}: {item.count}
            </Badge>
          ))}
          {items.length > 10 && <Badge variant="outline">+ {items.length - 10} more</Badge>}
        </div>
      )}
    </div>
  );
}

function SetupWizardSummary({ counts }: { counts: SetupCounts }) {
  return (
    <Card className="overflow-hidden border-primary/20 bg-card">
      <CardContent className="grid gap-5 p-5 lg:grid-cols-[1fr_1.1fr] lg:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-primary">Guided setup</p>
          <h2 className="mt-1 text-xl font-black">Build the school’s source-of-truth foundations</h2>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Work through the imports in order. Templates can be downloaded any time, but uploads unlock in sequence
            so the data lands cleanly: places first, then assets, staff, pupils and classes.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {[
            ["Locations", counts.locations],
            ["Assets", counts.assets],
            ["Staff", counts.staff],
            ["Pupils", counts.pupils],
            ["Classes", counts.classes],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border bg-muted/30 p-3 text-center">
              <p className="text-lg font-black">{value}</p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
              {Number(value) > 0 ? <CheckCircle2 className="mx-auto mt-2 h-4 w-4 text-emerald-600" /> : null}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

async function authHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token
    ? { Authorization: `Bearer ${session.access_token}` }
    : {};
}

async function readTemplateFile(file: File) {
  if (isXlsxFile(file)) {
    const XLSX = await import("xlsx");
    const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
    const firstSheetName = workbook.SheetNames[0];
    const sheet = firstSheetName ? workbook.Sheets[firstSheetName] : null;
    if (!sheet) return "";
    return XLSX.utils.sheet_to_csv(sheet, { blankrows: false });
  }

  const text = await file.text();
  if (!/<table[\s>]/i.test(text) || !/<tr[\s>]/i.test(text)) return text;

  const doc = new DOMParser().parseFromString(text, "text/html");
  const rows = Array.from(doc.querySelectorAll("tr"))
    .map((row) => Array.from(row.querySelectorAll("td,th")).map((cell) => cell.textContent?.trim() ?? ""))
    .filter((row) => row.length > 1);

  return rows.map(toCsvLine).join("\n");
}

function toCsvLine(values: string[]) {
  return values
    .map((value) => {
      if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
      return value;
    })
    .join(",");
}

function isXlsxFile(file: File) {
  const name = file.name.toLowerCase();
  return name.endsWith(".xlsx") || file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
}

function UploadTile({
  step,
  title,
  description,
  count,
  active = false,
  isOpen = false,
  locked = false,
  lockedReason,
  busy = false,
  downloadHref,
  excelHref,
  downloadLabel,
  downloadFilename,
  onDownload,
  onUpload,
  onManage,
  compact = false,
}: {
  step?: number;
  title: string;
  description: string;
  count?: number;
  active?: boolean;
  isOpen?: boolean;
  locked?: boolean;
  lockedReason?: string;
  busy?: boolean;
  downloadHref?: string;
  excelHref?: string;
  downloadLabel?: string;
  downloadFilename?: string;
  onDownload: () => void;
  onUpload?: (file: File) => void;
  onManage?: () => void;
  compact?: boolean;
}) {
  const templateHref = excelHref || downloadHref;
  return (
    <Card className={`${isOpen ? "border-primary shadow-sm" : active ? "border-primary/25" : ""} ${locked ? "opacity-80" : ""}`}>
      <CardHeader className={compact ? "pb-3" : undefined}>
        <CardTitle className="flex items-center justify-between gap-3 text-base">
          <span className="flex items-center gap-2">
            {step ? <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-black text-primary">{step}</span> : null}
            {title}
          </span>
          {locked ? <Lock className="h-4 w-4 text-muted-foreground" /> : count && count > 0 ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : null}
        </CardTitle>
      </CardHeader>
      <CardContent className={compact ? "space-y-3 pt-0" : "space-y-3"}>
        <div className="flex items-center justify-between gap-2">
          <Badge variant={count && count > 0 ? "default" : "secondary"}>{count ?? 0} in system</Badge>
          {locked ? <Badge variant="outline">Locked</Badge> : <Badge variant="outline">Ready</Badge>}
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
        {locked && lockedReason ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">{lockedReason}</p>
        ) : null}
        <div className={compact ? "grid gap-2 md:grid-cols-2" : "space-y-2"}>
          {onManage && !compact ? (
            <Button className="w-full" variant={isOpen ? "default" : "outline"} onClick={onManage}>
              {isOpen ? "Hide details" : count && count > 0 ? "View / maintain" : "Open section"}
            </Button>
          ) : null}
          {templateHref ? (
            <Button className="w-full" asChild>
              <a href={templateHref} download={downloadFilename} onClick={onDownload}>
                <Download className="h-4 w-4 mr-2" />
                {downloadLabel || "Download Excel template"}
              </a>
            </Button>
          ) : (
            <Button className="w-full" onClick={onDownload}>
              <Download className="h-4 w-4 mr-2" />
              {downloadLabel || "Download template"}
            </Button>
          )}
        </div>
        {onUpload ? (
          <label className={`flex w-full items-center justify-center rounded-md border px-3 py-2 text-sm ${locked || busy ? "cursor-not-allowed bg-muted text-muted-foreground" : "cursor-pointer hover:bg-accent"}`}>
            {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileUp className="h-4 w-4 mr-2" />}
            {locked ? "Upload locked" : "Upload completed Excel/CSV"}
            <Input
              type="file"
              accept=".csv,.xls,.xlsx,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
              disabled={busy || locked}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onUpload(file);
                event.currentTarget.value = "";
              }}
            />
          </label>
        ) : (
          <Button variant="ghost" className="w-full" disabled>
            Upload coming next
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function openPrintWindow(cards: PassCard[], className?: string, format: PrintFormat = "card") {
  const title = printTitle(format, className);
  const html = `<!doctype html>
<html>
<head>
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 24px; color: #0f172a; }
    body.book-sticker { margin: 10mm; }
    .book-sticker h1 { font-size: 18px; margin: 0 0 4px; }
    .book-sticker > p { font-size: 11px; margin: 0 0 8px; color: #475569; }
    .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
    .book-sticker .grid { grid-template-columns: repeat(auto-fill, 54mm); gap: 3mm; align-items: start; }
    .register .grid { grid-template-columns: 1fr; gap: 8px; }
    .card { border: 2px solid #cbd5e1; border-radius: 18px; padding: 14px; display: grid; grid-template-columns: 138px 1fr; gap: 14px; break-inside: avoid; background: linear-gradient(135deg, #ffffff, #f8fafc); }
    .book-sticker .card { width: 54mm; height: 22mm; box-sizing: border-box; grid-template-columns: 17mm 1fr; gap: 2.5mm; padding: 2mm; border-radius: 3mm; min-height: unset; overflow: hidden; }
    .register .card { grid-template-columns: 96px 1fr 220px; align-items: center; padding: 10px 12px; border-radius: 12px; }
    .qr-wrap { position: relative; width: 126px; height: 126px; border-radius: 18px; padding: 6px; background: #ffffff; border: 2px solid #e2e8f0; }
    .book-sticker .qr-wrap { width: 15mm; height: 15mm; border-radius: 2mm; padding: 1mm; border-width: 1px; }
    .register .qr-wrap { width: 78px; height: 78px; border-radius: 12px; padding: 4px; }
    .qr { width: 126px; height: 126px; display: block; }
    .book-sticker .qr { width: 15mm; height: 15mm; }
    .register .qr { width: 78px; height: 78px; }
    .qr-badge { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 46px; height: 46px; border-radius: 999px; border: 4px solid #ffffff; box-shadow: 0 8px 18px rgba(15, 23, 42, 0.2); background: #ffffff; object-fit: cover; }
    .book-sticker .qr-badge { width: 5.5mm; height: 5.5mm; border-width: 1px; }
    .register .qr-badge { width: 28px; height: 28px; border-width: 3px; }
    .name { font-size: 22px; font-weight: 800; margin: 0 0 6px; }
    .book-sticker .name { font-size: 10px; margin: 0 0 1px; line-height: 1.1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .register .name { font-size: 18px; margin-bottom: 2px; }
    .meta { color: #475569; font-size: 13px; margin: 2px 0; }
    .book-sticker .meta { font-size: 8px; margin: 0; line-height: 1.1; }
    .codename { font-size: 18px; font-weight: 700; margin: 8px 0; }
    .book-sticker .codename { font-size: 8px; margin: 1px 0 0; line-height: 1.1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .register .codename { font-size: 14px; margin: 2px 0; }
    .identity { display: inline-flex; align-items: center; gap: 6px; border-radius: 999px; padding: 5px 10px; color: #0f172a; font-size: 12px; font-weight: 800; margin: 2px 0 6px; }
    .book-sticker .identity { display: none; }
    .pill { display: inline-block; border-radius: 999px; background: #e0f2fe; padding: 4px 9px; font-size: 12px; font-weight: 700; margin-right: 4px; }
    .book-sticker .pill { display: none; }
    .register-name { display: none; }
    .register .register-name { display: block; font-size: 20px; font-weight: 800; }
    .register .actions { color: #64748b; font-size: 12px; }
    @media print { body { margin: 10mm; } body.book-sticker { margin: 7mm; } .grid { gap: 8px; } .book-sticker .grid { gap: 2.5mm; } }
  </style>
</head>
<body class="${format}">
  <h1>${escapeHtml(title)}</h1>
  <p>${format === "register" ? "Teacher reference sheet: names, classes and pupil QR identities together." : "Scan to start. Teacher view maps each pass to the pupil record."}</p>
  <div class="grid">
    ${cards.map((card) => {
      const colour = passColourHex(card.pass_colour);
      const identity = [card.pass_colour, card.pass_animal, card.pass_badge].filter(Boolean).join(" · ");
      const badgeSvg = characterBadgeDataUrl(card.pass_animal, card.pass_colour, card.pass_badge);
      return `
      <div class="card" style="border-color: ${colour};">
        <div class="qr-wrap">
          <img class="qr" src="${card.qrDataUrl}" alt="QR code for ${escapeHtml(card.pass_codename || card.first_name)}" />
          <img class="qr-badge" src="${badgeSvg}" alt="${escapeHtml(card.pass_codename || "Pupil character")}" />
        </div>
        <div>
          <p class="name">${escapeHtml(card.pass_codename || "Schoolgle Pass")}</p>
          <p class="meta">${escapeHtml(card.current_class || `Year ${card.year_group}`)}</p>
          <div class="identity" style="background: ${colour}22;">${escapeHtml(card.pass_codename || "Schoolgle Pass")}</div>
          <p class="codename">${escapeHtml(identity || "Scan to start")}</p>
          <span class="pill">Scan to start</span>
          <span class="pill">Schoolgle</span>
        </div>
        <div class="register-name">
          ${escapeHtml(`${card.first_name} ${card.last_name}`)}
          <div class="actions">${escapeHtml(card.current_class || `Year ${card.year_group}`)} · ${escapeHtml(card.pass_codename || "Schoolgle Pass")}</div>
        </div>
      </div>
    `}).join("")}
  </div>
  <script>window.onload = () => window.print();</script>
</body>
</html>`;
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    toast.error("Could not open print window");
    return;
  }
  printWindow.document.write(html);
  printWindow.document.close();
}

function printTitle(format: PrintFormat, className?: string) {
  const suffix = className ? ` — ${className}` : "";
  if (format === "book-sticker") return `Schoolgle Book Stickers${suffix}`;
  if (format === "register") return `Schoolgle QR Register${suffix}`;
  return `Schoolgle Pupil Passes${suffix}`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function passColourHex(colour: string | null) {
  const colours: Record<string, string> = {
    Blue: "#3b82f6",
    Green: "#22c55e",
    Purple: "#8b5cf6",
    Yellow: "#eab308",
    Red: "#ef4444",
    Orange: "#f97316",
    Pink: "#ec4899",
    Teal: "#14b8a6",
  };
  return colour ? colours[colour] || "#0ea5e9" : "#0ea5e9";
}

function characterBadgeDataUrl(animal: string | null, colour: string | null, badge: string | null) {
  const fill = passColourHex(colour);
  const animalSvg = animalFaceSvg(animal, fill);
  const badgeSvg = badgeMarkSvg(badge);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
    <defs>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#0f172a" flood-opacity="0.25"/>
      </filter>
    </defs>
    <circle cx="60" cy="60" r="56" fill="${fill}"/>
    <circle cx="60" cy="60" r="48" fill="#ffffff" opacity="0.92" filter="url(#shadow)"/>
    ${animalSvg}
    ${badgeSvg}
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function animalFaceSvg(animal: string | null, colour: string) {
  switch (animal) {
    case "Fox":
      return `<path d="M25 34 45 20l15 20 15-20 20 14-8 48-27 18-27-18z" fill="${colour}"/>
        <path d="M38 58 60 95l22-37-22 10z" fill="#fff7ed"/>
        <circle cx="48" cy="58" r="5" fill="#0f172a"/><circle cx="72" cy="58" r="5" fill="#0f172a"/>
        <path d="M55 75h10l-5 6z" fill="#0f172a"/>`;
    case "Panda":
      return `<circle cx="37" cy="34" r="16" fill="#0f172a"/><circle cx="83" cy="34" r="16" fill="#0f172a"/>
        <circle cx="60" cy="62" r="36" fill="#f8fafc"/>
        <ellipse cx="47" cy="58" rx="11" ry="14" fill="#0f172a"/><ellipse cx="73" cy="58" rx="11" ry="14" fill="#0f172a"/>
        <circle cx="47" cy="57" r="4" fill="#fff"/><circle cx="73" cy="57" r="4" fill="#fff"/>
        <path d="M55 77h10l-5 7z" fill="#0f172a"/>`;
    case "Owl":
      return `<path d="M28 36 44 22h32l16 14v36c0 20-15 34-32 34S28 92 28 72z" fill="${colour}"/>
        <circle cx="48" cy="58" r="15" fill="#fff"/><circle cx="72" cy="58" r="15" fill="#fff"/>
        <circle cx="48" cy="58" r="6" fill="#0f172a"/><circle cx="72" cy="58" r="6" fill="#0f172a"/>
        <path d="M55 76h10l-5 9z" fill="#f59e0b"/>`;
    case "Turtle":
      return `<ellipse cx="60" cy="66" rx="34" ry="28" fill="${colour}"/>
        <circle cx="60" cy="31" r="14" fill="#86efac"/>
        <circle cx="42" cy="67" r="6" fill="#bbf7d0"/><circle cx="60" cy="67" r="8" fill="#bbf7d0"/><circle cx="78" cy="67" r="6" fill="#bbf7d0"/>
        <circle cx="55" cy="29" r="3" fill="#0f172a"/><circle cx="65" cy="29" r="3" fill="#0f172a"/>`;
    case "Bee":
      return `<ellipse cx="60" cy="66" rx="28" ry="34" fill="#facc15"/>
        <path d="M35 52h50M34 66h52M39 80h42" stroke="#0f172a" stroke-width="8"/>
        <circle cx="50" cy="40" r="5" fill="#0f172a"/><circle cx="70" cy="40" r="5" fill="#0f172a"/>
        <ellipse cx="38" cy="50" rx="15" ry="24" fill="#dbeafe" opacity=".85"/><ellipse cx="82" cy="50" rx="15" ry="24" fill="#dbeafe" opacity=".85"/>`;
    case "Lion":
      return `<circle cx="60" cy="60" r="42" fill="#b45309"/>
        <circle cx="60" cy="64" r="30" fill="#f59e0b"/>
        <circle cx="49" cy="57" r="5" fill="#0f172a"/><circle cx="71" cy="57" r="5" fill="#0f172a"/>
        <path d="M54 73h12l-6 7z" fill="#0f172a"/>`;
    case "Otter":
      return `<ellipse cx="60" cy="62" rx="34" ry="38" fill="${colour}"/>
        <ellipse cx="60" cy="72" rx="20" ry="17" fill="#fed7aa"/>
        <circle cx="48" cy="55" r="5" fill="#0f172a"/><circle cx="72" cy="55" r="5" fill="#0f172a"/>
        <path d="M55 68h10l-5 7z" fill="#0f172a"/><path d="M42 76h36" stroke="#0f172a" stroke-width="3" stroke-linecap="round"/>`;
    case "Robin":
      return `<circle cx="60" cy="58" r="34" fill="${colour}"/>
        <circle cx="60" cy="72" r="22" fill="#fb7185"/>
        <path d="M83 55 103 64 83 73z" fill="#f59e0b"/>
        <circle cx="50" cy="50" r="5" fill="#0f172a"/>`;
    default:
      return `<circle cx="60" cy="60" r="34" fill="${colour}"/>
        <path d="M60 28 70 51l25 2-19 16 6 24-22-13-22 13 6-24-19-16 25-2z" fill="#ffffff"/>`;
  }
}

function badgeMarkSvg(badge: string | null) {
  if (!badge) return "";
  const marks: Record<string, string> = {
    Star: `<path d="M93 20 98 31l12 1-9 8 3 12-11-6-11 6 3-12-9-8 12-1z" fill="#facc15" stroke="#fff" stroke-width="3"/>`,
    Moon: `<path d="M102 24c-11 3-18 13-15 25 2 8 8 14 16 17-15 3-29-6-32-21-3-16 8-31 31-21z" fill="#fde68a" stroke="#fff" stroke-width="3"/>`,
    Rocket: `<path d="M88 20c12 3 18 9 21 21L94 56 73 35z" fill="#f97316" stroke="#fff" stroke-width="3"/><circle cx="92" cy="37" r="5" fill="#dbeafe"/>`,
    Leaf: `<path d="M108 22C84 22 75 35 78 56c20 1 32-10 30-34z" fill="#22c55e" stroke="#fff" stroke-width="3"/>`,
    Bolt: `<path d="M94 18 76 52h15l-8 30 29-42H96z" fill="#fde047" stroke="#fff" stroke-width="3"/>`,
    Heart: `<path d="M93 62S73 50 73 35c0-8 10-13 20-4 10-9 20-4 20 4 0 15-20 27-20 27z" fill="#fb7185" stroke="#fff" stroke-width="3"/>`,
  };
  return marks[badge] || "";
}
