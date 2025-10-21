import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="relative w-full max-w-2xl bg-black border-2 border-[#00eaff] rounded-lg p-6 space-y-4 shadow-2xl shadow-[#00eaff]/20"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-3xl font-orbitron text-glow-blue text-center">Game Rules & Scoring</h2>
            
            <div className="space-y-4 text-gray-300 font-rajdhani text-lg max-h-[70vh] overflow-y-auto pr-4">
              <div>
                <h3 className="font-orbitron text-xl text-[#ff7b00] font-bold">Objective</h3>
                <p>Solve a series of cryptic clues within your assigned domain to earn coins and climb the leaderboard. The top four participants on the leaderboard will receive a surprise useful for the next solveathon!</p>
              </div>

              <div>
                <h3 className="font-orbitron text-xl text-[#ff7b00] font-bold">Domains</h3>
                <p>Each team is assigned to one of four domains: <span className="font-semibold text-white">HealthCare, Banking, Food,</span> or <span className="font-semibold text-white">Airlines</span>. You will only receive clues relevant to your domain.</p>
              </div>

              <div>
                <h3 className="font-orbitron text-xl text-[#ff7b00] font-bold">Clue Progression</h3>
                <p>Clues are presented one by one. You must solve the current active clue to decrypt and unlock the next one in the sequence.</p>
              </div>
              
              <div>
                <h3 className="font-orbitron text-xl text-[#ff7b00] font-bold">The Chronos Coin System</h3>
                <p>Your score is based on how quickly you solve each clue from the moment it becomes active. The faster you submit the correct answer, the more coins you earn.</p>
                <ul className="list-disc list-inside mt-2 space-y-1 pl-4">
                    <li>Solve within <strong>5 minutes</strong>: <span className="font-bold text-yellow-300">30 Coins</span></li>
                    <li>Solve within <strong>10 minutes</strong>: <span className="font-bold text-yellow-300">20 Coins</span></li>
                    <li>Solve after <strong>10 minutes</strong>: <span className="font-bold text-yellow-300">10 Coins</span></li>
                </ul>
              </div>

              <div>
                <h3 className="font-orbitron text-xl text-[#ff7b00] font-bold">Leaderboard Ranking</h3>
                <p>Teams are ranked based on the following criteria, in order:</p>
                <ol className="list-decimal list-inside mt-2 space-y-1 pl-4">
                    <li>Highest coin total.</li>
                    <li>Most clues solved (Primary Tie-breaker).</li>
                    <li>Time of the last correct submission (Earliest wins, Secondary Tie-breaker).</li>
                </ol>
              </div>

              <div>
                <h3 className="font-orbitron text-xl text-[#ff7b00] font-bold">Fair Play</h3>
                <p>Any form of malpractice, sharing answers, or attempting to exploit the system will result in immediate disqualification. May the sharpest minds prevail!</p>
              </div>

              <div className="pt-4 text-center">
                <p className="font-orbitron text-2xl text-glow-blue tracking-widest">Imagine. Implement. Impact</p>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-600 rounded-md font-bold hover:bg-gray-500 transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RulesModal;