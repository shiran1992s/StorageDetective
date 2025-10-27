import React from 'react';
import { Button } from '@/components/ui/button';
import { auth, googleProvider, signInWithPopup } from '../firebase';

function Login() {
    const handleLogin = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (error) {
            console.error("Error during Google sign-in:", error);
        }
    };

    return (
        <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
            <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
                <h1 className="text-3xl font-bold mb-2">Welcome To VibeDevOps</h1>
                <p className="text-muted-foreground mb-6">Please sign in to continue</p>
                <Button onClick={handleLogin}>
                    Sign in with Google
                </Button>
            </div>
        </div>
    );
}

export default Login;