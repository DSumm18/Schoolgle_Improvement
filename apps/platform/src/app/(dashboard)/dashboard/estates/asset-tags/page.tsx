"use client";

import { useState, useEffect } from "react";
import { QrCode, Smartphone, Info } from "lucide-react";
import QRCodeGenerator from "@/components/estates/QRCodeGenerator";
import { useAuth } from "@/context/SupabaseAuthContext";

interface Asset {
  id: string;
  name: string;
  location?: string;
  assetType?: string;
  qrCodeId?: string;
}

const DEMO_ASSETS: Asset[] = [
  {
    id: "fe-001",
    name: "Fire Extinguisher - CO2",
    location: "Main Hall",
    assetType: "Fire Safety",
    qrCodeId: "fe-001",
  },
  {
    id: "fe-002",
    name: "Fire Extinguisher - Foam",
    location: "Kitchen",
    assetType: "Fire Safety",
    qrCodeId: "fe-002",
  },
  {
    id: "fe-003",
    name: "Fire Extinguisher - Water",
    location: "Reception",
    assetType: "Fire Safety",
    qrCodeId: "fe-003",
  },
  {
    id: "boiler-01",
    name: "Main Boiler",
    location: "Plant Room",
    assetType: "Heating",
    qrCodeId: "boiler-01",
  },
  {
    id: "boiler-02",
    name: "Secondary Boiler",
    location: "Annexe Plant Room",
    assetType: "Heating",
    qrCodeId: "boiler-02",
  },
  {
    id: "elec-db-01",
    name: "Distribution Board A",
    location: "Main Building Intake",
    assetType: "Electrical",
    qrCodeId: "elec-db-01",
  },
  {
    id: "elec-db-02",
    name: "Distribution Board B",
    location: "Annexe Intake",
    assetType: "Electrical",
    qrCodeId: "elec-db-02",
  },
  {
    id: "leg-01",
    name: "Water Tank (Cold)",
    location: "Roof Space",
    assetType: "Legionella",
    qrCodeId: "leg-01",
  },
  {
    id: "leg-02",
    name: "Calorifier",
    location: "Plant Room",
    assetType: "Legionella",
    qrCodeId: "leg-02",
  },
  {
    id: "asb-01",
    name: "Asbestos Register Location A",
    location: "Ceiling Tiles - Staff Room",
    assetType: "Asbestos",
    qrCodeId: "asb-01",
  },
  {
    id: "alarm-01",
    name: "Fire Alarm Panel",
    location: "Main Entrance",
    assetType: "Fire Safety",
    qrCodeId: "alarm-01",
  },
  {
    id: "hvac-01",
    name: "Air Handling Unit",
    location: "Hall Roof",
    assetType: "HVAC",
    qrCodeId: "hvac-01",
  },
  {
    id: "lift-01",
    name: "Passenger Lift",
    location: "Main Stairwell",
    assetType: "Accessibility",
    qrCodeId: "lift-01",
  },
  {
    id: "gen-01",
    name: "Emergency Generator",
    location: "External Compound",
    assetType: "Electrical",
    qrCodeId: "gen-01",
  },
  {
    id: "pat-lab",
    name: "PAT Testing Station",
    location: "IT Suite",
    assetType: "Electrical",
    qrCodeId: "pat-lab",
  },
  {
    id: "gutter-01",
    name: "Guttering - South Block",
    location: "South Building Exterior",
    assetType: "Building Fabric",
    qrCodeId: "gutter-01",
  },
];

export default function AssetTagsPage() {
  const { organization } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    async function fetchAssets() {
      try {
        const orgId = organization?.id;
        if (!orgId) {
          setAssets(DEMO_ASSETS);
          setIsDemo(true);
          setLoading(false);
          return;
        }

        const res = await fetch(`/api/estates/tasks?organizationId=${orgId}`);
        if (res.ok) {
          const data = await res.json();
          const mapped: Asset[] = (data.tasks || data || []).map((t: any) => ({
            id: t.id,
            name: t.title || t.name || "Unnamed Asset",
            location: t.location || t.area || undefined,
            assetType: t.category || t.asset_type || undefined,
            qrCodeId: t.qr_code_id || t.id,
          }));
          if (mapped.length > 0) {
            setAssets(mapped);
          } else {
            setAssets(DEMO_ASSETS);
            setIsDemo(true);
          }
        } else {
          setAssets(DEMO_ASSETS);
          setIsDemo(true);
        }
      } catch {
        setAssets(DEMO_ASSETS);
        setIsDemo(true);
      }
      setLoading(false);
    }
    fetchAssets();
  }, [organization?.id]);

  return (
    <div className="p-6 md:p-8 space-y-6 min-h-screen max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center">
            <QrCode className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold dark:text-white">Asset Tags</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Print QR/NFC asset tags to stick on physical assets. Scanning
              links directly to the asset&apos;s compliance history.
            </p>
          </div>
        </div>
      </div>

      {/* Demo banner */}
      {isDemo && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Demo Mode
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Showing sample assets. Connect your estates data to generate real
              asset tags.
            </p>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
        </div>
      ) : (
        <QRCodeGenerator assets={assets} />
      )}

      {/* NFC section */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-5 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex items-start gap-3">
          <Smartphone className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-2">
            <h3 className="font-medium dark:text-white">NFC Tags</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              For NFC, programme tags with the same URL using any NFC writer app
              (e.g. NFC Tools on iOS/Android). Write the URL{" "}
              <code className="text-xs bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                https://app.schoolgle.co.uk/scan/&#123;assetId&#125;
              </code>{" "}
              to each tag. Staff can then tap their phone on the tag to
              instantly view the asset&apos;s compliance record, log checks, and
              raise issues.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Recommended NFC tags: NTAG215 or NTAG216 (waterproof adhesive
              versions work best for plant rooms and outdoor equipment).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
