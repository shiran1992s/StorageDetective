import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, onAuthStateChanged } from '../firebase'; // Import from our new firebase config

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        console.log("AuthContext: Setting up auth state listener.");
        // onAuthStateChanged returns an unsubscribe function
        const unsubscribe = onAuthStateChanged(auth, user => {
            console.log("AuthContext: Auth state changed.", user ? `User: ${user.uid}` : "No user.");
            setCurrentUser(user);
            setLoading(false);
        });

        // Cleanup subscription on unmount
        return () => {
            console.log("AuthContext: Cleaning up auth state listener.");
            unsubscribe();
        };
    }, []);

    const value = {
        currentUser,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};