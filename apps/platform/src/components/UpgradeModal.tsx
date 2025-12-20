"use client";

import { X } from "lucide-react";

interface UpgradeModalProps {
  moduleName: string;
  moduleDescription: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function UpgradeModal({
  moduleName,
  moduleDescription,
  isOpen,
  onClose,
}: UpgradeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Upgrade Required</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <span className="text-3xl">🔒</span>
            <div>
              <h3 className="font-semibold text-gray-900">{moduleName}</h3>
              <p className="text-sm text-gray-600">{moduleDescription}</p>
            </div>
          </div>

          <p className="text-gray-700">
            This feature requires the <strong>{moduleName}</strong> module. 
            Upgrade your subscription to unlock this capability.
          </p>

          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <h4 className="font-semibold text-gray-900">What you'll get:</h4>
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
              <li>Full access to {moduleName} features</li>
              <li>Priority support</li>
              <li>Regular updates and improvements</li>
            </ul>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Maybe Later
            </button>
            <button
              onClick={() => {
                // TODO: Integrate with billing/subscription system
                window.location.href = '/dashboard/settings/billing';
              }}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Upgrade Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

