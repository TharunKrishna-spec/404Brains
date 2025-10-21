
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Message } from '../types';
import { supabase } from '../lib/supabaseClient';
import SkeletonLoader from './SkeletonLoader';
import Spinner from './Spinner';
import { useToast } from './Toast';

interface ChatBoxProps {
    senderName: string;
}

const ChatBox: React.FC<ChatBoxProps> = ({ senderName }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const toast = useToast();

    useEffect(() => {
        const fetchMessages = async () => {
            setLoading(true);
            const { data, error } = await supabase.from('messages').select('*').order('created_at', { ascending: true });
            if (error) {
                toast.error(`Failed to load messages: ${error.message}`);
            } else if (data) {
                setMessages(data as Message[]);
            }
            setLoading(false);
        };
        fetchMessages();

        const channel = supabase.channel('public:messages')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
                setMessages(currentMessages => [...currentMessages, payload.new as Message]);
            })
            // FIX: The subscribe method requires a callback to handle subscription status.
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    // console.log('Subscribed to messages channel.');
                }
            });
        
        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim() && !isSending) {
            setIsSending(true);
            const { error } = await supabase.from('messages').insert({ sender: senderName, text: newMessage.trim() });
            if (error) {
                toast.error(`Failed to send message: ${error.message}`);
            } else {
                setNewMessage('');
            }
            setIsSending(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-black/20 rounded-lg overflow-hidden border border-white/10">
            <h3 className="text-xl font-orbitron p-4 border-b border-white/20 text-center text-glow-blue">Event Chat</h3>
            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                {loading ? (
                    <div className="space-y-4">
                        <div className="flex justify-start">
                            <div className="space-y-2 p-3 rounded-lg bg-white/5 w-3/5">
                                <SkeletonLoader className="h-4 w-1/3" />
                                <SkeletonLoader className="h-4 w-full" />
                                <SkeletonLoader className="h-4 w-2/3" />
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <div className="space-y-2 p-3 rounded-lg bg-[#ff7b00]/10 w-1/2">
                                <SkeletonLoader className="h-4 w-full" />
                                <SkeletonLoader className="h-4 w-3/4" />
                            </div>
                        </div>
                        <div className="flex justify-start">
                            <div className="space-y-2 p-3 rounded-lg bg-white/5 w-2/3">
                                <SkeletonLoader className="h-4 w-1/4" />
                                <SkeletonLoader className="h-4 w-full" />
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        {messages.map((msg) => {
                            const isAdmin = msg.sender === 'Admin';
                            const isSelf = msg.sender === senderName;
                            const alignment = isSelf ? 'justify-end' : 'justify-start';
                            const bgColor = isSelf ? (isAdmin ? 'bg-[#00eaff]/30' : 'bg-[#ff7b00]/30') : 'bg-white/10';
                            const nameColor = isAdmin ? 'text-[#00eaff]' : 'text-[#ff7b00]';

                            return (
                                <motion.div 
                                    key={msg.id} 
                                    className={`flex ${alignment}`}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <div className={`max-w-xs md:max-w-md p-3 rounded-lg ${bgColor}`}>
                                        {!isSelf && <p className={`font-bold text-sm ${nameColor}`}>{msg.sender}</p>}
                                        <p className="text-white text-base break-words">{msg.text}</p>
                                        <p className="text-xs text-gray-400 text-right mt-1">
                                            {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                        </p>
                                    </div>
                                </motion.div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>
            <form onSubmit={handleSendMessage} className="p-4 border-t border-white/20 flex gap-2">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 bg-transparent border-2 border-white/30 rounded-md focus:outline-none focus:border-[#ff7b00] focus:ring-1 focus:ring-[#ff7b00] placeholder-gray-500 disabled:opacity-50"
                    disabled={isSending}
                />
                <button 
                    type="submit" 
                    className="px-6 py-2 bg-[#ff7b00] rounded-md font-bold hover:bg-[#ff7b00]/80 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isSending || !newMessage.trim()}
                >
                    {isSending ? <Spinner className="w-5 h-5" /> : 'Send'}
                </button>
            </form>
        </div>
    );
};

export default ChatBox;
