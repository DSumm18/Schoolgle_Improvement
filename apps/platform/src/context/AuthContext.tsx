"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, GoogleAuthProvider, OAuthProvider, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

export interface Organization {
    id: string;
    name: string;
    role: 'admin' | 'teacher' | 'slt';
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    accessToken: string | null;
    providerId: string | null;
    organization: Organization | null;
    signInWithGoogle: () => Promise<void>;
    signInWithMicrosoft: () => Promise<void>;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [providerId, setProviderId] = useState<string | null>(null);
    const [organization, setOrganization] = useState<Organization | null>(null);

    const fetchProfile = async (currentUser: User) => {
        try {
            const response = await fetch('/api/auth/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: currentUser.uid,
                    email: currentUser.email,
                    displayName: currentUser.displayName
                })
            });

            if (response.ok) {
                const data = await response.json();
                setOrganization(data.organization);
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                // Try to determine provider from providerData
                const provider = currentUser.providerData[0]?.providerId;
                setProviderId(provider || null);

                // Fetch profile and organization
                await fetchProfile(currentUser);
            } else {
                setProviderId(null);
                setAccessToken(null);
                setOrganization(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const refreshProfile = async () => {
        if (user) {
            await fetchProfile(user);
        }
    };

    const signInWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        provider.addScope('https://www.googleapis.com/auth/drive.readonly');

        try {
            const result = await signInWithPopup(auth, provider);
            const credential = GoogleAuthProvider.credentialFromResult(result);
            const token = credential?.accessToken;
            if (token) {
                setAccessToken(token);
            }
            setProviderId('google.com');
        } catch (error) {
            console.error("Error signing in with Google", error);
        }
    };

    const signInWithMicrosoft = async () => {
        const provider = new OAuthProvider('microsoft.com');
        provider.addScope('Files.Read.All');

        try {
            const result = await signInWithPopup(auth, provider);
            const credential = OAuthProvider.credentialFromResult(result);
            const token = credential?.accessToken;
            if (token) {
                setAccessToken(token);
            }
            setProviderId('microsoft.com');
        } catch (error) {
            console.error("Error signing in with Microsoft", error);
        }
    };

    const signOut = async () => {
        try {
            await firebaseSignOut(auth);
            setAccessToken(null);
            setProviderId(null);
            setOrganization(null);
        } catch (error) {
            console.error("Error signing out", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, accessToken, providerId, organization, signInWithGoogle, signInWithMicrosoft, signOut, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
