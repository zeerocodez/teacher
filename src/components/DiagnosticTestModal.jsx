import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Award, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  ArrowLeft, 
  RotateCcw, 
  GraduationCap, 
  BookOpen, 
  BrainCircuit, 
  HelpCircle,
  FileCheck
} from 'lucide-react';

const TRACKS = {
  primary: {
    title: 'Primary & Common Entrance Diagnostic',
    subtitle: 'Assessing foundational literacy, numeracy, and problem-solving skills (Ages 6–11)',
    questions: [
      {
        id: 1,
        question: "What is the product of 14 and 6?",
        options: ["74", "84", "94", "64"],
        correct: 1,
        subject: "Mental Mathematics",
        concept: "Multiplication Fluency"
      },
      {
        id: 2,
        question: "Choose the word with the correct spelling and phonics rule for the /aɪ/ sound:",
        options: ["Nite", "Night", "Nyte", "Niteg"],
        correct: 1,
        subject: "English Phonics",
        concept: "Vowel Digraphs (igh)"
      },
      {
        id: 3,
        question: "A train leaves Lagos at 2:15 PM and arrives in Ibadan at 4:45 PM. How long was the journey?",
        options: ["2 hours 15 mins", "2 hours 30 mins", "3 hours", "1 hour 45 mins"],
        correct: 1,
        subject: "Word Problems",
        concept: "Elapsed Time"
      },
      {
        id: 4,
        question: "Which of the following is an antonym for 'GENEROUS'?",
        options: ["Kind", "Selfish", "Wealthy", "Cheerful"],
        correct: 1,
        subject: "Verbal Reasoning",
        concept: "Vocabulary & Antonyms"
      },
      {
        id: 5,
        question: "Simplify the fraction: 18 / 24 to its lowest terms:",
        options: ["2/3", "3/4", "4/5", "3/5"],
        correct: 1,
        subject: "Fractions & Decimals",
        concept: "Simplification"
      }
    ]
  },
  checkpoint: {
    title: 'Junior Secondary (JSS / Cambridge Checkpoint)',
    subtitle: 'Assessing pre-algebra, scientific inquiry, and reading comprehension (Ages 11–14)',
    questions: [
      {
        id: 1,
        question: "Solve for x in the equation: 3x - 7 = 14",
        options: ["x = 5", "x = 7", "x = 9", "x = 21"],
        correct: 1,
        subject: "Algebra",
        concept: "Linear Equations"
      },
      {
        id: 2,
        question: "Which cellular organelle is responsible for generating chemical energy (ATP)?",
        options: ["Ribosome", "Mitochondria", "Nucleus", "Vacuole"],
        correct: 1,
        subject: "Basic Science",
        concept: "Cellular Biology"
      },
      {
        id: 3,
        question: "Identify the part of speech of 'METICULOUSLY' in: 'She checked her notes meticulously.'",
        options: ["Adjective", "Adverb", "Conjunction", "Preposition"],
        correct: 1,
        subject: "English Syntax",
        concept: "Grammar & Adverbs"
      },
      {
        id: 4,
        question: "What is the median of this data set: [4, 9, 2, 7, 11, 8, 3]?",
        options: ["6", "7", "8", "9"],
        correct: 1,
        subject: "Statistics",
        concept: "Measures of Central Tendency"
      },
      {
        id: 5,
        question: "Which gas makes up approximately 78% of the Earth's atmosphere?",
        options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Argon"],
        correct: 1,
        subject: "Physical Science",
        concept: "Atmospheric Chemistry"
      }
    ]
  },
  senior: {
    title: 'Senior Secondary (WAEC / JAMB / Cambridge IGCSE)',
    subtitle: 'Assessing advanced algebra, analytical reading, and senior STEM concepts (Ages 14–18)',
    questions: [
      {
        id: 1,
        question: "What are the roots of the quadratic equation: x² - 5x + 6 = 0?",
        options: ["x = -2, -3", "x = 2, 3", "x = 1, 6", "x = -1, 6"],
        correct: 1,
        subject: "Pure Mathematics",
        concept: "Quadratic Factorization"
      },
      {
        id: 2,
        question: "A car accelerates uniformly from rest to 20 m/s in 4 seconds. What is its acceleration?",
        options: ["2.5 m/s²", "5.0 m/s²", "10 m/s²", "80 m/s²"],
        correct: 1,
        subject: "Physics",
        concept: "Linear Kinematics"
      },
      {
        id: 3,
        question: "Identify the figure of speech in: 'The wind whispered secrets through the trees.'",
        options: ["Hyperbole", "Personification", "Oxymoron", "Simile"],
        correct: 1,
        subject: "Literature-in-English",
        concept: "Literary Devices"
      },
      {
        id: 4,
        question: "What is the oxidation number of sulfur in sulfuric acid (H₂SO₄)?",
        options: ["+4", "+6", "+2", "-2"],
        correct: 1,
        subject: "Chemistry",
        concept: "Redox & Oxidation States"
      },
      {
        id: 5,
        question: "Evaluate log₁₀(1000):",
        options: ["2", "3", "10", "100"],
        correct: 1,
        subject: "Further Mathematics",
        concept: "Logarithms"
      }
    ]
  }
};

export default function DiagnosticTestModal({ isOpen, onClose, onMatchTutor }) {
  const [selectedTrack, setSelectedTrack] = useState('primary');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isFinished, setIsFinished] = useState(false);
  const [learnerName, setLearnerName] = useState('');

  if (!isOpen) return null;

  const trackData = TRACKS[selectedTrack];
  const questions = trackData.questions;
  const currentQ = questions[currentIdx];

  const handleSelectAnswer = (optionIdx) => {
    setAnswers(prev => ({
      ...prev,
      [currentQ.id]: optionIdx
    }));
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
    } else {
      setIsFinished(true);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(prev => prev - 1);
    }
  };

  const handleReset = () => {
    setAnswers({});
    setCurrentIdx(0);
    setIsFinished(false);
  };

  // Score Calculation
  let correctCount = 0;
  const gaps = [];
  const strengths = [];

  questions.forEach(q => {
    const chosen = answers[q.id];
    if (chosen === q.correct) {
      correctCount++;
      strengths.push(`${q.subject} (${q.concept})`);
    } else if (chosen !== undefined) {
      gaps.push(`${q.subject} (${q.concept})`);
    }
  });

  const scorePct = Math.round((correctCount / questions.length) * 100);
  const performanceTier = scorePct >= 80 ? 'Mastery Tier' : (scorePct >= 60 ? 'Proficient' : 'Needs Targeted Support');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-brand-charcoal/70 backdrop-blur-xs" onClick={onClose} />

      <div className="relative bg-brand-cream border border-brand-moss/10 rounded-[2.5rem] w-full max-w-2xl p-6 sm:p-8 shadow-2xl z-10 font-sans text-brand-charcoal animate-fade-up max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-brand-moss/10 text-brand-charcoal transition-colors z-20 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {!isFinished ? (
          <div>
            {/* Header */}
            <div className="text-center mb-6">
              <span className="font-mono text-2xs uppercase tracking-widest text-brand-clay font-bold flex items-center justify-center gap-1.5 mb-1">
                <Sparkles className="w-3.5 h-3.5" /> EduVista Cognitive Diagnostic Test
              </span>
              <h3 className="font-heading font-extrabold text-2xl text-brand-moss">
                Assess Your Child's Academic Level
              </h3>
              <p className="text-xs text-brand-charcoal/65 mt-1 max-w-md mx-auto">
                Take a quick 5-question baseline assessment to identify hidden curriculum gaps and receive customized private tutor matching.
              </p>
            </div>

            {/* Track Selector Tabs */}
            <div className="p-1 bg-brand-moss/5 border border-brand-moss/10 rounded-2xl grid grid-cols-3 gap-1 mb-6 text-center text-xs">
              {[
                { id: 'primary', label: 'Primary (Common Ent)' },
                { id: 'checkpoint', label: 'Junior (Checkpoint)' },
                { id: 'senior', label: 'Senior (WAEC/IGCSE)' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => {
                    setSelectedTrack(t.id);
                    handleReset();
                  }}
                  className={`py-2 px-2.5 rounded-xl font-heading font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer ${
                    selectedTrack === t.id
                      ? 'bg-brand-moss text-white shadow-xs'
                      : 'text-brand-moss/70 hover:bg-brand-moss/5'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Progress Bar */}
            <div className="mb-6 space-y-1.5">
              <div className="flex justify-between items-center text-2xs font-mono text-brand-charcoal/60">
                <span>QUESTION {currentIdx + 1} OF {questions.length}</span>
                <span className="font-bold text-brand-moss">{Math.round(((currentIdx + 1) / questions.length) * 100)}% COMPLETE</span>
              </div>
              <div className="w-full bg-brand-moss/10 rounded-full h-1.5">
                <div 
                  className="bg-brand-clay h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Current Question Card */}
            <div className="bg-white border border-brand-moss/10 rounded-3xl p-6 shadow-sm mb-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] uppercase px-2.5 py-0.5 rounded-full bg-brand-moss/5 text-brand-moss font-bold border border-brand-moss/10">
                  {currentQ.subject}
                </span>
                <span className="font-mono text-[9px] text-brand-charcoal/50">
                  Concept: {currentQ.concept}
                </span>
              </div>

              <h4 className="font-heading font-bold text-base sm:text-lg text-brand-moss leading-snug">
                {currentQ.question}
              </h4>

              {/* Options */}
              <div className="space-y-2.5 pt-2">
                {currentQ.options.map((opt, optIdx) => {
                  const isSelected = answers[currentQ.id] === optIdx;
                  return (
                    <button
                      key={optIdx}
                      onClick={() => handleSelectAnswer(optIdx)}
                      className={`w-full py-3 px-4 rounded-xl border text-left font-sans text-xs transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'border-brand-clay bg-brand-clay/10 text-brand-moss font-bold ring-1 ring-brand-clay'
                          : 'border-brand-moss/10 hover:border-brand-moss/30 bg-brand-cream/10'
                      }`}
                    >
                      <span>{opt}</span>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        isSelected ? 'border-brand-clay bg-brand-clay text-white' : 'border-brand-moss/20'
                      }`}>
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between">
              <button
                disabled={currentIdx === 0}
                onClick={handlePrev}
                className="py-2.5 px-4 rounded-xl border border-brand-moss/20 text-brand-moss font-heading font-bold text-xs uppercase tracking-wider disabled:opacity-30 cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>

              <button
                disabled={answers[currentQ.id] === undefined}
                onClick={handleNext}
                className="btn-magnetic py-2.5 px-6 rounded-xl bg-brand-clay hover:bg-brand-clay/90 text-white font-heading font-bold text-xs uppercase tracking-wider disabled:opacity-40 cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                {currentIdx === questions.length - 1 ? 'Generate Scorecard' : 'Next Question'}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          /* RESULT / DIAGNOSTIC SCORECARD SCREEN */
          <div className="space-y-6 text-center animate-fade-up">
            <div className="w-16 h-16 rounded-3xl bg-brand-moss/10 text-brand-moss flex items-center justify-center mx-auto mb-2 border border-brand-moss/15 shadow-xs">
              <BrainCircuit className="w-8 h-8 text-brand-clay" />
            </div>

            <div>
              <span className="font-mono text-2xs uppercase tracking-widest text-brand-clay font-bold block mb-1">
                COGNITIVE DIAGNOSTIC RESULTS
              </span>
              <h3 className="font-heading font-extrabold text-2xl text-brand-moss">
                Diagnostic Scorecard: {scorePct}%
              </h3>
              <span className={`inline-block font-mono text-[10px] uppercase tracking-wider font-bold py-1 px-3 rounded-full mt-2 border ${
                scorePct >= 80 ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : (scorePct >= 60 ? 'bg-amber-50 border-amber-300 text-amber-800' : 'bg-rose-50 border-rose-300 text-rose-800')
              }`}>
                {performanceTier}
              </span>
            </div>

            {/* Strengths and Gaps Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left font-sans text-xs">
              <div className="bg-white border border-brand-moss/10 rounded-2xl p-4 space-y-2">
                <span className="font-heading font-bold text-emerald-800 text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Verified Strengths
                </span>
                {strengths.length > 0 ? (
                  <ul className="space-y-1 text-2xs text-brand-charcoal/70 list-disc list-inside">
                    {strengths.map((s, idx) => (
                      <li key={idx} className="truncate">{s}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-2xs text-brand-charcoal/50 italic">No concepts mastered yet. Intensive foundational guidance recommended.</p>
                )}
              </div>

              <div className="bg-white border border-brand-moss/10 rounded-2xl p-4 space-y-2">
                <span className="font-heading font-bold text-amber-800 text-xs flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" /> Focus Learning Gaps
                </span>
                {gaps.length > 0 ? (
                  <ul className="space-y-1 text-2xs text-brand-charcoal/70 list-disc list-inside">
                    {gaps.map((g, idx) => (
                      <li key={idx} className="truncate">{g}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-2xs text-brand-charcoal/50 italic">Zero critical gaps detected! Ready for accelerated competition prep.</p>
                )}
              </div>
            </div>

            {/* Tailored Tutor Recommendation Callout */}
            <div className="bg-emerald-50/90 border border-emerald-300 rounded-2xl p-4 text-left font-sans space-y-1.5">
              <span className="font-heading font-bold text-xs uppercase tracking-wider text-emerald-900 block">
                Recommended Learning Plan:
              </span>
              <p className="text-[11px] text-emerald-950/80 leading-relaxed">
                Based on this assessment, we recommend a <b>Standard Retainer Plan (3 sessions/week)</b> targeting your child's identified gap areas with a verified <b>{selectedTrack === 'primary' ? 'Primary Phonics & Common Entrance' : (selectedTrack === 'checkpoint' ? 'Cambridge Checkpoint Specialist' : 'WAEC / IGCSE Master Tutor')}</b>.
              </p>
            </div>

            {/* CTAs */}
            <div className="space-y-3 pt-2">
              <button
                onClick={() => {
                  onClose();
                  if (onMatchTutor) onMatchTutor(selectedTrack);
                }}
                className="btn-magnetic w-full py-3.5 bg-brand-clay hover:bg-brand-clay/90 text-white rounded-full font-heading font-bold text-xs uppercase tracking-wider shadow-md shadow-brand-clay/20 cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                <span>Connect with a Vetted Specialist Tutor</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={handleReset}
                className="w-full py-2.5 rounded-full text-brand-moss hover:bg-brand-moss/5 font-sans text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Retake Diagnostic Assessment
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
