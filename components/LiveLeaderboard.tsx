import React, { useState, useEffect, useCallback } from 'react';
import { LeaderboardEntry } from '../types';
import { supabase } from '../lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import SkeletonLoader from './SkeletonLoader';

const LeaderboardRowSkeleton: React.FC = () => (
    <div className="p-3 rounded-md flex items-center justify-between bg-white/5">
        <div className="flex items-center gap-4">
            <SkeletonLoader className="w-8 h-7" />
            <SkeletonLoader className="w-32 h-6" />
        </div>
        <div className="text-right">
            <SkeletonLoader className="w-20 h-6" />
        </div>
    </div>
);

// A simple reload icon component
const ReloadIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M4 4l1.5 1.5A9 9 0 0120.5 10M20 20l-1.5-1.5A9 9 0 013.5 14" />
    </svg>
);

// --- NEW: Live indicator component with status ---
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


const LiveLeaderboard: React.FC = () => {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [subscriptionStatus, setSubscriptionStatus] = useState<'connecting' | 'subscribed' | 'error'>('connecting');

    const fetchLeaderboard = useCallback(async (isInitialLoad = false) => {
        if (isInitialLoad) setLoading(true);

        // Fetch all necessary data in parallel
        const [teamsRes, progressRes, purchasesRes] = await Promise.all([
            supabase.from('teams').select('*'),
            supabase.from('team_progress').select('*'),
            supabase.from('problem_statement_purchases').select('team_id, problem_statements(cost)')
        ]);

        if (teamsRes.error || progressRes.error || purchasesRes.error) {
            console.error("Failed to fetch leaderboard data:", teamsRes.error || progressRes.error || purchasesRes.error);
            if (isInitialLoad) setLoading(false);
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
            
            // --- NEW: Score Calculation ---
            const finalScore = team.coins + (purchaseCostMap.get(team.id) || 0);

            return {
                id: team.id,
                team: team.name,
                coins: finalScore, // Use final score for ranking
                cluesSolved: solved.length,
                lastSolveTime: lastSolve ? lastSolve.solved_at : null
            };
        });

        boardData.sort((a, b) => {
            if (b.coins !== a.coins) return b.coins - a.coins;
            if (b.cluesSolved !== a.cluesSolved) return b.cluesSolved - a.cluesSolved;
            if (a.lastSolveTime && b.lastSolveTime) {
                const timeA = new Date(a.lastSolveTime).getTime();
                const timeB = new Date(b.lastSolveTime).getTime();
                if(timeA !== timeB) return timeA - timeB;
            }
            return a.id - b.id;
        });
        
        setLeaderboard(boardData.map((item, index) => ({ ...item, rank: index + 1 })));

        if (isInitialLoad) setLoading(false);
    }, []);

    const handleRefresh = async () => {
        if (isRefreshing) return;
        setIsRefreshing(true);
        await fetchLeaderboard(false);
        setIsRefreshing(false);
    };

    useEffect(() => {
        fetchLeaderboard(true); // Initial fetch with loading state

        const channel = supabase
            .channel('public:live_leaderboard')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'team_progress' }, () => fetchLeaderboard(false))
            .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, () => fetchLeaderboard(false))
            .on('postgres_changes', { event: '*', schema: 'public', table: 'problem_statement_purchases' }, () => fetchLeaderboard(false))
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
    }, [fetchLeaderboard]);

    const getRankEmoji = (rank: number) => {
        if (rank === 1) return '🏆';
        if (rank === 2) return '🥈';
        if (rank === 3) return '🥉';
        return `#${rank}`;
    };

    return (
        <div className="h-full bg-black/50 border-2 border-[#ff7b00]/50 rounded-lg shadow-lg shadow-[#ff7b00]/10 flex flex-col">
            <div className="flex justify-between items-center p-4 border-b-2 border-[#ff7b00]/50">
                <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-orbitron text-center text-glow">Live Standings</h2>
                    <LiveIndicator status={subscriptionStatus} />
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-wait"
                    aria-label="Refresh leaderboard"
                >
                    <ReloadIcon className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
                {loading ? (
                    <div className="space-y-3">
                        {[...Array(8)].map((_, i) => <LeaderboardRowSkeleton key={i} />)}
                    </div>
                ) : (
                    <div className="space-y-3">
                    <AnimatePresence>
                        {leaderboard.map((entry, index) => (
                            <motion.div
                                key={entry.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ delay: index * 0.05 }}
                                className={`p-3 rounded-md flex items-center justify-between bg-white/5 ${entry.rank === 1 ? 'border-l-4 border-yellow-400' : ''}`}
                            >
                                <div className="flex items-center gap-4">
                                    <span className={`font-orbitron text-lg w-8 text-center ${entry.rank === 1 ? 'text-yellow-400' : 'text-gray-400'}`}>{getRankEmoji(entry.rank)}</span>
                                    <span className="font-bold">{entry.team}</span>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-lg">{entry.coins} <span className="font-normal text-sm text-yellow-400">Pts</span></p>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LiveLeaderboard;