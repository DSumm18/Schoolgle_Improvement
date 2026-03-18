"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Church, MapPin, Search, Check, AlertCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SchoolChurchStatus, ChurchDenomination } from "@/lib/siams";

interface SiamsChurchStatusProps {
  organizationId: string;
  onRefresh?: () => void;
}

const DENOMINATION_OPTIONS: { value: ChurchDenomination; label: string }[] = [
  { value: "church_of_england", label: "Church of England" },
  { value: "roman_catholic", label: "Roman Catholic" },
  { value: "methodist", label: "Methodist" },
  { value: "other_christian", label: "Other Christian" },
];

const DIOCESE_OPTIONS = [
  "London",
  "Canterbury",
  "York",
  "Birmingham",
  "Manchester",
  "Liverpool",
  "Leeds",
  "Sheffield",
  "Bristol",
  "Norwich",
  "Portsmouth",
  "Southwark",
  "Rochester",
  "Guildford",
  "St Albans",
  "St Asaph",
  "Bangor",
  "Monmouth",
  "Oxford",
  "Peterborough",
  "Truro",
  "Exeter",
  "Salisbury",
  "Winchester",
  "Chichester",
  "Lincoln",
  "Carlisle",
  "Newcastle",
  "Durham",
  "Wakefield",
  "Leicester",
  "Nottingham",
  "Derby",
  "Lichfield",
  "Hereford",
  "Bath & Wells",
  "Gloucester",
  "Coventry",
];

export default function SiamsChurchStatus({
  organizationId,
  onRefresh,
}: SiamsChurchStatusProps) {
  const [status, setStatus] = useState<SchoolChurchStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchMode, setSearchMode] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchURN, setSearchURN] = useState("");
  const [searchName, setSearchName] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<Partial<SchoolChurchStatus>>({});

  useEffect(() => {
    fetchStatus();
  }, [organizationId]);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/siams/church-status?organizationId=${organizationId}`,
      );
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      console.error("Failed to fetch church status:", error);
    } finally {
      setLoading(false);
    }
  };

  const searchSchool = async () => {
    setSearching(true);
    try {
      const response = await fetch("/api/siams/school-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          urn: searchURN || undefined,
          name: searchName || undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.schools || []);
      }
    } catch (error) {
      console.error("Failed to search school:", error);
    } finally {
      setSearching(false);
    }
  };

  const saveStatus = async () => {
    try {
      const response = await fetch("/api/siams/church-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          ...editData,
        }),
      });

      if (response.ok) {
        setEditMode(false);
        fetchStatus();
        onRefresh?.();
      }
    } catch (error) {
      console.error("Failed to save status:", error);
    }
  };

  const selectSchool = (school: any) => {
    setEditData({
      is_church_school: school.is_church_school,
      church_denomination: school.church_denomination,
      diocese: school.diocese,
      parish: school.parish || "",
      urn: school.urn,
      la_code: school.local_authority,
    });
    setSearchMode(false);
    setSearchResults([]);
  };

  const openEditMode = () => {
    if (status) {
      setEditData({ ...status });
    }
    setEditMode(true);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-12">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Status Card */}
      <Card
        className={
          status?.is_church_school ? "border-violet-200 bg-violet-50/50" : ""
        }
      >
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div
                className={`p-3 rounded-lg ${status?.is_church_school ? "bg-violet-100" : "bg-slate-100"}`}
              >
                <Church className="w-6 h-6 text-violet-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold">
                  {status?.is_church_school
                    ? "Church School"
                    : "Not a Church School"}
                </h3>
                {status?.church_denomination && (
                  <p className="text-sm text-slate-600 mt-1">
                    <Badge variant="outline" className="mr-2">
                      {DENOMINATION_OPTIONS.find(
                        (d) => d.value === status.church_denomination,
                      )?.label || status.church_denomination}
                    </Badge>
                    {status.diocese && <>Diocese of {status.diocese}</>}
                  </p>
                )}
                {status?.parish && (
                  <p className="text-sm text-slate-600">
                    Parish: {status.parish}
                  </p>
                )}
                {status?.urn && (
                  <p className="text-xs text-slate-500 mt-1">
                    URN: {status.urn}
                  </p>
                )}
              </div>
            </div>
            <Button variant="outline" onClick={openEditMode}>
              Update Status
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Edit Mode / Setup */}
      {editMode && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="font-bold flex items-center gap-2">
              <Church className="w-5 h-5" />
              Configure Church School Status
            </h3>

            {/* DFE Lookup */}
            <div className="border rounded-lg p-4 bg-slate-50">
              <div className="flex items-center gap-2 mb-3">
                <Search className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-medium">
                  Lookup School in DFE Database (Get Information about Schools)
                </span>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter URN or school name..."
                  value={searchURN || searchName}
                  onChange={(e) => {
                    setSearchURN(e.target.value);
                    setSearchName(e.target.value);
                  }}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") searchSchool();
                  }}
                />
                <Button onClick={searchSchool} disabled={searching}>
                  {searching ? "Searching..." : "Search"}
                </Button>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                  {searchResults.map((school, idx) => (
                    <div
                      key={idx}
                      onClick={() => selectSchool(school)}
                      className="p-2 bg-white rounded border cursor-pointer hover:bg-violet-50 transition-colors"
                    >
                      <p className="font-medium text-sm">{school.name}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>{school.local_authority}</span>
                        {school.is_church_school && (
                          <Badge variant="outline" className="text-violet-600">
                            {school.church_denomination}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Manual Entry */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="is_church_school"
                  checked={editData.is_church_school || false}
                  onCheckedChange={(checked) =>
                    setEditData({ ...editData, is_church_school: !!checked })
                  }
                />
                <label
                  htmlFor="is_church_school"
                  className="text-sm font-medium cursor-pointer"
                >
                  This is a Church School
                </label>
              </div>

              {editData.is_church_school && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Denomination *</Label>
                      <Select
                        value={editData.church_denomination || ""}
                        onValueChange={(value: ChurchDenomination) =>
                          setEditData({
                            ...editData,
                            church_denomination: value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select denomination" />
                        </SelectTrigger>
                        <SelectContent>
                          {DENOMINATION_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Diocese</Label>
                      <Select
                        value={editData.diocese || ""}
                        onValueChange={(value) =>
                          setEditData({ ...editData, diocese: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select diocese" />
                        </SelectTrigger>
                        <SelectContent>
                          {DIOCESE_OPTIONS.map((diocese) => (
                            <SelectItem key={diocese} value={diocese}>
                              {diocese}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="parish">Parish</Label>
                      <Input
                        id="parish"
                        value={editData.parish || ""}
                        onChange={(e) =>
                          setEditData({ ...editData, parish: e.target.value })
                        }
                        placeholder="e.g., St Mary's"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="urn">URN</Label>
                      <Input
                        id="urn"
                        value={editData.urn || ""}
                        onChange={(e) =>
                          setEditData({ ...editData, urn: e.target.value })
                        }
                        placeholder="School URN"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditMode(false)}>
                Cancel
              </Button>
              <Button
                onClick={saveStatus}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Save Status
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900">
                About SIAMS Inspections
              </p>
              <p className="text-sm text-blue-700 mt-1">
                The Statutory Inspection of Anglican and Methodist Schools
                (SIAMS) evaluates how effective the school is as a church
                school. Schools are rated on a 4-point scale: Excellent, Good,
                Requires Improvement, or Ineffective. Configure your church
                school status above to enable SIAMS framework features.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
