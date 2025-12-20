"use client";

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/SupabaseAuthContext';
import { 
    Building, Users, Mail, Loader2, UserPlus, Shield, GraduationCap, 
    Upload, Download, FileSpreadsheet, X, Check, AlertCircle, Trash2, 
    MoreVertical, Clock, RefreshCw, ChevronDown
} from 'lucide-react';

interface Member {
    role: string;
    created_at: string;
    user: {
        id: string;
        email: string;
        display_name: string | null;
    };
}

interface Invitation {
    id: string;
    email: string;
    role: string;
    status: string;
    created_at: string;
    expires_at: string;
    invited_by_user: {
        email: string;
        display_name: string | null;
    } | null;
}

interface ImportPreview {
    email: string;
    displayName: string;
    role: string;
    status: 'new' | 'exists';
}

interface ImportError {
    row: number;
    field: string;
    message: string;
}

export default function SettingsView() {
    const { user, organization } = useAuth();
    const [activeTab, setActiveTab] = useState<'members' | 'invitations' | 'import'>('members');
    
    // Members state
    const [members, setMembers] = useState<Member[]>([]);
    const [isLoadingMembers, setIsLoadingMembers] = useState(true);
    const [editingMember, setEditingMember] = useState<string | null>(null);
    
    // Invitations state
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [isLoadingInvitations, setIsLoadingInvitations] = useState(false);
    const [showInviteForm, setShowInviteForm] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<'admin' | 'teacher' | 'slt'>('teacher');
    const [isInviting, setIsInviting] = useState(false);
    
    // Import state
    const [csvContent, setCsvContent] = useState('');
    const [importPreview, setImportPreview] = useState<ImportPreview[] | null>(null);
    const [importErrors, setImportErrors] = useState<ImportError[]>([]);
    const [importSummary, setImportSummary] = useState<any>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [importResult, setImportResult] = useState<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Messages
    const [success, setSuccess] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (organization?.id) {
            fetchMembers();
            fetchInvitations();
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

    const fetchInvitations = async () => {
        if (!organization?.id) return;
        setIsLoadingInvitations(true);
        try {
            const response = await fetch(`/api/organization/invitations?organizationId=${organization.id}`);
            if (response.ok) {
                const data = await response.json();
                setInvitations(data.invitations || []);
            }
        } catch (err) {
            console.error('Error fetching invitations:', err);
        } finally {
            setIsLoadingInvitations(false);
        }
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail.trim() || !organization?.id || !user) return;

        setIsInviting(true);
        setError(null);
        setSuccess(null);

        try {
            const response = await fetch('/api/organization/invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: inviteEmail,
                    role: inviteRole,
                    organizationId: organization.id,
                    invitedBy: user.id
                })
            });

            if (!response.ok) throw new Error('Failed to send invitation');

            setSuccess(`Invitation sent to ${inviteEmail}`);
            setInviteEmail('');
            setShowInviteForm(false);
            fetchInvitations();
        } catch (err: any) {
            setError(err.message || 'Failed to send invitation');
        } finally {
            setIsInviting(false);
        }
    };

    const handleUpdateRole = async (userId: string, newRole: string) => {
        if (!organization?.id || !user) return;
        
        try {
            const response = await fetch('/api/organization/members/update', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    organizationId: organization.id,
                    userId,
                    newRole,
                    requestedBy: user.id
                })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to update role');
            }

            setSuccess('Role updated successfully');
            setEditingMember(null);
            fetchMembers();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleRemoveMember = async (userId: string) => {
        if (!organization?.id || !user || !confirm('Are you sure you want to remove this member?')) return;

        try {
            const response = await fetch(
                `/api/organization/members/update?organizationId=${organization.id}&userId=${userId}&requestedBy=${user.id}`,
                { method: 'DELETE' }
            );

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to remove member');
            }

            setSuccess('Member removed successfully');
            fetchMembers();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleCancelInvitation = async (invitationId: string) => {
        if (!organization?.id || !user || !confirm('Cancel this invitation?')) return;

        try {
            const response = await fetch(
                `/api/organization/invitations?invitationId=${invitationId}&organizationId=${organization.id}&requestedBy=${user.id}`,
                { method: 'DELETE' }
            );

            if (!response.ok) throw new Error('Failed to cancel invitation');

            setSuccess('Invitation cancelled');
            fetchInvitations();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleResendInvitation = async (invitationId: string) => {
        if (!organization?.id || !user) return;

        try {
            const response = await fetch('/api/organization/invitations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    invitationId,
                    organizationId: organization.id,
                    requestedBy: user.id
                })
            });

            if (!response.ok) throw new Error('Failed to resend invitation');

            setSuccess('Invitation resent');
            fetchInvitations();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            setCsvContent(content);
            handlePreviewImport(content);
        };
        reader.readAsText(file);
    };

    const handlePreviewImport = async (content: string) => {
        if (!organization?.id || !user) return;

        setIsImporting(true);
        setImportErrors([]);
        setImportPreview(null);
        setImportResult(null);

        try {
            const response = await fetch('/api/organization/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    csvContent: content,
                    organizationId: organization.id,
                    invitedBy: user.id,
                    previewOnly: true
                })
            });

            const data = await response.json();

            if (data.preview) {
                setImportPreview(data.users);
                setImportErrors(data.errors || []);
                setImportSummary(data.summary);
            } else if (data.errors) {
                setImportErrors(data.errors);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsImporting(false);
        }
    };

    const handleConfirmImport = async () => {
        if (!organization?.id || !user || !csvContent) return;

        setIsImporting(true);
        setError(null);

        try {
            const response = await fetch('/api/organization/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    csvContent,
                    organizationId: organization.id,
                    invitedBy: user.id,
                    previewOnly: false
                })
            });

            const data = await response.json();

            if (data.success) {
                setImportResult(data.results);
                setSuccess(`Successfully created ${data.results.created} invitations`);
                setCsvContent('');
                setImportPreview(null);
                fetchInvitations();
            } else {
                setError(data.error || 'Import failed');
                setImportErrors(data.errors || []);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsImporting(false);
        }
    };

    const downloadTemplate = () => {
        window.location.href = '/api/organization/template';
    };

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'admin': return <Shield className="text-purple-600" size={18} />;
            case 'slt': return <GraduationCap className="text-blue-600" size={18} />;
            case 'teacher': return <Users className="text-green-600" size={18} />;
            default: return <Users className="text-gray-600" size={18} />;
        }
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'admin': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'slt': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'teacher': return 'bg-green-100 text-green-700 border-green-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const isAdmin = organization?.role === 'admin';

    if (!organization) {
        return (
            <div className="text-center py-12">
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 max-w-md mx-auto">
                    <AlertCircle className="text-yellow-600 mx-auto mb-4" size={48} />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">No Organization Found</h2>
                    <p className="text-gray-600 mb-4">Please complete the onboarding process to set up your school.</p>
                    <a href="/onboarding" className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                        Complete Setup
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Messages */}
            {success && (
                <div className="p-4 bg-green-50 text-green-700 rounded-lg border border-green-200 flex items-center gap-3">
                    <Check className="flex-shrink-0" size={20} />
                    <span>{success}</span>
                    <button onClick={() => setSuccess(null)} className="ml-auto"><X size={18} /></button>
                </div>
            )}
            {error && (
                <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-center gap-3">
                    <AlertCircle className="flex-shrink-0" size={20} />
                    <span>{error}</span>
                    <button onClick={() => setError(null)} className="ml-auto"><X size={18} /></button>
                </div>
            )}

            {/* Organization Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
                <div className="flex items-center gap-4">
                    <div className="bg-white/20 p-4 rounded-xl">
                        <Building size={32} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">{organization.name}</h1>
                        <div className="flex items-center gap-2 mt-1 opacity-90">
                            {getRoleIcon(organization.role)}
                            <span className="text-sm">Your role: {organization.role.toUpperCase()}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="border-b border-gray-200">
                    <nav className="flex">
                        <button
                            onClick={() => setActiveTab('members')}
                            className={`px-6 py-4 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${
                                activeTab === 'members' 
                                    ? 'border-blue-500 text-blue-600' 
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <Users size={18} />
                            Team Members
                            <span className="ml-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                                {members.length}
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab('invitations')}
                            className={`px-6 py-4 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${
                                activeTab === 'invitations' 
                                    ? 'border-blue-500 text-blue-600' 
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <Mail size={18} />
                            Pending Invitations
                            {invitations.length > 0 && (
                                <span className="ml-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs">
                                    {invitations.length}
                                </span>
                            )}
                        </button>
                        {isAdmin && (
                            <button
                                onClick={() => setActiveTab('import')}
                                className={`px-6 py-4 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${
                                    activeTab === 'import' 
                                        ? 'border-blue-500 text-blue-600' 
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <Upload size={18} />
                                Bulk Import
                            </button>
                        )}
                    </nav>
                </div>

                <div className="p-6">
                    {/* Members Tab */}
                    {activeTab === 'members' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">Team Members</h2>
                                    <p className="text-sm text-gray-500">Manage users and their access levels</p>
                                </div>
                                {isAdmin && (
                                    <button
                                        onClick={() => { setActiveTab('invitations'); setShowInviteForm(true); }}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                                    >
                                        <UserPlus size={18} />
                                        Invite User
                                    </button>
                                )}
                            </div>

                            {isLoadingMembers ? (
                                <div className="flex justify-center py-12">
                                    <Loader2 className="animate-spin text-blue-600" size={32} />
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {members.map((member) => (
                                        <div
                                            key={member.user.id}
                                            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-lg">
                                                    {member.user.email[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">
                                                        {member.user.display_name || member.user.email}
                                                    </p>
                                                    <p className="text-sm text-gray-500">{member.user.email}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {editingMember === member.user.id && isAdmin ? (
                                                    <select
                                                        value={member.role}
                                                        onChange={(e) => handleUpdateRole(member.user.id, e.target.value)}
                                                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    >
                                                        <option value="teacher">Teacher</option>
                                                        <option value="slt">SLT</option>
                                                        <option value="admin">Admin</option>
                                                    </select>
                                                ) : (
                                                    <div 
                                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${getRoleBadgeColor(member.role)} ${isAdmin ? 'cursor-pointer hover:opacity-80' : ''}`}
                                                        onClick={() => isAdmin && setEditingMember(member.user.id)}
                                                    >
                                                        {getRoleIcon(member.role)}
                                                        <span className="text-sm font-medium">{member.role.toUpperCase()}</span>
                                                        {isAdmin && <ChevronDown size={14} />}
                                                    </div>
                                                )}
                                                {isAdmin && member.user.id !== user?.id && (
                                                    <button
                                                        onClick={() => handleRemoveMember(member.user.id)}
                                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Remove member"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {members.length === 0 && (
                                        <p className="text-center text-gray-500 py-8">No members found.</p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Invitations Tab */}
                    {activeTab === 'invitations' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">Pending Invitations</h2>
                                    <p className="text-sm text-gray-500">Users who haven't accepted their invitation yet</p>
                                </div>
                                {isAdmin && (
                                    <button
                                        onClick={() => setShowInviteForm(!showInviteForm)}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                                    >
                                        <UserPlus size={18} />
                                        {showInviteForm ? 'Cancel' : 'Invite User'}
                                    </button>
                                )}
                            </div>

                            {/* Invite Form */}
                            {showInviteForm && isAdmin && (
                                <form onSubmit={handleInvite} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                    <h3 className="font-semibold text-gray-900 mb-4">Send New Invitation</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                            <input
                                                type="email"
                                                value={inviteEmail}
                                                onChange={(e) => setInviteEmail(e.target.value)}
                                                placeholder="user@school.edu"
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
                                    <button
                                        type="submit"
                                        disabled={isInviting}
                                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {isInviting ? <Loader2 className="animate-spin" size={18} /> : <Mail size={18} />}
                                        {isInviting ? 'Sending...' : 'Send Invitation'}
                                    </button>
                                </form>
                            )}

                            {isLoadingInvitations ? (
                                <div className="flex justify-center py-12">
                                    <Loader2 className="animate-spin text-blue-600" size={32} />
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {invitations.map((invitation) => (
                                        <div
                                            key={invitation.id}
                                            className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600">
                                                    <Clock size={24} />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{invitation.email}</p>
                                                    <p className="text-sm text-gray-500">
                                                        Invited {new Date(invitation.created_at).toLocaleDateString()}
                                                        {invitation.invited_by_user && ` by ${invitation.invited_by_user.display_name || invitation.invited_by_user.email}`}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${getRoleBadgeColor(invitation.role)}`}>
                                                    {getRoleIcon(invitation.role)}
                                                    <span className="text-sm font-medium">{invitation.role.toUpperCase()}</span>
                                                </div>
                                                {isAdmin && (
                                                    <>
                                                        <button
                                                            onClick={() => handleResendInvitation(invitation.id)}
                                                            className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="Resend invitation"
                                                        >
                                                            <RefreshCw size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleCancelInvitation(invitation.id)}
                                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Cancel invitation"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {invitations.length === 0 && (
                                        <p className="text-center text-gray-500 py-8">No pending invitations.</p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Bulk Import Tab */}
                    {activeTab === 'import' && isAdmin && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Bulk Import Users</h2>
                                <p className="text-sm text-gray-500">Upload a CSV file to invite multiple users at once</p>
                            </div>

                            {/* Step 1: Download Template */}
                            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                                <div className="flex items-start gap-4">
                                    <div className="bg-blue-100 p-3 rounded-lg">
                                        <FileSpreadsheet className="text-blue-600" size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900">Step 1: Download Template</h3>
                                        <p className="text-sm text-gray-600 mt-1 mb-3">
                                            Download our CSV template, fill in your users' details, then upload it below.
                                        </p>
                                        <button
                                            onClick={downloadTemplate}
                                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                                        >
                                            <Download size={18} />
                                            Download CSV Template
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Step 2: Upload File */}
                            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                                <div className="flex items-start gap-4">
                                    <div className="bg-green-100 p-3 rounded-lg">
                                        <Upload className="text-green-600" size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900">Step 2: Upload Your File</h3>
                                        <p className="text-sm text-gray-600 mt-1 mb-3">
                                            Select your completed CSV file to preview and import users.
                                        </p>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept=".csv"
                                            onChange={handleFileUpload}
                                            className="hidden"
                                        />
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={isImporting}
                                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors disabled:opacity-50"
                                        >
                                            {isImporting ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
                                            {isImporting ? 'Processing...' : 'Select CSV File'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Preview Results */}
                            {(importPreview || importErrors.length > 0) && (
                                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                    <div className="p-4 border-b border-gray-200 bg-gray-50">
                                        <h3 className="font-semibold text-gray-900">Import Preview</h3>
                                        {importSummary && (
                                            <div className="flex gap-4 mt-2 text-sm">
                                                <span className="text-green-600">{importSummary.new} new users</span>
                                                <span className="text-yellow-600">{importSummary.existing} already exist</span>
                                                <span className="text-red-600">{importSummary.errors} errors</span>
                                            </div>
                                        )}
                                    </div>

                                    {importErrors.length > 0 && (
                                        <div className="p-4 bg-red-50 border-b border-red-200">
                                            <h4 className="font-medium text-red-700 mb-2">Validation Errors</h4>
                                            <ul className="text-sm text-red-600 space-y-1">
                                                {importErrors.map((err, idx) => (
                                                    <li key={idx}>Row {err.row}: {err.message}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {importPreview && importPreview.length > 0 && (
                                        <div className="divide-y divide-gray-200 max-h-64 overflow-y-auto">
                                            {importPreview.map((user, idx) => (
                                                <div key={idx} className="p-3 flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white font-bold ${
                                                            user.status === 'new' ? 'bg-green-500' : 'bg-yellow-500'
                                                        }`}>
                                                            {user.email[0].toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-900">{user.displayName}</p>
                                                            <p className="text-sm text-gray-500">{user.email}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`px-2 py-1 rounded text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                                                            {user.role.toUpperCase()}
                                                        </span>
                                                        {user.status === 'exists' && (
                                                            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs">
                                                                Already exists
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {importPreview && importSummary?.new > 0 && importErrors.length === 0 && (
                                        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                                            <button
                                                onClick={() => { setCsvContent(''); setImportPreview(null); setImportErrors([]); }}
                                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleConfirmImport}
                                                disabled={isImporting}
                                                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
                                            >
                                                {isImporting ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                                                {isImporting ? 'Importing...' : `Import ${importSummary.new} Users`}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Import Result */}
                            {importResult && (
                                <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                                    <div className="flex items-center gap-3 mb-3">
                                        <Check className="text-green-600" size={24} />
                                        <h3 className="font-semibold text-green-900">Import Complete!</h3>
                                    </div>
                                    <div className="text-sm text-green-700">
                                        <p>✓ {importResult.created} invitations created</p>
                                        {importResult.skipped > 0 && <p>⊘ {importResult.skipped} skipped (already exist)</p>}
                                        {importResult.errors?.length > 0 && (
                                            <p className="text-red-600">✗ {importResult.errors.length} failed</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
