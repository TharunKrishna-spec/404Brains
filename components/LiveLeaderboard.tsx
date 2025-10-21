import React, { useState, useEffect } from 'react';
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


const LiveLeaderboard: React.FC = () => {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchLeaderboard = async () => {
        // Set loading to true only for the initial fetch
        if (leaderboard.length === 0 && !isRefreshing) {
            setLoading(true);
        }
        
        const { data: teams, error: teamsError } = await supabase.from('teams').select('*');
        if (teamsError) {
            console.error(teamsError);
            setLoading(false);
            return;
        }

        const { data: progress, error: progressError } = await supabase.from('team_progress').select('*');
        if (progressError) {
            console.error(progressError);
            setLoading(false);
            return;
        }

        const boardData = teams.map(team => {
            const solved = progress.filter(p => p.team_id === team.id);
            const lastSolve = solved.length > 0 
                ? solved.reduce((latest, p) => new Date(p.solved_at) > new Date(latest.solved_at) ? p : latest) 
                : null;
            
            return {
                id: team.id,
                team: team.name,
                coins: team.coins,
                cluesSolved: solved.length,
                lastSolveTime: lastSolve ? lastSolve.solved_at : null
            };
        });

        boardData.sort((a, b) => {
            // 1. Descending by coins
            if (b.coins !== a.coins) return b.coins - a.coins;
            // 2. Descending by clues solved
            if (b.cluesSolved !== a.cluesSolved) return b.cluesSolved - a.cluesSolved;
            // 3. Ascending by last solve time (earlier is better)
            if (a.lastSolveTime && b.lastSolveTime) {
                const timeA = new Date(a.lastSolveTime).getTime();
                const timeB = new Date(b.lastSolveTime).getTime();
                if(timeA !== timeB) return timeA - timeB;
            }
            // 4. Tie-breaker: Ascending by Team ID for consistency
            return a.id - b.id;
        });
        
        setLeaderboard(boardData.map((item, index) => ({ ...item, rank: index + 1 })));
        setLoading(false);
    };

    const handleRefresh = async () => {
        if (isRefreshing) return;
        setIsRefreshing(true);
        await fetchLeaderboard();
        setIsRefreshing(false);
    };

    useEffect(() => {
        fetchLeaderboard();

        const channel = supabase
            .channel('public:live_leaderboard')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'team_progress' }, fetchLeaderboard)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, fetchLeaderboard)
            // FIX: The subscribe method requires a callback to handle subscription status.
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    // console.log('Subscribed to live leaderboard updates.');
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const getRankEmoji = (rank: number) => {
        if (rank === 1) return '🏆';
        if (rank === 2) return '🥈';
        if (rank === 3) return '🥉';
        return `#${rank}`;
    };

    return (
        <div className="h-full bg-black/50 border-2 border-[#ff7b00]/50 rounded-lg shadow-lg shadow-[#ff7b00]/10 flex flex-col">
            <div className="flex justify-between items-center p-4 border-b-2 border-[#ff7b00]/50">
                <h2 className="text-2xl font-orbitron text-center text-glow">Live Standings</h2>
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
                                    <p className="font-bold text-lg">{entry.coins} <span className="font-normal text-sm text-yellow-400">🪙</span></p>
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