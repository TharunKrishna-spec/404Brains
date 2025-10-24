

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import PageTransition from '../components/PageTransition';
import GlowingButton from '../components/GlowingButton';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabaseClient';
import { Team, Clue, TeamProgress } from '../types';
import LiveLeaderboard from '../components/LiveLeaderboard';
import { motion, AnimatePresence } from 'framer-motion';
import SkeletonLoader from '../components/SkeletonLoader';
import ClueCard from '../components/ClueCard';
import { useToast } from '../components/Toast';
import ConfirmationModal from '../components/ConfirmationModal';

const CheckIcon: React.FC<{className?:string}> = ({className}) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>;

const formatTime = (seconds: number): string => {
    if (isNaN(seconds) || seconds < 0) return '00:00:00';
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
};

const ClueCardSkeleton: React.FC = () => (
    <div className="p-4 rounded-lg bg-black/40 border-2 border-white/20">
        <div className="flex justify-between items-start">
            <SkeletonLoader className="h-7 w-1/4" />
        </div>
        <SkeletonLoader className="h-5 w-full mt-3" />
        <SkeletonLoader className="h-5 w-3/4 mt-2" />
        <div className="mt-4 flex gap-2">
            <SkeletonLoader className="flex-1 h-10 rounded-md" />
            <SkeletonLoader className="w-32 h-12 rounded-md" />
        </div>
    </div>
);

const TeamDashboardSkeleton: React.FC = () => (
    <PageTransition>
        <div className="w-full max-w-7xl mx-auto backdrop-blur-sm bg-black/30 p-4 sm:p-8 rounded-2xl border-2 border-[#ff7b00]/50">
            <div className="text-center mb-8">
                <SkeletonLoader className="h-12 w-1/2 mx-auto" />
                <SkeletonLoader className="h-6 w-1/3 mx-auto mt-4" />
            </div>
            <div className="mb-8">
                <SkeletonLoader className="h-6 w-1/3 mx-auto mb-3" />
                <SkeletonLoader className="h-6 w-full rounded-full" />
                <SkeletonLoader className="h-8 w-1/4 mx-auto mt-3" />
            </div>
            <div className="mb-8 p-4 bg-black/40 rounded-lg border border-dashed border-white/20">
                <SkeletonLoader className="h-6 w-1/4 mx-auto mb-2" />
                <SkeletonLoader className="h-16 w-1/2 mx-auto" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <SkeletonLoader className="h-10 w-1/3" />
                    <div className="space-y-4">
                        <ClueCardSkeleton />
                        <ClueCardSkeleton />
                    </div>
                </div>
                <div className="lg:col-span-1 h-[60vh]">
                     <div className="h-full bg-black/50 border-2 border-[#ff7b00]/50 rounded-lg shadow-lg shadow-[#ff7b00]/10 flex flex-col">
                        <h2 className="text-2xl font-orbitron text-center p-4 text-glow border-b-2 border-[#ff7b00]/50">Live Standings</h2>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                             {[...Array(5)].map((_, i) => (
                                <div key={i} className="p-3 rounded-md flex items-center justify-between bg-white/5">
                                    <div className="flex items-center gap-4">
                                        <SkeletonLoader className="w-8 h-7" />
                                        <SkeletonLoader className="w-32 h-6" />
                                    </div>
                                    <div className="text-right">
                                        <SkeletonLoader className="w-20 h-6" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </PageTransition>
);


const TeamDashboardPage: React.FC = () => {
    const { user, logout } = useAuth();
    const [team, setTeam] = useState<Team | null>(null);
    const [clues, setClues] = useState<Clue[]>([]);
    const [progress, setProgress] = useState<TeamProgress[]>([]);
    const [loading, setLoading] = useState(true);
    const [eventStatus, setEventStatus] = useState<'stopped' | 'running'>('stopped');
    const [startTime, setStartTime] = useState<string | null>(null);
    const [activeClueElapsedTime, setActiveClueElapsedTime] = useState(0);
    const [currentAnswer, setCurrentAnswer] = useState<{ [clueId: number]: string }>({});
    const [submitStatus, setSubmitStatus] = useState<{ [clueId: number]: 'idle' | 'loading' | 'correct' | 'incorrect' }>({});
    const [awardedCoins, setAwardedCoins] = useState<{ [clueId: number]: number }>({});
    const toast = useToast();
    const [clueToSkip, setClueToSkip] = useState<Clue | null>(null);
    const [isSkipping, setIsSkipping] = useState(false);
    
    useEffect(() => {
        const fetchTeamData = async () => {
            if (!user) {
                setLoading(false);
                return;
            };
            
            // Fetch team details
            const { data: teamData, error: teamError } = await supabase
                .from('teams')
                .select('*')
                .eq('user_id', user.id)
                .single();
            
            if (teamError) {
                toast.error(`Could not load team data: ${teamError.message}`);
                setLoading(false);
                return; // Stop execution if team data fails
            }
            
            if (teamData) {
                setTeam(teamData);
    
                // Fetch clues for team's domain
                const { data: cluesData, error: cluesError } = await supabase
                    .from('clues')
                    .select('*')
                    .eq('domain', teamData.domain)
                    .order('id', { ascending: true });
                
                if (cluesError) toast.error(`Failed to load clues: ${cluesError.message}`);
                else if (cluesData) setClues(cluesData);
    
                // Fetch team progress
                const { data: progressData, error: progressError } = await supabase
                    .from('team_progress')
                    .select('*')
                    .eq('team_id', teamData.id);
                
                if (progressError) toast.error(`Failed to load progress: ${progressError.message}`);
                else if (progressData) setProgress(progressData);
            }
            
            // Fetch event status and start time
            const { data: eventData, error: eventError } = await supabase.from('event').select('status, start_time').eq('id', 1).single();
            if (eventError) toast.error(`Failed to get event status: ${eventError.message}`);
            else if (eventData) {
                setEventStatus(eventData.status);
                setStartTime(eventData.start_time);
            }
    
            setLoading(false);
        };

        fetchTeamData();

        const channel = supabase.channel(`team-dashboard-changes-${user?.id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'team_progress' }, fetchTeamData)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, fetchTeamData)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'event' }, fetchTeamData)
            .subscribe(status => {
                if (status === 'SUBSCRIBED') {
                    // console.log(`Subscribed to team dashboard updates for user ${user?.id}`);
                }
            });

        return () => { 
            supabase.removeChannel(channel);
        };

    }, [user, toast]);

    const sortedClues = useMemo(() => [...clues].sort((a, b) => a.id - b.id), [clues]);
    const progressMap = useMemo(() => {
        const map = new Map<number, TeamProgress>();
        progress.forEach(p => map.set(p.clue_id, p));
        return map;
    }, [progress]);
    
    // Memoize the active clue's start time for scoring calculations.
    const activeClueInfo = useMemo(() => {
        const activeIndex = sortedClues.findIndex((clue, index) => {
            const isSolved = progressMap.has(clue.id);
            if (isSolved) return false;
            const isUnlocked = index === 0 || progressMap.has(sortedClues[index - 1].id);
            return isUnlocked;
        });

        if (activeIndex === -1) return null;

        const activeClue = sortedClues[activeIndex];
        // For the first clue, its start time is the global event start time.
        // For subsequent clues, its start time is when the previous clue was solved.
        let clueStartTime = (activeIndex === 0) 
            ? startTime 
            : progressMap.get(sortedClues[activeIndex - 1].id)?.solved_at ?? null;
        
        return { clueId: activeClue.id, startTime: clueStartTime };
    }, [sortedClues, progressMap, startTime]);

    useEffect(() => {
        // Timer for the currently active clue.
        if (eventStatus === 'running' && activeClueInfo?.startTime) {
            const timerInterval = setInterval(() => {
                const elapsed = Math.floor((Date.now() - new Date(activeClueInfo.startTime!).getTime()) / 1000);
                setActiveClueElapsedTime(elapsed >= 0 ? elapsed : 0);
            }, 1000);

            return () => clearInterval(timerInterval);
        } else {
            // If no active clue or event stopped, reset timer display.
            setActiveClueElapsedTime(0);
        }
    }, [activeClueInfo, eventStatus]);

    useEffect(() => {
        // This effect provides an extra guarantee that the timer is zeroed out
        // as soon as the event status changes to 'stopped', ensuring immediate
        // synchronization with the admin's action.
        if (eventStatus === 'stopped') {
            setActiveClueElapsedTime(0);
        }
    }, [eventStatus]);

    const handleLogout = async () => {
        const { error } = await logout();
        if (error) {
            toast.error(`Logout failed: ${error.message}`);
        }
    };

    const handleAnswerChange = (clueId: number, value: string) => {
        setCurrentAnswer(prev => ({ ...prev, [clueId]: value }));
        if (submitStatus[clueId] && submitStatus[clueId] !== 'loading') {
            setSubmitStatus(prev => ({ ...prev, [clueId]: 'idle' }));
        }
    };
    
    const handleSubmitAnswer = async (clueId: number) => {
        if (!team || !currentAnswer[clueId]?.trim()) return;

        setSubmitStatus(prev => ({ ...prev, [clueId]: 'loading' }));
        const submittedAnswer = currentAnswer[clueId].trim().toUpperCase();

        const clue = sortedClues.find(c => c.id === clueId);
        if (!clue) return;

        if (clue.answer === submittedAnswer) {
            const solveTime = new Date();
            
            const clueStartTime = activeClueInfo?.startTime;
            if (!clueStartTime) {
                toast.error("Scoring Error: Could not determine clue start time.");
                setSubmitStatus(prev => ({ ...prev, [clueId]: 'idle' }));
                return;
            }
            const elapsedSeconds = Math.floor((solveTime.getTime() - new Date(clueStartTime).getTime()) / 1000);

            let coinsToAdd = 10;
            if (elapsedSeconds <= 5 * 60) {
                coinsToAdd = 30;
            } else if (elapsedSeconds <= 10 * 60) {
                coinsToAdd = 20;
            }
            
            setAwardedCoins(prev => ({ ...prev, [clueId]: coinsToAdd }));
            setSubmitStatus(prev => ({ ...prev, [clueId]: 'correct' }));

            try {
                const { error: progressError } = await supabase.from('team_progress').insert({ team_id: team.id, clue_id: clueId, solved_at: solveTime.toISOString() });
                if (progressError) throw progressError;

                const newCoins = (team.coins || 0) + coinsToAdd;
                const { error: teamUpdateError } = await supabase.from('teams').update({ coins: newCoins }).eq('id', team.id);
                if (teamUpdateError) throw teamUpdateError;

                const newProgressRecord: TeamProgress = { team_id: team.id, clue_id: clueId, solved_at: solveTime.toISOString() };
                setProgress(prev => [...prev, newProgressRecord]);
                setTeam(prev => prev ? { ...prev, coins: newCoins } : null);
                setCurrentAnswer(prev => {
                    const newState = { ...prev };
                    delete newState[clueId];
                    return newState;
                });

            } catch (error: any) {
                console.error("Error submitting answer progress:", error);
                toast.error(`Submission failed: ${error.message}. Please contact an admin.`);
                
                setSubmitStatus(prev => ({ ...prev, [clueId]: 'idle' }));
                setAwardedCoins(prev => {
                    const newAwards = {...prev};
                    delete newAwards[clueId];
                    return newAwards;
                });
            }

        } else {
            setSubmitStatus(prev => ({ ...prev, [clueId]: 'incorrect' }));
            setTimeout(() => {
                setSubmitStatus(prev => ({ ...prev, [clueId]: 'idle' }));
            }, 2000);
        }
    };
    
    const handleOpenSkipConfirm = useCallback((clueId: number) => {
        const clue = sortedClues.find(c => c.id === clueId);
        if (clue) {
            setClueToSkip(clue);
        }
    }, [sortedClues]);

    const handleConfirmSkip = async () => {
        if (!team || !clueToSkip) return;

        setIsSkipping(true);

        const newCoins = (team.coins || 0) - 20;
        const skipTime = new Date();

        try {
            const { error: progressError } = await supabase.from('team_progress').insert({ 
                team_id: team.id, 
                clue_id: clueToSkip.id, 
                solved_at: skipTime.toISOString() 
            });
            if (progressError) throw progressError;

            const { error: teamUpdateError } = await supabase.from('teams').update({ coins: newCoins }).eq('id', team.id);
            if (teamUpdateError) throw teamUpdateError;
            
            toast.info(`Clue skipped. 20 coins deducted.`);
            
            // Optimistic update for faster UI response
            const newProgressRecord: TeamProgress = { team_id: team.id, clue_id: clueToSkip.id, solved_at: skipTime.toISOString() };
            setProgress(prev => [...prev, newProgressRecord]);
            setTeam(prev => prev ? { ...prev, coins: newCoins } : null);
            
        } catch (error: any) {
            console.error("Error skipping clue:", error);
            toast.error(`Failed to skip clue: ${error.message}. Please try again.`);
        } finally {
            setIsSkipping(false);
            setClueToSkip(null); // Close the modal
        }
    };

    if (loading) {
        return <TeamDashboardSkeleton />;
    }
    
    if (!team) {
        return (
            <div className="text-center">
                <h1 className="text-4xl font-orbitron text-red-500">Error</h1>
                <p className="mt-4 text-lg">Could not load team data. You may not be assigned to a team yet.</p>
                <GlowingButton onClick={logout} className="mt-8 !border-red-500 group-hover:!bg-red-500">Logout</GlowingButton>
            </div>
        )
    }
    
    const solvedCount = progress.length;
    const totalClues = clues.length;
    const progressPercentage = totalClues > 0 ? (solvedCount / totalClues) * 100 : 0;
    const allCluesSolved = totalClues > 0 && solvedCount === totalClues;

    return (
        <PageTransition>
            <div className="relative w-full max-w-7xl mx-auto backdrop-blur-sm bg-black/30 p-4 sm:p-8 rounded-2xl border-2 border-[#ff7b00]/50">
                <div className="absolute top-4 right-4 z-20 flex items-center gap-4">
                     <GlowingButton 
                        onClick={handleLogout} 
                        className="!py-1 !px-3 !border-red-500 group-hover:!bg-red-500 !text-xs"
                    >
                        Logout
                    </GlowingButton>
                </div>
                <div className="relative z-10">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl md:text-5xl font-orbitron font-bold text-glow">{team.name}</h1>
                        <p className="text-2xl font-orbitron text-gray-200 mt-4">
                            Total Coins: <span className="font-bold text-yellow-400 text-glow">{team.coins} 🪙</span>
                        </p>
                    </div>

                    {totalClues > 0 && (
                        <div className="mb-8 px-2">
                            <h3 className="text-xl font-orbitron text-center text-gray-400 uppercase tracking-widest mb-3">Mission Progress</h3>
                            <div className="w-full bg-black/50 border-2 border-[#ff7b00]/30 rounded-full p-1 pulse-glow">
                                <motion.div
                                    className="h-4 bg-gradient-to-r from-[#ff7b00] to-yellow-400 rounded-full shadow-lg shadow-[#ff7b00]/50 progress-bar-shimmer"
                                    initial={{ width: '0%' }}
                                    animate={{ width: `${progressPercentage}%` }}
                                    transition={{ duration: 1, ease: [0.42, 0, 0.58, 1] }}
                                />
                            </div>
                            <p className="text-center font-orbitron text-2xl mt-3 text-glow">
                                {solvedCount} / {totalClues} <span className="text-lg text-gray-300">Clues Decrypted</span>
                            </p>
                        </div>
                    )}
                    
                    {eventStatus === 'stopped' && (
                        <div className="flex flex-col items-center justify-center text-center p-8 bg-black/40 border-2 border-dashed border-yellow-500/80 rounded-lg min-h-[40vh] mt-8">
                            <h2 className="text-4xl font-orbitron text-yellow-300">Awaiting Transmission...</h2>
                            <p className="mt-4 text-xl text-yellow-200 max-w-2xl">
                                The event has not yet started. Please stand by. Clues for your domain will be broadcast here once the event is initiated by the administrator.
                            </p>
                            <div className="mt-6 text-6xl animate-pulse">⏳</div>
                        </div>
                    )}

                    <AnimatePresence>
                    {eventStatus === 'running' && (
                        <motion.div 
                            initial={{opacity: 0, y: 20}}
                            animate={{opacity: 1, y: 0}}
                            exit={{opacity: 0, y: -20}}
                            className="pt-4"
                        >
                            {activeClueInfo && (
                                <div className="my-8 text-center p-6 bg-black/40 rounded-lg border-2 border-dashed border-[#ff7b00]/50">
                                    <h3 className="text-2xl font-orbitron text-gray-400 uppercase tracking-widest">Time on Current Clue</h3>
                                    <div className="font-orbitron text-7xl font-black tracking-widest text-yellow-300 text-glow mt-2">
                                        {formatTime(activeClueElapsedTime)}
                                    </div>
                                </div>
                            )}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 space-y-6">
                                    <h2 className="text-3xl font-orbitron text-glow-blue border-b-2 border-[#00eaff]/30 pb-2">Your Clues</h2>
                                     {allCluesSolved ? (
                                        <div className="flex flex-col items-center justify-center text-center p-8 bg-black/40 border-2 border-dashed border-green-500/80 rounded-lg min-h-[40vh]">
                                            <div className="text-6xl mb-4">🏆</div>
                                            <h2 className="text-4xl font-orbitron text-green-300 text-glow-green">TRANSMISSION COMPLETE</h2>
                                            <p className="mt-4 text-xl text-green-200 max-w-2xl">
                                                Congratulations, your team has decrypted all clues in your domain! Your final score is locked in. Keep an eye on the live leaderboard for final standings.
                                            </p>
                                        </div>
                                     ) : sortedClues.length > 0 ? (
                                        <div className="space-y-4 max-h-[60vh] overflow-y-auto overflow-x-hidden pr-2">
                                            {sortedClues.map((clue, index) => {
                                                const isClueSolved = progressMap.has(clue.id);
                                                const status = submitStatus[clue.id] || 'idle';
                                                const isUnlocked = index === 0 || progressMap.has(sortedClues[index - 1].id);

                                                return (
                                                    <ClueCard
                                                        key={clue.id}
                                                        clue={clue}
                                                        clueNumber={index + 1}
                                                        isSolved={isClueSolved}
                                                        status={status}
                                                        currentAnswer={currentAnswer[clue.id]}
                                                        awardedCoins={awardedCoins[clue.id]}
                                                        isActive={isUnlocked}
                                                        isSkipping={isSkipping}
                                                        onAnswerChange={handleAnswerChange}
                                                        onSubmitAnswer={handleSubmitAnswer}
                                                        onSkipClue={handleOpenSkipConfirm}
                                                    />
                                                )
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-gray-400 italic">No clues have been assigned to your domain yet.</p>
                                    )}
                                </div>
                                <div className="lg:col-span-1">
                                    <LiveLeaderboard />
                                </div>
                            </div>
                        </motion.div>
                    )}
                    </AnimatePresence>
                </div>
            </div>
             <ConfirmationModal
                isOpen={!!clueToSkip}
                onClose={() => setClueToSkip(null)}
                onConfirm={handleConfirmSkip}
                title="Confirm Skip Clue"
                message={
                    <>
                        <p>Are you sure you want to skip this clue?</p>
                        <p className="mt-2 text-lg font-bold text-yellow-400">
                            This will deduct <strong className="font-orbitron">20 COINS</strong> from your total. This action cannot be undone.
                        </p>
                    </>
                }
                confirmText="Yes, Skip It"
                isConfirming={isSkipping}
                borderColorClassName="border-yellow-500"
                shadowClassName="shadow-yellow-500/20"
                titleColorClassName="text-yellow-400"
                confirmButtonClassName="!py-2 !px-6 !border-yellow-500 group-hover:!bg-yellow-500"
            />
        </PageTransition>
    );
};

export default TeamDashboardPage;