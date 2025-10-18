import React, { useState, useEffect } from 'react';
import PageTransition from '../components/PageTransition';
import GlowingButton from '../components/GlowingButton';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabaseClient';
import { Team, Clue, TeamProgress } from '../types';
import ChatBox from '../components/ChatBox';
import LiveLeaderboard from '../components/LiveLeaderboard';
import { motion, AnimatePresence } from 'framer-motion';

const CheckIcon: React.FC<{className?:string}> = ({className}) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>;
const CoinsIcon: React.FC<{className?:string}> = ({className}) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01M12 6v-1m0-1V4m0 2.01M12 18v-1m0-1v-.01m0-2.01V12m0 6v1m0 1v1m0-2.01M6 12H5m1 0h.01M4 12H3m2.01 0H6m12 0h-1m-1 0h-.01m-2.01 0H18m-6-6v.01M12 4V3m0-1V2m0 2.01M18 6l.01.01M6 6l-.01.01M18 18l.01.01M6 18l-.01.01" /></svg>;

const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
};

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
            .subscribe();

        return () => { supabase.removeChannel(channel) };

    }, [user]);

    // Timer effect to sync with server start time
    useEffect(() => {
        let timer: number;
        if (eventStatus === 'running' && startTime) {
            const updateElapsedTime = () => {
                const elapsed = Math.floor((Date.now() - new Date(startTime).getTime()) / 1000);
                setElapsedTime(elapsed > 0 ? elapsed : 0);
            };
            
            updateElapsedTime(); // Set initial time immediately
            timer = window.setInterval(updateElapsedTime, 1000); // Update every second
        } else {
            setElapsedTime(0); // Reset timer if event is stopped
        }
        return () => clearInterval(timer); // Cleanup interval
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
             await supabase.from('team_progress').insert({ team_id: team.id, clue_id: clueId });
             const newCoins = (team.coins || 0) + 10;
             await supabase.from('teams').update({ coins: newCoins }).eq('id', team.id);
        } else {
            setSubmitStatus(prev => ({ ...prev, [clueId]: 'incorrect' }));
            setTimeout(() => {
                setSubmitStatus(prev => ({ ...prev, [clueId]: 'idle' }));
            }, 2000);
        }
    };

    const solvedCount = progress.length;

    if (loading) {
        return <div className="text-2xl font-orbitron text-glow-blue animate-pulse">Loading Team Data...</div>;
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

    return (
        <PageTransition>
            <div className="relative w-full max-w-7xl mx-auto backdrop-blur-sm bg-black/30 p-4 sm:p-8 rounded-2xl border-2 border-[#ff7b00]/50">
                <div className="absolute top-4 right-4 z-20">
                     <GlowingButton 
                        onClick={logout} 
                        className="!py-2 !px-4 !border-red-500 group-hover:!bg-red-500 !text-sm"
                    >
                        Logout
                    </GlowingButton>
                </div>
                <div className="relative z-10">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl md:text-5xl font-orbitron font-bold text-glow">{team.name}</h1>
                        <p className="text-xl font-rajdhani text-gray-300 mt-2">Domain: <span className="font-bold text-[#ff7b00]">{team.domain}</span></p>
                        <div className="mt-4 flex justify-center items-center gap-4 text-2xl font-orbitron">
                            <div className="flex items-center gap-2 p-2 bg-black/30 border border-white/20 rounded-lg">
                                <CoinsIcon className="w-8 h-8 text-yellow-400" />
                                <span className="text-yellow-400">{team.coins}</span>
                            </div>
                             <div className="flex items-center gap-2 p-2 bg-black/30 border border-white/20 rounded-lg">
                                <CheckIcon className="w-8 h-8 text-green-400" />
                                <span className="text-green-400">{solvedCount} / {clues.length}</span>
                            </div>
                        </div>
                    </div>
                    
                    {eventStatus === 'stopped' && (
                        <div className="flex flex-col items-center justify-center text-center p-8 bg-black/40 border-2 border-dashed border-yellow-500/80 rounded-lg min-h-[50vh]">
                            <h2 className="text-4xl font-orbitron text-yellow-300">Awaiting Transmission...</h2>
                            <p className="mt-4 text-xl text-yellow-200 max-w-2xl">
                                The event has not yet started. Please stand by. Clues for your domain will be broadcast here once the event is initiated by the administrator.
                            </p>
                            <div className="mt-6 text-6xl animate-pulse">⏳</div>
                        </div>
                    )}
                    
                    {eventStatus === 'running' && (
                         <div className="text-center mb-8 p-4 bg-black/40 rounded-lg border border-dashed border-white/20">
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
                                                <div key={clue.id} className={`p-4 rounded-lg bg-black/40 border-2 transition-colors duration-500 ${isClueSolved ? 'border-green-500/70' : 'border-white/20'}`}>
                                                    <div className="flex justify-between items-start">
                                                        <p className="font-semibold text-xl">Clue #{clue.id}</p>
                                                        {isClueSolved && <div className="px-3 py-1 bg-green-500/30 text-green-300 font-bold text-sm rounded-full flex items-center gap-2"><CheckIcon className="w-4 h-4" /> Solved</div>}
                                                    </div>
                                                    <p className="text-gray-300 mt-2 text-lg">{clue.text}</p>
                                                    {clue.image_url && (
                                                        <div className="mt-4">
                                                            <img src={clue.image_url} alt={`Clue ${clue.id} image`} className="max-w-sm rounded-md shadow-lg holographic-image" />
                                                        </div>
                                                    )}
                                                    {!isClueSolved && (
                                                        <div className="mt-4 flex flex-col sm:flex-row gap-2">
                                                            <input 
                                                                type="text" 
                                                                placeholder="Enter your answer..."
                                                                value={currentAnswer[clue.id] || ''}
                                                                onChange={(e) => handleAnswerChange(clue.id, e.target.value)}
                                                                className={`flex-1 px-4 py-2 bg-transparent border-2 rounded-md focus:outline-none placeholder-gray-500 transition-all duration-300
                                                                    ${status === 'incorrect' ? 'border-red-500 animate-shake' : ''}
                                                                    ${status === 'correct' ? 'border-green-500 text-green-400' : ''}
                                                                    ${status === 'idle' || status === 'loading' ? 'border-[#ff7b00]/50 focus:border-[#ff7b00]' : ''}
                                                                `}
                                                                disabled={status === 'loading' || status === 'correct'}
                                                            />
                                                            <GlowingButton onClick={() => handleSubmitAnswer(clue.id)} disabled={status === 'loading' || status === 'correct' || !currentAnswer[clue.id]}>
                                                                {status === 'loading' ? 'Submitting...' : 'Submit'}
                                                            </GlowingButton>
                                                        </div>
                                                    )}
                                                     <AnimatePresence>
                                                        {status === 'incorrect' && (
                                                            <motion.p initial={{height: 0, opacity:0}} animate={{height: 'auto', opacity: 1}} exit={{height: 0, opacity: 0}} className="text-red-400 font-bold text-sm mt-2">
                                                                Incorrect answer. Try again.
                                                            </motion.p>
                                                        )}
                                                        {status === 'correct' && (
                                                            <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="mt-4 text-center font-orbitron text-2xl text-green-400 text-glow-green flex items-center justify-center gap-2">
                                                                <CheckIcon className="w-8 h-8"/>
                                                                <span>CORRECT! +10 COINS</span>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            )
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-gray-400 italic">No clues have been assigned to your domain yet.</p>
                                )}
                            </div>
                            <div className="lg:col-span-1 flex flex-col gap-6" style={{maxHeight: '75vh'}}>
                                <div className="flex-1 min-h-0">
                                    <LiveLeaderboard />
                                </div>
                                <div className="flex-1 min-h-0">
                                    <ChatBox senderName={team.name} />
                                </div>
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