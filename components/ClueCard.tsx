import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlowingButton from './GlowingButton';
import { Clue } from '../types';

const CheckIcon: React.FC<{className?:string}> = ({className}) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>;

interface ClueCardProps {
    clue: Clue;
    clueNumber: number;
    isSolved: boolean;
    status: 'idle' | 'loading' | 'correct' | 'incorrect';
    currentAnswer: string;
    awardedCoins: number | undefined;
    isActive: boolean;
    isSkipping: boolean;
    onAnswerChange: (clueId: number, value: string) => void;
    onSubmitAnswer: (clueId: number) => void;
    onSkipClue: (clueId: number) => void;
}

const ClueCard: React.FC<ClueCardProps> = ({ clue, clueNumber, isSolved, status, currentAnswer, awardedCoins, isActive, isSkipping, onAnswerChange, onSubmitAnswer, onSkipClue }) => {
    
    const isCurrentlyActive = isActive && !isSolved;
    
    // FIX: Refactored card styling into a memoized variable for better readability and performance.
    // This provides more distinct visual cues for locked, active, and solved states.
    const cardStateStyles = useMemo(() => {
        if (isSolved) {
            // Solved: Green border, slightly darker background to feel "completed".
            return 'bg-black/60 border-green-500/70';
        }
        if (isCurrentlyActive) {
            // Active: Bright glowing orange border to draw focus.
            return 'bg-black/40 border-[#ff7b00] shadow-lg shadow-[#ff7b00]/30';
        }
        // Locked: Muted gray border and faded out to de-emphasize.
        return 'bg-black/40 border-gray-700 opacity-50';
    }, [isSolved, isCurrentlyActive]);
    
    const embedUrl = useMemo(() => {
        if (!clue.video_url) return null;
        try {
            const url = new URL(clue.video_url);
            let videoId: string | null = null;
            if (url.hostname === 'youtu.be') {
                videoId = url.pathname.substring(1);
            } else if (url.hostname === 'www.youtube.com' || url.hostname === 'youtube.com') {
                videoId = url.searchParams.get('v');
            }
            return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
        } catch (e) {
            console.error("Invalid video URL provided for clue.", e);
            return null;
        }
    }, [clue.video_url]);

    return (
        <div className={`p-4 rounded-lg border-2 transition-all duration-500 ${cardStateStyles}`}>
            <div className="flex justify-between items-start">
                <p className="font-semibold text-xl">Clue #{clueNumber}</p>
                {isSolved ? (
                     <div className="px-3 py-1 bg-green-500/30 text-green-300 font-bold text-sm rounded-full flex items-center gap-2"><CheckIcon className="w-4 h-4" /> Solved</div>
                ) : isCurrentlyActive ? (
                    <div className="px-3 py-1 bg-yellow-500/30 text-yellow-300 font-bold text-sm rounded-full flex items-center gap-2">ACTIVE</div>
                ) : (
                    <div className="px-3 py-1 bg-gray-500/30 text-gray-300 font-bold text-sm rounded-full flex items-center gap-2">LOCKED</div>
                )}
            </div>
            {isActive && (
                <>
                    <p 
                        className="text-gray-300 mt-2 text-lg typing-effect whitespace-pre-wrap"
                        style={{ '--char-count': clue.text.length } as React.CSSProperties}
                    >
                        {clue.text}
                    </p>
                    {clue.image_url && (
                        <div className="mt-4">
                            <img src={clue.image_url} alt={`Clue image`} className="max-w-sm rounded-md shadow-lg holographic-image" />
                        </div>
                    )}
                    {embedUrl && (
                        <div className="mt-4 aspect-video w-full max-w-md mx-auto">
                            <iframe
                                className="w-full h-full rounded-md shadow-lg holographic-image"
                                src={embedUrl}
                                title={`Clue Video ${clueNumber}`}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            ></iframe>
                        </div>
                    )}
                    <div className="mt-4 flex flex-wrap gap-4">
                        {clue.link_url && (
                            <GlowingButton
                                onClick={() => window.open(clue.link_url, '_blank', 'noopener,noreferrer')}
                                className="!py-2 !px-4 !text-sm !border-blue-400 group-hover:!bg-blue-400"
                            >
                                Reference Link
                            </GlowingButton>
                        )}
                        {clue.video_url && (
                            <GlowingButton
                                onClick={() => window.open(clue.video_url, '_blank', 'noopener,noreferrer')}
                                className="!py-2 !px-4 !text-sm !border-red-500 group-hover:!bg-red-500"
                            >
                                Watch Video
                            </GlowingButton>
                        )}
                    </div>
                </>
            )}
            
            {isCurrentlyActive && (
                <>
                    <div className="mt-4 flex flex-col sm:flex-row gap-2">
                        <input 
                            type="text" 
                            placeholder="Enter your answer..."
                            value={currentAnswer || ''}
                            onChange={(e) => onAnswerChange(clue.id, e.target.value)}
                            className={`flex-1 px-4 py-2 bg-transparent border-2 rounded-md focus:outline-none placeholder-gray-500 transition-all duration-300
                                ${status === 'incorrect' ? 'border-red-500 animate-shake' : ''}
                                ${status === 'correct' ? 'border-green-500 text-green-400' : ''}
                                ${status === 'idle' || status === 'loading' ? 'border-[#ff7b00]/50 focus:border-[#ff7b00]' : ''}
                            `}
                            disabled={status === 'loading' || status === 'correct' || isSkipping}
                        />
                        <GlowingButton 
                            onClick={() => onSubmitAnswer(clue.id)} 
                            loading={status === 'loading'}
                            disabled={status === 'correct' || !currentAnswer || isSkipping}
                        >
                            Submit
                        </GlowingButton>
                    </div>
                    <div className="mt-3 text-center">
                        <button 
                            onClick={() => onSkipClue(clue.id)}
                            disabled={status === 'loading' || status === 'correct' || isSkipping}
                            className="text-sm text-gray-400 hover:text-yellow-400 hover:underline transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Stuck? Skip this clue for 20 coins
                        </button>
                    </div>
                </>
            )}
            
            {!isSolved && !isActive && (
                <div className="mt-4 p-3 text-center bg-black/50 rounded-md border border-dashed border-gray-600">
                    <p className="font-orbitron text-gray-400">STATUS: LOCKED</p>
                    <p className="text-sm text-gray-500">Solve the previous clue to decrypt this transmission.</p>
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
                        <span>CORRECT! +{awardedCoins || 10} COINS</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Memoize the component to prevent re-renders and re-triggering the typing animation
export default React.memo(ClueCard);