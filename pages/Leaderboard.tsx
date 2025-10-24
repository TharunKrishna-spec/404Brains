import React, { useState, useEffect } from 'react';
import PageTransition from '../components/PageTransition';
import { LeaderboardEntry } from '../types';
import { supabase } from '../lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import SkeletonLoader from '../components/SkeletonLoader';
import { useToast } from '../components/Toast';

const LeaderboardPage: React.FC = () => {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [eventStatus, setEventStatus] = useState<'stopped' | 'running' | 'ended' | 'market' | null>(null);
    const toast = useToast();

    const fetchLeaderboardAndStatus = async () => {
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
            setLoading(false);
            return;
        }
        if (progressRes.error) {
            toast.error(`Failed to load team progress: ${progressRes.error.message}`);
            setLoading(false);
            return;
        }
        if (purchasesRes.error) {
            toast.error(`Failed to load purchases: ${purchasesRes.error.message}`);
            setLoading(false);
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
        setLoading(false);
    };

    useEffect(() => {
        fetchLeaderboardAndStatus();

        const channel = supabase
            .channel('public:leaderboard_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'team_progress' }, fetchLeaderboardAndStatus)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, fetchLeaderboardAndStatus)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'event' }, fetchLeaderboardAndStatus)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'problem_statement_purchases' }, fetchLeaderboardAndStatus)
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    // console.log('Subscribed to leaderboard updates.');
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
                <h1 className="text-4xl md:text-5xl font-orbitron font-bold mb-8 text-glow text-center">Leaderboard</h1>
                {renderContent()}
            </div>
        </PageTransition>
    );
};

export default LeaderboardPage;