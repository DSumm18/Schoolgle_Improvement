"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { loadGoogleDriveApi } from "@/lib/drive";
import { FolderPlus } from "lucide-react";

interface DrivePickerProps {
    onFolderSelect: (folder: { id: string; name: string }) => void;
}

export default function DrivePicker({ onFolderSelect }: DrivePickerProps) {
    const { accessToken } = useAuth();
    const [pickerApiLoaded, setPickerApiLoaded] = useState(false);

    useEffect(() => {
        loadGoogleDriveApi(() => {
            setPickerApiLoaded(true);
        });
    }, []);

    const handleOpenPicker = () => {
        if (!accessToken || !pickerApiLoaded) return;

        const view = new window.google.picker.DocsView(window.google.picker.ViewId.FOLDERS)
            .setSelectFolderEnabled(true)
            .setIncludeFolders(true)
            .setMimeTypes("application/vnd.google-apps.folder");

        const picker = new window.google.picker.PickerBuilder()
            .setAppId(process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "")
            .setOAuthToken(accessToken)
            .addView(view)
            .setCallback((data: any) => {
                if (data.action === window.google.picker.Action.PICKED) {
                    const doc = data.docs[0];
                    onFolderSelect({ id: doc.id, name: doc.name });
                }
            })
            .build();

        picker.setVisible(true);
    };

    return (
        <button
            onClick={handleOpenPicker}
            disabled={!accessToken || !pickerApiLoaded}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
            <FolderPlus size={20} />
            <span>Select Evidence Folder</span>
        </button>
    );
}
