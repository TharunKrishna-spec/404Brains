import React, { useState, useEffect, useRef, useCallback } from 'react';
import PageTransition from '../components/PageTransition';
import GlowingButton from '../components/GlowingButton';
import { Team, Clue, LeaderboardEntry, ProblemStatement, ProblemStatementPurchase, PurchaseLogEntry } from '../types';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { v4 as uuidv4 } from 'uuid'; // For unique file names
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmationModal from '../components/ConfirmationModal';
import SkeletonLoader from '../components/SkeletonLoader';
import { useToast } from '../components/Toast';

const DOMAINS = ['HealthCare', 'Climate', 'Food', 'Airlines'];

// Icons as React components
const UsersIcon: React.FC<{className?:string}> = ({className}) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.124-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.124-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const KeyIcon: React.FC<{className?:string}> = ({className}) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H5v-2H3v-2H1v-4a6 6 0 017.743-5.743z" /></svg>;
const ControlIcon: React.FC<{className?:string}> = ({className}) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>;
const LeaderboardIcon: React.FC<{className?:string}> = ({className}) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
const ViewIcon: React.FC<{className?:string}> = ({className}) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>;
const ReloadIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M4 4l1.5 1.5A9 9 0 0120.5 10M20 20l-1.5-1.5A9 9 0 013.5 14" />
    </svg>
);
const EditIcon: React.FC<{className?:string}> = ({className}) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
const DeleteIcon: React.FC<{className?:string}> = ({className}) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const MarketplaceIcon: React.FC<{className?:string}> = ({className}) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
const ReceiptIcon: React.FC<{className?:string}> = ({className}) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;


type AdminTab = 'control' | 'add-teams' | 'view-teams' | 'add-clues' | 'view-clues' | 'leaderboard' | 'add-ps' | 'view-ps' | 'purchase-logs';
type EventStatus = 'stopped' | 'running' | 'ended' | 'market';

const AdminContentSkeleton: React.FC = () => (
    <div className="w-full">
        <SkeletonLoader className="h-10 w-1/2 mb-8" />
        <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
                 <div key={i} className="p-4 bg-white/5 rounded-lg flex items-center gap-4">
                    <div className="flex-1 space-y-2">
                        <SkeletonLoader className={`h-6 ${i % 2 === 0 ? 'w-3/4' : 'w-2/3'}`} />
                        <SkeletonLoader className={`h-4 ${i % 2 === 0 ? 'w-1/2' : 'w-1/3'}`} />
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const AdminDashboardPage: React.FC = () => {
    const { logout } = useAuth();
    const [activeTab, setActiveTab] = useState<AdminTab>('add-teams');
    const [clues, setClues] = useState<Clue[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [problemStatements, setProblemStatements] = useState<ProblemStatement[]>([]);
    const [purchaseLogs, setPurchaseLogs] = useState<PurchaseLogEntry[]>([]);
    const [domainLeaderboards, setDomainLeaderboards] = useState<Record<string, LeaderboardEntry[]>>({});
    const [isLoading, setIsLoading] = useState(true);
    const toast = useToast();

    const fetchClues = useCallback(async () => {
        const { data, error } = await supabase.from('clues').select('*').order('id', { ascending: true });
        if (error) toast.error(`Failed to fetch clues: ${error.message}`);
        else if (data) setClues(data);
    }, [toast]);

    const fetchTeams = useCallback(async () => {
        const { data, error } = await supabase.from('teams').select('*');
        if (error) toast.error(`Failed to fetch teams: ${error.message}`);
        else if (data) setTeams(data);
    }, [toast]);

    const fetchProblemStatements = useCallback(async () => {
        const { data, error } = await supabase.from('problem_statements').select('*');
        if (error) toast.error(`Failed to fetch problem statements: ${error.message}`);
        else if (data) setProblemStatements(data);
    }, [toast]);
    
    const fetchPurchaseLogs = useCallback(async () => {
        const { data, error } = await supabase
            .from('problem_statement_purchases')
            .select('created_at, teams(name), problem_statements(title)')
            .order('created_at', { ascending: false });

        if (error) toast.error(`Failed to fetch purchase logs: ${error.message}`);
        else if (data) setPurchaseLogs(data as PurchaseLogEntry[]);
    }, [toast]);

    // FIX: Lifted leaderboard fetching logic to the parent to ensure data synchronization.
    const fetchLeaderboards = useCallback(async () => {
        const [teamsRes, progressRes, purchasesRes] = await Promise.all([
            supabase.from('teams').select('*'),
            supabase.from('team_progress').select('*'),
            supabase.from('problem_statement_purchases').select('team_id, problem_statements(cost)')
        ]);

        if (teamsRes.error) { toast.error(`Leaderboard Error (Teams): ${teamsRes.error.message}`); return; }
        if (progressRes.error) { toast.error(`Leaderboard Error (Progress): ${progressRes.error.message}`); return; }
        if (purchasesRes.error) { toast.error(`Leaderboard Error (Purchases): ${purchasesRes.error.message}`); return; }
        
        const teams = teamsRes.data;
        const progress = progressRes.data;
        const purchases = purchasesRes.data as unknown as { team_id: number; problem_statements: { cost: number } }[];

        const purchaseCostMap = new Map<number, number>();
        purchases.forEach(p => {
            if (p.problem_statements) purchaseCostMap.set(p.team_id, p.problem_statements.cost);
        });

        const leaderboards: Record<string, LeaderboardEntry[]> = {};

        for (const domain of DOMAINS) {
            const domainTeams = teams.filter(team => team.domain === domain);
            const boardData = domainTeams.map(team => {
                const solved = progress.filter(p => p.team_id === team.id);
                const lastSolve = solved.length > 0 ? solved.reduce((latest, p) => new Date(p.solved_at) > new Date(latest.solved_at) ? p : latest) : null;
                const finalScore = team.coins + (purchaseCostMap.get(team.id) || 0);
                return { id: team.id, team: team.name, coins: finalScore, cluesSolved: solved.length, lastSolveTime: lastSolve ? lastSolve.solved_at : null };
            });
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
            leaderboards[domain] = boardData.map((item, index) => ({ ...item, rank: index + 1 }));
        }
        setDomainLeaderboards(leaderboards);
    }, [toast]);
    
    // FIX: Combined refresh function to update all relevant data at once.
    const refreshAllData = useCallback(async () => {
        await Promise.all([fetchTeams(), fetchLeaderboards()]);
    }, [fetchTeams, fetchLeaderboards]);

    const handleLogout = async () => {
        const { error } = await logout();
        if (error) toast.error(`Logout failed: ${error.message}`);
    };

    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoading(true);
            await Promise.all([fetchClues(), fetchTeams(), fetchProblemStatements(), fetchPurchaseLogs(), fetchLeaderboards()]);
            setIsLoading(false);
        };
        loadInitialData();
    }, [fetchClues, fetchTeams, fetchProblemStatements, fetchPurchaseLogs, fetchLeaderboards]);
    
    // Centralized real-time subscription
    useEffect(() => {
        const channel = supabase
            .channel('admin-dashboard-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, () => refreshAllData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'team_progress' }, () => fetchLeaderboards())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'problem_statement_purchases' }, () => {
                fetchPurchaseLogs();
                fetchLeaderboards();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [refreshAllData, fetchLeaderboards, fetchPurchaseLogs]);

    const renderContent = () => {
        switch(activeTab) {
            case 'control': return <EventControl />;
            case 'add-teams': return <AddTeamsManagement onTeamAdded={refreshAllData} />;
            case 'view-teams': return <ViewTeamsManagement teams={teams} onDataChanged={refreshAllData} />;
            case 'add-clues': return <AddCluesManagement onClueAdded={fetchClues} />;
            case 'view-clues': return <ViewCluesManagement clues={clues} onCluesChanged={fetchClues} />;
            case 'add-ps': return <AddProblemStatementManagement onProblemStatementAdded={fetchProblemStatements} />;
            case 'view-ps': return <ViewProblemStatementsManagement problemStatements={problemStatements} onProblemStatementsChanged={fetchProblemStatements} />;
            case 'purchase-logs': return <PurchaseLogsView logs={purchaseLogs} onRefresh={fetchPurchaseLogs} />;
            case 'leaderboard': return <LeaderboardView domainLeaderboards={domainLeaderboards} />;
            default: return null;
        }
    };

    const TabButton: React.FC<{ tab: AdminTab, icon: React.ReactNode, label: string }> = ({ tab, icon, label }) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`flex items-center space-x-3 px-4 py-3 rounded-md transition-all duration-300 w-full text-left ${activeTab === tab ? 'bg-[#00eaff]/20 text-[#00eaff]' : 'hover:bg-white/10'}`}
        >
            {icon}
            <span className="font-bold">{label}</span>
        </button>
    );

    return (
        <PageTransition>
            <div className="relative w-full max-w-7xl mx-auto backdrop-blur-sm bg-black/30 p-4 sm:p-8 rounded-2xl border-2 border-[#00eaff]/50">
                <div className="absolute top-4 right-4 z-20">
                     <GlowingButton 
                        onClick={handleLogout} 
                        className="!py-2 !px-4 !border-red-500 group-hover:!bg-red-500 !text-sm"
                    >
                        Logout
                    </GlowingButton>
                </div>
                <div className="relative z-10">
                    <h1 className="text-4xl md:text-5xl font-orbitron font-bold mb-8 text-glow-blue text-center">Admin Dashboard</h1>
                    <div className="flex flex-col md:flex-row gap-8">
                        <aside className="md:w-1/4 lg:w-1/5 space-y-2">
                            <TabButton tab="control" icon={<ControlIcon className="w-6 h-6"/>} label="Event Control" />
                            <TabButton tab="add-teams" icon={<UsersIcon className="w-6 h-6"/>} label="Add Teams" />
                            <TabButton tab="view-teams" icon={<ViewIcon className="w-6 h-6"/>} label="View Teams" />
                            <TabButton tab="add-clues" icon={<KeyIcon className="w-6 h-6"/>} label="Add Clues" />
                            <TabButton tab="view-clues" icon={<ViewIcon className="w-6 h-6"/>} label="View Clues" />
                            <TabButton tab="add-ps" icon={<MarketplaceIcon className="w-6 h-6"/>} label="Add Problem Statement" />
                            <TabButton tab="view-ps" icon={<ViewIcon className="w-6 h-6"/>} label="View Problem Statements" />
                            <TabButton tab="purchase-logs" icon={<ReceiptIcon className="w-6 h-6"/>} label="Purchase Logs" />
                            <TabButton tab="leaderboard" icon={<LeaderboardIcon className="w-6 h-6"/>} label="Leaderboard" />
                        </aside>
                        <main className="flex-1 flex flex-col min-h-[60vh] md:min-h-0 bg-black/30 p-4 sm:p-6 rounded-lg border border-white/20">
                            {isLoading ? (
                                <div className="flex-1 flex items-center justify-center">
                                    <AdminContentSkeleton />
                                </div>
                            ) : (
                                renderContent()
                            )}
                        </main>
                    </div>
                </div>
            </div>
        </PageTransition>
    );
};

const EventControl: React.FC = () => {
    const toast = useToast();
    const [status, setStatus] = useState<EventStatus>('stopped');
    const [purchaseLimit, setPurchaseLimit] = useState(3);
    const [newPurchaseLimit, setNewPurchaseLimit] = useState('3');
    const [loading, setLoading] = useState(true);
    const [isUpdatingLimit, setIsUpdatingLimit] = useState(false);
    const [isLimitFeatureAvailable, setIsLimitFeatureAvailable] = useState(true);

    useEffect(() => {
        const fetchStatusAndLimit = async () => {
            setLoading(true);
            const { data: eventData, error: eventError } = await supabase.from('event').select('status').eq('id', 1).single();
            if (eventData) {
                setStatus(eventData.status);
            }
            if (eventError) {
                toast.error(`Failed to get event status: ${eventError.message}`);
            }

            try {
                const { data: limitData, error: limitError } = await supabase.from('event').select('ps_purchase_limit').eq('id', 1).single();
                if (limitError) throw limitError;
                if (limitData) {
                    setPurchaseLimit(limitData.ps_purchase_limit || 3);
                    setNewPurchaseLimit(String(limitData.ps_purchase_limit || 3));
                }
            } catch (e: any) {
                if (e.message.includes('does not exist')) {
                    console.warn("Feature 'ps_purchase_limit' not available. DB column may be missing.");
                    setIsLimitFeatureAvailable(false);
                } else {
                    toast.error(`Failed to get purchase limit: ${e.message}`);
                }
                setPurchaseLimit(3); // Fallback
                setNewPurchaseLimit('3');
            }
            
            setLoading(false);
        };
        fetchStatusAndLimit();
    }, [toast]);

    const handleSetStatus = async (newStatus: EventStatus) => {
        const updates: { status: string; start_time?: string } = { status: newStatus };
        if (newStatus === 'running' && status === 'stopped') {
            updates.start_time = new Date().toISOString();
        }

        const { error } = await supabase.from('event').update(updates).eq('id', 1);

        if (error) {
            toast.error(`Failed to update event status: ${error.message}`);
        } else {
            toast.success(`Event status updated to ${newStatus.toUpperCase()}!`);
            setStatus(newStatus);
        }
    };
    
    const handleUpdateLimit = async () => {
        const limit = parseInt(newPurchaseLimit, 10);
        if (isNaN(limit) || limit < 1) {
            toast.error("Purchase limit must be a number greater than 0.");
            return;
        }
        setIsUpdatingLimit(true);
        const { error } = await supabase.from('event').update({ ps_purchase_limit: limit }).eq('id', 1);
        if (error) {
            toast.error(`Failed to update purchase limit: ${error.message}`);
        } else {
            toast.success(`Purchase limit updated to ${limit}!`);
            setPurchaseLimit(limit);
        }
        setIsUpdatingLimit(false);
    };

    const getStatusInfo = () => {
        switch(status) {
            case 'running': return { text: 'RUNNING (CLUE HUNT)', color: 'text-green-400' };
            case 'market': return { text: 'MARKETPLACE OPEN', color: 'text-yellow-400' };
            case 'ended': return { text: 'CLUE HUNT ENDED', color: 'text-blue-400' };
            default: return { text: 'STOPPED', color: 'text-red-400' };
        }
    };

    if (loading) return <SkeletonLoader className="h-40 w-full" />;

    return (
        <div>
            <h2 className="text-3xl font-orbitron mb-6 text-[#00eaff]">Event Control</h2>
            <div className="p-4 border border-dashed border-white/20 rounded-lg space-y-6">
                <div>
                    <p className="text-lg">Current Status: 
                        <span className={`font-bold ml-2 ${getStatusInfo().color}`}>
                            {getStatusInfo().text}
                        </span>
                    </p>
                    <div className="flex flex-wrap gap-4 mt-2">
                        {status === 'stopped' && (
                            <GlowingButton onClick={() => handleSetStatus('running')} className="!border-green-500 group-hover:!bg-green-500">Start Event</GlowingButton>
                        )}
                        {status === 'running' && (
                            <GlowingButton onClick={() => handleSetStatus('ended')} className="!border-red-500 group-hover:!bg-red-500">End Clue Hunt</GlowingButton>
                        )}
                        {status === 'ended' && (
                            <>
                                <GlowingButton onClick={() => handleSetStatus('market')} className="!border-yellow-500 group-hover:!bg-yellow-500">Open Marketplace</GlowingButton>
                                <GlowingButton onClick={() => handleSetStatus('stopped')} className="!border-gray-500 group-hover:!bg-gray-500">Reset Event</GlowingButton>
                            </>
                        )}
                        {status === 'market' && (
                            <GlowingButton onClick={() => handleSetStatus('stopped')} className="!border-red-500 group-hover:!bg-red-500">End Event</GlowingButton>
                        )}
                    </div>
                </div>
                 <div className="pt-4 border-t border-white/10">
                    {isLimitFeatureAvailable ? (
                        <>
                            <p className="text-lg mb-2">Problem Statement Purchase Limit:
                                <span className="font-bold ml-2 text-yellow-300">
                                    {purchaseLimit}
                                </span>
                            </p>
                            <div className="flex items-center gap-4">
                                <input
                                    type="number"
                                    value={newPurchaseLimit}
                                    onChange={(e) => setNewPurchaseLimit(e.target.value)}
                                    min="1"
                                    className="w-32 px-4 py-2 bg-transparent border-2 border-[#00eaff]/50 rounded-md focus:outline-none focus:border-[#00eaff] placeholder-gray-500"
                                />
                                <GlowingButton onClick={handleUpdateLimit} className="!py-2 !px-4 !border-[#00eaff] group-hover:!bg-[#00eaff]" loading={isUpdatingLimit}>
                                    Update Limit
                                </ GlowingButton>
                            </div>
                        </>
                    ) : (
                         <div>
                            <p className="text-lg mb-2">Problem Statement Purchase Limit</p>
                            <div className="p-3 bg-yellow-900/30 border border-yellow-700 rounded-md text-yellow-300 text-sm">
                                <p><strong className="font-bold">Feature Unavailable:</strong> The 'ps_purchase_limit' column seems to be missing from your 'event' table in the database. Please add it to enable this feature.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const AddTeamsManagement: React.FC<{ onTeamAdded: () => void }> = ({ onTeamAdded }) => {
    const [newTeamName, setNewTeamName] = useState('');
    const [newTeamEmail, setNewTeamEmail] = useState('');
    const [newTeamPassword, setNewTeamPassword] = useState('');
    const [newTeamDomain, setNewTeamDomain] = useState(DOMAINS[0]);
    const [loading, setLoading] = useState(false);
    const toast = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTeamName.trim() || !newTeamEmail.trim() || !newTeamPassword.trim()) {
            toast.error('All fields are required.');
            return;
        }
        setLoading(true);

        const { data: { session: adminSession }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !adminSession) {
            toast.error(`Admin session error: ${sessionError?.message || 'Please log in again.'}`);
            setLoading(false);
            return;
        }

        const { data: signUpData, error: authError } = await supabase.auth.signUp({
            email: newTeamEmail,
            password: newTeamPassword,
        });

        await supabase.auth.setSession({
            access_token: adminSession.access_token,
            refresh_token: adminSession.refresh_token,
        });

        if (authError || !signUpData.user) {
            toast.error(authError?.message || 'Failed to create user account.');
            setLoading(false);
            return;
        }
        
        const { error: teamError } = await supabase.from('teams').insert({
            name: newTeamName.trim(),
            user_id: signUpData.user.id,
            email: newTeamEmail.trim(),
            coins: 0,
            domain: newTeamDomain,
        });

        if (teamError) {
             if (teamError.code === '42501' || teamError.message?.includes('permission denied')) {
                toast.error('Database Permission Denied. Check that your RLS policy for the "teams" table allows admin inserts.');
            } else {
                toast.error(`Failed to create team profile: ${teamError.message}`);
            }
            alert(`CRITICAL ERROR: The team's login was created, but their team profile failed: ${teamError.message}. You must now go to the Supabase 'Authentication' page and manually delete the user '${newTeamEmail}' before trying again.`);
        } else {
            toast.success(`Team "${newTeamName.trim()}" added successfully!`);
            onTeamAdded();
            setNewTeamName('');
            setNewTeamEmail('');
            setNewTeamPassword('');
            setNewTeamDomain(DOMAINS[0]);
        }
        setLoading(false);
    };
    
    return (
        <div>
            <h2 className="text-3xl font-orbitron mb-6 text-[#00eaff]">Add New Team</h2>
            <form onSubmit={handleSubmit} className="p-4 border border-dashed border-white/20 rounded-lg space-y-3">
                <input type="text" value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} placeholder="New team name..." className="w-full px-4 py-2 bg-transparent border-2 border-[#00eaff]/50 rounded-md focus:outline-none focus:border-[#00eaff] placeholder-gray-500"/>
                <input type="email" value={newTeamEmail} onChange={(e) => setNewTeamEmail(e.target.value)} placeholder="Team login email..." className="w-full px-4 py-2 bg-transparent border-2 border-[#00eaff]/50 rounded-md focus:outline-none focus:border-[#00eaff] placeholder-gray-500"/>
                <input type="password" value={newTeamPassword} onChange={(e) => setNewTeamPassword(e.target.value)} placeholder="Team login password..." className="w-full px-4 py-2 bg-transparent border-2 border-[#00eaff]/50 rounded-md focus:outline-none focus:border-[#00eaff] placeholder-gray-500"/>
                <select value={newTeamDomain} onChange={(e) => setNewTeamDomain(e.target.value)} className="w-full px-4 py-2 bg-transparent border-2 border-[#00eaff]/50 rounded-md focus:outline-none focus:border-[#00eaff] placeholder-gray-500">
                    {DOMAINS.map(domain => <option key={domain} value={domain} className="bg-black text-white">{domain}</option>)}
                </select>
                <GlowingButton type="submit" className="!py-2 !px-4 !border-[#00eaff] group-hover:!bg-[#00eaff]" loading={loading}>
                    Add Team
                </ GlowingButton>
            </form>
        </div>
    );
};

const ViewTeamsManagement: React.FC<{ teams: Team[], onDataChanged: () => Promise<void> }> = ({ teams, onDataChanged }) => {
    const [editingTeam, setEditingTeam] = useState<Team | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [deletingTeamId, setDeletingTeamId] = useState<number | null>(null);
    const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);
    const toast = useToast();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [domainFilter, setDomainFilter] = useState('All');

    const filteredTeams = teams.filter(team => {
        if (domainFilter === 'All') return true;
        return team.domain === domainFilter;
    });

    const handleRefresh = async () => {
        if (isRefreshing) return;
        setIsRefreshing(true);
        try {
            await onDataChanged();
            toast.info("Team list has been refreshed.");
        } catch (e) {
            toast.error("Failed to refresh team list.");
        } finally {
            setIsRefreshing(false);
        }
    };

    const openDeleteConfirm = (team: Team) => {
        setTeamToDelete(team);
    };

    const closeDeleteConfirm = () => {
        setTeamToDelete(null);
    };

    const handleDeleteTeam = async () => {
        if (!teamToDelete) return;

        setDeletingTeamId(teamToDelete.id);
        try {
            // Cascade delete is preferred, but we'll do it manually to be safe.
            // 1. Delete team progress
            const { error: progressError } = await supabase
                .from('team_progress')
                .delete()
                .eq('team_id', teamToDelete.id);
            if (progressError) throw progressError;

            // 2. Delete problem statement purchases
            const { error: purchaseError } = await supabase
                .from('problem_statement_purchases')
                .delete()
                .eq('team_id', teamToDelete.id);
            if (purchaseError) throw purchaseError;

            // 3. Delete team profile from 'teams' table
            const { error: teamError } = await supabase
                .from('teams')
                .delete()
                .eq('id', teamToDelete.id);
            if (teamError) throw teamError;

            // 4. Invoke edge function to delete the user from auth
            const { error: functionError } = await supabase.functions.invoke('delete-user', {
                body: { userId: teamToDelete.user_id },
            });

            // The function might return an error if the user was already deleted, which we can ignore.
            if (functionError && !functionError.message.includes('User not found')) {
                throw functionError;
            }

            toast.success(`Team "${teamToDelete.name}" and all associated data have been completely deleted.`);
            onDataChanged();
            closeDeleteConfirm();

        } catch (e: any) {
            // FIX: Improved error messaging for function invocation failures.
            const isPermissionError = e.message?.includes('permission denied') || e.code === '42501';
            let errorMessage = isPermissionError
                ? `Permission Denied. Check RLS policies on all related tables.`
                : `An error occurred: ${e.message}`;
            
            if (e.message.includes('Function not found')) {
                errorMessage = 'Deletion function not found. Make sure the "delete-user" Supabase Edge Function is deployed correctly.';
            } else if (e.message?.toLowerCase().includes('failed to fetch')) {
                 errorMessage = 'Failed to connect to the Edge Function. Please check network and function deployment status.';
            }

            toast.error(errorMessage);
            console.error("Detailed deletion error:", e);
        } finally {
            setDeletingTeamId(null);
        }
    };

    const handleOpenEditModal = (team: Team) => {
        setEditingTeam({ ...team });
        setIsEditModalOpen(true);
    };

    const handleCancelEdit = () => {
        setIsEditModalOpen(false);
        setEditingTeam(null);
    };

    const handleUpdateTeam = async () => {
        if (!editingTeam || !editingTeam.name.trim() || editingTeam.coins < 0 || isNaN(editingTeam.coins)) {
            toast.error('Team name cannot be empty and coins must be a non-negative number.');
            return;
        }
        setIsUpdating(true);

        const { error } = await supabase.from('teams').update({
            name: editingTeam.name.trim(),
            domain: editingTeam.domain,
            coins: editingTeam.coins,
        }).eq('id', editingTeam.id).select();

        if (error) {
            const isPermissionError = error.message?.includes('permission denied') || error.code === '42501';
            const errorMessage = isPermissionError
                ? `Permission Denied. Check RLS policies and ensure your admin email matches.`
                : `Failed to update team: ${error.message}`;
            toast.error(errorMessage);
        } else {
            toast.success(`Team "${editingTeam.name.trim()}" updated successfully.`);
            onDataChanged();
            handleCancelEdit();
        }
        setIsUpdating(false);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <h2 className="text-3xl font-orbitron text-[#00eaff]">View & Edit Teams</h2>
                <div className="flex items-center gap-4">
                    <select
                        value={domainFilter}
                        onChange={(e) => setDomainFilter(e.target.value)}
                        className="w-full sm:w-auto px-4 py-2 bg-transparent border-2 border-[#00eaff]/50 rounded-md focus:outline-none focus:border-[#00eaff]"
                    >
                        <option value="All" className="bg-black text-white">All Domains</option>
                        {DOMAINS.map(domain => <option key={domain} value={domain} className="bg-black text-white">{domain}</option>)}
                    </select>
                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-wait"
                        aria-label="Refresh teams list"
                    >
                        <ReloadIcon className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                {filteredTeams.length > 0 ? (
                    filteredTeams.map(team => (
                        <div key={team.id} className="p-4 bg-white/5 rounded-lg flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                            <div>
                                <p className="font-bold text-lg">{team.name}</p>
                                <p className="text-sm text-gray-400 font-mono">Email: {team.email}</p>
                                <p className="text-sm text-gray-400">Coins: {team.coins} | Domain: <span className="font-semibold text-gray-300">{team.domain}</span></p>
                            </div>
                            <div className="flex space-x-4 self-end sm:self-auto">
                                <button onClick={() => handleOpenEditModal(team)} className="text-sm text-yellow-400 hover:text-yellow-300 hover:underline transition-colors">Edit</button>
                                <button 
                                    onClick={() => openDeleteConfirm(team)} 
                                    className="text-sm text-red-500 hover:text-red-400 hover:underline transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="p-4 text-center text-gray-400 italic">
                        No teams found for the selected domain.
                    </div>
                )}
            </div>
            <ConfirmationModal
                isOpen={!!teamToDelete}
                onClose={closeDeleteConfirm}
                onConfirm={handleDeleteTeam}
                title="Confirm Team Deletion"
                message={
                    <>
                        <p>Are you sure you want to delete team <strong className="font-bold text-white">{teamToDelete?.name}</strong>?</p>
                        <p className="mt-2 text-sm text-yellow-400">
                            This will permanently delete the team's profile, login credentials, and all associated progress. This action cannot be undone.
                        </p>
                    </>
                }
                confirmText="Delete Team Permanently"
                isConfirming={deletingTeamId === teamToDelete?.id}
            />
             <AnimatePresence>
                {isEditModalOpen && editingTeam && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
                        onClick={handleCancelEdit}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="relative w-full max-w-lg bg-black border-2 border-[#00eaff] rounded-lg p-4 sm:p-6 space-y-4"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="text-2xl font-orbitron text-glow-blue">Edit Team: {editingTeam.name}</h3>
                            <div className="space-y-3">
                                <label className="block text-sm font-bold text-gray-400">Team Name</label>
                                <input type="text" value={editingTeam.name} onChange={(e) => setEditingTeam({ ...editingTeam, name: e.target.value })} className="w-full px-3 py-2 bg-transparent border-2 border-[#00eaff]/50 rounded-md" placeholder="Team name"/>
                                
                                <label className="block text-sm font-bold text-gray-400">Domain</label>
                                <select value={editingTeam.domain} onChange={(e) => setEditingTeam({ ...editingTeam, domain: e.target.value })} className="w-full px-3 py-2 bg-transparent border-2 border-[#00eaff]/50 rounded-md">
                                    {DOMAINS.map(domain => <option key={domain} value={domain} className="bg-black text-white">{domain}</option>)}
                                </select>

                                <label className="block text-sm font-bold text-gray-400">Coins</label>
                                <input
                                    type="number"
                                    value={editingTeam.coins}
                                    onChange={(e) => {
                                        const newCoins = parseInt(e.target.value, 10);
                                        setEditingTeam({ ...editingTeam, coins: isNaN(newCoins) ? 0 : newCoins });
                                    }}
                                    className="w-full px-3 py-2 bg-transparent border-2 border-[#00eaff]/50 rounded-md"
                                    placeholder="Coin balance"
                                    min="0"
                                />
                            </div>
                            <div className="flex justify-end space-x-4 pt-4">
                                <button onClick={handleCancelEdit} className="px-6 py-2 bg-gray-600 rounded-md font-bold hover:bg-gray-500 transition-colors">Cancel</button>
                                <GlowingButton onClick={handleUpdateTeam} className="!py-2 !px-6 !border-[#00eaff] group-hover:!bg-[#00eaff]" loading={isUpdating}>
                                    Save Changes
                                </GlowingButton>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const AddCluesManagement: React.FC<{ onClueAdded: () => void }> = ({ onClueAdded }) => {
    const [newClueText, setNewClueText] = useState('');
    const [newClueAnswer, setNewClueAnswer] = useState('');
    const [newClueDomain, setNewClueDomain] = useState(DOMAINS[0]);
    const [newClueImageUrl, setNewClueImageUrl] = useState('');
    const [newClueLinkUrl, setNewClueLinkUrl] = useState('');
    const [newClueVideoUrl, setNewClueVideoUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const toast = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newClueText.trim() || !newClueAnswer.trim()) {
            toast.error('Clue text and answer are required.');
            return;
        }
        setLoading(true);

        const { error } = await supabase.from('clues').insert({
            text: newClueText.trim(),
            answer: newClueAnswer.trim().toUpperCase(),
            domain: newClueDomain,
            image_url: newClueImageUrl.trim() || undefined,
            link_url: newClueLinkUrl.trim() || undefined,
            video_url: newClueVideoUrl.trim() || undefined,
        });

        if (error) {
            toast.error(`Failed to add clue: ${error.message}`);
        } else {
            toast.success('Clue added successfully!');
            onClueAdded();
            setNewClueText('');
            setNewClueAnswer('');
            setNewClueDomain(DOMAINS[0]);
            setNewClueImageUrl('');
            setNewClueLinkUrl('');
            setNewClueVideoUrl('');
        }
        setLoading(false);
    };

    return (
        <div>
            <h2 className="text-3xl font-orbitron mb-6 text-[#00eaff]">Add New Clue</h2>
            <form onSubmit={handleSubmit} className="p-4 border border-dashed border-white/20 rounded-lg space-y-3">
                <textarea value={newClueText} onChange={(e) => setNewClueText(e.target.value)} placeholder="New clue text..." rows={3} className="w-full px-4 py-2 bg-transparent border-2 border-[#00eaff]/50 rounded-md focus:outline-none focus:border-[#00eaff] placeholder-gray-500"/>
                <input type="text" value={newClueAnswer} onChange={(e) => setNewClueAnswer(e.target.value)} placeholder="Clue answer (case-insensitive)..." className="w-full px-4 py-2 bg-transparent border-2 border-[#00eaff]/50 rounded-md focus:outline-none focus:border-[#00eaff] placeholder-gray-500"/>
                <input type="url" value={newClueImageUrl} onChange={(e) => setNewClueImageUrl(e.target.value)} placeholder="Image URL (optional)..." className="w-full px-4 py-2 bg-transparent border-2 border-[#00eaff]/50 rounded-md focus:outline-none focus:border-[#00eaff] placeholder-gray-500"/>
                <input type="url" value={newClueLinkUrl} onChange={(e) => setNewClueLinkUrl(e.target.value)} placeholder="Link URL for searching (optional)..." className="w-full px-4 py-2 bg-transparent border-2 border-[#00eaff]/50 rounded-md focus:outline-none focus:border-[#00eaff] placeholder-gray-500"/>
                <input type="url" value={newClueVideoUrl} onChange={(e) => setNewClueVideoUrl(e.target.value)} placeholder="Video URL (YouTube, optional)..." className="w-full px-4 py-2 bg-transparent border-2 border-[#00eaff]/50 rounded-md focus:outline-none focus:border-[#00eaff] placeholder-gray-500"/>
                <select value={newClueDomain} onChange={(e) => setNewClueDomain(e.target.value)} className="w-full px-4 py-2 bg-transparent border-2 border-[#00eaff]/50 rounded-md focus:outline-none focus:border-[#00eaff] placeholder-gray-500">
                    {DOMAINS.map(domain => <option key={domain} value={domain} className="bg-black text-white">{domain}</option>)}
                </select>
                <GlowingButton type="submit" className="!py-2 !px-4 !border-[#00eaff] group-hover:!bg-[#00eaff]" loading={loading}>
                    Add Clue
                </ GlowingButton>
            </form>
        </div>
    );
};

const ViewCluesManagement: React.FC<{ clues: Clue[], onCluesChanged: () => void }> = ({ clues, onCluesChanged }) => {
    const toast = useToast();
    const [modalState, setModalState] = useState<{ type: 'none' | 'edit' | 'delete', data: Clue | null }>({ type: 'none', data: null });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleOpenEditModal = (clue: Clue) => {
        setModalState({ type: 'edit', data: { ...clue } });
    };
    
    const handleOpenDeleteModal = (clue: Clue) => {
        setModalState({ type: 'delete', data: clue });
    };

    const handleCloseModals = () => {
        setModalState({ type: 'none', data: null });
    };

    const handleEditFormChange = (updates: Partial<Clue>) => {
        if (modalState.type === 'edit' && modalState.data) {
            setModalState(prev => ({
                ...prev,
                data: { ...prev.data!, ...updates }
            }));
        }
    };

    const handleDeleteClue = async () => {
        if (modalState.type !== 'delete' || !modalState.data) return;

        setIsSubmitting(true);
        try {
            const { error: progressError } = await supabase
                .from('team_progress')
                .delete()
                .eq('clue_id', modalState.data.id);

            if (progressError) throw progressError;

            const { error: clueError } = await supabase.from('clues').delete().eq('id', modalState.data.id);
            
            if (clueError) throw clueError;

            toast.success(`Clue for domain "${modalState.data.domain}" and all associated progress has been deleted.`);
            onCluesChanged();
            handleCloseModals();
        } catch (e: any) {
            const isPermissionError = e.message?.includes('permission denied') || e.code === '42501';
            const errorMessage = isPermissionError
                ? "Permission Denied. Check RLS policies and ensure your admin email matches."
                : `Failed to delete clue: ${e.message}`;
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleUpdateClue = async () => {
        if (modalState.type !== 'edit' || !modalState.data || !modalState.data.text.trim() || !modalState.data.answer.trim()) {
            toast.error('Clue text and answer cannot be empty.');
            return;
        }
        setIsSubmitting(true);

        const { error } = await supabase.from('clues').update({
            text: modalState.data.text.trim(),
            answer: modalState.data.answer.trim().toUpperCase(),
            domain: modalState.data.domain,
            image_url: modalState.data.image_url?.trim() || null,
            link_url: modalState.data.link_url?.trim() || null,
            video_url: modalState.data.video_url?.trim() || null
        }).eq('id', modalState.data.id);

        if (error) {
            const isPermissionError = error.message?.includes('permission denied') || error.code === '42501';
            const errorMessage = isPermissionError
                ? `Permission Denied. Check RLS policies and ensure your admin email matches.`
                : `Failed to update clue: ${error.message}`;
            toast.error(errorMessage);
        } else {
            toast.success('Clue updated successfully.');
            onCluesChanged();
            handleCloseModals();
        }
        setIsSubmitting(false);
    };

    return (
        <div>
            <h2 className="text-3xl font-orbitron mb-6 text-[#00eaff]">View & Edit Clues</h2>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                {clues.length > 0 ? clues.map(clue => (
                    <div key={clue.id} className="p-4 bg-white/5 rounded-lg flex justify-between items-start gap-4">
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-lg whitespace-pre-wrap break-words">{clue.text}</p>
                            <p className="text-sm text-green-400 font-mono break-words">Answer: {clue.answer}</p>
                            <p className="text-sm text-gray-400">Domain: <span className="font-semibold text-gray-300">{clue.domain}</span></p>
                            {clue.image_url && <p className="text-xs text-gray-500 break-all">Image: {clue.image_url}</p>}
                            {clue.link_url && <p className="text-xs text-blue-400 break-all">Link: {clue.link_url}</p>}
                            {clue.video_url && <p className="text-xs text-purple-400 break-all">Video: {clue.video_url}</p>}
                        </div>
                        <div className="flex flex-col sm:flex-row sm:space-y-0 sm:space-x-1 items-end">
                            <button 
                                onClick={() => handleOpenEditModal(clue)} 
                                className="flex items-center gap-1 p-2 rounded-md text-yellow-400 hover:text-yellow-300 hover:bg-white/10 transition-colors"
                                aria-label={`Edit clue #${clue.id}`}
                            >
                                <EditIcon className="w-4 h-4" />
                                <span className="hidden sm:inline text-sm">Edit</span>
                            </button>
                            <button 
                                onClick={() => handleOpenDeleteModal(clue)} 
                                className="flex items-center gap-1 p-2 rounded-md text-red-500 hover:text-red-400 hover:bg-white/10 transition-colors"
                                aria-label={`Delete clue #${clue.id}`}
                            >
                                <DeleteIcon className="w-4 h-4" />
                                <span className="hidden sm:inline text-sm">Delete</span>
                            </button>
                        </div>
                    </div>
                )) : (
                    <p className="text-gray-400 italic">No clues found. Use the "Add Clues" tab to create some.</p>
                )}
            </div>
            <ConfirmationModal
                isOpen={modalState.type === 'delete'}
                onClose={handleCloseModals}
                onConfirm={handleDeleteClue}
                title="Confirm Clue Deletion"
                message={<>Are you sure you want to permanently delete this clue? This will also remove it from any team's progress. <br /><strong className="font-mono text-white mt-2 block">"{modalState.data?.text}"</strong></>}
                confirmText="Delete Clue"
                isConfirming={isSubmitting}
            />
             <AnimatePresence>
                {modalState.type === 'edit' && modalState.data && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
                        onClick={handleCloseModals}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="relative w-full max-w-2xl bg-black border-2 border-[#00eaff] rounded-lg p-4 sm:p-6 space-y-4"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="text-2xl font-orbitron text-glow-blue">Edit Clue #{modalState.data.id}</h3>
                            <div className="space-y-3">
                                <label className="block text-sm font-bold text-gray-400">Clue Text</label>
                                <textarea value={modalState.data.text} onChange={(e) => handleEditFormChange({ text: e.target.value })} rows={3} className="w-full px-3 py-2 bg-transparent border-2 border-[#00eaff]/50 rounded-md" placeholder="Clue text"/>
                                
                                <label className="block text-sm font-bold text-gray-400">Answer</label>
                                <input type="text" value={modalState.data.answer} onChange={(e) => handleEditFormChange({ answer: e.target.value })} className="w-full px-3 py-2 bg-transparent border-2 border-[#00eaff]/50 rounded-md" placeholder="Clue answer"/>

                                <label className="block text-sm font-bold text-gray-400">Image URL (Optional)</label>
                                <input type="url" value={modalState.data.image_url || ''} onChange={(e) => handleEditFormChange({ image_url: e.target.value })} className="w-full px-3 py-2 bg-transparent border-2 border-[#00eaff]/50 rounded-md" placeholder="https://..."/>
                                
                                <label className="block text-sm font-bold text-gray-400">Link URL (Optional)</label>
                                <input type="url" value={modalState.data.link_url || ''} onChange={(e) => handleEditFormChange({ link_url: e.target.value })} className="w-full px-3 py-2 bg-transparent border-2 border-[#00eaff]/50 rounded-md" placeholder="https://..."/>
                                
                                <label className="block text-sm font-bold text-gray-400">Video URL (Optional)</label>
                                <input type="url" value={modalState.data.video_url || ''} onChange={(e) => handleEditFormChange({ video_url: e.target.value })} className="w-full px-3 py-2 bg-transparent border-2 border-[#00eaff]/50 rounded-md" placeholder="https://youtube.com/..."/>

                                <label className="block text-sm font-bold text-gray-400">Domain</label>
                                <select value={modalState.data.domain} onChange={(e) => handleEditFormChange({ domain: e.target.value })} className="w-full px-3 py-2 bg-transparent border-2 border-[#00eaff]/50 rounded-md">
                                    {DOMAINS.map(domain => <option key={domain} value={domain} className="bg-black text-white">{domain}</option>)}
                                </select>
                            </div>
                            <div className="flex justify-end space-x-4 pt-4">
                                <button onClick={handleCloseModals} className="px-6 py-2 bg-gray-600 rounded-md font-bold hover:bg-gray-500 transition-colors">Cancel</button>
                                <GlowingButton onClick={handleUpdateClue} className="!py-2 !px-6 !border-[#00eaff] group-hover:!bg-[#00eaff]" loading={isSubmitting}>
                                    Save Changes
                                </GlowingButton>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const AddProblemStatementManagement: React.FC<{ onProblemStatementAdded: () => void }> = ({ onProblemStatementAdded }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [cost, setCost] = useState('');
    const [domain, setDomain] = useState(DOMAINS[0]);
    const [loading, setLoading] = useState(false);
    const toast = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const costValue = parseInt(cost, 10);
        if (!title.trim() || !description.trim() || isNaN(costValue) || costValue < 0) {
            toast.error('All fields are required and cost must be a positive number.');
            return;
        }
        setLoading(true);

        const { error } = await supabase.from('problem_statements').insert({
            title: title.trim(),
            description: description.trim(),
            cost: costValue,
            domain: domain,
        });

        if (error) {
            toast.error(`Failed to add problem statement: ${error.message}`);
        } else {
            toast.success('Problem statement added successfully!');
            onProblemStatementAdded();
            setTitle('');
            setDescription('');
            setCost('');
            setDomain(DOMAINS[0]);
        }
        setLoading(false);
    };

    return (
        <div>
            <h2 className="text-3xl font-orbitron mb-6 text-[#00eaff]">Add Problem Statement</h2>
            <form onSubmit={handleSubmit} className="p-4 border border-dashed border-white/20 rounded-lg space-y-3">
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Problem statement title..." className="w-full px-4 py-2 bg-transparent border-2 border-[#00eaff]/50 rounded-md"/>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Full description..." rows={4} className="w-full px-4 py-2 bg-transparent border-2 border-[#00eaff]/50 rounded-md"/>
                <input type="number" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="Cost in coins..." min="0" className="w-full px-4 py-2 bg-transparent border-2 border-[#00eaff]/50 rounded-md"/>
                <select value={domain} onChange={(e) => setDomain(e.target.value)} className="w-full px-4 py-2 bg-transparent border-2 border-[#00eaff]/50 rounded-md">
                    {DOMAINS.map(d => <option key={d} value={d} className="bg-black text-white">{d}</option>)}
                </select>
                <GlowingButton type="submit" className="!py-2 !px-4 !border-[#00eaff] group-hover:!bg-[#00eaff]" loading={loading}>
                    Add Statement
                </GlowingButton>
            </form>
        </div>
    );
};

const ViewProblemStatementsManagement: React.FC<{ problemStatements: ProblemStatement[], onProblemStatementsChanged: () => void }> = ({ problemStatements, onProblemStatementsChanged }) => {
    const [purchaseCounts, setPurchaseCounts] = useState<Record<number, number>>({});
    const [purchaseLimit, setPurchaseLimit] = useState(3);
    const toast = useToast();
    
    const [modalState, setModalState] = useState<{ type: 'none' | 'edit' | 'delete', data: ProblemStatement | null }>({ type: 'none', data: null });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchCountsAndLimit = async () => {
            const { data: purchasesData, error: purchasesError } = await supabase.from('problem_statement_purchases').select('problem_statement_id');

            if (purchasesError) {
                toast.error("Could not fetch purchase counts.");
            } else {
                const counts: Record<number, number> = {};
                for (const row of purchasesData) {
                    counts[row.problem_statement_id] = (counts[row.problem_statement_id] || 0) + 1;
                }
                setPurchaseCounts(counts);
            }

            try {
                const { data: eventData, error: eventError } = await supabase.from('event').select('ps_purchase_limit').eq('id', 1).single();
                if (eventError) throw eventError;
                if (eventData) {
                    setPurchaseLimit(eventData.ps_purchase_limit || 3);
                }
            } catch (e: any) {
                console.warn("Could not fetch 'ps_purchase_limit'. Falling back to default 3.", e.message);
                setPurchaseLimit(3);
            }
        };
        fetchCountsAndLimit();
    }, [problemStatements, toast]);

    const handleOpenEditModal = (ps: ProblemStatement) => {
        setModalState({ type: 'edit', data: { ...ps } });
    };

    const handleOpenDeleteModal = (ps: ProblemStatement) => {
        setModalState({ type: 'delete', data: ps });
    };

    const handleCloseModals = () => {
        setModalState({ type: 'none', data: null });
    };
    
    const handleEditFormChange = (updates: Partial<ProblemStatement>) => {
        if (modalState.type === 'edit' && modalState.data) {
            setModalState(prev => ({
                ...prev,
                data: { ...prev.data!, ...updates }
            }));
        }
    };

    const handleDeleteProblemStatement = async () => {
        if (modalState.type !== 'delete' || !modalState.data) return;

        setIsSubmitting(true);
        try {
            // First delete any purchases of this statement. This is crucial if cascade delete is not set up on the DB.
            const { error: purchaseError } = await supabase
                .from('problem_statement_purchases')
                .delete()
                .eq('problem_statement_id', modalState.data.id);
            if (purchaseError) throw purchaseError;

            // Then, delete the problem statement itself.
            const { error: psError } = await supabase
                .from('problem_statements')
                .delete()
                .eq('id', modalState.data.id);
            if (psError) throw psError;

            toast.success(`Problem Statement "${modalState.data.title}" deleted.`);
            onProblemStatementsChanged();
            handleCloseModals();
        } catch (e: any) {
            toast.error(`Deletion failed: ${e.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleUpdateProblemStatement = async () => {
        if (modalState.type !== 'edit' || !modalState.data) return;
        const { title, description, cost, domain, id } = modalState.data;
        const costValue = Number(cost);

        if (!title.trim() || !description.trim() || isNaN(costValue) || costValue < 0) {
            toast.error('Title, description are required and cost must be a non-negative number.');
            return;
        }

        setIsSubmitting(true);
        const { error } = await supabase
            .from('problem_statements')
            .update({ title: title.trim(), description: description.trim(), cost: costValue, domain })
            .eq('id', id);

        if (error) {
            toast.error(`Update failed: ${error.message}`);
        } else {
            toast.success(`Problem Statement "${title.trim()}" updated.`);
            onProblemStatementsChanged();
            handleCloseModals();
        }
        setIsSubmitting(false);
    };

    return (
        <div>
            <h2 className="text-3xl font-orbitron mb-6 text-[#00eaff]">View Problem Statements</h2>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                {problemStatements.map(ps => {
                    const count = purchaseCounts[ps.id] || 0;
                    return (
                        <div key={ps.id} className="p-4 bg-white/5 rounded-lg flex flex-col justify-between">
                            <div>
                                <p className="font-bold text-lg">{ps.title}</p>
                                <p className="text-sm text-gray-300 whitespace-pre-wrap">{ps.description}</p>
                                <div className="mt-2 flex flex-wrap justify-between items-center text-sm gap-x-4 gap-y-1">
                                    <span className="font-mono text-yellow-400">Cost: {ps.cost} 🪙</span>
                                    <span className="font-mono text-gray-400">Domain: {ps.domain}</span>
                                    <span className={`font-mono ${count >= purchaseLimit ? 'text-red-500' : 'text-green-400'}`}>
                                        Purchased: {count} / {purchaseLimit}
                                    </span>
                                </div>
                            </div>
                            <div className="flex space-x-2 self-end mt-4">
                                <button onClick={() => handleOpenEditModal(ps)} className="flex items-center gap-1 p-2 rounded-md text-yellow-400 hover:text-yellow-300 hover:bg-white/10 transition-colors" aria-label={`Edit ${ps.title}`}>
                                    <EditIcon className="w-4 h-4" />
                                    <span className="hidden sm:inline text-sm">Edit</span>
                                </button>
                                <button onClick={() => handleOpenDeleteModal(ps)} className="flex items-center gap-1 p-2 rounded-md text-red-500 hover:text-red-400 hover:bg-white/10 transition-colors" aria-label={`Delete ${ps.title}`}>
                                    <DeleteIcon className="w-4 h-4" />
                                    <span className="hidden sm:inline text-sm">Delete</span>
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
             <ConfirmationModal
                isOpen={modalState.type === 'delete'}
                onClose={handleCloseModals}
                onConfirm={handleDeleteProblemStatement}
                title="Confirm Deletion"
                message={<>Are you sure you want to permanently delete this Problem Statement? This will also remove any purchase records. <br /><strong className="font-mono text-white mt-2 block">"{modalState.data?.title}"</strong></>}
                confirmText="Delete Statement"
                isConfirming={isSubmitting}
            />
             <AnimatePresence>
                {modalState.type === 'edit' && modalState.data && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
                        onClick={handleCloseModals}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="relative w-full max-w-2xl bg-black border-2 border-[#00eaff] rounded-lg p-4 sm:p-6 space-y-4"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="text-2xl font-orbitron text-glow-blue">Edit Problem Statement</h3>
                            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                                <label className="block text-sm font-bold text-gray-400">Title</label>
                                <input type="text" value={modalState.data.title} onChange={(e) => handleEditFormChange({ title: e.target.value })} className="w-full px-3 py-2 bg-transparent border-2 border-[#00eaff]/50 rounded-md"/>
                                
                                <label className="block text-sm font-bold text-gray-400">Description</label>
                                <textarea value={modalState.data.description} onChange={(e) => handleEditFormChange({ description: e.target.value })} rows={4} className="w-full px-3 py-2 bg-transparent border-2 border-[#00eaff]/50 rounded-md"/>

                                <label className="block text-sm font-bold text-gray-400">Cost</label>
                                <input type="number" value={modalState.data.cost} onChange={(e) => handleEditFormChange({ cost: parseInt(e.target.value, 10) || 0 })} min="0" className="w-full px-3 py-2 bg-transparent border-2 border-[#00eaff]/50 rounded-md"/>

                                <label className="block text-sm font-bold text-gray-400">Domain</label>
                                <select value={modalState.data.domain} onChange={(e) => handleEditFormChange({ domain: e.target.value })} className="w-full px-3 py-2 bg-transparent border-2 border-[#00eaff]/50 rounded-md">
                                    {DOMAINS.map(domain => <option key={domain} value={domain} className="bg-black text-white">{domain}</option>)}
                                </select>
                            </div>
                            <div className="flex justify-end space-x-4 pt-4">
                                <button onClick={handleCloseModals} className="px-6 py-2 bg-gray-600 rounded-md font-bold hover:bg-gray-500 transition-colors">Cancel</button>
                                <GlowingButton onClick={handleUpdateProblemStatement} className="!py-2 !px-6 !border-[#00eaff] group-hover:!bg-[#00eaff]" loading={isSubmitting}>
                                    Save Changes
                                </GlowingButton>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const PurchaseLogsView: React.FC<{ logs: PurchaseLogEntry[], onRefresh: () => Promise<void> }> = ({ logs, onRefresh }) => {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const toast = useToast();

    const handleRefresh = async () => {
        if (isRefreshing) return;
        setIsRefreshing(true);
        try {
            await onRefresh();
            toast.info("Purchase log has been refreshed.");
        } catch (e) {
            toast.error("Failed to refresh purchase log.");
        } finally {
            setIsRefreshing(false);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <h2 className="text-3xl font-orbitron text-[#00eaff]">Marketplace Purchase Log</h2>
                <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-wait"
                    aria-label="Refresh purchase log"
                >
                    <ReloadIcon className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
            </div>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                {logs.length > 0 ? (
                    logs.map((log, index) => (
                        <div key={index} className="p-4 bg-white/5 rounded-lg flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                            <div>
                                <p className="font-bold text-lg">{log.teams?.name || <span className="text-gray-500 italic">Deleted Team</span>}</p>
                                <p className="text-sm text-gray-300">purchased</p>
                                <p className="text-md text-yellow-300 font-semibold">{log.problem_statements?.title || <span className="text-gray-500 italic">Deleted Statement</span>}</p>
                            </div>
                            <div className="text-sm text-gray-400 self-end sm:self-auto font-mono">
                                {new Date(log.created_at).toLocaleString()}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="p-4 text-center text-gray-400 italic">
                        No problem statements have been purchased yet.
                    </div>
                )}
            </div>
        </div>
    );
};

// FIX: Converted LeaderboardView to a presentational component that receives data as props.
const LeaderboardView: React.FC<{ domainLeaderboards: Record<string, LeaderboardEntry[]> }> = ({ domainLeaderboards }) => {
    const isLoading = Object.keys(domainLeaderboards).length === 0;

    return (
        <div>
            <h2 className="text-3xl font-orbitron mb-6 text-[#00eaff]">Domain Leaderboards</h2>
            {isLoading ? (
                <SkeletonLoader className="h-64 w-full" />
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto pr-2">
                    {DOMAINS.map(domain => (
                        <div key={domain} className="bg-white/5 p-4 rounded-lg">
                            <h3 className="text-2xl font-orbitron text-center text-glow mb-4">{domain}</h3>
                            <div className="space-y-2">
                                {domainLeaderboards[domain] && domainLeaderboards[domain].length > 0 ? (
                                    domainLeaderboards[domain].map(entry => (
                                        <div key={entry.id} className="flex justify-between items-center p-2 bg-black/20 rounded-md">
                                            <div className="flex items-center gap-3">
                                                <span className={`font-bold w-6 text-center ${entry.rank === 1 ? 'text-yellow-400' : 'text-gray-400'}`}>
                                                    {entry.rank}
                                                </span>
                                                <span className="font-semibold">{entry.team}</span>
                                            </div>
                                            <div className="font-mono text-right">
                                                <p>{entry.coins} 🪙</p>
                                                <p className="text-xs text-gray-400">{entry.cluesSolved} clues</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center text-gray-500 italic">No activity yet.</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminDashboardPage;