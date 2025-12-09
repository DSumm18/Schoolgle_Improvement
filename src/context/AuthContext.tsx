"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, GoogleAuthProvider, OAuthProvider, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { logger } from "@/lib/logger";

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
        const context = { userId: currentUser.uid, function: 'fetchProfile' };

        try {
            logger.debug('Fetching user profile', context);

            const response = await fetch('/api/auth/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: currentUser.uid,
                    email: currentUser.email,
                    displayName: currentUser.displayName
                })
            });

            if (!response.ok) {
                throw new Error(`Profile fetch failed with status: ${response.status}`);
            }

            const data = await response.json();
            setOrganization(data.organization);
            logger.info('User profile fetched successfully', context);
        } catch (error) {
            logger.error('Error fetching user profile', context, error);
            // Don't throw - allow user to continue without organization data
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
            logger.info('Initiating Google sign-in', { provider: 'google.com' });
            const result = await signInWithPopup(auth, provider);
            const credential = GoogleAuthProvider.credentialFromResult(result);
            const token = credential?.accessToken;
            if (token) {
                setAccessToken(token);
            }
            setProviderId('google.com');
            logger.info('Google sign-in successful', { userId: result.user.uid });
        } catch (error: any) {
            logger.error('Error signing in with Google', { provider: 'google.com' }, error);

            // Provide user-friendly error messages
            if (error.code === 'auth/popup-closed-by-user') {
                throw new Error('Sign-in cancelled. Please try again.');
            } else if (error.code === 'auth/popup-blocked') {
                throw new Error('Pop-up blocked. Please allow pop-ups and try again.');
            } else if (error.code === 'auth/network-request-failed') {
                throw new Error('Network error. Please check your connection and try again.');
            }
            throw error;
        }
    };

    const signInWithMicrosoft = async () => {
        const provider = new OAuthProvider('microsoft.com');
        provider.addScope('Files.Read.All');

        try {
            logger.info('Initiating Microsoft sign-in', { provider: 'microsoft.com' });
            const result = await signInWithPopup(auth, provider);
            const credential = OAuthProvider.credentialFromResult(result);
            const token = credential?.accessToken;
            if (token) {
                setAccessToken(token);
            }
            setProviderId('microsoft.com');
            logger.info('Microsoft sign-in successful', { userId: result.user.uid });
        } catch (error: any) {
            logger.error('Error signing in with Microsoft', { provider: 'microsoft.com' }, error);

            // Provide user-friendly error messages
            if (error.code === 'auth/popup-closed-by-user') {
                throw new Error('Sign-in cancelled. Please try again.');
            } else if (error.code === 'auth/popup-blocked') {
                throw new Error('Pop-up blocked. Please allow pop-ups and try again.');
            } else if (error.code === 'auth/network-request-failed') {
                throw new Error('Network error. Please check your connection and try again.');
            }
            throw error;
        }
    };

    const signOut = async () => {
        try {
            logger.info('User signing out', { userId: user?.uid });
            await firebaseSignOut(auth);
            setAccessToken(null);
            setProviderId(null);
            setOrganization(null);
            logger.info('User signed out successfully');
        } catch (error) {
            logger.error('Error signing out', { userId: user?.uid }, error);
            throw error;
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
