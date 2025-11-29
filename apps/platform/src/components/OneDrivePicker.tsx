"use client";

import { useEffect, useState } from "react";
import { loadOneDriveApi } from "@/lib/onedrive";
import { FolderPlus } from "lucide-react";

interface OneDrivePickerProps {
    onFolderSelect: (folder: { id: string; name: string }) => void;
}

export default function OneDrivePicker({ onFolderSelect }: OneDrivePickerProps) {
    const [apiLoaded, setApiLoaded] = useState(false);

    useEffect(() => {
        loadOneDriveApi(() => {
            setApiLoaded(true);
        });
    }, []);

    const handleOpenPicker = () => {
        if (!apiLoaded) return;

        const odOptions = {
            clientId: process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID, // Note: This might need to be configured in Azure AD
            action: "query",
            multiSelect: false,
            advanced: {
                filter: "folder,.folder"
            },
            success: function (files: any) {
                const folder = files.value[0];
                onFolderSelect({ id: folder.id, name: folder.name });
            },
            cancel: function () {
                console.log("OneDrive picker cancelled");
            },
            error: function (error: any) {
                console.error("OneDrive picker error", error);
            }
        };

        window.OneDrive.open(odOptions);
    };

    return (
        <button
            onClick={handleOpenPicker}
            disabled={!apiLoaded}
            className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
            <FolderPlus size={20} />
            <span>Select OneDrive Folder</span>
        </button>
    );
}
