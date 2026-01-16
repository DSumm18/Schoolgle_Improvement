"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Save, Info } from 'lucide-react';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
}

export default function SettingsModal({ isOpen, onClose, onSave }: SettingsModalProps) {
    const [sheetId, setSheetId] = useState('');
    const [apiKey, setApiKey] = useState('');

    // Initialize with current values from localStorage if available
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const storedSheetId = localStorage.getItem('estates_audit_sheet_id');
            const storedApiKey = localStorage.getItem('estates_audit_api_key');
            if (storedSheetId) setSheetId(storedSheetId);
            if (storedApiKey) setApiKey(storedApiKey);
        }
    }, [isOpen]);

    const handleSave = () => {
        if (sheetId) {
            localStorage.setItem('estates_audit_sheet_id', sheetId);
        }
        if (apiKey) {
            localStorage.setItem('estates_audit_api_key', apiKey);
        }
        onSave();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md shadow-2xl border-indigo-500/20">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-xl font-bold text-indigo-900 dark:text-indigo-100">Connect Your Data</CardTitle>
                            <CardDescription>
                                Link your Google Sheet and API key to see real estates audit data
                            </CardDescription>
                        </div>
                        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <Info className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mt-0.5" />
                            <div className="text-sm text-indigo-800 dark:text-indigo-200">
                                <p className="font-semibold mb-1">How to get your Google Sheet ID:</p>
                                <ol className="list-decimal list-inside space-y-1 text-xs opacity-90">
                                    <li>Open your Google Sheet</li>
                                    <li>Copy the ID from the URL (the long string after /d/)</li>
                                    <li>Paste it below</li>
                                </ol>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="sheet-id" className="text-sm font-medium">Google Sheet ID</Label>
                            <Input
                                id="sheet-id"
                                placeholder="1ABC123def456GHI789jkl..."
                                value={sheetId}
                                onChange={(e) => setSheetId(e.target.value)}
                                className="bg-muted/50 border-indigo-500/10 focus:border-indigo-500"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="api-key" className="text-sm font-medium">Google API Key</Label>
                            <Input
                                id="api-key"
                                type="password"
                                placeholder="AIzaSyAFX-_Pxp36PuMevKF69h_ookWAnGtzs4Y"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                className="bg-muted/50 border-indigo-500/10 focus:border-indigo-500"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button onClick={handleSave} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-6">
                            <Save className="h-5 w-5 mr-2" />
                            Save & Connect
                        </Button>
                        <Button variant="outline" onClick={onClose} className="py-6 px-6">
                            Cancel
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
