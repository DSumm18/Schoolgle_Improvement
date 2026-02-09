
import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DOMAIN_METADATA, type ComplianceDomain } from '@/lib/estates-compliance/statutory-checks';
import { toast } from 'sonner';

interface SettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    visibleDomains: ComplianceDomain[];
    onVisibilityChange: (domains: ComplianceDomain[]) => void;
}

export function SettingsDialog({
    open,
    onOpenChange,
    visibleDomains,
    onVisibilityChange
}: SettingsDialogProps) {
    // Local state for the dialog form
    const [localVisible, setLocalVisible] = useState<ComplianceDomain[]>(visibleDomains);

    // Sync with props when dialog opens
    useEffect(() => {
        if (open) {
            setLocalVisible(visibleDomains);
        }
    }, [open, visibleDomains]);

    const handleToggle = (domain: ComplianceDomain) => {
        setLocalVisible(prev => {
            if (prev.includes(domain)) {
                return prev.filter(d => d !== domain);
            } else {
                return [...prev, domain];
            }
        });
    };

    const handleSave = () => {
        onVisibilityChange(localVisible);
        onOpenChange(false);
        toast.success('Settings saved successfully');
    };

    const domains = Object.entries(DOMAIN_METADATA).sort((a, b) => a[1].order - b[1].order);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Dashboard Settings</DialogTitle>
                    <DialogDescription>
                        Customize which compliance domains are visible on your dashboard.
                        Statutory checks will still be tracked in the background.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <h3 className="mb-4 text-sm font-medium leading-none">Visible Compliance Domains</h3>
                    <ScrollArea className="h-[300px] pr-4">
                        <div className="space-y-4">
                            {domains.map(([key, meta]) => {
                                const domain = key as ComplianceDomain;
                                const isVisible = localVisible.includes(domain);

                                return (
                                    <div key={domain} className="flex items-center justify-between space-x-2 border p-3 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-md ${meta.color === 'blue' ? 'bg-blue-100 text-blue-700' :
                                                    meta.color === 'red' ? 'bg-red-100 text-red-700' :
                                                        meta.color === 'purple' ? 'bg-purple-100 text-purple-700' :
                                                            meta.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                                                                meta.color === 'orange' ? 'bg-orange-100 text-orange-700' :
                                                                    meta.color === 'cyan' ? 'bg-cyan-100 text-cyan-700' :
                                                                        meta.color === 'slate' ? 'bg-slate-100 text-slate-700' :
                                                                            meta.color === 'green' ? 'bg-green-100 text-green-700' :
                                                                                'bg-gray-100 text-gray-700'
                                                }`}>
                                                {meta.icon}
                                            </div>
                                            <div className="space-y-0.5">
                                                <Label htmlFor={`toggle-${domain}`} className="text-sm font-medium cursor-pointer">
                                                    {meta.name}
                                                </Label>
                                                <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                                                    {meta.description}
                                                </p>
                                            </div>
                                        </div>
                                        <Switch
                                            id={`toggle-${domain}`}
                                            checked={isVisible}
                                            onCheckedChange={() => handleToggle(domain)}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </ScrollArea>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave}>Save Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
