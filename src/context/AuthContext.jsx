import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    GoogleAuthProvider,
    onAuthStateChanged,
    signInWithPopup,
    signInWithCredential,
    signInAnonymously,
    signOut,
    updateProfile,
} from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { ref, set } from 'firebase/database';
import { initGoogleNativeAuth, signInWithGoogleNative, isNativePlatform } from '../lib/googleNativeAuth';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Keep React auth state in sync with Firebase
    useEffect(() => {
        // Initialize native Google auth on device (no-op on web).
        initGoogleNativeAuth('124929410484-1qsrbe3uhfqg3p38idhsag3ddl2mpec6.apps.googleusercontent.com');

        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const syncUserProfile = async (firebaseUser) => {
        if (!firebaseUser) return;
        try {
            const userRef = ref(db, `users/${firebaseUser.uid}`);
            await set(userRef, {
                uid: firebaseUser.uid,
                name: firebaseUser.displayName || 'Explorer',
                avatar: firebaseUser.photoURL,
                email: firebaseUser.email,
                isAnonymous: firebaseUser.isAnonymous,
                lastSeen: Date.now(), // Use Date.now() for Realtime Database
            });
        } catch (error) {
            console.error("Error syncing user profile:", error);
        }
    };

    const loginWithGoogle = async () => {
        setLoading(true);
        try {
            let firebaseUser;
            if (isNativePlatform()) {
                const googleUser = await signInWithGoogleNative();
                const idToken = googleUser?.authentication?.idToken || googleUser?.idToken || googleUser?.authentication?.id_token;
                if (!idToken) throw new Error('No ID token');
                const credential = GoogleAuthProvider.credential(idToken);
                const result = await signInWithCredential(auth, credential);
                firebaseUser = result.user;
            } else {
                const provider = new GoogleAuthProvider();
                const result = await signInWithPopup(auth, provider);
                firebaseUser = result.user;
            }
            await syncUserProfile(firebaseUser);
        } catch (error) {
            console.error('Google sign-in failed:', error);
            alert('Google sign-in failed.');
            setLoading(false);
        }
    };

    const loginAnonymouslyHandler = async () => {
        setLoading(true);
        try {
            const result = await signInAnonymously(auth);
            await syncUserProfile(result.user);
        } catch (error) {
            console.error('Anonymous sign-in failed:', error);
            alert('Guest sign-in failed.');
            setLoading(false);
        }
    };

    const logout = async () => {
        setLoading(true);
        try {
            await signOut(auth);
            // onAuthStateChanged will clear user
        } catch (error) {
            console.error('Logout failed:', error);
            alert('Logout failed. Please try again.');
            setLoading(false);
        }
    };

    const updateUserProfile = async (updates) => {
        if (!auth.currentUser) return;
        try {
            await updateProfile(auth.currentUser, updates);
            // Updating the user state locally to reflect changes immediately might be needed if onAuthStateChanged doesn't trigger on profile updates (it usually doesn't for token refreshes but might for profile)
            // But let's rely on manual state refresh or reloading if needed, or just force a re-render.
            // Actually, best to update the local user object manually to trigger UI updates.
            const updatedUser = { ...auth.currentUser, ...updates };
            setUser(updatedUser);
            await syncUserProfile(updatedUser);
        } catch (error) {
            console.error("Error updating profile:", error);
            throw error;
        }
    };

    const value = {
        user,
        loginWithGoogle,
        loginAnonymously: loginAnonymouslyHandler,
        logout,
        loading,
        updateUserProfile,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
