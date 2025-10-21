
import React, { useState, useEffect, useRef } from 'react';
import { BACKGROUND_MUSIC } from '../assets/audio';

const SoundOnIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
    </svg>
);

const SoundOffIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2 2m2-2l2 2" />
    </svg>
);


const BackgroundMusicPlayer: React.FC = () => {
    const [isMuted, setIsMuted] = useState(() => {
        const savedMuteState = localStorage.getItem('isMuted');
        return savedMuteState ? JSON.parse(savedMuteState) : true;
    });
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        localStorage.setItem('isMuted', JSON.stringify(isMuted));
        if (audioRef.current) {
            audioRef.current.muted = isMuted;
            if (!isMuted) {
                audioRef.current.play().catch(error => {
                    // Autoplay was prevented, which is common.
                    // The user will need to interact to start the music.
                    console.log("Audio autoplay prevented:", error);
                });
            }
        }
    }, [isMuted]);

    const toggleMute = () => {
        setIsMuted(!isMuted);
    };
    
    // This effect ensures audio is loaded and ready
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = 0.3; // Set a pleasant volume
            audioRef.current.play().catch(() => {});
        }
    }, []);

    return (
        <>
            <audio ref={audioRef} src={BACKGROUND_MUSIC} loop autoPlay muted={isMuted} />
            <button
                onClick={toggleMute}
                className="fixed bottom-5 right-5 z-50 p-2 bg-black/50 border border-white/20 rounded-full text-white/70 hover:text-white hover:bg-white/20 transition-all duration-300"
                aria-label={isMuted ? 'Unmute background music' : 'Mute background music'}
            >
                {isMuted ? <SoundOffIcon className="w-5 h-5" /> : <SoundOnIcon className="w-5 h-5" />}
            </button>
        </>
    );
};

export default BackgroundMusicPlayer;
