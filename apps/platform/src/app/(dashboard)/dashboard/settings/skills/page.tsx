"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/SupabaseAuthContext";
import { supabase } from "@/lib/supabase";
import {
    ShieldCheck,
    Building2,
    Users,
    GraduationCap,
    Search,
    Bell,
    Mail,
    MessageSquare,
    Settings2
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";

interface Skill {
    id: string;
    name: string;
    description: string;
    category: string;
    default_channel: string;
    is_automated: boolean;
    enabled?: boolean;
    preferred_channel?: string;
}

const CATEGORY_ICONS: Record<string, any> = {
    Estates: Building2,
    Safety: ShieldCheck,
    HR: Users,
    Leadership: GraduationCap,
    "Public Ed": GraduationCap,
};

export default function SkillLibraryPage() {
    const { organizationId } = useAuth();
    const [skills, setSkills] = useState<Skill[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterCategory, setFilterCategory] = useState<string | null>(null);

    useEffect(() => {
        if (organizationId) {
            fetchSkills();
        }
    }, [organizationId]);

    async function fetchSkills() {
        setLoading(true);
        try {
            // Fetch all skills
            const { data: registry, error: regError } = await supabase
                .from('ed_skill_registry')
                .select('*')
                .order('category', { ascending: true });

            if (regError) throw regError;

            // Fetch school config
            const { data: config, error: confError } = await supabase
                .from('school_skills_config')
                .select('skill_id, is_enabled, preferred_channel')
                .eq('organization_id', organizationId);

            if (confError) throw confError;

            const configMap = new Map(config?.map(c => [c.skill_id, c]));

            const combined = registry?.map(s => ({
                ...s,
                enabled: configMap.get(s.id)?.is_enabled ?? true,
                preferred_channel: configMap.get(s.id)?.preferred_channel ?? s.default_channel
            }));

            setSkills(combined || []);
        } catch (error) {
            console.error("Error fetching skills:", error);
            toast({
                title: "Error",
                description: "Failed to load skill library.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    }

    async function toggleSkill(skillId: string, enabled: boolean) {
        try {
            const { error } = await supabase
                .from('school_skills_config')
                .upsert({
                    organization_id: organizationId,
                    skill_id: skillId,
                    is_enabled: enabled
                }, { onConflict: 'organization_id, skill_id' });

            if (error) throw error;

            setSkills(prev => prev.map(s => s.id === skillId ? { ...s, enabled } : s));

            toast({
                title: enabled ? "Skill Activated" : "Skill Deactivated",
                description: `${skills.find(s => s.id === skillId)?.name} has been ${enabled ? 'enabled' : 'disabled'}.`
            });
        } catch (error) {
            console.error("Error toggling skill:", error);
            toast({
                title: "Update Failed",
                description: "Could not update skill setting.",
                variant: "destructive"
            });
        }
    }

    async function updateChannel(skillId: string, channel: string) {
        try {
            const { error } = await supabase
                .from('school_skills_config')
                .upsert({
                    organization_id: organizationId,
                    skill_id: skillId,
                    preferred_channel: channel
                }, { onConflict: 'organization_id, skill_id' });

            if (error) throw error;

            setSkills(prev => prev.map(s => s.id === skillId ? { ...s, preferred_channel: channel } : s));

            toast({
                title: "Channel Updated",
                description: `Ed will now use ${channel.toUpperCase()} for this skill.`
            });
        } catch (error) {
            console.error("Error updating channel:", error);
            toast({
                title: "Update Failed",
                description: "Could not update channel preference.",
                variant: "destructive"
            });
        }
    }

    const filteredSkills = skills.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = filterCategory ? s.category === filterCategory : true;
        return matchesSearch && matchesCategory;
    });

    const categories = Array.from(new Set(skills.map(s => s.category)));

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <header className="space-y-2">
                <div className="flex items-center gap-2 text-primary">
                    <Settings2 size={24} />
                    <h1 className="text-3xl font-black tracking-tighter">ED SKILL LIBRARY</h1>
                </div>
                <p className="text-muted-foreground font-medium max-w-2xl">
                    Configure Ed's autonomous capabilities. Toggle specific skills on or off and set
                    preferred response channels for your school.
                </p>
            </header>

            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-accent/30 p-4 rounded-xl border border-border">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                    <Input
                        placeholder="Search skills..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto w-full md:w-auto">
                    <Badge
                        variant={filterCategory === null ? "default" : "outline"}
                        className="cursor-pointer whitespace-nowrap"
                        onClick={() => setFilterCategory(null)}
                    >
                        All
                    </Badge>
                    {categories.map(cat => (
                        <Badge
                            key={cat}
                            variant={filterCategory === cat ? "default" : "outline"}
                            className="cursor-pointer whitespace-nowrap"
                            onClick={() => setFilterCategory(cat)}
                        >
                            {cat}
                        </Badge>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSkills.map((skill) => {
                    const Icon = CATEGORY_ICONS[skill.category] || Bell;
                    return (
                        <Card key={skill.id} className={`transition-all duration-300 border-2 ${skill.enabled ? 'border-primary/20 bg-primary/[0.02]' : 'border-border grayscale opacity-60'}`}>
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className={`p-2 rounded-lg ${skill.enabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                        <Icon size={20} />
                                    </div>
                                    <Switch
                                        checked={skill.enabled}
                                        onCheckedChange={(val) => toggleSkill(skill.id, val)}
                                    />
                                </div>
                                <div className="mt-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <CardTitle className="text-lg font-bold">{skill.name}</CardTitle>
                                        {skill.is_automated && (
                                            <Badge variant="secondary" className="text-[10px] uppercase font-black tracking-widest px-1.5 h-4">
                                                Auto
                                            </Badge>
                                        )}
                                    </div>
                                    <CardDescription className="line-clamp-2 min-h-[40px]">
                                        {skill.description}
                                    </CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground mt-4 pt-4 border-t border-border">
                                    <span>Primary Channel</span>
                                    <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
                                        <button
                                            onClick={() => updateChannel(skill.id, 'email')}
                                            className={`p-1 rounded ${skill.preferred_channel === 'email' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                            title="Use Email"
                                        >
                                            <Mail size={14} />
                                        </button>
                                        <button
                                            onClick={() => updateChannel(skill.id, 'sms')}
                                            className={`p-1 rounded ${skill.preferred_channel === 'sms' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                            title="Use SMS"
                                        >
                                            <MessageSquare size={14} />
                                        </button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
