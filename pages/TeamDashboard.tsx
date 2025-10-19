
import React, { useState, useEffect, useRef } from 'react';
import PageTransition from '../components/PageTransition';
import GlowingButton from '../components/GlowingButton';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabaseClient';
import { Team, Clue, TeamProgress } from '../types';
import LiveLeaderboard from '../components/LiveLeaderboard';
import { motion, AnimatePresence } from 'framer-motion';
import SkeletonLoader from '../components/SkeletonLoader';
import ClueCard from '../components/ClueCard';

const CheckIcon: React.FC<{className?:string}> = ({className}) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>;

const formatTime = (seconds: number): string => {
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
    const [elapsedTime, setElapsedTime] = useState(0);
    const [currentAnswer, setCurrentAnswer] = useState<{ [clueId: number]: string }>({});
    const [submitStatus, setSubmitStatus] = useState<{ [clueId: number]: 'idle' | 'loading' | 'correct' | 'incorrect' }>({});
    const [awardedCoins, setAwardedCoins] = useState<{ [clueId: number]: number }>({});
    const timerRef = useRef<number | undefined>();
    
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
            
            if (teamData) {
                setTeam(teamData);
    
                // Fetch clues for team's domain
                const { data: cluesData } = await supabase
                    .from('clues')
                    .select('*')
                    .eq('domain', teamData.domain)
                    .order('id', { ascending: true });
    
                if (cluesData) setClues(cluesData);
    
                // Fetch team progress
                const { data: progressData } = await supabase
                    .from('team_progress')
                    .select('*')
                    .eq('team_id', teamData.id);
    
                if (progressData) setProgress(progressData);
            }
            
            // Fetch event status and start time
            const { data: eventData } = await supabase.from('event').select('status, start_time').eq('id', 1).single();
            if (eventData) {
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
            // FIX: The subscribe method was called without arguments. A callback function has been added to handle the subscription status.
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    // console.log(`Subscribed to team dashboard updates for user ${user?.id}`);
                }
            });

        return () => { supabase.removeChannel(channel) };

    }, [user]);

    // Timer effect to sync with server start time
    useEffect(() => {
        // This effect manages the event timer, starting and stopping it based on the event status
        // received from the server. It runs whenever the event status or start time changes.
        
        if (eventStatus === 'running' && startTime) {
            // The core logic for timer accuracy: calculate the elapsed time by comparing the
            // client's current timestamp (Date.now()) with the server's start time. This ensures
            // the timer is synchronized with the event, regardless of when the page was loaded.
            const updateElapsedTime = () => {
                const serverStartTime = new Date(startTime).getTime();
                const elapsedSeconds = Math.floor((Date.now() - serverStartTime) / 1000);
                
                // Ensure the timer doesn't display a negative value.
                setElapsedTime(Math.max(0, elapsedSeconds));
            };
            
            updateElapsedTime(); // Set the initial time immediately to avoid a 1-second delay.
            
            // Set up an interval to update the displayed time every second.
            const intervalId = window.setInterval(updateElapsedTime, 1000);
            timerRef.current = intervalId;

        } else {
            // If the event is not running, reset the timer to zero.
            setElapsedTime(0);
        }
        
        // Cleanup function: This is crucial. It runs when the component unmounts or when
        // eventStatus/startTime change, clearing any existing interval to prevent memory leaks
        // and multiple timers running simultaneously.
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [eventStatus, startTime]);

    const isSolved = (clueId: number) => {
        return progress.some(p => p.clue_id === clueId);
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

        const clue = clues.find(c => c.id === clueId);
        if (!clue) return;

        if (clue.answer === submittedAnswer) {
             setSubmitStatus(prev => ({ ...prev, [clueId]: 'correct' }));
             
             let coinsToAdd = 10;
             if (elapsedTime <= 5 * 60) { // 5 minutes
                coinsToAdd = 30;
             } else if (elapsedTime <= 10 * 60) { // 10 minutes
                coinsToAdd = 20;
             }
             setAwardedCoins(prev => ({ ...prev, [clueId]: coinsToAdd }));

             await supabase.from('team_progress').insert({ team_id: team.id, clue_id: clueId });
             const newCoins = (team.coins || 0) + coinsToAdd;
             await supabase.from('teams').update({ coins: newCoins }).eq('id', team.id);
        } else {
            setSubmitStatus(prev => ({ ...prev, [clueId]: 'incorrect' }));
            setTimeout(() => {
                setSubmitStatus(prev => ({ ...prev, [clueId]: 'idle' }));
            }, 2000);
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

    return (
        <PageTransition>
            <div className="relative w-full max-w-7xl mx-auto backdrop-blur-sm bg-black/30 p-4 sm:p-8 rounded-2xl border-2 border-[#ff7b00]/50">
                <div className="absolute top-4 right-4 z-20 flex items-center gap-4">
                     <GlowingButton 
                        onClick={logout} 
                        className="!py-1 !px-3 !border-red-500 group-hover:!bg-red-500 !text-xs"
                    >
                        Logout
                    </GlowingButton>
                </div>
                <div className="relative z-10">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl md:text-5xl font-orbitron font-bold text-glow">{team.name}</h1>
                        <p className="text-xl font-rajdhani text-gray-300 mt-2">Domain: <span className="font-bold text-[#ff7b00]">{team.domain}</span></p>
                    </div>

                    {totalClues > 0 && (
                        <div className="mb-8 px-2">
                            <h3 className="text-xl font-orbitron text-center text-gray-400 uppercase tracking-widest mb-3">Mission Progress</h3>
                            <div className="w-full bg-black/50 border-2 border-[#ff7b00]/30 rounded-full p-1 pulse-glow">
                                <motion.div
                                    className="h-4 bg-gradient-to-r from-[#ff7b00] to-yellow-400 rounded-full shadow-lg shadow-[#ff7b00]/50"
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
                    
                    {eventStatus === 'running' && (
                         <div className="text-center my-8 p-4 bg-black/40 rounded-lg border border-dashed border-white/20">
                            <p className="text-lg text-gray-400 uppercase tracking-widest">Time Elapsed</p>
                            <div className="font-orbitron text-6xl font-black text-[#ff7b00] tracking-widest text-glow">
                                {formatTime(elapsedTime)}
                            </div>
                        </div>
                    )}

                    <AnimatePresence>
                    {eventStatus === 'running' && (
                        <motion.div 
                            initial={{opacity: 0, y: 20}}
                            animate={{opacity: 1, y: 0}}
                            exit={{opacity: 0, y: -20}}
                            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
                        >
                            <div className="lg:col-span-2 space-y-6">
                                <h2 className="text-3xl font-orbitron text-glow-blue border-b-2 border-[#00eaff]/30 pb-2">Your Clues</h2>
                                {clues.length > 0 ? (
                                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                                        {clues.map(clue => {
                                            const isClueSolved = isSolved(clue.id);
                                            const status = submitStatus[clue.id] || 'idle';
                                            return (
                                                <ClueCard
                                                    key={clue.id}
                                                    clue={clue}
                                                    isSolved={isClueSolved}
                                                    status={status}
                                                    currentAnswer={currentAnswer[clue.id]}
                                                    awardedCoins={awardedCoins[clue.id]}
                                                    onAnswerChange={handleAnswerChange}
                                                    onSubmitAnswer={handleSubmitAnswer}
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
                        </motion.div>
                    )}
                    </AnimatePresence>
                </div>
            </div>
        </PageTransition>
    );
};

export default TeamDashboardPage;