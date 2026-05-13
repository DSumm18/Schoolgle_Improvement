"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/SupabaseAuthContext";
import { supabase } from "@/lib/supabase";
import StaffList from "@/components/staff/StaffList";
import StaffModal from "@/components/staff/StaffModal";
import StaffImportModal from "@/components/staff/StaffImportModal";
import type { StaffMember } from "@/lib/staff-directory";
import { saveStaffMember } from "@/lib/hr/staff-directory-client";
import { Loader2 } from "lucide-react";

type ModalType = "none" | "add" | "edit" | "import";

async function getAuthHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session?.access_token) {
    return { Authorization: `Bearer ${session.access_token}` };
  }
  return {};
}

export default function StaffDirectoryPage() {
  const { organizationId } = useAuth();

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalType, setModalType] = useState<ModalType>("none");
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | undefined>();
  const [saveError, setSaveError] = useState("");

  const fetchStaff = useCallback(async () => {
    if (!organizationId) return;

    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(
        `/api/staff?organizationId=${organizationId}&source=db`,
        { headers },
      );
      if (response.ok) {
        const data = await response.json();
        setStaff(data.staff || data.data || []);
      }
    } catch (error) {
      console.error("Error fetching staff:", error);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    if (organizationId) {
      fetchStaff();
    }
  }, [organizationId, fetchStaff]);

  const handleAddStaff = useCallback(() => {
    setSelectedStaff(undefined);
    setSaveError("");
    setModalType("add");
  }, []);

  const handleEditStaff = useCallback((staffMember: StaffMember) => {
    setSelectedStaff(staffMember);
    setSaveError("");
    setModalType("edit");
  }, []);

  const handleImport = useCallback(() => {
    setModalType("import");
  }, []);

  const handleExport = useCallback(async () => {
    if (!organizationId) return;

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(
        `/api/staff/import?type=export&organizationId=${organizationId}`,
        { headers },
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `staff_directory_${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Error exporting staff:", error);
    }
  }, [organizationId]);

  const handleCloseModal = useCallback(() => {
    setModalType("none");
    setSelectedStaff(undefined);
    setSaveError("");
  }, []);

  const handleSaveStaff = useCallback(
    async (staffData: Partial<StaffMember>) => {
      try {
        await saveStaffMember(staffData);
        handleCloseModal();
        await fetchStaff();
      } catch (error) {
        setSaveError(
          error instanceof Error ? error.message : "Failed to save staff member",
        );
      }
    },
    [handleCloseModal, fetchStaff],
  );

  const handleImportComplete = useCallback(async () => {
    handleCloseModal();
    await fetchStaff();
  }, [handleCloseModal, fetchStaff]);

  const handleDeleteStaff = useCallback(
    async (staffId: string) => {
      if (!confirm("Are you sure you want to delete this staff member?")) {
        return;
      }

      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`/api/staff?id=${staffId}`, {
          method: "DELETE",
          headers,
        });

        if (response.ok) {
          await fetchStaff();
        }
      } catch (error) {
        console.error("Error deleting staff:", error);
      }
    },
    [fetchStaff],
  );

  if (!organizationId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500">
          Please select an organization to view staff directory.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const mode = modalType === "edit" ? "edit" : "create";

  return (
    <div className="container mx-auto px-4 py-8">
      <StaffList
        staff={staff}
        onAddStaff={handleAddStaff}
        onEditStaff={handleEditStaff}
        onDeleteStaff={handleDeleteStaff}
        onImport={handleImport}
        onExport={handleExport}
        showBulkActions={false}
      />

      {saveError && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {saveError}
        </div>
      )}

      {/* Add/Edit Modal */}
      {(modalType === "add" || modalType === "edit") && (
        <StaffModal
          key={`staff-modal-${mode}-${selectedStaff?.id || "new"}`}
          isOpen={true}
          onClose={handleCloseModal}
          onSave={handleSaveStaff}
          staff={selectedStaff}
          mode={mode}
          organizationId={organizationId}
        />
      )}

      {/* Import Modal */}
      {modalType === "import" && (
        <StaffImportModal
          key="staff-import-modal"
          isOpen={true}
          onClose={handleCloseModal}
          onComplete={handleImportComplete}
          organizationId={organizationId}
        />
      )}
    </div>
  );
}
