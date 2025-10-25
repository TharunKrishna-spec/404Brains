import React, { useState, useEffect, useMemo, useCallback } from 'react';
import PageTransition from '../components/PageTransition';
import GlowingButton from '../components/GlowingButton';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabaseClient';
import { Team, Clue, TeamProgress, ProblemStatement, ProblemStatementPurchase } from '../types';
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
    const [eventStatus, setEventStatus] = useState<'stopped' | 'running' | 'ended' | 'market'>('stopped');
    const [startTime, setStartTime] = useState<string | null>(null);
    const [activeClueElapsedTime, setActiveClueElapsedTime] = useState(0);
    const [currentAnswer, setCurrentAnswer] = useState<{ [clueId: number]: string }>({});
    const [submitStatus, setSubmitStatus] = useState<{ [clueId: number]: 'idle' | 'loading' | 'correct' | 'incorrect' }>({});
    const [awardedCoins, setAwardedCoins] = useState<{ [clueId: number]: number }>({});
    const toast = useToast();
    const [clueToSkip, setClueToSkip] = useState<Clue | null>(null);
    const [isSkipping, setIsSkipping] = useState(false);

    // Marketplace state
    const [problemStatements, setProblemStatements] = useState<ProblemStatement[]>([]);
    const [purchases, setPurchases] = useState<ProblemStatementPurchase[]>([]);
    const [purchasedProblemStatement, setPurchasedProblemStatement] = useState<ProblemStatement | null>(null);
    const [isMarketLoading, setIsMarketLoading] = useState(true);
    const [psToBuy, setPsToBuy] = useState<ProblemStatement | null>(null);
    const [isBuying, setIsBuying] = useState(false);
    const [purchaseLimit, setPurchaseLimit] = useState(3);


    const fetchAllData = useCallback(async () => {
        if (!user) {
            setLoading(false);
            return;
        }

        // Fetch primary data
        const [teamRes, eventBaseRes] = await Promise.all([
            supabase.from('teams').select('*').eq('user_id', user.id).single(),
            supabase.from('event').select('status, start_time').eq('id', 1).single()
        ]);

        if (teamRes.error) {
            toast.error(`Could not load team data: ${teamRes.error.message}`);
            setLoading(false);
            return;
        }
        const currentTeam = teamRes.data;
        setTeam(currentTeam);
        
        if (eventBaseRes.error) toast.error(`Failed to get event status: ${eventBaseRes.error.message}`);
        const currentEventStatus = eventBaseRes.data?.status || 'stopped';
        setEventStatus(currentEventStatus);
        setStartTime(eventBaseRes.data?.start_time || null);
        
        // Safely fetch purchase limit with a fallback
        try {
            const { data: limitData, error: limitError } = await supabase.from('event').select('ps_purchase_limit').eq('id', 1).single();
            if (limitError) throw limitError;
            if (limitData && typeof limitData.ps_purchase_limit === 'number') {
                setPurchaseLimit(limitData.ps_purchase_limit);
            } else {
                setPurchaseLimit(3);
            }
        } catch (e: any) {
            console.warn("Could not fetch 'ps_purchase_limit'. Falling back to default 3.", e.message);
            setPurchaseLimit(3);
        }

        // Based on event status, fetch relevant data
        if (currentEventStatus === 'running' && currentTeam) {
            const [cluesRes, progressRes] = await Promise.all([
                supabase.from('clues').select('*').eq('domain', currentTeam.domain).order('id', { ascending: true }),
                supabase.from('team_progress').select('*').eq('team_id', currentTeam.id)
            ]);
            if (cluesRes.error) toast.error(`Failed to load clues: ${cluesRes.error.message}`);
            else setClues(cluesRes.data || []);
            if (progressRes.error) toast.error(`Failed to load progress: ${progressRes.error.message}`);
            else setProgress(progressRes.data || []);
        } else if (currentEventStatus === 'market' && currentTeam) {
            setIsMarketLoading(true);
            const [psRes, purchasesRes] = await Promise.all([
                supabase.from('problem_statements').select('*').eq('domain', currentTeam.domain),
                supabase.from('problem_statement_purchases').select('*,problem_statements(*)').eq('team_id', currentTeam.id)
            ]);
            
            if (psRes.error) toast.error(`Failed to load marketplace: ${psRes.error.message}`);
            else setProblemStatements(psRes.data || []);
            
            if (purchasesRes.error) toast.error(`Failed to load purchases: ${purchasesRes.error.message}`);
            else {
                const teamPurchase = purchasesRes.data.length > 0 ? purchasesRes.data[0] : null;
                if (teamPurchase && teamPurchase.problem_statements) {
                    setPurchasedProblemStatement(teamPurchase.problem_statements as ProblemStatement);
                } else {
                    // Fetch all purchases to calculate counts for the marketplace view
                    const {data: allPurchases, error: allPurchasesError} = await supabase.from('problem_statement_purchases').select('*');
                    if (allPurchasesError) toast.error(`Failed to load purchase counts: ${allPurchasesError.message}`);
                    else setPurchases(allPurchases || []);
                }
            }
            setIsMarketLoading(false);
        }

        setLoading(false);
    }, [user, toast]);
    
    useEffect(() => {
        fetchAllData();
        const channel = supabase.channel(`team-dashboard-changes-${user?.id}`)
            .on('postgres_changes', { event: '*', schema: 'public' }, payload => {
                fetchAllData();
            })
            .subscribe((status, err) => {
                if (status === 'SUBSCRIBED') {
                    // console.log('Successfully subscribed to team-dashboard changes!');
                } else if (status === 'TIMED_OUT' || status === 'CHANNEL_ERROR') {
                    console.error('Subscription error:', err);
                    toast.error('Live connection lost. Data may be stale.');
                }
            });

        return () => { 
            supabase.removeChannel(channel);
        };
    }, [user, fetchAllData, toast]);

    const sortedClues = useMemo(() => [...clues].sort((a, b) => a.id - b.id), [clues]);
    const progressMap = useMemo(() => {
        const map = new Map<number, TeamProgress>();
        progress.forEach(p => map.set(p.clue_id, p));
        return map;
    }, [progress]);
    
    const activeClueInfo = useMemo(() => {
        const activeIndex = sortedClues.findIndex((clue, index) => {
            const isSolved = progressMap.has(clue.id);
            if (isSolved) return false;
            const isUnlocked = index === 0 || progressMap.has(sortedClues[index - 1].id);
            return isUnlocked;
        });

        if (activeIndex === -1) return null;

        const activeClue = sortedClues[activeIndex];
        let clueStartTime = (activeIndex === 0) 
            ? startTime 
            : progressMap.get(sortedClues[activeIndex - 1].id)?.solved_at ?? null;
        
        return { clueId: activeClue.id, startTime: clueStartTime };
    }, [sortedClues, progressMap, startTime]);

    useEffect(() => {
        if (eventStatus === 'running' && activeClueInfo?.startTime) {
            const timerInterval = setInterval(() => {
                const elapsed = Math.floor((Date.now() - new Date(activeClueInfo.startTime!).getTime()) / 1000);
                setActiveClueElapsedTime(elapsed >= 0 ? elapsed : 0);
            }, 1000);
            return () => clearInterval(timerInterval);
        } else {
            setActiveClueElapsedTime(0);
        }
    }, [activeClueInfo, eventStatus]);

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
            if (elapsedSeconds <= 5 * 60) coinsToAdd = 30;
            else if (elapsedSeconds <= 10 * 60) coinsToAdd = 20;
            
            // --- START: Optimistic Update Logic ---
            // 1. Show immediate visual feedback
            setAwardedCoins(prev => ({ ...prev, [clueId]: coinsToAdd }));
            setSubmitStatus(prev => ({ ...prev, [clueId]: 'correct' }));
            
            // 2. Create the new progress record for optimistic state update
            const newProgressRecord: TeamProgress = {
                team_id: team.id,
                clue_id: clueId,
                solved_at: solveTime.toISOString(),
            };
            
            // 3. Update the progress and team coins in the local state to instantly unlock the next clue
            setProgress(currentProgress => [...currentProgress, newProgressRecord]);
            setTeam(currentTeam => ({ ...currentTeam!, coins: currentTeam!.coins + coinsToAdd }));

            // 4. Send the update to the database.
            try {
                const { error } = await supabase.rpc('submit_answer', {
                    in_team_id: team.id,
                    in_clue_id: clueId,
                    in_solved_at: solveTime.toISOString(),
                    in_coins_to_add: coinsToAdd
                });

                if (error) throw error;
                // Success! The optimistic state was correct. The UI is already updated.
                // We'll let the real-time listener sync the state if needed, but the user experience is already handled.

            } catch (error: any) {
                // 5. If the database call fails, revert the optimistic state changes.
                console.error("Error submitting answer progress:", error);
                toast.error(`Submission failed: ${error.message}. Reverting changes.`);
                
                // Revert by refetching the source of truth from the database.
                fetchAllData(); 
                
                // Also reset the submit status for the failed clue
                setSubmitStatus(prev => ({ ...prev, [clueId]: 'idle' }));
                setAwardedCoins(prev => {
                    const newState = {...prev};
                    delete newState[clueId];
                    return newState;
                });
            }
            // --- END: Optimistic Update Logic ---

        } else {
            setSubmitStatus(prev => ({ ...prev, [clueId]: 'incorrect' }));
            setTimeout(() => setSubmitStatus(prev => ({ ...prev, [clueId]: 'idle' })), 2000);
        }
    };
    
    const handleOpenSkipConfirm = useCallback((clueId: number) => {
        const clue = sortedClues.find(c => c.id === clueId);
        if (clue) setClueToSkip(clue);
    }, [sortedClues]);

    const handleConfirmSkip = async () => {
        if (!team || !clueToSkip) return;
        setIsSkipping(true);

        const newCoins = (team.coins || 0) - 20;
        try {
            const { error: teamUpdateError } = await supabase.from('teams').update({ coins: newCoins }).eq('id', team.id);
            if (teamUpdateError) throw teamUpdateError;

            const { error: progressError } = await supabase.from('team_progress').insert({ team_id: team.id, clue_id: clueToSkip.id, solved_at: new Date().toISOString() });
            if (progressError) throw progressError;

            toast.info(`Clue skipped. 20 coins deducted.`);
        } catch (error: any) {
            console.error("Error skipping clue:", error);
            toast.error(`Failed to skip clue: ${error.message}. Please try again.`);
        } finally {
            setIsSkipping(false);
            setClueToSkip(null);
        }
    };

    const handleBuyProblemStatement = async () => {
        if (!team || !psToBuy) return;
        setIsBuying(true);

        try {
            const { count: purchaseCount, error: countError } = await supabase
                .from('problem_statement_purchases')
                .select('*', { count: 'exact', head: true })
                .eq('problem_statement_id', psToBuy.id);

            if (countError) throw countError;
            if (purchaseCount >= purchaseLimit) {
                toast.error("Purchase failed: No more slots available for this problem statement.");
                setIsBuying(false);
                setPsToBuy(null);
                return;
            }
            if (team.coins < psToBuy.cost) {
                toast.error("Purchase failed: Not enough coins.");
                setIsBuying(false);
                setPsToBuy(null);
                return;
            }
            
            // Proceed with purchase
            const { error: purchaseError } = await supabase.from('problem_statement_purchases').insert({
                team_id: team.id,
                problem_statement_id: psToBuy.id
            });
            if (purchaseError) throw purchaseError;

            const { error: coinError } = await supabase.from('teams').update({ coins: team.coins - psToBuy.cost }).eq('id', team.id);
            if (coinError) throw coinError;

            toast.success(`Successfully purchased "${psToBuy.title}"!`);

        } catch (error: any) {
            toast.error(`Purchase failed: ${error.message}`);
        } finally {
            setIsBuying(false);
            setPsToBuy(null);
        }
    };


    const renderContent = () => {
        if (!team) return null;

        switch (eventStatus) {
            case 'stopped':
                return (
                    <div className="flex flex-col items-center justify-center text-center p-8 bg-black/40 border-2 border-dashed border-yellow-500/80 rounded-lg min-h-[40vh] mt-8">
                        <h2 className="text-4xl font-orbitron text-yellow-300">Awaiting Transmission...</h2>
                        <p className="mt-4 text-xl text-yellow-200 max-w-2xl">The event has not yet started. Please stand by.</p>
                        <div className="mt-6 text-6xl animate-pulse">⏳</div>
                    </div>
                );
            case 'ended':
                return (
                    <div className="flex flex-col items-center justify-center text-center p-8 bg-black/40 border-2 border-dashed border-blue-500/80 rounded-lg min-h-[40vh] mt-8">
                        <h2 className="text-4xl font-orbitron text-blue-300">Clue Hunt Concluded</h2>
                        <p className="mt-4 text-xl text-blue-200 max-w-2xl">The clue-solving phase has ended. Stand by for the marketplace to open.</p>
                        <div className="mt-6 text-6xl animate-pulse">📡</div>
                    </div>
                );
            
            case 'market':
                if (isMarketLoading) return <ClueCardSkeleton />;
                if (purchasedProblemStatement) {
                    return (
                        <div className="mt-8 p-6 bg-black/50 border-2 border-green-500 rounded-lg shadow-lg shadow-green-500/20 pulse-glow-green">
                            <h2 className="text-3xl font-orbitron text-glow-green text-center">MISSION ACQUIRED</h2>
                            <div className="mt-6 text-center">
                                <p className="text-lg text-gray-400">Your final objective is:</p>
                                <h3 className="text-4xl font-orbitron font-bold text-white my-2">{purchasedProblemStatement.title}</h3>
                            </div>
                            <div className="mt-4 p-4 bg-black/30 rounded-md border border-white/20">
                                <p className="text-lg text-gray-200 whitespace-pre-wrap">{purchasedProblemStatement.description}</p>
                            </div>
                        </div>
                    );
                }
                const purchaseCounts = purchases.reduce((acc, p) => {
                    acc[p.problem_statement_id] = (acc[p.problem_statement_id] || 0) + 1;
                    return acc;
                }, {} as Record<number, number>);

                return (
                    <div className="pt-4">
                        <h2 className="text-4xl font-orbitron text-glow text-center mb-4">Mission Marketplace</h2>
                        <p className="text-center text-gray-300 mb-8">Use your coins to purchase your final problem statement. Choose wisely.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {problemStatements.map(ps => {
                                const count = purchaseCounts[ps.id] || 0;
                                const canAfford = team.coins >= ps.cost;
                                const slotsAvailable = count < purchaseLimit;
                                return (
                                    <div key={ps.id} className={`p-4 rounded-lg border-2 flex flex-col justify-between transition-all ${canAfford && slotsAvailable ? 'bg-black/40 border-[#ff7b00]/70' : 'bg-black/30 border-gray-700 opacity-70'}`}>
                                        <div>
                                            <h3 className="text-2xl font-orbitron font-bold text-glow">{ps.title}</h3>
                                            <p className="text-gray-300 mt-2 text-sm whitespace-pre-wrap flex-grow">{ps.description}</p>
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
                                            <div className="font-orbitron">
                                                <p className="text-2xl text-yellow-400">{ps.cost} 🪙</p>
                                                <p className={`text-sm ${slotsAvailable ? 'text-green-400' : 'text-red-500'}`}>{purchaseLimit - count} slots remaining</p>
                                            </div>
                                            <GlowingButton onClick={() => setPsToBuy(ps)} disabled={!canAfford || !slotsAvailable}>
                                                Buy
                                            </GlowingButton>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            
            case 'running':
                const solvedCount = progress.length;
                const totalClues = clues.length;
                const progressPercentage = totalClues > 0 ? (solvedCount / totalClues) * 100 : 0;
                const allCluesSolved = totalClues > 0 && solvedCount === totalClues;

                return (
                    <motion.div initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: -20}}>
                        {totalClues > 0 && (
                            <div className="mb-8 px-2">
                                <h3 className="text-xl font-orbitron text-center text-gray-400 uppercase tracking-widest mb-3">Mission Progress</h3>
                                <div className="w-full bg-black/50 border-2 border-[#ff7b00]/30 rounded-full p-1 pulse-glow-orange">
                                    <motion.div className="h-4 bg-gradient-to-r from-[#ff7b00] to-yellow-400 rounded-full shadow-lg shadow-[#ff7b00]/50 progress-bar-shimmer" initial={{ width: '0%' }} animate={{ width: `${progressPercentage}%` }} transition={{ duration: 1, ease: [0.42, 0, 0.58, 1] }}/>
                                </div>
                                <p className="text-center font-orbitron text-2xl mt-3 text-glow">{solvedCount} / {totalClues} <span className="text-lg text-gray-300">Clues Decrypted</span></p>
                            </div>
                        )}
                        {activeClueInfo && (
                            <div className="my-8 text-center p-6 bg-black/40 rounded-lg border-2 border-dashed border-[#ff7b00]/50">
                                <h3 className="text-2xl font-orbitron text-gray-400 uppercase tracking-widest">Time on Current Clue</h3>
                                <div className="font-orbitron text-7xl font-black tracking-widest text-yellow-300 text-glow mt-2">{formatTime(activeClueElapsedTime)}</div>
                            </div>
                        )}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-6">
                                <h2 className="text-3xl font-orbitron text-glow-blue border-b-2 border-[#00eaff]/30 pb-2">Your Clues</h2>
                                    {allCluesSolved ? (
                                    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, type: 'spring' }} className="flex flex-col items-center justify-center text-center p-8 bg-black/40 border-2 border-dashed border-green-500 rounded-lg min-h-[40vh] pulse-glow-green">
                                        <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }} className="text-7xl mb-4">🏆</motion.div>
                                        <h2 className="text-3xl sm:text-4xl font-orbitron text-green-300">DOMAIN CONQUERED</h2>
                                        <p className="font-orbitron text-5xl sm:text-7xl font-black text-white uppercase tracking-widest text-glow-green my-4">{team.domain}</p>
                                        <p className="mt-2 text-lg sm:text-xl text-green-200 max-w-2xl">Congratulations! Your team has decrypted all clues. Await the opening of the marketplace.</p>
                                    </motion.div>
                                    ) : sortedClues.length > 0 ? (
                                    <div className="space-y-4 max-h-[60vh] overflow-y-auto overflow-x-hidden pr-2">
                                        {sortedClues.map((clue, index) => {
                                            const isClueSolved = progressMap.has(clue.id);
                                            const status = submitStatus[clue.id] || 'idle';
                                            const isUnlocked = index === 0 || progressMap.has(sortedClues[index - 1].id);
                                            return <ClueCard key={clue.id} clue={clue} clueNumber={index + 1} isSolved={isClueSolved} status={status} currentAnswer={currentAnswer[clue.id]} awardedCoins={awardedCoins[clue.id]} isActive={isUnlocked} isSkipping={isSkipping} onAnswerChange={handleAnswerChange} onSubmitAnswer={handleSubmitAnswer} onSkipClue={handleOpenSkipConfirm}/>
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-gray-400 italic">No clues have been assigned to your domain yet.</p>
                                )}
                            </div>
                            <div className="lg:col-span-1"><LiveLeaderboard /></div>
                        </div>
                    </motion.div>
                );
        }
    };


    if (loading) return <TeamDashboardSkeleton />;
    
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
                <div className="absolute top-4 right-4 z-20 flex items-center gap-4">
                     <GlowingButton onClick={handleLogout} className="!py-1 !px-3 !border-red-500 group-hover:!bg-red-500 !text-xs">Logout</GlowingButton>
                </div>
                <div className="relative z-10">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl md:text-5xl font-orbitron font-bold text-glow">{team.name}</h1>
                        <p className="text-2xl font-orbitron text-gray-200 mt-4">Total Coins: <span className="font-bold text-yellow-400 text-glow">{team.coins} 🪙</span></p>
                    </div>
                    <AnimatePresence mode="wait">{renderContent()}</AnimatePresence>
                </div>
            </div>
             <ConfirmationModal
                isOpen={!!clueToSkip}
                onClose={() => setClueToSkip(null)}
                onConfirm={handleConfirmSkip}
                title="Confirm Skip Clue"
                message={
                    <>
                        <p>Are you sure you want to skip the following clue?</p>
                        <blockquote className="my-3 p-3 border-l-4 border-yellow-500 bg-black/30 text-gray-300 italic">
                            "{clueToSkip?.text}"
                        </blockquote>
                        <p className="mt-2 text-lg font-bold text-yellow-400">
                            This will deduct <strong className="font-orbitron">20 COINS</strong> and cannot be undone.
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
             <ConfirmationModal
                isOpen={!!psToBuy}
                onClose={() => setPsToBuy(null)}
                onConfirm={handleBuyProblemStatement}
                title="Confirm Purchase"
                message={<><p>Purchase <strong className="font-bold text-white">"{psToBuy?.title}"</strong> for <strong className="font-orbitron text-yellow-400">{psToBuy?.cost} COINS</strong>?</p><p className="mt-2 text-sm text-yellow-400">This action is final and cannot be undone.</p></>}
                confirmText="Confirm"
                isConfirming={isBuying}
                borderColorClassName="border-green-500"
                shadowClassName="shadow-green-500/20"
                titleColorClassName="text-green-400"
                confirmButtonClassName="!py-2 !px-6 !border-green-500 group-hover:!bg-green-500"
            />
        </PageTransition>
    );
};

export default TeamDashboardPage;