import React, { useState, useEffect } from 'react';
import PageTransition from '../components/PageTransition';
import { LeaderboardEntry } from '../types';
import { supabase } from '../lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';

const LeaderboardPage: React.FC = () => {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLeaderboard = async () => {
        // Using an RPC function would be more efficient, but this works client-side.
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

        // Sort by clues solved (desc), then coins (desc), then time (asc)
        boardData.sort((a, b) => {
            if (b.cluesSolved !== a.cluesSolved) return b.cluesSolved - a.cluesSolved;
            if (b.coins !== a.coins) return b.coins - a.coins;
            if (a.lastSolveTime && b.lastSolveTime) return new Date(a.lastSolveTime).getTime() - new Date(b.lastSolveTime).getTime();
            if (a.lastSolveTime) return -1;
            if (b.lastSolveTime) return 1;
            return 0;
        });
        
        setLeaderboard(boardData.map((item, index) => ({ ...item, rank: index + 1 })));
        setLoading(false);
    };

    useEffect(() => {
        fetchLeaderboard();

        const channel = supabase
            .channel('public:leaderboard_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'team_progress' }, fetchLeaderboard)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, fetchLeaderboard)
            .subscribe();

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
        <PageTransition>
            <div className="w-full max-w-4xl mx-auto backdrop-blur-sm bg-black/30 p-4 sm:p-8 rounded-2xl border-2 border-[#ff7b00]/50">
                <h1 className="text-4xl md:text-5xl font-orbitron font-bold mb-8 text-glow text-center">Leaderboard</h1>
                {loading ? (
                    <div className="text-center py-8 text-lg font-rajdhani animate-pulse">Scanning frequencies for leaderboard data...</div>
                ) : (
                    <div>
                        {/* Mobile Card View */}
                        <div className="md:hidden space-y-4">
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
                        </div>

                        {/* Desktop Grid View (Replaces Table) */}
                        <div className="hidden md:block">
                             {/* Header */}
                            <div className="grid grid-cols-12 gap-4 p-4 border-b-2 border-[#ff7b00]/30 text-sm uppercase text-gray-300 tracking-wider font-bold">
                                <div className="col-span-2 pl-4">Rank</div>
                                <div className="col-span-4">Team</div>
                                <div className="col-span-3 text-center">Coins</div>
                                <div className="col-span-3 text-center">Clues Solved</div>
                            </div>

                             {/* Body */}
                            <div className="mt-2">
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
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </PageTransition>
    );
};

export default LeaderboardPage;