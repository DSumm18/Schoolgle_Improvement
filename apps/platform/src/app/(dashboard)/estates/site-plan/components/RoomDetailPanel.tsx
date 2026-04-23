"use client";

import { SchoolRoom, FireEquipment } from "@/types/site-plan";
import { X, Shield, AlertTriangle, CheckCircle, Clock, Calendar } from "lucide-react";

interface RoomDetailPanelProps {
  room: SchoolRoom;
  onClose: () => void;
}

const STATUS_CONFIG = {
  compliant: { color: "bg-green-100 text-green-800", icon: CheckCircle, label: "Compliant" },
  action_needed: { color: "bg-amber-100 text-amber-800", icon: AlertTriangle, label: "Action Needed" },
  overdue: { color: "bg-red-100 text-red-800", icon: AlertTriangle, label: "Overdue" },
  unknown: { color: "bg-gray-100 text-gray-800", icon: Shield, label: "Unknown" },
};

export default function RoomDetailPanel({ room, onClose }: RoomDetailPanelProps) {
  const statusConfig = STATUS_CONFIG[room.compliance_status] || STATUS_CONFIG.unknown;

  return (
    <div className="absolute inset-y-0 right-0 w-96 bg-white shadow-xl z-[1000] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{room.room_name}</h2>
          {room.block && (
            <p className="text-sm text-gray-500">Block {room.block}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          title="Close"
        >
          <X size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Compliance Status */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Compliance Status</h3>
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${statusConfig.color}`}>
            <statusConfig.icon size={16} />
            {statusConfig.label}
          </div>
        </div>

        {/* Room Details */}
        <div className="space-y-2 text-sm">
          {room.room_type && (
            <div className="flex justify-between">
              <span className="text-gray-600">Type:</span>
              <span className="font-medium">{room.room_type}</span>
            </div>
          )}
          {room.area_sqm && (
            <div className="flex justify-between">
              <span className="text-gray-600">Area:</span>
              <span className="font-medium">{room.area_sqm} m²</span>
            </div>
          )}
          {room.condition_rating && (
            <div className="flex justify-between">
              <span className="text-gray-600">Condition:</span>
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-4 h-4 rounded ${
                      i < room.condition_rating! ? "bg-green-500" : "bg-gray-200"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Inspection Dates */}
        {(room.last_inspection_date || room.next_inspection_due) && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Inspections</h3>
            <div className="space-y-2 text-sm">
              {room.last_inspection_date && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar size={14} />
                  <span>Last: {new Date(room.last_inspection_date).toLocaleDateString('en-GB')}</span>
                </div>
              )}
              {room.next_inspection_due && (
                <div className="flex items-center gap-2">
                  <Clock size={14} />
                  <span className={room.next_inspection_due && new Date(room.next_inspection_due) < new Date() ? "text-red-600 font-medium" : "text-gray-600"}>
                    Due: {new Date(room.next_inspection_due).toLocaleDateString('en-GB')}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Fire Safety */}
        {(room.fire_equipment && room.fire_equipment.length > 0) || room.has_emergency_lighting || room.has_fire_door || room.is_fire_escape_route ? (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Fire Safety</h3>
            <div className="space-y-2 text-sm">
              {room.is_fire_escape_route && (
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle size={16} />
                  <span>Fire escape route</span>
                </div>
              )}
              {room.has_emergency_lighting && (
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle size={16} />
                  <span>Emergency lighting</span>
                </div>
              )}
              {room.has_fire_door && (
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle size={16} />
                  <span>Fire door</span>
                </div>
              )}
              {room.fire_equipment && room.fire_equipment.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-gray-500 mb-1">Equipment:</p>
                  <ul className="space-y-1">
                    {room.fire_equipment.map((eq, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-gray-400">•</span>
                        <div>
                          <span className="font-medium">{eq.type}</span>
                          <span className="text-gray-500 ml-1">({eq.location})</span>
                          {eq.last_tested && (
                            <span className="text-gray-400 text-xs ml-1">
                              • tested {new Date(eq.last_tested).toLocaleDateString('en-GB')}
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* COSHH */}
        {room.coshh_items_count !== undefined && room.coshh_items_count > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">COSHH</h3>
            <p className="text-sm text-gray-600">
              {room.coshh_items_count} item{room.coshh_items_count !== 1 ? 's' : ''} stored
              {room.coshh_last_audit && ` • last audit ${new Date(room.coshh_last_audit).toLocaleDateString('en-GB')}`}
            </p>
          </div>
        )}

        {/* Notes */}
        {room.notes && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Notes</h3>
            <p className="text-sm text-gray-600">{room.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
