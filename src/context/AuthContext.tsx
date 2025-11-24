"use client";
"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, GoogleAuthProvider, OAuthProvider, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    accessToken: string | null;
    providerId: string | null;
    signInWithGoogle: () => Promise<void>;
    signInWithMicrosoft: () => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [providerId, setProviderId] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                // Try to determine provider from providerData
                const provider = currentUser.providerData[0]?.providerId;
                setProviderId(provider || null);
            } else {
                setProviderId(null);
                setAccessToken(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

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
        } catch (error) {
            console.error("Error signing out", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, accessToken, providerId, signInWithGoogle, signInWithMicrosoft, signOut }}>
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
