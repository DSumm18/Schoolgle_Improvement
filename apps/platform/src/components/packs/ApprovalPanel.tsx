"use client";

import React, { useState } from 'react';
import { Shield, CheckCircle, AlertTriangle, MessageSquare, Loader2, Send } from 'lucide-react';
import { Pack, PackStatus } from '@/lib/packs/types';

interface ApprovalPanelProps {
    pack: Pack;
    userRole: 'admin' | 'headteacher' | 'governor' | 'staff';
    userId: string;
    onStatusChange: (newStatus: PackStatus) => void;
}

export default function ApprovalPanel({ pack, userRole, userId, onStatusChange }: ApprovalPanelProps) {
    const [comments, setComments] = useState('');
    const [processing, setProcessing] = useState(false);

    const handleAction = async (action: 'approve' | 'request-changes' | 'reject' | 'submit') => {
        setProcessing(true);
        try {
            const endpoint = `/api/packs/${pack.id}/${action}`;
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    organizationId: pack.organization_id,
                    comments
                })
            });

            if (response.ok) {
                const result = await response.json();
                onStatusChange(result.status);
                setComments('');
            }
        } catch (err) {
            console.error(`Approval action ${action} failed:`, err);
        } finally {
            setProcessing(false);
        }
    };

    const isAuthor = pack.created_by === userId;
    const isApprover = ['admin', 'headteacher', 'governor'].includes(userRole);

    return (
        <div className="bg-white rounded-3xl border-2 border-slate-900 shadow-2xl p-8 animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                        <Shield className="text-blue-600" size={24} />
                        GOVERNANCE WORKFLOW
                    </h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">Current Status: {pack.status.replace('_', ' ')}</p>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${pack.status === 'draft' ? 'bg-gray-100 text-gray-500' :
                        pack.status === 'submitted' ? 'bg-amber-100 text-amber-600' :
                            pack.status === 'approved' ? 'bg-emerald-100 text-emerald-600' :
                                'bg-red-100 text-red-600'
                    }`}>
                    {pack.status}
                </div>
            </div>

            {pack.status === 'draft' || pack.status === 'changes_requested' ? (
                <div className="space-y-6">
                    <p className="text-sm text-gray-500 font-medium leading-relaxed">
                        Ready for formal board review? Submission will snapshot the current version and notify the governors.
                    </p>
                    <button
                        onClick={() => handleAction('submit')}
                        disabled={processing}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white p-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-xl shadow-blue-100 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {processing ? <Loader2 className="animate-spin" /> : <Send size={20} />}
                        SUBMIT FOR APPROVAL
                    </button>
                </div>
            ) : pack.status === 'submitted' && isApprover ? (
                <div className="space-y-8">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Review Comments</label>
                        <textarea
                            value={comments}
                            onChange={(e) => setComments(e.target.value)}
                            placeholder="Provide feedback for the author..."
                            className="w-full h-32 p-4 bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl outline-none transition-all text-sm font-medium"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => handleAction('approve')}
                            disabled={processing}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                        >
                            <CheckCircle size={16} />
                            APPROVE PACK
                        </button>
                        <button
                            onClick={() => handleAction('request-changes')}
                            disabled={processing}
                            className="bg-amber-500 hover:bg-amber-600 text-white p-4 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                        >
                            <AlertTriangle size={16} />
                            REQUEST CHANGES
                        </button>
                    </div>

                    <button
                        onClick={() => handleAction('reject')}
                        disabled={processing}
                        className="w-full text-red-600 border-2 border-red-50 hover:bg-red-50 p-4 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all"
                    >
                        DECLINE / REJECT
                    </button>
                </div>
            ) : (
                <div className="text-center py-6">
                    <CheckCircle className="text-emerald-500 mx-auto mb-4" size={48} />
                    <h4 className="text-lg font-black text-gray-900">Process Complete</h4>
                    <p className="text-sm text-gray-400 font-medium mt-1">This pack is approved and locked. You can now proceed to export.</p>
                </div>
            )}
        </div>
    );
}
