"use client";

import { useState, useEffect } from "react";
import { Copy, QrCode, Code2, Link2, Check, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface ShareDialogProps {
  surveyId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface DistributionData {
  surveyUrl: string;
  qrCodeDataUrl: string;
  embedCode: string;
  popupEmbedCode: string;
}

export function ShareDialog({
  surveyId,
  open,
  onOpenChange,
}: ShareDialogProps) {
  const [data, setData] = useState<DistributionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (open && !data) {
      fetchDistribution();
    }
  }, [open]);

  async function fetchDistribution() {
    setLoading(true);
    try {
      const res = await fetch(`/api/surveys/${surveyId}/distribute`);
      const json = await res.json();
      if (res.ok) setData(json);
    } catch {
      toast.error("Failed to load sharing options");
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(`${label} copied to clipboard`);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Share Survey</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-cyan-600" />
          </div>
        ) : data ? (
          <Tabs defaultValue="link">
            <TabsList className="w-full">
              <TabsTrigger value="link" className="flex-1">
                <Link2 className="w-4 h-4 mr-1" />
                Link
              </TabsTrigger>
              <TabsTrigger value="qr" className="flex-1">
                <QrCode className="w-4 h-4 mr-1" />
                QR Code
              </TabsTrigger>
              <TabsTrigger value="embed" className="flex-1">
                <Code2 className="w-4 h-4 mr-1" />
                Embed
              </TabsTrigger>
            </TabsList>

            <TabsContent value="link" className="space-y-3 pt-2">
              <p className="text-sm text-slate-500">
                Share this link with respondents. Anyone with the link can
                respond.
              </p>
              <div className="flex items-center gap-2">
                <Input value={data.surveyUrl} readOnly className="text-sm" />
                <Button
                  size="sm"
                  onClick={() => copyToClipboard(data.surveyUrl, "Link")}
                  className="shrink-0"
                >
                  {copied === "Link" ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="qr" className="space-y-3 pt-2">
              <p className="text-sm text-slate-500">
                Print this QR code for posters, newsletters, or displays.
              </p>
              <div className="flex justify-center p-4 bg-white rounded-xl border">
                <img
                  src={data.qrCodeDataUrl}
                  alt="Survey QR Code"
                  className="w-48 h-48"
                />
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  const a = document.createElement("a");
                  a.href = data.qrCodeDataUrl;
                  a.download = "survey-qr-code.png";
                  a.click();
                  toast.success("QR code downloaded");
                }}
              >
                Download QR Code
              </Button>
            </TabsContent>

            <TabsContent value="embed" className="space-y-3 pt-2">
              <p className="text-sm text-slate-500">
                Embed the survey on your school website.
              </p>
              <div>
                <label className="text-xs font-medium text-slate-700 mb-1 block">
                  Inline Embed (iframe)
                </label>
                <Textarea
                  value={data.embedCode}
                  readOnly
                  rows={3}
                  className="text-xs font-mono"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-1"
                  onClick={() => copyToClipboard(data.embedCode, "Embed code")}
                >
                  {copied === "Embed code" ? (
                    <Check className="w-3 h-3 mr-1" />
                  ) : (
                    <Copy className="w-3 h-3 mr-1" />
                  )}
                  Copy
                </Button>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 mb-1 block">
                  Popup Button
                </label>
                <Textarea
                  value={data.popupEmbedCode}
                  readOnly
                  rows={3}
                  className="text-xs font-mono"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-1"
                  onClick={() =>
                    copyToClipboard(data.popupEmbedCode, "Popup code")
                  }
                >
                  {copied === "Popup code" ? (
                    <Check className="w-3 h-3 mr-1" />
                  ) : (
                    <Copy className="w-3 h-3 mr-1" />
                  )}
                  Copy
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <p className="text-sm text-slate-500 text-center py-8">
            Failed to load sharing options.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
