import React, { useState, useEffect } from 'react';
import { LeaderboardEntry } from '../types';
import { supabase } from '../lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';

const LiveLeaderboard: React.FC = () => {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLeaderboard = async () => {
        setLoading(true);
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
            if (b.cluesSolved !== a.cluesSolved) return b.cluesSolved - a.cluesSolved;
            if (b.coins !== a.coins) return b.coins - a.coins;
            if (a.lastSolveTime && b.lastSolveTime) return new Date(a.lastSolveTime).getTime() - new Date(b.lastSolveTime).getTime();
            return 0;
        });
        
        setLeaderboard(boardData.map((item, index) => ({ ...item, rank: index + 1 })));
        setLoading(false);
    };

    useEffect(() => {
        fetchLeaderboard();

        const channel = supabase
            .channel('public:live_leaderboard')
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
        <div className="h-full bg-black/50 border-2 border-[#ff7b00]/50 rounded-lg shadow-lg shadow-[#ff7b00]/10 flex flex-col">
            <h2 className="text-2xl font-orbitron text-center p-4 text-glow border-b-2 border-[#ff7b00]/50">Live Standings</h2>
            <div className="flex-1 overflow-y-auto p-4">
                {loading ? (
                    <div className="text-center text-gray-400 animate-pulse">Loading standings...</div>
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
                                    <p className="font-bold text-lg">{entry.cluesSolved} <span className="text-sm font-normal text-gray-400">clues</span></p>
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