
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlowingButton from './GlowingButton';
import { Clue } from '../types';

const CheckIcon: React.FC<{className?:string}> = ({className}) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>;

interface ClueCardProps {
    clue: Clue;
    isSolved: boolean;
    status: 'idle' | 'loading' | 'correct' | 'incorrect';
    currentAnswer: string;
    awardedCoins: number | undefined;
    onAnswerChange: (clueId: number, value: string) => void;
    onSubmitAnswer: (clueId: number) => void;
}

const ClueCard: React.FC<ClueCardProps> = ({ clue, isSolved, status, currentAnswer, awardedCoins, onAnswerChange, onSubmitAnswer }) => {
    return (
        <div className={`p-4 rounded-lg bg-black/40 border-2 transition-colors duration-500 ${isSolved ? 'border-green-500/70' : 'border-white/20'}`}>
            <div className="flex justify-between items-start">
                <p className="font-semibold text-xl">Clue #{clue.id}</p>
                {isSolved && <div className="px-3 py-1 bg-green-500/30 text-green-300 font-bold text-sm rounded-full flex items-center gap-2"><CheckIcon className="w-4 h-4" /> Solved</div>}
            </div>
            {/* NEW: Added typing effect class and style for char count */}
            <p 
                className="text-gray-300 mt-2 text-lg typing-effect"
                style={{ '--char-count': clue.text.length } as React.CSSProperties}
            >
                {clue.text}
            </p>
            {clue.image_url && (
                <div className="mt-4">
                    <img src={clue.image_url} alt={`Clue ${clue.id} image`} className="max-w-sm rounded-md shadow-lg holographic-image" />
                </div>
            )}
            {!isSolved && (
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
                        disabled={status === 'loading' || status === 'correct'}
                    />
                    <GlowingButton 
                        onClick={() => onSubmitAnswer(clue.id)} 
                        loading={status === 'loading'}
                        disabled={status === 'correct' || !currentAnswer}
                    >
                        Submit
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
                        <span>CORRECT! +{awardedCoins || 10} COINS</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Memoize the component to prevent re-renders and re-triggering the typing animation
export default React.memo(ClueCard);