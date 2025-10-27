import React from 'react';
import { LogOut, LayoutDashboard, Settings } from 'lucide-react';
// REMOVED: import { Button } from 'lucide-react'; 

// Utility function copied from App.jsx
const gradientText = "bg-gradient-to-r from-indigo-400 to-pink-500 text-transparent bg-clip-text";

export function VibeHeader({ user, onLogout, currentScreen, onSelectScreen }) {
    if (!user) return null;

    const displayName = user.displayName || (user.isAnonymous ? "Anonymous User (Local)" : "Vibe User");
    const placeholderChar = (displayName.charAt(0) || 'U').toUpperCase();
    const photoURL = `https://placehold.co/40x40/4F46E5/FFFFFF?text=${placeholderChar}`;

    return (
        <aside className="w-64 bg-gray-900 border-r border-gray-800 p-6 flex flex-col shrink-0 text-gray-200">
            <div className="text-2xl font-bold tracking-tight mb-10">
                <a href="/"><span className={gradientText}>Vibe</span><span className="text-white">DevOps</span></a>
            </div>
            <nav className="flex flex-col space-y-2">
                <button 
                    onClick={() => onSelectScreen('config')}
                    className={`flex items-center p-3 rounded-lg font-semibold w-full text-left transition-colors ${currentScreen === 'config' || currentScreen === 'dashboard' ? 'bg-indigo-600/20 text-indigo-400' : 'text-gray-400 hover:bg-gray-800'}`}
                >
                    <LayoutDashboard className="w-5 h-5 mr-3" />
                    Deployment Config
                </button>
                <button 
                    onClick={() => onSelectScreen('credentials')}
                    className={`flex items-center p-3 rounded-lg font-semibold w-full text-left transition-colors ${currentScreen === 'credentials' ? 'bg-indigo-600/20 text-indigo-400' : 'text-gray-400 hover:bg-gray-800'}`}
                >
                    <Settings className="w-5 h-5 mr-3" />
                    Setup & Credentials
                </button>
            </nav>

            <div className="mt-auto pt-6 border-t border-gray-700">
                <div className="flex items-center">
                    <img className="h-10 w-10 rounded-full object-cover" src={photoURL} alt="User avatar" />
                    <div className="ml-3">
                        <p className="font-semibold text-white">{displayName}</p>
                        <button 
                            className="text-xs text-gray-400 hover:text-indigo-400 cursor-pointer" 
                            onClick={onLogout}
                        >
                            <LogOut className="inline-block w-3 h-3 mr-1 align-middle" />
                            Log Out
                        </button>
                    </div>
                </div>
            </div>
        </aside>
    );
}