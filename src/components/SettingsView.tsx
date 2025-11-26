"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Building, Users, Mail, Loader2, UserPlus, Shield, GraduationCap } from 'lucide-react';

interface Member {
    role: string;
    created_at: string;
    user: {
        id: string;
        email: string;
        display_name: string | null;
    };
}

export default function SettingsView() {
    const { user, organization } = useAuth();
    const [members, setMembers] = useState<Member[]>([]);
    const [isLoadingMembers, setIsLoadingMembers] = useState(true);
    const [showInviteForm, setShowInviteForm] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<'admin' | 'teacher' | 'slt'>('teacher');
    const [isInviting, setIsInviting] = useState(false);
    const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (organization?.id) {
            fetchMembers();
        }
    }, [organization]);

    const fetchMembers = async () => {
        if (!organization?.id) return;

        setIsLoadingMembers(true);
        try {
            const response = await fetch(`/api/organization/members?organizationId=${organization.id}`);
            if (response.ok) {
                const data = await response.json();
                setMembers(data.members || []);
            }
        } catch (err) {
            console.error('Error fetching members:', err);
        } finally {
            setIsLoadingMembers(false);
        }
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail.trim() || !organization?.id || !user) return;

        setIsInviting(true);
        setError(null);
        setInviteSuccess(null);

        try {
            const response = await fetch('/api/organization/invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: inviteEmail,
                    role: inviteRole,
                    organizationId: organization.id,
                    invitedBy: user.uid
                })
            });

            if (!response.ok) {
                throw new Error('Failed to send invitation');
            }

            setInviteSuccess(`Invitation sent to ${inviteEmail}`);
            setInviteEmail('');
            setShowInviteForm(false);
            // In a real app, we'd send an email. For now, just show success.
        } catch (err: any) {
            setError(err.message || 'Failed to send invitation');
        } finally {
            setIsInviting(false);
        }
    };

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'admin':
                return <Shield className="text-purple-600" size={18} />;
            case 'slt':
                return <GraduationCap className="text-blue-600" size={18} />;
            case 'teacher':
                return <Users className="text-green-600" size={18} />;
            default:
                return <Users className="text-gray-600" size={18} />;
        }
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'admin':
                return 'bg-purple-100 text-purple-700';
            case 'slt':
                return 'bg-blue-100 text-blue-700';
            case 'teacher':
                return 'bg-green-100 text-green-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    if (!organization) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-600">No organization found. Please complete onboarding.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Organization Details */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-blue-100 p-3 rounded-lg">
                        <Building className="text-blue-600" size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Organization Details</h2>
                        <p className="text-sm text-gray-500">Manage your school information</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">School Name</label>
                        <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                            {organization.name}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Your Role</label>
                        <div className="flex items-center gap-2">
                            {getRoleIcon(organization.role)}
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeColor(organization.role)}`}>
                                {organization.role.toUpperCase()}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Team Management */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="bg-green-100 p-3 rounded-lg">
                            <Users className="text-green-600" size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Team Management</h2>
                            <p className="text-sm text-gray-500">Manage users and permissions</p>
                        </div>
                    </div>
                    {organization.role === 'admin' && (
                        <button
                            onClick={() => setShowInviteForm(!showInviteForm)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                        >
                            <UserPlus size={18} />
                            Invite User
                        </button>
                    )}
                </div>

                {/* Invite Form */}
                {showInviteForm && organization.role === 'admin' && (
                    <form onSubmit={handleInvite} className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <h3 className="font-semibold text-gray-900 mb-4">Invite New User</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                <input
                                    type="email"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    placeholder="user@example.com"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                <select
                                    value={inviteRole}
                                    onChange={(e) => setInviteRole(e.target.value as any)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                >
                                    <option value="teacher">Teacher</option>
                                    <option value="slt">SLT</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setShowInviteForm(false)}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isInviting}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isInviting ? (
                                    <>
                                        <Loader2 className="animate-spin" size={18} />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Mail size={18} />
                                        Send Invitation
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                )}

                {/* Success/Error Messages */}
                {inviteSuccess && (
                    <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg border border-green-200">
                        {inviteSuccess}
                    </div>
                )}
                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg border border-red-200">
                        {error}
                    </div>
                )}

                {/* Members List */}
                {isLoadingMembers ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="animate-spin text-blue-600" size={32} />
                    </div>
                ) : (
                    <div className="space-y-3">
                        {members.map((member, idx) => (
                            <div
                                key={idx}
                                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                        {member.user.email[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">
                                            {member.user.display_name || member.user.email}
                                        </p>
                                        <p className="text-sm text-gray-500">{member.user.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {getRoleIcon(member.role)}
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeColor(member.role)}`}>
                                        {member.role.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {members.length === 0 && (
                            <p className="text-center text-gray-500 py-8">No members found.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
