import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FilePlus2, Edit, Trash2, Check, X } from 'lucide-react';

export function ThreadSidebar({ threads, currentThreadId, onNewThread, onSelectThread, onRenameThread, onDeleteThread }) {
	console.log("...ThreadSidebar component rendering...");
    const [editingThreadId, setEditingThreadId] = useState(null);
    const [newTitle, setNewTitle] = useState('');

    const handleStartEdit = (thread) => {
        setEditingThreadId(thread.id);
        setNewTitle(thread.title);
    };

    const handleCancelEdit = () => {
        setEditingThreadId(null);
        setNewTitle('');
    };

    const handleSaveEdit = (threadId) => {
        onRenameThread(threadId, newTitle);
        setEditingThreadId(null);
        setNewTitle('');
    };
    
    return (
        <div className="flex flex-col h-full bg-muted/40 p-2">
            <div className="flex items-center justify-between p-2">
                <h2 className="font-semibold">Conversations</h2>
                <Button variant="ghost" size="icon" onClick={onNewThread}>
                    <FilePlus2 className="h-5 w-5" />
                </Button>
            </div>
            <ScrollArea className="flex-grow">
                <div className="space-y-1 p-2">
                    {threads.map((thread) => (
                        <div key={thread.id}>
                            {editingThreadId === thread.id ? (
                                <div className="flex items-center gap-2">
                                    <Input 
                                        value={newTitle} 
                                        onChange={(e) => setNewTitle(e.target.value)} 
                                        className="h-8"
                                    />
                                    <Button variant="ghost" size="icon" onClick={() => handleSaveEdit(thread.id)}><Check className="h-4 w-4"/></Button>
                                    <Button variant="ghost" size="icon" onClick={handleCancelEdit}><X className="h-4 w-4"/></Button>
                                </div>
                            ) : (
                                <Button
                                    variant={currentThreadId === thread.id ? "secondary" : "ghost"}
                                    className="w-full justify-start group"
                                    onClick={() => onSelectThread(thread.id)}
                                >
                                    <span className="truncate flex-1 text-left">{thread.title || "New Chat"}</span>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); handleStartEdit(thread); }}><Edit className="h-4 w-4"/></Button>
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onDeleteThread(thread.id); }}><Trash2 className="h-4 w-4 text-red-500"/></Button>
                                    </div>
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}