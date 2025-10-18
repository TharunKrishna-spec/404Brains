import React, { useState, useEffect } from 'react';
import PageTransition from '../components/PageTransition';
import GlowingButton from '../components/GlowingButton';
import { Team, Clue, LeaderboardEntry } from '../types';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { v4 as uuidv4 } from 'uuid'; // For unique file names
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmationModal from '../components/ConfirmationModal';

const DOMAINS = ['Cybernetics', 'Quantum', 'Bio-Synth', 'Neutrino'];

// Icons as React components
const UsersIcon: React.FC<{className?:string}> = ({className}) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.124-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.124-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const KeyIcon: React.FC<{className?:string}> = ({className}) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H5v-2H3v-2H1v-4a6 6 0 017.743-5.743z" /></svg>;
const ControlIcon: React.FC<{className?:string}> = ({className}) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>;
const LeaderboardIcon: React.FC<{className?:string}> = ({className}) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
const ViewIcon: React.FC<{className?:string}> = ({className}) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>;

const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
};

type AdminTab = 'control' | 'add-teams' | 'view-teams' | 'add-clues' | 'view-clues' | 'leaderboard';

const AdminDashboardPage: React.FC = () => {
    const { logout } = useAuth();
    const [activeTab, setActiveTab] = useState<AdminTab>('add-teams');
    const [clues, setClues] = useState<Clue[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchClues = async () => {
        const { data, error } = await supabase.from('clues').select('*').order('id', { ascending: true });
        if (data) setClues(data);
    };

    const fetchTeams = async () => {
        const { data, error } = await supabase.from('teams').select('*');
        if (data) setTeams(data);
    };

    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoading(true);
            await Promise.all([fetchClues(), fetchTeams()]);
            setIsLoading(false);
        };
        loadInitialData();
    }, []);

    const renderContent = () => {
        switch(activeTab) {
            case 'control': return <EventControl />;
            case 'add-teams': return <AddTeamsManagement onTeamAdded={fetchTeams} />;
            case 'view-teams': return <ViewTeamsManagement teams={teams} onTeamsChanged={fetchTeams} />;
            case 'add-clues': return <AddCluesManagement onClueAdded={fetchClues} />;
            case 'view-clues': return <ViewCluesManagement clues={clues} onCluesChanged={fetchClues} />;
            case 'leaderboard': return <LeaderboardView />;
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
                        onClick={logout} 
                        className="!py-2 !px-4 !border-red-500 group-hover:!bg-red-500 !text-sm"
                    >
                        Logout
                    </GlowingButton>
                </div>
                <div className="relative z-10">
                    <h1 className="text-4xl md:text-5xl font-orbitron font-bold mb-8 text-glow-blue text-center">Admin Dashboard</h1>
                    <div className="flex flex-col md:flex-row gap-8">
                        <aside className="md:w-1/4 lg:w-1/5 space-y-4">
                            <TabButton tab="control" icon={<ControlIcon className="w-6 h-6"/>} label="Event Control" />
                            <TabButton tab="add-teams" icon={<UsersIcon className="w-6 h-6"/>} label="Add Teams" />
                            <TabButton tab="view-teams" icon={<ViewIcon className="w-6 h-6"/>} label="View Teams" />
                            <TabButton tab="add-clues" icon={<KeyIcon className="w-6 h-6"/>} label="Add Clues" />
                            <TabButton tab="view-clues" icon={<ViewIcon className="w-6 h-6"/>} label="View Clues" />
                            <TabButton tab="leaderboard" icon={<LeaderboardIcon className="w-6 h-6"/>} label="Leaderboard" />
                        </aside>
                        <main className="flex-1 flex flex-col min-h-[60vh] md:min-h-0 bg-black/30 p-6 rounded-lg border border-white/20">
                            {isLoading ? (
                                <div className="flex-1 flex items-center justify-center">
                                    <p className="text-2xl font-orbitron text-glow-blue animate-pulse">Loading Data...</p>
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

const AddTeamsManagement: React.FC<{ onTeamAdded: () => void }> = ({ onTeamAdded }) => {
    const [newTeamName, setNewTeamName] = useState('');
    const [newTeamEmail, setNewTeamEmail] = useState('');
    const [newTeamPassword, setNewTeamPassword] = useState('');
    const [newTeamDomain, setNewTeamDomain] = useState(DOMAINS[0]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTeamName.trim() || !newTeamEmail.trim() || !newTeamPassword.trim()) {
            setError('All fields are required.');
            return;
        }
        setLoading(true);
        setError(null);

        const { data: { session: adminSession } } = await supabase.auth.getSession();
        if (!adminSession) {
            setError('Admin session not found. Please log in again.');
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
            setError(authError?.message || 'Failed to create user.');
            setLoading(false);
            return;
        }
        
        const { error: teamError } = await supabase.from('teams').insert({
            name: newTeamName.trim(),
            user_id: signUpData.user.id,
            coins: 0,
            domain: newTeamDomain,
        });

        if (teamError) {
             if (teamError.code === '42501' || teamError.message?.includes('permission denied')) {
                setError('Database Permission Denied. Please check RLS policies for the "teams" table to ensure INSERT permission is granted for authenticated users.');
            } else {
                setError(teamError.message);
            }
            alert(`CRITICAL ERROR: The team's login was created, but their team profile failed: ${teamError.message}. You must now go to the Supabase 'Authentication' page and manually delete the user '${newTeamEmail}' before trying again.`);
        } else {
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
                <GlowingButton type="submit" className="!py-2 !px-4 !border-[#00eaff] group-hover:!bg-[#00eaff]" disabled={loading}>
                    {loading ? 'Creating...' : 'Add Team'}
                </ GlowingButton>
                {error && <p className="text-red-400 text-sm mt-2" role="alert">{error}</p>}
            </form>
        </div>
    );
};

const ViewTeamsManagement: React.FC<{ teams: Team[], onTeamsChanged: () => void }> = ({ teams, onTeamsChanged }) => {
    const [editingTeam, setEditingTeam] = useState<Team | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [editError, setEditError] = useState<string | null>(null);
    const [deletingTeamId, setDeletingTeamId] = useState<number | null>(null);
    const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    const openDeleteConfirm = (team: Team) => {
        setTeamToDelete(team);
        setDeleteError(null);
    };

    const closeDeleteConfirm = () => {
        setTeamToDelete(null);
        setDeleteError(null);
    };

    const handleDeleteTeam = async () => {
        if (!teamToDelete) return;

        setDeletingTeamId(teamToDelete.id);
        setDeleteError(null);
        try {
            // 1. Delete team progress first
            const { error: progressError } = await supabase
                .from('team_progress')
                .delete()
                .eq('team_id', teamToDelete.id);

            if (progressError) throw progressError;

            // 2. Delete team profile
            const { error: teamError } = await supabase
                .from('teams')
                .delete()
                .eq('id', teamToDelete.id);

            if (teamError) throw teamError;
            
            // REMOVED: The call to the 'delete-user' Edge Function which was causing the error.
            // This restores the previous working behavior.
            
            onTeamsChanged();
            closeDeleteConfirm(); // Close modal on success

        } catch (e: any) {
             if (e.code === '42501' || e.message?.includes('permission denied')) {
                setDeleteError(`Database Permission Denied. Check RLS policies for 'teams' and 'team_progress' tables.`);
            } else {
                setDeleteError(`An error occurred: ${e.message}`);
            }
            console.error(e);
        } finally {
            setDeletingTeamId(null);
            // On error, we don't close the modal so the user can see the error message.
        }
    };

    const handleOpenEditModal = (team: Team) => {
        setEditingTeam({ ...team });
        setEditError(null);
        setIsEditModalOpen(true);
    };

    const handleCancelEdit = () => {
        setIsEditModalOpen(false);
        setEditingTeam(null);
        setEditError(null);
    };

    const handleUpdateTeam = async () => {
        if (!editingTeam || !editingTeam.name.trim()) {
            setEditError('Team name cannot be empty.');
            return;
        }
        setIsUpdating(true);
        setEditError(null);

        const { error } = await supabase.from('teams').update({
            name: editingTeam.name.trim(),
            domain: editingTeam.domain,
        }).eq('id', editingTeam.id).select();

        if (error) {
            if (error.code === '42501' || error.message?.includes('permission denied')) {
                setEditError('Database Permission Denied. Please check the RLS policies for the "teams" table to ensure admins have UPDATE permission.');
            } else {
                setEditError('Failed to update team: ' + error.message);
            }
        } else {
            onTeamsChanged();
            handleCancelEdit();
        }
        setIsUpdating(false);
    };

    return (
        <div>
            <h2 className="text-3xl font-orbitron mb-6 text-[#00eaff]">View & Edit Teams</h2>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                {teams.map(team => (
                    <div key={team.id} className="p-4 bg-white/5 rounded-lg flex justify-between items-center">
                        <div>
                            <p className="font-bold text-lg">{team.name}</p>
                            <p className="text-sm text-gray-400">Coins: {team.coins} | Domain: <span className="font-semibold text-gray-300">{team.domain}</span></p>
                        </div>
                        <div className="flex space-x-4">
                            <button onClick={() => handleOpenEditModal(team)} className="text-sm text-yellow-400 hover:underline">Edit</button>
                            <button 
                                onClick={() => openDeleteConfirm(team)} 
                                className="text-sm text-red-500 hover:underline"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            <ConfirmationModal
                isOpen={!!teamToDelete}
                onClose={closeDeleteConfirm}
                onConfirm={handleDeleteTeam}
                title="Confirm Team Deletion"
                message={
                    <>
                        <p>Are you sure you want to permanently delete team <strong className="font-bold text-white">{teamToDelete?.name}</strong>?</p>
                        <p className="mt-2 text-sm text-yellow-400">This action will delete the team's profile and all their progress. Note: This does <strong className="font-semibold text-red-400">NOT</strong> delete their login credentials.</p>
                        <AnimatePresence>
                        {deleteError && (
                            <motion.div 
                                initial={{height: 0, opacity: 0, marginTop: 0}}
                                animate={{height: 'auto', opacity: 1, marginTop: '1rem'}}
                                exit={{height: 0, opacity: 0, marginTop: 0}}
                                className="p-3 bg-red-900/50 border border-red-500/80 rounded-md"
                            >
                                <p className="text-red-300 font-bold text-sm" role="alert">{deleteError}</p>
                            </motion.div>
                        )}
                        </AnimatePresence>
                    </>
                }
                confirmText="Delete Team"
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
                            className="relative w-full max-w-lg bg-black border-2 border-[#00eaff] rounded-lg p-6 space-y-4"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="text-2xl font-orbitron text-glow-blue">Edit Team: {editingTeam.name}</h3>
                            <div className="space-y-3">
                                <label className="block text-sm font-bold text-gray-400">Team Name</label>
                                <input type="text" value={editingTeam.name} onChange={(e) => {
                                    setEditingTeam({ ...editingTeam, name: e.target.value });
                                    if (editError) setEditError(null);
                                }} className="w-full px-3 py-2 bg-transparent border-2 border-[#00eaff]/50 rounded-md" placeholder="Team name"/>
                                
                                <label className="block text-sm font-bold text-gray-400">Domain</label>
                                <select value={editingTeam.domain} onChange={(e) => {
                                    setEditingTeam({ ...editingTeam, domain: e.target.value });
                                    if (editError) setEditError(null);
                                }} className="w-full px-3 py-2 bg-transparent border-2 border-[#00eaff]/50 rounded-md">
                                    {DOMAINS.map(d => <option key={d} value={d} className="bg-black">{d}</option>)}
                                </select>
                            </div>
                            <AnimatePresence>
                                {editError && (
                                    <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="text-red-400 text-center text-sm font-bold pt-2" role="alert">
                                        {editError}
                                    </motion.p>
                                )}
                            </AnimatePresence>
                            <div className="flex space-x-4 justify-end pt-4">
                                <button onClick={handleCancelEdit} className="px-4 py-2 bg-gray-600 rounded-md font-bold hover:bg-gray-500 transition-colors">Cancel</button>
                                <GlowingButton onClick={handleUpdateTeam} className="!py-2 !px-4 !border-[#00eaff] group-hover:!bg-[#00eaff]" disabled={isUpdating}>
                                    {isUpdating ? 'Saving...' : 'Save Changes'}
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
    const [newClueImageFile, setNewClueImageFile] = useState<File | null>(null);
    const [newClueImagePreview, setNewClueImagePreview] = useState<string | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [error, setError] = useState<string | null>(null);

    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                setError('File size should not exceed 2MB.');
                return;
            }
            setError(null);
            setNewClueImageFile(file);
            setNewClueImagePreview(URL.createObjectURL(file));
        } else {
            setNewClueImageFile(null);
            setNewClueImagePreview(null);
        }
    };
    
    const uploadImage = async (file: File): Promise<string | null> => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${uuidv4()}.${fileExt}`;
        const { error } = await supabase.storage
            .from('clue-images')
            .upload(fileName, file);

        if (error) {
            setError('Error uploading image: ' + error.message);
            return null;
        }

        const { data } = supabase.storage
            .from('clue-images')
            .getPublicUrl(fileName);
        
        return data.publicUrl;
    };

    const handleAddClue = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newClueText.trim() || !newClueAnswer.trim()) {
            setError('Clue text and answer are required.');
            return;
        }
        setIsAdding(true);
        setError(null);

        let imageUrl: string | undefined = undefined;
        if (newClueImageFile) {
            const uploadedUrl = await uploadImage(newClueImageFile);
            if (!uploadedUrl) {
                setIsAdding(false);
                return; // Stop if upload fails
            }
            imageUrl = uploadedUrl;
        }

        const { error: insertError } = await supabase.from('clues').insert({
            text: newClueText.trim(),
            answer: newClueAnswer.trim().toUpperCase(),
            image_url: imageUrl,
            domain: newClueDomain,
        });

        if (insertError) {
            if (insertError.code === '42501' || insertError.message?.includes('permission denied')) {
                setError('Database Permission Denied: Could not add clue. Please check the RLS policies for the "clues" table to ensure INSERT permission is granted.');
            } else {
                setError('Failed to add clue: ' + insertError.message);
            }
        } else {
            setNewClueText('');
            setNewClueAnswer('');
            setNewClueDomain(DOMAINS[0]);
            setNewClueImageFile(null);
            setNewClueImagePreview(null);
            onClueAdded();
        }
        setIsAdding(false);
    };

    return (
        <div>
            <h2 className="text-3xl font-orbitron mb-6 text-[#00eaff]">Add Clue</h2>
             <form 
                onSubmit={handleAddClue} 
                className="p-4 border border-dashed border-white/20 rounded-lg space-y-3"
            >
                <select value={newClueDomain} onChange={(e) => setNewClueDomain(e.target.value)} className="w-full px-4 py-2 bg-transparent border-2 border-[#00eaff]/50 rounded-md focus:outline-none focus:border-[#00eaff] placeholder-gray-500">
                    {DOMAINS.map(domain => <option key={domain} value={domain} className="bg-black text-white">{domain}</option>)}
                </select>
                <input type="text" value={newClueText} onChange={(e) => setNewClueText(e.target.value)} placeholder="Clue text..." className="w-full px-4 py-2 bg-transparent border-2 border-[#00eaff]/50 rounded-md"/>
                <input type="text" value={newClueAnswer} onChange={(e) => setNewClueAnswer(e.target.value)} placeholder="Clue answer (will be stored as uppercase)..." className="w-full px-4 py-2 bg-transparent border-2 border-[#00eaff]/50 rounded-md"/>
                <div className="mt-2">
                    <label className="text-sm text-gray-400">Optional Image (Max 2MB)</label>
                    <input type="file" accept="image/*" onChange={handleFileChange} className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-[#00eaff]/20 file:text-[#00eaff] hover:file:bg-[#00eaff]/30"/>
                </div>
                {newClueImagePreview && (
                    <div className="mt-2 relative w-32">
                        <img src={newClueImagePreview} alt="Clue preview" className="rounded-md w-full h-auto" />
                        <button type="button" onClick={() => { setNewClueImageFile(null); setNewClueImagePreview(null); }} className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold">&times;</button>
                    </div>
                )}
                <GlowingButton type="submit" className="!py-2 !px-4 !border-[#00eaff] group-hover:!bg-[#00eaff]" disabled={isAdding}>
                    {isAdding ? 'Adding...' : 'Add Clue'}
                </GlowingButton>
                {error && <p className="text-red-400 text-sm mt-2" role="alert">{error}</p>}
            </form>
        </div>
    );
};

const ViewCluesManagement: React.FC<{ clues: Clue[], onCluesChanged: () => void }> = ({ clues, onCluesChanged }) => {
    const [editingClue, setEditingClue] = useState<Clue | null>(null);
    const [editingClueImageFile, setEditingClueImageFile] = useState<File | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [editError, setEditError] = useState<string | null>(null);
    const [clueToDelete, setClueToDelete] = useState<Clue | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                setEditError('File size should not exceed 2MB.');
                return;
            }
            setEditError(null);
            setEditingClueImageFile(file);
        } else {
            setEditingClueImageFile(null);
        }
    };
    
    const uploadImage = async (file: File): Promise<string | null> => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${uuidv4()}.${fileExt}`;
        const { error } = await supabase.storage
            .from('clue-images')
            .upload(fileName, file);

        if (error) {
            setEditError('Error uploading image: ' + error.message);
            return null;
        }

        const { data } = supabase.storage
            .from('clue-images')
            .getPublicUrl(fileName);
        
        return data.publicUrl;
    };
    
    const openDeleteConfirm = (clue: Clue) => {
        setClueToDelete(clue);
    };

    const closeDeleteConfirm = () => {
        setClueToDelete(null);
    };

    const handleDeleteClue = async () => {
        if (!clueToDelete) return;
        setIsDeleting(true);

        if (clueToDelete.image_url) {
            try {
                const fileName = clueToDelete.image_url.split('/').pop();
                if (fileName) {
                    await supabase.storage.from('clue-images').remove([fileName]);
                }
            } catch (storageError) {
                console.error("Could not delete image from storage, but proceeding with DB deletion:", storageError);
            }
        }

        const { error } = await supabase.from('clues').delete().eq('id', clueToDelete.id);
        if (error) {
                if (error.code === '42501' || error.message?.includes('permission denied')) {
                alert('Database Permission Denied: Could not delete clue. Please check the RLS policies for the "clues" table to ensure DELETE permission is granted.');
            } else {
                alert('Failed to delete clue: ' + error.message);
            }
        } else {
            onCluesChanged();
        }
        setIsDeleting(false);
        closeDeleteConfirm();
    };
    
    const handleOpenEditModal = (clue: Clue) => {
        setEditingClue({ ...clue });
        setEditingClueImageFile(null);
        setEditError(null);
        setIsEditModalOpen(true);
    };

    const handleCancelEdit = () => {
        setIsEditModalOpen(false);
        setEditingClue(null);
        setEditingClueImageFile(null);
        setEditError(null);
    };
    
    const handleUpdateClue = async () => {
        if (!editingClue || !editingClue.text.trim() || !editingClue.answer.trim()) {
            setEditError('Clue text and answer cannot be empty.');
            return;
        }
        setIsUpdating(true);
        setEditError(null);

        let imageUrl = editingClue.image_url;
        if (editingClueImageFile) {
            const uploadedUrl = await uploadImage(editingClueImageFile);
            if (!uploadedUrl) {
                setIsUpdating(false);
                return;
            }
            imageUrl = uploadedUrl;
        }

        const { error } = await supabase.from('clues').update({
            text: editingClue.text.trim(),
            answer: editingClue.answer.trim().toUpperCase(),
            image_url: imageUrl,
            domain: editingClue.domain,
        }).eq('id', editingClue.id).select();

        if (error) {
             if (error.code === '42501' || error.message?.includes('permission denied')) {
                setEditError('Database Permission Denied: Please check RLS policies for the "clues" table to ensure UPDATE permission is granted.');
            } else {
                setEditError('Failed to update clue: ' + error.message);
            }
        } else {
            onCluesChanged();
            handleCancelEdit();
        }
        setIsUpdating(false);
    };

    const cluesByDomain = clues.reduce((acc, clue) => {
        const domain = clue.domain || 'Uncategorized';
        if (!acc[domain]) {
            acc[domain] = [];
        }
        acc[domain].push(clue);
        return acc;
    }, {} as Record<string, Clue[]>);

    return (
         <div>
            <h2 className="text-3xl font-orbitron mb-6 text-[#00eaff]">View & Edit Clues</h2>
            <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
                {DOMAINS.map(domain => {
                    const domainClues = cluesByDomain[domain] || [];
                    return (
                        <div key={domain}>
                            <h4 className="text-2xl font-orbitron text-gray-400 border-b-2 border-gray-700 pb-2 mb-4">{domain} ({domainClues.length} clues)</h4>
                            {domainClues.length > 0 ? (
                                <div className="space-y-4">
                                {domainClues.map(clue => (
                                    <div key={clue.id} className="p-4 bg-white/5 rounded-lg">
                                        <p className="font-semibold text-lg">Clue #{clue.id}: <span className="font-light text-gray-300">"{clue.text}"</span></p>
                                        <p className="font-semibold text-md mt-1">Answer: <span className="font-mono text-green-400 bg-black/30 px-2 py-1 rounded">{clue.answer}</span></p>
                                        {clue.image_url && (
                                            <div className="mt-2">
                                                <img src={clue.image_url} alt={`Clue ${clue.id} image`} className="max-w-xs max-h-32 rounded-md" />
                                            </div>
                                        )}
                                        <div className="flex space-x-2 mt-2">
                                            <button onClick={() => handleOpenEditModal(clue)} className="text-sm text-yellow-400 hover:underline">Edit</button>
                                            <button onClick={() => openDeleteConfirm(clue)} className="text-sm text-red-500 hover:underline">Delete</button>
                                        </div>
                                    </div>
                                ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 italic">No clues added for this domain yet.</p>
                            )}
                        </div>
                    )
                })}
            </div>

            <ConfirmationModal
                isOpen={!!clueToDelete}
                onClose={closeDeleteConfirm}
                onConfirm={handleDeleteClue}
                title="Confirm Clue Deletion"
                message={<p>Are you sure you want to permanently delete Clue #{clueToDelete?.id}? This action cannot be undone.</p>}
                isConfirming={isDeleting}
            />

            {/* Edit Clue Modal */}
            <AnimatePresence>
                {isEditModalOpen && editingClue && (
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
                            className="relative w-full max-w-lg bg-black border-2 border-[#00eaff] rounded-lg p-6 space-y-4"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="text-2xl font-orbitron text-glow-blue">Edit Clue #{editingClue.id}</h3>
                            <div className="space-y-3">
                                <label className="block text-sm font-bold text-gray-400">Domain</label>
                                <select value={editingClue.domain} onChange={(e) => setEditingClue({ ...editingClue, domain: e.target.value })} className="w-full px-3 py-2 bg-transparent border-2 border-[#00eaff]/50 rounded-md">
                                    {DOMAINS.map(d => <option key={d} value={d} className="bg-black">{d}</option>)}
                                </select>
                                
                                <label className="block text-sm font-bold text-gray-400">Clue Text</label>
                                <textarea value={editingClue.text} onChange={(e) => setEditingClue({ ...editingClue, text: e.target.value })} className="w-full h-24 px-3 py-2 bg-transparent border-2 border-[#00eaff]/50 rounded-md" placeholder="Clue text"/>
                                
                                <label className="block text-sm font-bold text-gray-400">Answer</label>
                                <input type="text" value={editingClue.answer} onChange={(e) => setEditingClue({ ...editingClue, answer: e.target.value })} className="w-full px-3 py-2 bg-transparent border-2 border-[#00eaff]/50 rounded-md" placeholder="Clue answer"/>
                                
                                <div>
                                    <label className="block text-sm font-bold text-gray-400">Clue Image (Optional)</label>
                                    <div className="flex items-center gap-4 mt-2">
                                        {(editingClue.image_url || editingClueImageFile) && (
                                            <div className="relative w-24 h-24">
                                                <img src={editingClueImageFile ? URL.createObjectURL(editingClueImageFile) : editingClue.image_url} alt="Current clue" className="rounded-md w-full h-full object-cover" />
                                                <button type="button" onClick={() => { setEditingClue({ ...editingClue, image_url: undefined }); setEditingClueImageFile(null); }} className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold">&times;</button>
                                            </div>
                                        )}
                                        <input type="file" accept="image/*" onChange={handleFileChange} className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#00eaff]/20 file:text-[#00eaff] hover:file:bg-[#00eaff]/30"/>
                                    </div>
                                </div>
                            </div>
                             <AnimatePresence>
                                {editError && (
                                    <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="text-red-400 text-center text-sm font-bold pt-2" role="alert">
                                        {editError}
                                    </motion.p>
                                )}
                            </AnimatePresence>
                            <div className="flex space-x-4 justify-end pt-4">
                                <button onClick={handleCancelEdit} className="px-4 py-2 bg-gray-600 rounded-md font-bold hover:bg-gray-500 transition-colors">Cancel</button>
                                <GlowingButton onClick={handleUpdateClue} className="!py-2 !px-4 !border-[#00eaff] group-hover:!bg-[#00eaff]" disabled={isUpdating}>
                                    {isUpdating ? 'Saving...' : 'Save Changes'}
                                </GlowingButton>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const EventControl: React.FC = () => {
    const [status, setStatus] = useState<'stopped' | 'running'>('stopped');
    const [startTime, setStartTime] = useState<string | null>(null);
    const [elapsedTime, setElapsedTime] = useState(0);

    useEffect(() => {
        const fetchEvent = async () => {
            const { data } = await supabase.from('event').select('*').eq('id', 1).single();
            if (data) {
                setStatus(data.status);
                setStartTime(data.start_time);
            }
        };
        fetchEvent();
        const channel = supabase.channel('public:event')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'event' }, fetchEvent)
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, []);

    useEffect(() => {
        let timer: number;
        if (status === 'running' && startTime) {
            timer = window.setInterval(() => {
                const elapsed = Math.floor((Date.now() - new Date(startTime).getTime()) / 1000);
                setElapsedTime(elapsed > 0 ? elapsed : 0);
            }, 1000);
        } else {
            setElapsedTime(0);
        }
        return () => clearInterval(timer);
    }, [status, startTime]);

    const handleStart = async () => {
        if (status === 'stopped') {
            await supabase.from('event').update({ status: 'running', start_time: new Date().toISOString() }).eq('id', 1);
        }
    };
    
    const handleStop = async () => {
        if (status === 'running') {
            if (window.confirm('Are you sure you want to stop the event? This will reset the timer.')) {
                 await supabase.from('event').update({ status: 'stopped', start_time: null }).eq('id', 1);
            }
        }
    };

    return (
        <div>
            <h2 className="text-3xl font-orbitron mb-6 text-[#00eaff]">Event Control</h2>
            <div className="text-center p-8 bg-black/40 rounded-lg border border-dashed border-white/20">
                <p className="text-xl mb-4">Event Timer</p>
                <div className="font-orbitron text-7xl font-black text-[#00eaff] tracking-widest">
                    {formatTime(elapsedTime)}
                </div>
            </div>
            <div className="flex justify-center space-x-6 mt-8">
                <GlowingButton onClick={handleStart} className={`!border-green-500 group-hover:!bg-green-500 ${status === 'running' ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={status === 'running'}>
                    {status === 'running' ? 'Running...' : 'Start Event'}
                </GlowingButton>
                <GlowingButton onClick={handleStop} className={`!border-red-500 group-hover:!bg-red-500 ${status !== 'running' ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={status !== 'running'}>
                    Stop Event
                </GlowingButton>
            </div>
        </div>
    );
};


const LeaderboardView: React.FC = () => {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            setLoading(true);
            const { data: teams, error: teamsError } = await supabase.from('teams').select('*');
            if (teamsError) {
                setLoading(false);
                return;
            }

            const { data: progress, error: progressError } = await supabase.from('team_progress').select('*');
            if (progressError) {
                setLoading(false);
                return;
            }

            const board = teams.map(team => {
                const solved = progress.filter(p => p.team_id === team.id);
                const lastSolve = solved.length > 0 ? solved.reduce((latest, p) => new Date(p.solved_at) > new Date(latest.solved_at) ? p : latest) : null;
                return {
                    team: team.name,
                    coins: team.coins,
                    cluesSolved: solved.length,
                    lastSolveTime: lastSolve ? lastSolve.solved_at : null
                };
            });

            board.sort((a, b) => {
                if (b.cluesSolved !== a.cluesSolved) return b.cluesSolved - a.cluesSolved;
                if (b.coins !== a.coins) return b.coins - a.coins;
                if (a.lastSolveTime && b.lastSolveTime) return new Date(a.lastSolveTime).getTime() - new Date(b.lastSolveTime).getTime();
                return 0;
            });
            
            setLeaderboard(board.map((item, index) => ({ ...item, rank: index + 1 })));
            setLoading(false);
        };

        fetchLeaderboard();
        const channel = supabase.channel('public:team_progress')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'team_progress' }, fetchLeaderboard)
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    return (
        <div>
            <h2 className="text-3xl font-orbitron mb-6 text-[#00eaff]">Leaderboard</h2>
            {loading ? (
                <div className="text-center py-8 text-lg font-rajdhani animate-pulse">Fetching latest standings...</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-b border-white/20 text-sm uppercase text-gray-400">
                            <tr>
                                <th className="p-3">Rank</th>
                                <th className="p-3">Team</th>
                                <th className="p-3">Coins</th>
                                <th className="p-3">Clues Solved</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaderboard.map((entry) => (
                                <tr key={entry.rank} className="border-b border-white/10 hover:bg-white/5">
                                    <td className="p-3 font-bold">{entry.rank}</td>
                                    <td className="p-3 font-bold">{entry.team}</td>
                                    <td className="p-3">{entry.coins}</td>
                                    <td className="p-3">{entry.cluesSolved}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default AdminDashboardPage;