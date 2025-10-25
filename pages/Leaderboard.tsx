import React, { useState, useEffect, useCallback } from 'react';
import PageTransition from '../components/PageTransition';
import { LeaderboardEntry } from '../types';
import { supabase } from '../lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import SkeletonLoader from '../components/SkeletonLoader';
import { useToast } from '../components/Toast';

const ReloadIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M4 4l1.5 1.5A9 9 0 0120.5 10M20 20l-1.5-1.5A9 9 0 013.5 14" />
    </svg>
);

const LiveIndicator: React.FC<{ status: 'connecting' | 'subscribed' | 'error' }> = ({ status }) => {
    const statusConfig = {
        connecting: { pingColor: 'bg-yellow-400', dotColor: 'bg-yellow-500', title: 'Connecting to live updates...' },
        subscribed: { pingColor: 'bg-green-400', dotColor: 'bg-green-500', title: 'Live updates enabled' },
        error: { pingColor: 'bg-red-400', dotColor: 'bg-red-500', title: 'Live updates disconnected. Please refresh.' },
    };
    const config = statusConfig[status];
    return (
        <div className="relative flex h-3 w-3" title={config.title}>
            {status !== 'error' && ( <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.pingColor} opacity-75`}></span> )}
            <span className={`relative inline-flex rounded-full h-3 w-3 ${config.dotColor}`}></span>
        </div>
    );
};

const LeaderboardPage: React.FC = () => {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [eventStatus, setEventStatus] = useState<'stopped' | 'running' | 'ended' | 'market' | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [subscriptionStatus, setSubscriptionStatus] = useState<'connecting' | 'subscribed' | 'error'>('connecting');
    const toast = useToast();

    const fetchLeaderboardAndStatus = useCallback(async (isInitialLoad = false) => {
        if (isInitialLoad) setLoading(true);
        else setIsRefreshing(true);

        // Fetch event status first
        const { data: eventData, error: eventError } = await supabase.from('event').select('status').eq('id', 1).single();
        if (eventError) {
            toast.error(`Failed to get event status: ${eventError.message}`);
        } else if (eventData) {
            setEventStatus(eventData.status);
        }

        // Fetch all necessary data in parallel
        const [teamsRes, progressRes, purchasesRes] = await Promise.all([
            supabase.from('teams').select('*'),
            supabase.from('team_progress').select('*'),
            supabase.from('problem_statement_purchases').select('team_id, problem_statements(cost)')
        ]);

        if (teamsRes.error) {
            toast.error(`Failed to load teams: ${teamsRes.error.message}`);
            if (isInitialLoad) setLoading(false);
            setIsRefreshing(false);
            return;
        }
        if (progressRes.error) {
            toast.error(`Failed to load team progress: ${progressRes.error.message}`);
            if (isInitialLoad) setLoading(false);
            setIsRefreshing(false);
            return;
        }
        if (purchasesRes.error) {
            toast.error(`Failed to load purchases: ${purchasesRes.error.message}`);
            if (isInitialLoad) setLoading(false);
            setIsRefreshing(false);
            return;
        }
        
        const teams = teamsRes.data;
        const progress = progressRes.data;
        const purchases = purchasesRes.data as unknown as { team_id: number; problem_statements: { cost: number } }[];

        // Create a map for quick lookup of purchase costs
        const purchaseCostMap = new Map<number, number>();
        purchases.forEach(p => {
            if (p.problem_statements) {
                purchaseCostMap.set(p.team_id, p.problem_statements.cost);
            }
        });

        const boardData = teams.map(team => {
            const solved = progress.filter(p => p.team_id === team.id);
            const lastSolve = solved.length > 0 
                ? solved.reduce((latest, p) => new Date(p.solved_at) > new Date(latest.solved_at) ? p : latest) 
                : null;
            
            const finalScore = team.coins + (purchaseCostMap.get(team.id) || 0);

            return {
                id: team.id,
                team: team.name,
                coins: finalScore, // Use final score for ranking
                cluesSolved: solved.length,
                lastSolveTime: lastSolve ? lastSolve.solved_at : null
            };
        });

        // Sort by score (desc), then clues solved (desc), then time (asc), then ID (asc)
        boardData.sort((a, b) => {
            if (b.coins !== a.coins) return b.coins - a.coins;
            if (b.cluesSolved !== a.cluesSolved) return b.cluesSolved - a.cluesSolved;
            if (a.lastSolveTime && b.lastSolveTime) {
                const timeA = new Date(a.lastSolveTime).getTime();
                const timeB = new Date(b.lastSolveTime).getTime();
                if (timeA !== timeB) return timeA - timeB;
            }
            return a.id - b.id;
        });
        
        setLeaderboard(boardData.map((item, index) => ({ ...item, rank: index + 1 })));
        if (isInitialLoad) setLoading(false);
        setIsRefreshing(false);
    }, [toast]);

    useEffect(() => {
        fetchLeaderboardAndStatus(true);

        const channel = supabase
            .channel('public:leaderboard_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'team_progress' }, () => fetchLeaderboardAndStatus(false))
            .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, () => fetchLeaderboardAndStatus(false))
            .on('postgres_changes', { event: '*', schema: 'public', table: 'event' }, () => fetchLeaderboardAndStatus(false))
            .on('postgres_changes', { event: '*', schema: 'public', table: 'problem_statement_purchases' }, () => fetchLeaderboardAndStatus(false))
            .subscribe((status, err) => {
                if (status === 'SUBSCRIBED') {
                    setSubscriptionStatus('subscribed');
                } else if (status === 'TIMED_OUT' || status === 'CHANNEL_ERROR') {
                    console.error('Subscription error:', err);
                    setSubscriptionStatus('error');
                } else if (status === 'CLOSED') {
                    setSubscriptionStatus('error');
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchLeaderboardAndStatus]);

    const getRankEmoji = (rank: number) => {
        if (rank === 1) return '🏆';
        if (rank === 2) return '🥈';
        if (rank === 3) return '🥉';
        return `#${rank}`;
    };

    const renderContent = () => {
        if (loading) {
            return (
                <div className="space-y-2">
                    {/* Desktop Skeleton */}
                    <div className="hidden md:block">
                         <div className="grid grid-cols-12 gap-4 p-4 border-b-2 border-[#ff7b00]/30">
                            <SkeletonLoader className="col-span-2 h-6" />
                            <SkeletonLoader className="col-span-4 h-6" />
                            <SkeletonLoader className="col-span-3 h-6" />
                            <SkeletonLoader className="col-span-3 h-6" />
                        </div>
                         <div className="mt-2 space-y-2">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="grid grid-cols-12 gap-4 items-center p-2 rounded-lg bg-white/5">
                                    <SkeletonLoader className="col-span-2 h-8" />
                                    <SkeletonLoader className="col-span-4 h-8" />
                                    <SkeletonLoader className="col-span-3 h-8" />
                                    <SkeletonLoader className="col-span-3 h-8" />
                                </div>
                            ))}
                        </div>
                    </div>
                     {/* Mobile Skeleton */}
                    <div className="md:hidden space-y-4">
                         {[...Array(5)].map((_, i) => (
                            <div key={i} className="p-4 rounded-lg bg-white/5">
                                <div className="flex justify-between items-center">
                                    <div className="w-2/3 space-y-2">
                                        <SkeletonLoader className="h-6 w-full" />
                                        <SkeletonLoader className="h-4 w-1/3" />
                                    </div>
                                    <div className="w-1/4 space-y-2">
                                        <SkeletonLoader className="h-5 w-full" />
                                        <SkeletonLoader className="h-5 w-full" />
                                    </div>
                                </div>
                            </div>
                         ))}
                    </div>
                </div>
            );
        }

        return (
            <div>
                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                    {eventStatus === 'stopped' ? (
                        <div className="p-4 rounded-lg bg-black/40 border-2 border-dashed border-yellow-500/80 text-center">
                            <p className="text-lg text-yellow-300 font-orbitron">Awaiting Transmission...</p>
                            <p className="mt-2 text-yellow-200">The leaderboard will be populated once the event starts.</p>
                        </div>
                    ) : leaderboard.length === 0 ? (
                        <div className="p-4 rounded-lg bg-white/5 text-center">
                            <p className="text-lg text-gray-400">No teams have scored yet.</p>
                        </div>
                    ) : (
                        <AnimatePresence>
                            {leaderboard.map((entry) => (
                                <motion.div 
                                    key={entry.id}
                                    layout
                                    initial={{ opacity: 0, y: 50 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -50 }}
                                    transition={{ type: 'spring', stiffness: 260, damping: 25 }}
                                    className={`p-4 rounded-lg bg-white/5 border-l-4 ${entry.rank === 1 ? 'border-l-[#ffD700]' : entry.rank === 2 ? 'border-l-[#C0C0C0]' : entry.rank === 3 ? 'border-l-[#CD7F32]' : 'border-l-transparent'}`}
                                >
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className={`font-orbitron text-xl ${entry.rank === 1 ? 'text-[#ff7b00]' : ''}`}>{entry.team}</p>
                                            <p className="text-sm text-gray-400">Rank: <span className="font-bold">{getRankEmoji(entry.rank)}</span></p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-lg">{entry.cluesSolved} <span className="text-sm font-normal text-gray-400">clues</span></p>
                                            <p className="font-bold text-lg">{entry.coins} <span className="text-sm font-normal text-gray-400">coins</span></p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}
                </div>

                {/* Desktop Grid View */}
                <div className="hidden md:block">
                     {/* Header */}
                    <div className="grid grid-cols-12 gap-4 p-4 border-b-2 border-[#ff7b00]/30 text-sm uppercase text-gray-300 tracking-wider font-bold">
                        <div className="col-span-2 pl-4">Rank</div>
                        <div className="col-span-4">Team</div>
                        <div className="col-span-3 text-center">Score</div>
                        <div className="col-span-3 text-center">Clues Solved</div>
                    </div>

                     {/* Body */}
                    <div className="mt-2">
                         {eventStatus === 'stopped' ? (
                            <div className="mt-2 p-6 rounded-lg bg-black/40 border-2 border-dashed border-yellow-500/80 text-center">
                                <p className="text-xl text-yellow-300 font-orbitron">Awaiting Transmission...</p>
                                <p className="mt-2 text-yellow-200">The leaderboard will be populated once the event starts.</p>
                            </div>
                        ) : leaderboard.length === 0 ? (
                             <div className="mt-2 p-6 rounded-lg bg-white/5 text-center">
                                <p className="text-lg text-gray-400">No teams have scored yet. Standings will appear here live.</p>
                            </div>
                        ) : (
                            <AnimatePresence>
                                {leaderboard.map((entry) => (
                                    <motion.div 
                                        key={entry.id} 
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                                        transition={{ type: 'spring', stiffness: 260, damping: 25 }}
                                        className={`grid grid-cols-12 gap-4 items-center p-2 rounded-lg text-lg my-1
                                        ${entry.rank <= 3 ? 'font-bold' : ''}
                                        ${entry.rank === 1 ? 'text-[#ff7b00] bg-white/10' : 'bg-white/5'}`}
                                    >
                                        <div className={`col-span-2 p-2 border-l-4 ${entry.rank === 1 ? 'border-l-[#ffD700]' : entry.rank === 2 ? 'border-l-[#C0C0C0]' : entry.rank === 3 ? 'border-l-[#CD7F32]' : 'border-l-transparent'}`}>
                                            <span className="ml-2">{getRankEmoji(entry.rank)}</span>
                                        </div>
                                        <div className="col-span-4 font-orbitron">{entry.team}</div>
                                        <div className="col-span-3 text-center">{entry.coins}</div>
                                        <div className="col-span-3 text-center">{entry.cluesSolved}</div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <PageTransition>
            <div className="w-full max-w-4xl mx-auto backdrop-blur-sm bg-black/30 p-4 sm:p-8 rounded-2xl border-2 border-[#ff7b00]/50">
                <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                        <h1 className="text-4xl md:text-5xl font-orbitron font-bold text-glow">Leaderboard</h1>
                        <LiveIndicator status={subscriptionStatus} />
                    </div>
                     <button
                        onClick={() => fetchLeaderboardAndStatus(false)}
                        disabled={isRefreshing}
                        className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-wait flex items-center gap-2"
                        aria-label="Refresh leaderboard"
                    >
                        <ReloadIcon className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                        <span className="text-sm">Refresh</span>
                    </button>
                </div>
                {renderContent()}
            </div>
        </PageTransition>
    );
};

export default LeaderboardPage;
