/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Volume2, ArrowLeft, Star, Maximize, CheckCircle2, XCircle, Eye, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';

const ACTION_VOCAB = [
  { id: 'climb', word: 'climb', spanish: 'trepar', emoji: '🧗' },
  { id: 'dance', word: 'dance', spanish: 'bailar', emoji: '💃' },
  { id: 'sing', word: 'sing', spanish: 'cantar', emoji: '🎤' },
  { id: 'ride', word: 'ride a bike', spanish: 'montar en bici', emoji: '🚴' },
  { id: 'swim', word: 'swim', spanish: 'nadar', emoji: '🏊' },
  { id: 'draw', word: 'draw', spanish: 'dibujar', emoji: '🖍️' },
  { id: 'catch', word: 'catch', spanish: 'atrapar', emoji: '👐' },
  { id: 'throw', word: 'throw', spanish: 'lanzar', emoji: '⚾' },
];

const DIRECTION_VOCAB = [
  { id: 'up', word: 'up', spanish: 'arriba', emoji: '⬆️' },
  { id: 'down', word: 'down', spanish: 'abajo', emoji: '⬇️' },
  { id: 'left', word: 'left', spanish: 'izquierda', emoji: '⬅️' },
  { id: 'right', word: 'right', spanish: 'derecha', emoji: '➡️' },
];

const ALL_VOCAB = [...ACTION_VOCAB, ...DIRECTION_VOCAB];

// Dynamic Question Generators (100 questions each)
const generateVocabQuestions = () => Array.from({ length: 100 }, (_, i) => {
  const answer = ACTION_VOCAB[Math.floor(Math.random() * ACTION_VOCAB.length)];
  const optionsSet = new Set([answer.word]);
  while(optionsSet.size < 4) {
    optionsSet.add(ACTION_VOCAB[Math.floor(Math.random() * ACTION_VOCAB.length)].word);
  }
  return {
    id: i,
    emoji: answer.emoji,
    check: null as boolean | null,
    questionText: `Listen and select the word.`,
    audioText: answer.word,
    options: Array.from(optionsSet).sort(() => Math.random() - 0.5),
    correctOption: answer.word,
    spanishTranslation: answer.spanish
  };
});

const generateCanQuestions = () => Array.from({ length: 100 }, (_, i) => {
  const vocab = ACTION_VOCAB[Math.floor(Math.random() * ACTION_VOCAB.length)];
  const options = [`I can ${vocab.word}.`, `I can't ${vocab.word}.`, `Can you ${vocab.word}?`].sort(() => Math.random() - 0.5);
  return {
    id: i,
    emoji: vocab.emoji,
    check: true,
    questionText: `Select the affirmative.`,
    audioText: `I can ${vocab.word}.`,
    options,
    correctOption: `I can ${vocab.word}.`,
    spanishTranslation: `Yo puedo ${vocab.spanish}.`
  };
});

const generateCantQuestions = () => Array.from({ length: 100 }, (_, i) => {
  const vocab = ACTION_VOCAB[Math.floor(Math.random() * ACTION_VOCAB.length)];
  const options = [`I can ${vocab.word}.`, `I can't ${vocab.word}.`, `Can you ${vocab.word}?`].sort(() => Math.random() - 0.5);
  return {
    id: i,
    emoji: vocab.emoji,
    check: false,
    questionText: `Select the negative.`,
    audioText: `I can't ${vocab.word}.`,
    options,
    correctOption: `I can't ${vocab.word}.`,
    spanishTranslation: `Yo no puedo ${vocab.spanish}.`
  };
});

const generateCanYouQuestions = () => Array.from({ length: 100 }, (_, i) => {
  const vocab = ACTION_VOCAB[Math.floor(Math.random() * ACTION_VOCAB.length)];
  const answer = Math.random() > 0.5;
  return {
    id: i,
    emoji: vocab.emoji,
    check: null as boolean | null,
    questionText: `Can you ${vocab.word}?`,
    audioText: `Can you ${vocab.word}?`,
    options: ['Yes, I can.', 'No, I can\'t.'],
    correctOption: answer ? 'Yes, I can.' : 'No, I can\'t.',
    spanishTranslation: `¿Puedes tú ${vocab.spanish}?`
  };
});

const generateDirectionSequences = () => Array.from({ length: 100 }, (_, i) => {
  const isHorizontal = Math.random() > 0.5;
  const subset = isHorizontal ? [DIRECTION_VOCAB[2], DIRECTION_VOCAB[3]] : [DIRECTION_VOCAB[0], DIRECTION_VOCAB[1]];
  const seqItems = Array.from({ length: 3 }, () => subset[Math.floor(Math.random() * subset.length)]);
  const nextItem = subset[Math.floor(Math.random() * subset.length)];
  
  const optionsSet = new Set([nextItem.emoji]);
  while(optionsSet.size < 3) {
    optionsSet.add(DIRECTION_VOCAB[Math.floor(Math.random() * DIRECTION_VOCAB.length)].emoji);
  }
  
  return {
    id: i,
    seq: seqItems.map(x => x.emoji),
    next: nextItem.emoji,
    options: Array.from(optionsSet).sort(() => Math.random() - 0.5),
    audioText: seqItems.map(x => x.word).join(', ') + `, what's next?`,
    spanishTranslation: seqItems.map(x => x.spanish).join(', ') + `, ¿qué sigue?`
  };
});

const playSound = (type: 'correct' | 'incorrect') => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (type === 'correct') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(500, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } else {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    }
  } catch(e) {}
}

export default function App() {
  const [currentView, setCurrentView] = useState('home');
  const [stars, setStars] = useState(0);
  const [streak, setStreak] = useState(0);

  const handleCorrect = () => {
    const isStreakCombo = streak >= 2;
    setStars(s => s + (isStreakCombo ? 2 : 1));
    setStreak(s => s + 1);
  };

  const handleIncorrect = () => {
    setStreak(0);
  };

  const [vocabQuestions] = useState(generateVocabQuestions);
  const [canQuestions] = useState(generateCanQuestions);
  const [cantQuestions] = useState(generateCantQuestions);
  const [canyouQuestions] = useState(generateCanYouQuestions);
  const [dirQuestions] = useState(generateDirectionSequences);

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-GB';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const renderHeader = (title: string, showBack = true) => (
    <div className="w-full flex justify-between items-center p-4 bg-sky-500 text-white shadow-sm rounded-b-xl mb-4 shrink-0">
      <div className="flex items-center gap-4">
        {showBack && (
          <button onClick={() => setCurrentView('home')} className="p-2 bg-sky-600 rounded-full hover:bg-sky-700 transition">
            <ArrowLeft size={28} />
          </button>
        )}
        <h1 className="text-xl md:text-3xl font-extrabold tracking-wide">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        {showBack && (
           <button onClick={() => setCurrentView('words_lesson')} className="mr-2 px-4 py-2 bg-pink-500 rounded-full hover:bg-pink-600 transition font-bold shadow-md">
             Study Words
           </button>
        )}
        <AnimatePresence>
          {streak > 1 && (
            <motion.div 
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [1, 1.1, 1], opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ repeat: Infinity, duration: 0.8, repeatType: "reverse" }} 
              className="bg-orange-500 text-white px-3 py-1 md:px-4 md:py-2 rounded-full font-bold shadow-md flex items-center gap-1 border-2 border-orange-300"
            >
              <Flame size={20} className="fill-orange-200 text-orange-200" /> 
              <span className="hidden md:inline">Combo</span> {streak}x
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex items-center gap-2 bg-amber-400 px-4 py-2 rounded-full shadow-inner font-bold text-xl transition-all">
          <Star className="fill-white text-white w-6 h-6" /> {stars}
        </div>
        <button onClick={toggleFullScreen} className="p-2 bg-sky-600 rounded-full hover:bg-sky-700 transition">
          <Maximize size={24} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-sky-50 flex flex-col font-sans select-none overflow-x-hidden">
      {currentView === 'home' && (
        <div className="flex-1 flex flex-col">
          {renderHeader('Unit 6 Adventure', false)}
          <div className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-8 flex flex-col justify-center">
            
            <div className="mb-6 flex justify-between items-center bg-white p-6 rounded-3xl shadow-md border-2 border-sky-100">
               <div>
                  <h2 className="text-3xl font-bold text-sky-800 mb-2">Welcome to your adventure!</h2>
                  <p className="text-sky-600 text-lg">Pick a world to play and earn stars! 🌟</p>
               </div>
               <button onClick={() => setCurrentView('words_lesson')} className="px-6 py-4 bg-pink-500 text-white font-bold rounded-2xl shadow-lg hover:bg-pink-600 hover:scale-105 transition-all text-xl">
                 📖 Study Words First
               </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              
              <button onClick={() => setCurrentView('action_park')} className="p-8 rounded-3xl shadow-lg flex flex-col items-center gap-4 hover:scale-105 active:scale-95 transition bg-emerald-400 hover:bg-emerald-500">
                <span className="text-6xl mb-2 flex items-center justify-center w-24 h-24 bg-white/30 rounded-full shadow-inner">🏃‍♂️</span>
                <span className="text-2xl font-bold text-white tracking-wide">Action Park</span>
              </button>
              
              <button onClick={() => setCurrentView('i_can_castle')} className="p-8 rounded-3xl shadow-lg flex flex-col items-center gap-4 hover:scale-105 active:scale-95 transition bg-blue-400 hover:bg-blue-500">
                <span className="text-6xl mb-2 flex items-center justify-center w-24 h-24 bg-white/30 rounded-full shadow-inner">🏰</span>
                <span className="text-2xl font-bold text-white tracking-wide">I Can Castle</span>
              </button>
              
              <button onClick={() => setCurrentView('i_cant_cave')} className="p-8 rounded-3xl shadow-lg flex flex-col items-center gap-4 hover:scale-105 active:scale-95 transition bg-fuchsia-400 hover:bg-fuchsia-500">
                <span className="text-6xl mb-2 flex items-center justify-center w-24 h-24 bg-white/30 rounded-full shadow-inner">🦇</span>
                <span className="text-2xl font-bold text-white tracking-wide">I Can't Cave</span>
              </button>

              <button onClick={() => setCurrentView('question_forest')} className="p-8 rounded-3xl shadow-lg flex flex-col items-center gap-4 hover:scale-105 active:scale-95 transition bg-amber-400 hover:bg-amber-500">
                <span className="text-6xl mb-2 flex items-center justify-center w-24 h-24 bg-white/30 rounded-full shadow-inner">🌲</span>
                <span className="text-2xl font-bold text-white tracking-wide">Question Forest</span>
              </button>
              
              <button onClick={() => setCurrentView('robot_directions')} className="p-8 rounded-3xl shadow-lg flex flex-col items-center gap-4 hover:scale-105 active:scale-95 transition bg-indigo-400 hover:bg-indigo-500">
                <span className="text-6xl mb-2 flex items-center justify-center w-24 h-24 bg-white/30 rounded-full shadow-inner">🤖</span>
                <span className="text-2xl font-bold text-white tracking-wide">Robot Directions</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {currentView === 'words_lesson' && (
        <VocabularyView speak={speak} header={renderHeader('Words Lesson', true)} />
      )}

      {currentView === 'action_park' && (
        <QuizView 
          header={renderHeader('Action Park', true)} 
          speak={speak} 
          onCorrect={handleCorrect}
          onIncorrect={handleIncorrect}
          streak={streak}
          questions={vocabQuestions}
        />
      )}

      {currentView === 'i_can_castle' && (
        <QuizView 
          header={renderHeader('I Can Castle', true)} 
          speak={speak} 
          onCorrect={handleCorrect}
          onIncorrect={handleIncorrect}
          streak={streak}
          questions={canQuestions}
        />
      )}

      {currentView === 'i_cant_cave' && (
        <QuizView 
          header={renderHeader('I Can\'t Cave', true)} 
          speak={speak} 
          onCorrect={handleCorrect}
          onIncorrect={handleIncorrect}
          streak={streak}
          questions={cantQuestions}
        />
      )}

      {currentView === 'question_forest' && (
        <QuizView 
          header={renderHeader('Question Forest', true)} 
          speak={speak} 
          onCorrect={handleCorrect}
          onIncorrect={handleIncorrect}
          streak={streak}
          questions={canyouQuestions}
        />
      )}

      {currentView === 'robot_directions' && (
        <SequenceQuizView
          header={renderHeader('Robot Directions', true)} 
          speak={speak} 
          onCorrect={handleCorrect}
          onIncorrect={handleIncorrect}
          streak={streak}
          questions={dirQuestions}
        />
      )}
    </div>
  );
}

function VocabularyView({ speak, header }: any) {
  return (
    <div className="flex flex-col flex-1 pb-12">
      {header}
      <div className="w-full max-w-6xl mx-auto p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {ALL_VOCAB.map((item) => (
            <VocabCard key={item.id} item={item} speak={speak} />
          ))}
        </div>
      </div>
    </div>
  );
}

function VocabCard({ item, speak }: { item: any, speak: (s: string) => void }) {
  const [showSpanish, setShowSpanish] = useState(false);

  return (
    <div className="bg-white rounded-2xl p-4 shadow-md flex flex-col items-center justify-center gap-3 text-center border-4 border-transparent hover:border-sky-300 transition-all">
      <div className="text-6xl p-4 bg-sky-50 rounded-full w-24 h-24 flex items-center justify-center">{item.emoji}</div>
      <h3 className="text-xl font-bold text-sky-800 capitalize leading-tight">{item.word}</h3>
      <div className="flex flex-col w-full gap-2 mt-auto">
        <button 
          onClick={() => speak(item.word)} 
          className="bg-amber-400 py-2 rounded-xl text-white font-bold hover:bg-amber-500 shadow-sm flex justify-center items-center gap-2 active:scale-95 transition"
        >
          <Volume2 size={20} /> Listen
        </button>
        <button
          onClick={() => setShowSpanish(s => !s)} 
          className="bg-slate-100 py-2 rounded-xl text-slate-700 font-semibold hover:bg-slate-200 active:scale-95 transition text-sm flex justify-center items-center gap-2"
        >
          <Eye size={16} /> {showSpanish ? item.spanish : 'Show Spanish'}
        </button>
      </div>
    </div>
  );
}

function QuizView({ header, speak, onCorrect, onIncorrect, streak, questions }: any) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [showSpanish, setShowSpanish] = useState(false);

  const q = questions[currentIndex];

  useEffect(() => {
    if (q && !feedback) {
      speak(q.audioText);
    }
    setShowSpanish(false); // Reset spanish toggle on new question
  }, [currentIndex, q, speak, feedback]);

  if (!q) {
    return (
      <div className="flex flex-col flex-1">
        {header}
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="text-8xl mb-6">🎉</div>
          <h2 className="text-4xl font-bold text-sky-800 text-center mb-4">World Complete!</h2>
          <p className="text-sky-600 text-xl font-semibold">You finished all 100 exercises!</p>
        </div>
      </div>
    );
  }

  const handleSelect = (option: string) => {
    if (option === q.correctOption) {
      setFeedback('correct');
      playSound('correct');
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      const messages = ["Fantastic!", "Great job!", "Awesome!", "You did it!"];
      speak(messages[Math.floor(Math.random() * messages.length)]);
      onCorrect();
      setTimeout(() => {
        setFeedback(null);
        setCurrentIndex(i => i + 1);
      }, 2000);
    } else {
      setFeedback('incorrect');
      playSound('incorrect');
      onIncorrect();
      speak("Oops, try again!");
      setTimeout(() => {
        setFeedback(null);
      }, 1500);
    }
  };

  return (
    <div className="flex flex-col flex-1 relative">
      {header}
      <div className="flex-1 w-full max-w-4xl mx-auto p-4 flex flex-col items-center justify-center">
        
        <div className="bg-white rounded-3xl p-6 md:p-12 shadow-xl border border-sky-100 flex flex-col items-center w-full relative">
          
          <div className="w-full flex justify-between items-start mb-4">
             <div className="flex flex-col gap-2">
                 <button onClick={() => setShowSpanish(s => !s)} className="flex items-center gap-2 bg-slate-100 text-slate-600 px-4 py-2 rounded-full font-semibold hover:bg-slate-200 transition">
                    <Eye size={18} /> {showSpanish ? 'Hide' : 'Show in Spanish'}
                 </button>
             </div>
             
             <button onClick={() => speak(q.audioText)} className="bg-amber-400 p-3 md:p-4 rounded-full text-white hover:bg-amber-500 hover:scale-105 active:scale-95 transition shadow-md">
               <Volume2 size={32} />
             </button>
          </div>

          <div className="relative mb-6">
            <div className="text-[100px] md:text-[140px] bg-sky-50 p-6 rounded-[40px] shadow-inner leading-none w-48 h-48 md:w-56 md:h-56 flex items-center justify-center">{q.emoji}</div>
            {q.check !== null && (
              <div className={`absolute -bottom-4 -right-4 p-3 rounded-full text-white shadow-xl border-4 border-white ${q.check ? 'bg-emerald-500' : 'bg-red-500'}`}>
                {q.check ? <CheckCircle2 size={40} /> : <XCircle size={40} />}
              </div>
            )}
          </div>
          
          <div className="text-center mb-8 min-h-[80px]">
             <h2 className="text-2xl md:text-3xl font-bold text-sky-800">{q.questionText}</h2>
             {showSpanish && (
               <p className="text-xl md:text-2xl font-bold text-pink-500 mt-2 bg-pink-50 px-4 py-2 rounded-xl inline-block">{q.spanishTranslation}</p>
             )}
          </div>
          
          <div className="w-full flex flex-col sm:flex-row flex-wrap justify-center gap-4">
            {q.options.map((opt: string, idx: number) => (
              <button 
                key={idx}
                onClick={() => handleSelect(opt)}
                disabled={feedback !== null}
                className="flex-[1_1_40%] min-w-[150px] bg-sky-500 text-white text-xl md:text-2xl font-bold py-5 px-4 rounded-2xl shadow-md hover:bg-sky-600 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

      </div>

      <AnimatePresence>
        {feedback && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-sm"
          >
            {feedback === 'correct' ? (
              <motion.div 
                initial={{ scale: 0.5, rotate: -15 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', bounce: 0.6, duration: 0.8 }}
                className="p-8 md:p-12 rounded-[40px] shadow-2xl flex flex-col items-center justify-center gap-4 bg-emerald-500 text-white relative overflow-hidden"
              >
                 <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.5 }}><CheckCircle2 size={100} /></motion.div>
                 <span className="text-4xl font-extrabold tracking-wide text-center">Great!</span>
                 {streak >= 2 && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3 }} className="text-emerald-100 font-bold text-2xl">+2 Stars Combo!</motion.span>}
              </motion.div>
            ) : (
              <motion.div 
                initial={{ x: -20 }}
                animate={{ x: [0, -20, 20, -20, 20, 0] }}
                transition={{ duration: 0.4 }}
                className="p-8 md:p-12 rounded-[40px] shadow-2xl flex flex-col items-center justify-center gap-4 bg-red-500 text-white"
              >
                 <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.4 }}><XCircle size={100} /></motion.div>
                 <span className="text-4xl font-extrabold tracking-wide text-center">Oops!</span>
                 <span className="text-xl text-red-100 font-bold text-center">Try again</span>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SequenceQuizView({ header, speak, onCorrect, onIncorrect, streak, questions }: any) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [showSpanish, setShowSpanish] = useState(false);

  const q = questions[currentIndex];

  useEffect(() => {
    if (q && !feedback) {
      speak(q.audioText);
    }
    setShowSpanish(false);
  }, [currentIndex, q, speak, feedback]);

  if (!q) {
    return (
      <div className="flex flex-col flex-1">
        {header}
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="text-8xl mb-6">🤖</div>
          <h2 className="text-3xl font-bold text-indigo-800 text-center">Robot says: Well done!</h2>
        </div>
      </div>
    );
  }

  const handleSelect = (option: string) => {
    if (option === q.next) {
      setFeedback('correct');
      playSound('correct');
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      const messages = ["Correct!", "Robot says YES!", "Perfect!"];
      speak(messages[Math.floor(Math.random() * messages.length)]);
      onCorrect();
      setTimeout(() => {
        setFeedback(null);
        setCurrentIndex(i => i + 1);
      }, 2000);
    } else {
      setFeedback('incorrect');
      playSound('incorrect');
      onIncorrect();
      speak("Robot says try again!");
      setTimeout(() => {
        setFeedback(null);
      }, 1500);
    }
  };

  return (
    <div className="flex flex-col flex-1 relative">
      {header}
      <div className="flex-1 w-full max-w-4xl mx-auto p-4 flex flex-col items-center justify-center">
        
        <div className="bg-white rounded-3xl p-6 md:p-12 shadow-xl border border-indigo-100 w-full flex flex-col items-center">
          
          <div className="w-full flex justify-between items-start mb-4">
             <button onClick={() => setShowSpanish(s => !s)} className="flex items-center gap-2 bg-slate-100 text-slate-600 px-4 py-2 rounded-full font-semibold hover:bg-slate-200 transition">
                <Eye size={18} /> {showSpanish ? 'Hide' : 'Show in Spanish'}
             </button>
             
             <button onClick={() => speak(q.audioText)} className="bg-amber-400 p-3 md:p-4 rounded-full text-white hover:bg-amber-500 hover:scale-105 active:scale-95 transition shadow-md">
               <Volume2 size={32} />
             </button>
          </div>

          <div className="text-center mb-8 min-h-[80px]">
             <h2 className="text-2xl md:text-3xl font-bold text-indigo-800 flex items-center justify-center gap-3">
                 <span>🤖</span> What comes next?
             </h2>
             {showSpanish && (
               <p className="text-xl md:text-2xl font-bold text-pink-500 mt-2 bg-pink-50 px-4 py-2 rounded-xl inline-block">{q.spanishTranslation}</p>
             )}
          </div>
          
          <div className="flex gap-4 md:gap-6 items-center flex-wrap justify-center mb-10 bg-indigo-50 p-6 md:p-8 rounded-[40px] shadow-inner">
            {q.seq.map((emoji: string, idx: number) => (
              <div key={idx} className="text-5xl md:text-7xl w-16 h-16 md:w-24 md:h-24 flex items-center justify-center bg-white rounded-2xl shadow-sm">
                {emoji}
              </div>
            ))}
            <div className="text-4xl md:text-6xl text-indigo-300 font-bold ml-2 w-16 h-16 md:w-24 md:h-24 flex items-center justify-center bg-indigo-100 rounded-2xl border-4 border-dashed border-indigo-200">
              ?
            </div>
          </div>

          <div className="flex gap-4 w-full justify-center">
             {q.options.map((opt: string, idx: number) => (
               <button 
                 key={idx}
                 onClick={() => handleSelect(opt)}
                 disabled={feedback !== null}
                 className="flex-1 max-w-[120px] md:max-w-[150px] aspect-square text-5xl md:text-7xl bg-indigo-500 text-white rounded-3xl shadow-lg hover:bg-indigo-600 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center justify-center"
               >
                 {opt}
               </button>
             ))}
          </div>

        </div>
      </div>

      <AnimatePresence>
        {feedback && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-sm"
          >
            {feedback === 'correct' ? (
              <motion.div 
                initial={{ scale: 0.5, rotate: 15 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', bounce: 0.6, duration: 0.8 }}
                className="p-8 md:p-12 rounded-[40px] shadow-2xl flex flex-col items-center justify-center gap-4 bg-emerald-500 text-white relative overflow-hidden"
              >
                 <motion.div animate={{ rotate: -360 }} transition={{ duration: 0.5 }}><CheckCircle2 size={100} /></motion.div>
                 <span className="text-4xl font-extrabold tracking-wide text-center">Correct!</span>
                 {streak >= 2 && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3 }} className="text-emerald-100 font-bold text-2xl">+2 Stars Combo!</motion.span>}
              </motion.div>
            ) : (
              <motion.div 
                initial={{ x: 20 }}
                animate={{ x: [0, 20, -20, 20, -20, 0] }}
                transition={{ duration: 0.4 }}
                className="p-8 md:p-12 rounded-[40px] shadow-2xl flex flex-col items-center justify-center gap-4 bg-red-500 text-white"
              >
                 <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.4 }}><XCircle size={100} /></motion.div>
                 <span className="text-4xl font-extrabold tracking-wide text-center">Oops!</span>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

