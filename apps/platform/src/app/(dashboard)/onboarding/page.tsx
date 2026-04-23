"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    CheckCircle, Upload, Palette, Building2, Users, FolderOpen,
    ArrowRight, ArrowLeft, Check, Loader2, School, MapPin, Mail,
    Phone, Globe, AlertCircle
} from "lucide-react";
import { extractColoursFromLogo, generatePaletteOptions } from "@/lib/website-builder";

interface DFESchoolData {
    urn: number;
    name: string;
    la_name?: string;
    type_name?: string;
    phase_name?: string;
    address_line1?: string;
    town?: string;
    postcode?: string;
    phone?: string;
    email?: string;
    website?: string;
    religious_character?: string;
}

type OnboardingStep =
    | "welcome"
    | "branding"
    | "confirm_details"
    | "site_structure"
    | "connect_drive"
    | "import_data"
    | "complete";

interface StepDef {
    id: OnboardingStep;
    title: string;
    icon: any;
    description: string;
}

const STEPS: StepDef[] = [
    { id: "welcome", title: "Welcome", icon: School, description: "Let's get your school set up" },
    { id: "branding", title: "Branding", icon: Palette, description: "Upload your logo and colors" },
    { id: "confirm_details", title: "School Details", icon: MapPin, description: "Confirm your school information" },
    { id: "site_structure", title: "Site Structure", icon: Building2, description: "Add your classes and rooms" },
    { id: "connect_drive", title: "Connect Drive", icon: FolderOpen, description: "Link your Google Drive" },
    { id: "import_data", title: "Import Data", icon: Users, description: "Import staff and pupils" },
    { id: "complete", title: "Complete", icon: CheckCircle, description: "You're all set up!" },
];

export default function OnboardingPage() {
    const router = useRouter();

    const [currentStep, setCurrentStep] = useState<OnboardingStep>("welcome");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // DfE School Data (pre-populated)
    const [schoolData, setSchoolData] = useState<DFESchoolData | null>(null);
    const [confirmDetails, setConfirmDetails] = useState({
        name: "",
        address: "",
        town: "",
        postcode: "",
        phone: "",
        email: "",
        website: "",
    });

    // Branding State
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
    const [primaryColor, setPrimaryColor] = useState("#1e40af");
    const [secondaryColor, setSecondaryColor] = useState("#059669");
    const [schoolMotto, setSchoolMotto] = useState("");

    // Site Structure State
    const [classes, setClasses] = useState<string[]>([]);
    const [newClass, setNewClass] = useState("");

    // Google Drive State
    const [driveConnected, setDriveConnected] = useState(false);

    const currentStepIndex = STEPS.findIndex(s => s.id === currentStep);
    const progress = ((currentStepIndex) / (STEPS.length - 1)) * 100;

    // Load organization and DfE data on mount
    useEffect(() => {
        loadOrganizationData();
    }, []);

    const loadOrganizationData = async () => {
        try {
            // Fetch profile to get organization
            const profileRes = await fetch('/api/auth/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            });
            const profileData = await profileRes.json();
            const organization = profileData.data?.organization;

            if (!organization) {
                router.push('/signup');
                return;
            }

            // If URN exists, fetch DfE data
            if (organization.urn) {
                const dfeRes = await fetch(`/api/school/lookup?urn=${organization.urn}`);
                if (dfeRes.ok) {
                    const dfeData = await dfeRes.json();
                    if (dfeData.success && dfeData.school) {
                        setSchoolData(dfeData.school);
                        setConfirmDetails({
                            name: dfeData.school.name || organization.name,
                            address: dfeData.school.address_line1 || "",
                            town: dfeData.school.town || "",
                            postcode: dfeData.school.postcode || "",
                            phone: dfeData.school.phone || "",
                            email: dfeData.school.email || "",
                            website: dfeData.school.website || "",
                        });
                    }
                }
            }
        } catch (err) {
            console.error('Failed to load organization data:', err);
        }
    };

    const handleLogoUpload = async (file: File) => {
        setLogoFile(file);
        setLogoPreviewUrl(URL.createObjectURL(file));

        // Extract colors from logo
        try {
            const colours = await extractColoursFromLogo(file);
            const palettes = generatePaletteOptions(colours);
            if (palettes.length > 0) {
                setPrimaryColor(palettes[0].palette.primary);
                setSecondaryColor(palettes[0].palette.secondary);
            }
        } catch (err) {
            console.error('Color extraction failed:', err);
        }
    };

    const addClass = () => {
        if (newClass.trim() && !classes.includes(newClass.trim())) {
            setClasses([...classes, newClass.trim()]);
            setNewClass("");
        }
    };

    const removeClass = (className: string) => {
        setClasses(classes.filter(c => c !== className));
    };

    const saveBranding = async () => {
        setIsLoading(true);
        try {
            // Upload logo if provided
            let logoUrl = null;
            if (logoFile) {
                const formData = new FormData();
                formData.append('file', logoFile);

                const uploadRes = await fetch('/api/settings/branding/logo', {
                    method: 'POST',
                    body: formData,
                });
                if (uploadRes.ok) {
                    const uploadData = await uploadRes.json();
                    logoUrl = uploadData.url;
                }
            }

            // Save branding settings
            await fetch('/api/branding', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    logo_url: logoUrl,
                    primary_color: primaryColor,
                    secondary_color: secondaryColor,
                    school_name: confirmDetails.name,
                    school_motto: schoolMotto,
                }),
            });

            nextStep();
        } catch (err) {
            setError("Failed to save branding");
        } finally {
            setIsLoading(false);
        }
    };

    const saveSchoolDetails = async () => {
        setIsLoading(true);
        setError(null);
        nextStep();
        setIsLoading(false);
    };

    const saveSiteStructure = async () => {
        setIsLoading(true);
        setError(null);
        if (classes.length === 0) {
            setError("Please add at least one class");
            setIsLoading(false);
            return;
        }
        nextStep();
        setIsLoading(false);
    };

    const nextStep = () => {
        const steps: OnboardingStep[] = ["welcome", "branding", "confirm_details", "site_structure", "connect_drive", "import_data", "complete"];
        const currentIndex = steps.indexOf(currentStep);
        if (currentIndex < steps.length - 1) {
            setCurrentStep(steps[currentIndex + 1]);
            window.scrollTo(0, 0);
        }
    };

    const prevStep = () => {
        const steps: OnboardingStep[] = ["welcome", "branding", "confirm_details", "site_structure", "connect_drive", "import_data", "complete"];
        const currentIndex = steps.indexOf(currentStep);
        if (currentIndex > 0) {
            setCurrentStep(steps[currentIndex - 1]);
        }
    };

    const goToDashboard = () => {
        router.push('/dashboard');
    };

    return (
        <main className="min-h-screen bg-background transition-colors duration-700">
            {/* Progress Header */}
            <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-slate-100 dark:border-white/10 px-6 py-4">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Setup Wizard
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Step {currentStepIndex + 1} of {STEPS.length}
                        </span>
                    </div>
                    <div className="h-1 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-slate-900 dark:bg-white"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.5 }}
                        />
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto px-6 py-12">

                {/* Welcome Step */}
                {currentStep === "welcome" && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center space-y-8 py-12"
                    >
                        <div className="w-20 h-20 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto">
                            <School className="w-10 h-10 text-slate-900 dark:text-white" />
                        </div>

                        <h1 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                            Welcome to<br /><span className="text-slate-400">Schoolgle</span>
                        </h1>

                        <p className="text-xl text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                            Let's get your school set up. This will take about 5 minutes.
                        </p>

                        {schoolData && (
                            <div className="bg-slate-50 dark:bg-white/5 rounded-[3rem] p-6 border border-slate-100 dark:border-white/10 inline-block">
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    We found your school from URN lookup:
                                </p>
                                <p className="text-lg font-bold text-slate-900 dark:text-white mt-2">
                                    {schoolData.name}
                                </p>
                                <p className="text-xs text-slate-400 mt-1">
                                    {schoolData.town}, {schoolData.postcode}
                                </p>
                            </div>
                        )}

                        <button
                            onClick={nextStep}
                            className="group px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full font-bold text-sm uppercase tracking-widest hover:brightness-110 transition-all shadow-lg flex items-center justify-center gap-2 mx-auto"
                        >
                            Let's Get Started
                            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </motion.div>
                )}

                {/* Branding Step */}
                {currentStep === "branding" && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-8"
                    >
                        <div className="text-center">
                            <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                                Add Your <span className="text-slate-400">Branding</span>
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400">
                                Upload your school logo and we'll extract your colors
                            </p>
                        </div>

                        <div className="bg-slate-50 dark:bg-white/5 rounded-[4rem] p-8 md:p-12 border border-slate-100 dark:border-white/10 space-y-8">
                            {/* Logo Upload */}
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">
                                    School Logo
                                </label>
                                <div className="flex items-center gap-6">
                                    <label className="relative group cursor-pointer">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])}
                                            className="hidden"
                                        />
                                        <div className={`
                                            w-32 h-32 rounded-full border-2 border-dashed flex items-center justify-center transition-all
                                            ${logoPreviewUrl ? 'border-transparent p-0' : 'border-slate-300 dark:border-slate-700 group-hover:border-slate-400'}
                                        `}>
                                            {logoPreviewUrl ? (
                                                <img src={logoPreviewUrl} alt="Logo preview" className="w-full h-full rounded-full object-cover" />
                                            ) : (
                                                <div className="text-center">
                                                    <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                                                    <p className="text-[10px] text-slate-400">Upload</p>
                                                </div>
                                            )}
                                        </div>
                                    </label>

                                    {logoPreviewUrl && (
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-slate-900 dark:text-white">Logo uploaded!</p>
                                            <p className="text-xs text-slate-400">We extracted colors from your logo</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Colors */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                                        Primary Color
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="color"
                                            value={primaryColor}
                                            onChange={(e) => setPrimaryColor(e.target.value)}
                                            className="w-12 h-12 rounded-full cursor-pointer"
                                        />
                                        <input
                                            type="text"
                                            value={primaryColor}
                                            onChange={(e) => setPrimaryColor(e.target.value)}
                                            className="flex-1 px-4 py-2 rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-sm"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                                        Secondary Color
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="color"
                                            value={secondaryColor}
                                            onChange={(e) => setSecondaryColor(e.target.value)}
                                            className="w-12 h-12 rounded-full cursor-pointer"
                                        />
                                        <input
                                            type="text"
                                            value={secondaryColor}
                                            onChange={(e) => setSecondaryColor(e.target.value)}
                                            className="flex-1 px-4 py-2 rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Motto */}
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                                    School Motto (optional)
                                </label>
                                <input
                                    type="text"
                                    value={schoolMotto}
                                    onChange={(e) => setSchoolMotto(e.target.value)}
                                    placeholder="e.g., Learning Together, Growing Together"
                                    className="w-full px-6 py-4 rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 bg-red-50 dark:bg-red-500/10 rounded-full text-red-600 text-center text-sm">
                                <AlertCircle className="w-4 h-4 inline mr-2" />
                                {error}
                            </div>
                        )}

                        <div className="flex gap-4">
                            <button onClick={prevStep} className="px-6 py-4 text-slate-500 font-bold rounded-full hover:bg-slate-100 dark:hover:bg-white/5 text-sm uppercase">
                                Back
                            </button>
                            <button
                                onClick={saveBranding}
                                disabled={isLoading}
                                className="flex-1 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full font-bold text-sm uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save & Continue'}
                                <ArrowRight size={16} />
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Confirm Details Step */}
                {currentStep === "confirm_details" && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-8"
                    >
                        <div className="text-center">
                            <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                                Confirm Your <span className="text-slate-400">Details</span>
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400">
                                We found this from your URN. Please confirm it's correct.
                            </p>
                        </div>

                        <div className="bg-slate-50 dark:bg-white/5 rounded-[4rem] p-8 md:p-12 border border-slate-100 dark:border-white/10 space-y-6">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                                    School Name
                                </label>
                                <input
                                    type="text"
                                    value={confirmDetails.name}
                                    onChange={(e) => setConfirmDetails({ ...confirmDetails, name: e.target.value })}
                                    className="w-full px-6 py-4 rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                                    Address
                                </label>
                                <input
                                    type="text"
                                    value={confirmDetails.address}
                                    onChange={(e) => setConfirmDetails({ ...confirmDetails, address: e.target.value })}
                                    className="w-full px-6 py-4 rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                                        Town
                                    </label>
                                    <input
                                        type="text"
                                        value={confirmDetails.town}
                                        onChange={(e) => setConfirmDetails({ ...confirmDetails, town: e.target.value })}
                                        className="w-full px-6 py-4 rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                                        Postcode
                                    </label>
                                    <input
                                        type="text"
                                        value={confirmDetails.postcode}
                                        onChange={(e) => setConfirmDetails({ ...confirmDetails, postcode: e.target.value })}
                                        className="w-full px-6 py-4 rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                                        Phone
                                    </label>
                                    <div className="relative">
                                        <Phone className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        <input
                                            type="tel"
                                            value={confirmDetails.phone}
                                            onChange={(e) => setConfirmDetails({ ...confirmDetails, phone: e.target.value })}
                                            className="w-full pl-14 pr-6 py-4 rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                                        Email
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        <input
                                            type="email"
                                            value={confirmDetails.email}
                                            onChange={(e) => setConfirmDetails({ ...confirmDetails, email: e.target.value })}
                                            className="w-full pl-14 pr-6 py-4 rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                                    Website
                                </label>
                                <div className="relative">
                                    <Globe className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="url"
                                        value={confirmDetails.website}
                                        onChange={(e) => setConfirmDetails({ ...confirmDetails, website: e.target.value })}
                                        className="w-full pl-14 pr-6 py-4 rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900"
                                    />
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 bg-red-50 dark:bg-red-500/10 rounded-full text-red-600 text-center text-sm">
                                <AlertCircle className="w-4 h-4 inline mr-2" />
                                {error}
                            </div>
                        )}

                        <div className="flex gap-4">
                            <button onClick={prevStep} className="px-6 py-4 text-slate-500 font-bold rounded-full hover:bg-slate-100 dark:hover:bg-white/5 text-sm uppercase">
                                Back
                            </button>
                            <button
                                onClick={saveSchoolDetails}
                                disabled={isLoading}
                                className="flex-1 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full font-bold text-sm uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Details'}
                                <ArrowRight size={16} />
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Site Structure Step */}
                {currentStep === "site_structure" && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-8"
                    >
                        <div className="text-center">
                            <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                                Classes & <span className="text-slate-400">Rooms</span>
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400">
                                Add your classes so you can assign pupils and staff
                            </p>
                        </div>

                        <div className="bg-slate-50 dark:bg-white/5 rounded-[4rem] p-8 md:p-12 border border-slate-100 dark:border-white/10 space-y-6">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">
                                    Add Classes
                                </label>
                                <div className="flex gap-3">
                                    <input
                                        type="text"
                                        value={newClass}
                                        onChange={(e) => setNewClass(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && addClass()}
                                        placeholder="e.g., Oak Class, Year 3, Badgers"
                                        className="flex-1 px-6 py-4 rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900"
                                    />
                                    <button
                                        onClick={addClass}
                                        className="px-6 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full font-bold text-sm uppercase"
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>

                            {classes.length > 0 && (
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">
                                        Your Classes
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {classes.map((className) => (
                                            <span
                                                key={className}
                                                className="px-4 py-2 bg-white dark:bg-slate-900 rounded-full text-sm font-medium text-slate-900 dark:text-white flex items-center gap-2"
                                            >
                                                {className}
                                                <button
                                                    onClick={() => removeClass(className)}
                                                    className="text-slate-400 hover:text-red-500"
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="pt-6 border-t border-slate-200 dark:border-white/10">
                                <p className="text-xs text-slate-400 text-center">
                                    You can add more classes and rooms later in the Settings
                                </p>
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 bg-red-50 dark:bg-red-500/10 rounded-full text-red-600 text-center text-sm">
                                <AlertCircle className="w-4 h-4 inline mr-2" />
                                {error}
                            </div>
                        )}

                        <div className="flex gap-4">
                            <button onClick={prevStep} className="px-6 py-4 text-slate-500 font-bold rounded-full hover:bg-slate-100 dark:hover:bg-white/5 text-sm uppercase">
                                Back
                            </button>
                            <button
                                onClick={saveSiteStructure}
                                disabled={isLoading}
                                className="flex-1 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full font-bold text-sm uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Continue'}
                                <ArrowRight size={16} />
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Connect Drive Step */}
                {currentStep === "connect_drive" && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-8"
                    >
                        <div className="text-center">
                            <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                                Connect <span className="text-slate-400">Drive</span>
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400">
                                Link your Google Drive to import data and access documents
                            </p>
                        </div>

                        <div className="bg-slate-50 dark:bg-white/5 rounded-[4rem] p-12 border border-slate-100 dark:border-white/10 text-center space-y-6">
                            <div className="w-20 h-20 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto shadow-lg">
                                <FolderOpen className="w-10 h-10 text-slate-900 dark:text-white" />
                            </div>

                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                Share your Google Drive
                            </h3>

                            <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                                Share a folder with <span className="font-mono text-sm bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded">schoolgle@schoolgle.co.uk</span> containing your import templates
                            </p>

                            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 text-left space-y-3 max-w-sm mx-auto">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Template folders:</p>
                                <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                                    <li>• 02 - Pupil Data</li>
                                    <li>• 03 - Finance & Budget</li>
                                    <li>• 04 - Attendance</li>
                                    <li>• 05 - Governance</li>
                                </ul>
                            </div>

                            <button
                                onClick={() => { setDriveConnected(true); setTimeout(nextStep, 500); }}
                                className="px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full font-bold text-sm uppercase tracking-widest hover:brightness-110"
                            >
                                I've Shared My Drive
                            </button>
                        </div>

                        <div className="flex gap-4">
                            <button onClick={prevStep} className="px-6 py-4 text-slate-500 font-bold rounded-full hover:bg-slate-100 dark:hover:bg-white/5 text-sm uppercase">
                                Back
                            </button>
                            <button
                                onClick={nextStep}
                                className="flex-1 py-4 border-2 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-full font-bold text-sm uppercase hover:bg-slate-50 dark:hover:bg-white/5"
                            >
                                Skip for Now
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Import Data Step */}
                {currentStep === "import_data" && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-8"
                    >
                        <div className="text-center">
                            <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                                Import Your <span className="text-slate-400">Data</span>
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400">
                                Import staff and pupil data from your Drive templates
                            </p>
                        </div>

                        <div className="bg-slate-50 dark:bg-white/5 rounded-[4rem] p-8 md:p-12 border border-slate-100 dark:border-white/10 space-y-6">
                            {!driveConnected ? (
                                <div className="text-center py-8">
                                    <FolderOpen className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-700 mb-4" />
                                    <p className="text-slate-500 dark:text-slate-400">
                                        Connect Google Drive first to import data
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">
                                        Ready to import:
                                    </p>
                                    <div className="space-y-2">
                                        <div className="p-4 bg-white dark:bg-slate-900 rounded-full flex items-center gap-3">
                                            <Users className="w-5 h-5 text-slate-400" />
                                            <span className="font-medium text-slate-900 dark:text-white">Staff Directory</span>
                                        </div>
                                        <div className="p-4 bg-white dark:bg-slate-900 rounded-full flex items-center gap-3">
                                            <Users className="w-5 h-5 text-slate-400" />
                                            <span className="font-medium text-slate-900 dark:text-white">Pupils</span>
                                        </div>
                                        <div className="p-4 bg-white dark:bg-slate-900 rounded-full flex items-center gap-3">
                                            <span className="w-5 h-5 text-slate-400">£</span>
                                            <span className="font-medium text-slate-900 dark:text-white">Budget</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            // TODO: Actually import the data
                                            nextStep();
                                        }}
                                        className="w-full px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full font-bold text-sm uppercase tracking-widest hover:brightness-110"
                                    >
                                        Import All Data
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-4">
                            <button onClick={prevStep} className="px-6 py-4 text-slate-500 font-bold rounded-full hover:bg-slate-100 dark:hover:bg-white/5 text-sm uppercase">
                                Back
                            </button>
                            <button
                                onClick={nextStep}
                                className="flex-1 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2"
                            >
                                Complete Setup
                                <ArrowRight size={16} />
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Complete Step */}
                {currentStep === "complete" && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center space-y-8 py-12"
                    >
                        <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle className="w-10 h-10 text-white" />
                        </div>

                        <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                            You're All <span className="text-slate-400">Set Up!</span>
                        </h2>

                        <p className="text-xl text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                            Your Schoolgle dashboard is ready. Let's improve your school together.
                        </p>

                        <div className="bg-slate-50 dark:bg-white/5 rounded-[4rem] p-8 border border-slate-100 dark:border-white/10">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">
                                What's next?
                            </h3>
                            <ul className="text-left space-y-3 max-w-sm mx-auto">
                                <li className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-400">
                                    <Check className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                    Complete your self-evaluation
                                </li>
                                <li className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-400">
                                    <Check className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                    Upload evidence documents
                                </li>
                                <li className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-400">
                                    <Check className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                    Chat with Ed AI Assistant
                                </li>
                            </ul>
                        </div>

                        <button
                            onClick={goToDashboard}
                            className="group px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full font-bold text-sm uppercase tracking-widest hover:brightness-110 transition-all shadow-lg flex items-center justify-center gap-2 mx-auto"
                        >
                            Go to Dashboard
                            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </motion.div>
                )}

            </div>
        </main>
    );
}
