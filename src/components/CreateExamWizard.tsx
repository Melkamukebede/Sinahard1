import React, { useState, useRef } from 'react';
import {
  FileText,
  HelpCircle,
  Settings,
  CheckCircle2,
  Plus,
  Trash2,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Sparkles,
  FileCode,
  Save,
  Calculator,
  BookOpen,
  Code2,
  Upload,
  Clock,
  Award,
  Target,
  FileUp,
  Check,
  Edit3,
  ClipboardPaste,
  FileCheck2,
} from 'lucide-react';
import { Exam, Question, SubjectType, DifficultyLevel } from '../types';
import { MathRenderer } from './MathRenderer';

interface CreateExamWizardProps {
  initialExam?: Exam | null;
  onSaveExam: (exam: Exam) => void;
  onCancel: () => void;
  onOpenPasteModal: () => void;
  onOpenProfessorModal: () => void;
}

export const CreateExamWizard: React.FC<CreateExamWizardProps> = ({
  initialExam,
  onSaveExam,
  onCancel,
  onOpenPasteModal,
  onOpenProfessorModal,
}) => {
  // If editing an existing exam, start in manual wizard; otherwise prompt selection mode
  const [creationMode, setCreationMode] = useState<'select' | 'manual' | 'paste'>(
    initialExam ? 'manual' : 'select'
  );
  const [currentStep, setCurrentStep] = useState<number>(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [name, setName] = useState(initialExam?.name || '');
  const [subject, setSubject] = useState(initialExam?.subject || '');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(initialExam?.difficulty || 'Medium');
  const [timeLimit, setTimeLimit] = useState<number>(initialExam?.timeLimit || 25);
  const [passingScore, setPassingScore] = useState<number>(initialExam?.passingScore || 70);
  const [subjectType, setSubjectType] = useState<SubjectType>(initialExam?.subjectType || 'theory');
  const [description, setDescription] = useState(initialExam?.description || '');

  const [questions, setQuestions] = useState<Question[]>(() => {
    if (initialExam?.questions && initialExam.questions.length > 0) {
      return JSON.parse(JSON.stringify(initialExam.questions));
    }
    return [
      {
        id: 'q_' + Date.now(),
        text: '',
        options: ['', '', '', ''],
        correct: 0,
        explanation: '',
      },
    ];
  });

  const [expandedIndex, setExpandedIndex] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Paste Text view internal state
  const [pasteRawText, setPasteRawText] = useState('');

  // Handle .txt / .json file import
  const handleTriggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      const parsed = parseTextQuestions(content);
      if (parsed.length > 0) {
        // If current questions only have 1 blank item, replace it
        if (questions.length === 1 && !questions[0].text.trim()) {
          setQuestions(parsed);
        } else {
          setQuestions([...questions, ...parsed]);
        }
        setExpandedIndex(questions.length > 1 ? questions.length : 0);
        setSuccessMsg(`Imported ${parsed.length} questions from ${file.name}`);
        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        setErrorMsg('Could not parse questions. Ensure questions follow standard format (e.g. 1. Question, A) Option).');
      }
    };
    reader.readAsText(file);
    // Reset file input value
    e.target.value = '';
  };

  const handleApplyPastedText = () => {
    if (!pasteRawText.trim()) {
      setErrorMsg('Please paste your questions or text first.');
      return;
    }
    const parsed = parseTextQuestions(pasteRawText);
    if (parsed.length === 0) {
      setErrorMsg('No questions recognized. Please verify the format (e.g. 1. Question, A) Option).');
      return;
    }

    // Populate questions and transition smoothly to wizard Step 1 so user can name exam
    if (questions.length === 1 && !questions[0].text.trim()) {
      setQuestions(parsed);
    } else {
      setQuestions([...questions, ...parsed]);
    }
    setCreationMode('manual');
    setCurrentStep(1);
    setSuccessMsg(`Loaded ${parsed.length} questions! Review exam title and details to proceed.`);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleAddQuestion = () => {
    const newQ: Question = {
      id: 'q_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      text: '',
      options: ['', '', '', ''],
      correct: 0,
      explanation: '',
    };
    setQuestions([...questions, newQ]);
    setExpandedIndex(questions.length);
  };

  const handleRemoveQuestion = (idx: number) => {
    if (questions.length <= 1) return;
    const updated = questions.filter((_, i) => i !== idx);
    setQuestions(updated);
    if (expandedIndex >= updated.length) {
      setExpandedIndex(updated.length - 1);
    }
  };

  const updateQuestionText = (idx: number, text: string) => {
    const updated = [...questions];
    updated[idx].text = text;
    setQuestions(updated);
  };

  const updateOptionText = (qIdx: number, optIdx: number, text: string) => {
    const updated = [...questions];
    updated[qIdx].options[optIdx] = text;
    setQuestions(updated);
  };

  const updateCorrectOption = (qIdx: number, optIdx: number) => {
    const updated = [...questions];
    updated[qIdx].correct = optIdx;
    setQuestions(updated);
  };

  const updateExplanation = (idx: number, text: string) => {
    const updated = [...questions];
    updated[idx].explanation = text;
    setQuestions(updated);
  };

  const insertMathSnippet = (qIdx: number, snippet: string, target: 'text' | 'explanation') => {
    const updated = [...questions];
    if (target === 'text') {
      updated[qIdx].text += snippet;
    } else {
      updated[qIdx].explanation = (updated[qIdx].explanation || '') + snippet;
    }
    setQuestions(updated);
  };

  const validateStep1 = () => {
    if (!name.trim()) {
      setErrorMsg('Please specify an Exam Title.');
      return false;
    }
    setErrorMsg(null);
    return true;
  };

  const validateStep2 = () => {
    if (questions.length === 0) {
      setErrorMsg('Please add at least one question.');
      return false;
    }
    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].text.trim()) {
        setErrorMsg(`Question ${i + 1} text cannot be empty.`);
        setExpandedIndex(i);
        return false;
      }
      for (let j = 0; j < questions[i].options.length; j++) {
        if (!questions[i].options[j]?.trim()) {
          setErrorMsg(`Question ${i + 1}: Option ${String.fromCharCode(65 + j)} is empty.`);
          setExpandedIndex(i);
          return false;
        }
      }
    }
    setErrorMsg(null);
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
    } else if (currentStep === 3) {
      setCurrentStep(4);
    }
  };

  const handleSave = () => {
    if (!validateStep1() || !validateStep2()) return;

    const examData: Exam = {
      id: initialExam?.id || 'exam_' + Date.now(),
      name: name.trim(),
      subject: subject.trim() || 'General',
      difficulty,
      timeLimit: Number(timeLimit) || 20,
      passingScore: Number(passingScore) || 70,
      subjectType,
      description: description.trim(),
      questions,
      createdAt: initialExam?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveExam(examData);
  };

  // 1. Initial Selection Screen: "Manual" or "Paste Text File"
  if (creationMode === 'select') {
    return (
      <div className="max-w-2xl mx-auto space-y-6 pb-12">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold font-['Syne',sans-serif] text-zinc-900 dark:text-white">
                Create Exam
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Choose how you would like to compose your exam
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-white px-3 py-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            Cancel
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Option A: Manual Creation */}
          <button
            type="button"
            onClick={() => {
              setCreationMode('manual');
              setCurrentStep(1);
            }}
            className="p-6 rounded-[24px] bg-white dark:bg-[#0c1626] border border-zinc-200/80 dark:border-white/10 hover:border-emerald-500/50 hover:shadow-md transition text-left group cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Edit3 className="w-6 h-6" />
              </div>
              <h2 className="text-base font-bold font-['Syne',sans-serif] text-zinc-900 dark:text-white mb-1">
                Manual
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Step-by-step wizard to specify exam details, questions, options, and solutions manually.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <span>Start wizard</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Option B: Paste Text File */}
          <button
            type="button"
            onClick={() => {
              setCreationMode('paste');
            }}
            className="p-6 rounded-[24px] bg-white dark:bg-[#0c1626] border border-zinc-200/80 dark:border-white/10 hover:border-blue-500/50 hover:shadow-md transition text-left group cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <FileText className="w-6 h-6" />
              </div>
              <h2 className="text-base font-bold font-['Syne',sans-serif] text-zinc-900 dark:text-white mb-1">
                Paste Text File
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Generate prompt with Exam Professor at the top or paste raw text & questions below.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400">
              <span>Open paste workspace</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>
      </div>
    );
  }

  // 2. "Paste Text File" Screen: Exam Professor at TOP, Paste features at BOTTOM
  if (creationMode === 'paste') {
    return (
      <div className="max-w-4xl mx-auto space-y-5 pb-12">
        {/* Hidden File Input for .txt import */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.json"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Top Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setCreationMode('select')}
              className="p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition cursor-pointer"
              title="Back to options"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-xl font-extrabold font-['Syne',sans-serif] text-zinc-900 dark:text-white">
                Paste Text File
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Exam Professor generator at the top, paste features at the bottom
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCreationMode('manual')}
              className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            >
              Switch to Manual
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-white px-3 py-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Messages */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center justify-between">
            <span>{errorMsg}</span>
            <button type="button" onClick={() => setErrorMsg(null)} className="cursor-pointer">
              ✕
            </button>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              {successMsg}
            </span>
            <button type="button" onClick={() => setSuccessMsg(null)} className="cursor-pointer">
              ✕
            </button>
          </div>
        )}

        {/* TOP SECTION: Exam Professor Button */}
        <div className="p-5 rounded-[24px] bg-gradient-to-r from-purple-500/10 via-purple-500/5 to-transparent border border-purple-500/20 dark:border-purple-500/30 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-bold font-['Syne',sans-serif] text-zinc-900 dark:text-white flex items-center gap-2">
                <span>Exam Professor</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-300">
                  AI Prompt Studio
                </span>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-0.5">
                Generate tailored curriculum prompts to copy into AI tools and paste the generated text below.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenProfessorModal}
            className="px-5 py-2.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-xs shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            <span>Open Exam Professor</span>
          </button>
        </div>

        {/* BOTTOM SECTION: Paste Features */}
        <div className="p-5 rounded-[24px] bg-white dark:bg-[#0d1829] border border-zinc-200/80 dark:border-white/10 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ClipboardPaste className="w-4 h-4 text-blue-500" />
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white">
                Paste Text Features
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setPasteRawText(`1. What is the acceleration due to gravity on Earth?
A) 8.9 m/s²
B) 9.8 m/s²*
C) 11.2 m/s²
D) 3.7 m/s²
Explanation: Standard gravity on Earth is approximately g = 9.8 m/s².

2. What is the derivative of f(x) = 3x² + 5x?
A) 3x + 5
B) 6x + 5*
C) 6x - 5
D) 5x + 3
Explanation: Using the power rule d/dx[x^n] = n*x^(n-1).`);
                }}
                className="px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-semibold cursor-pointer transition"
              >
                Insert Sample Text
              </button>

              <button
                type="button"
                onClick={handleTriggerFileInput}
                className="px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload .txt File</span>
              </button>
            </div>
          </div>

          <div>
            <textarea
              rows={12}
              value={pasteRawText}
              onChange={(e) => setPasteRawText(e.target.value)}
              placeholder={`Paste plain text questions or standard exam format here:\n\n1. What is Newton's Second Law?\nA) F = ma*\nB) E = mc²\nC) p = mv\nD) W = Fd\nExplanation: Force equals mass times acceleration.`}
              className="w-full px-4 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 leading-relaxed"
            />
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => onOpenPasteModal()}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>Open Bulk Modal Importer</span>
            </button>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setPasteRawText('')}
                className="px-4 py-2 rounded-full border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={handleApplyPastedText}
                className="px-5 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition"
              >
                <span>Parse & Continue</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. Manual Wizard Flow (Steps 1 to 4)
  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-12">
      {/* Hidden File Input for .txt and .json import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.json"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Top Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold font-['Syne',sans-serif] text-zinc-900 dark:text-white">
              {initialExam ? 'Edit Exam' : 'Create Exam'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!initialExam && (
            <button
              type="button"
              onClick={() => setCreationMode('select')}
              className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            >
              Change Mode
            </button>
          )}
          <button
            type="button"
            onClick={onCancel}
            className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-white px-3 py-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Stepper Navigation */}
      <div className="p-2 rounded-2xl bg-white dark:bg-[#0d1829] border border-zinc-200/80 dark:border-white/10 shadow-xs">
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { step: 1, label: 'Details', icon: BookOpen },
            { step: 2, label: `Questions (${questions.length})`, icon: HelpCircle },
            { step: 3, label: 'Settings', icon: Settings },
            { step: 4, label: 'Review', icon: CheckCircle2 },
          ].map(({ step, label, icon: Icon }) => {
            const isActive = currentStep === step;
            const isDone = currentStep > step;
            return (
              <button
                key={step}
                type="button"
                onClick={() => {
                  if (step === 1) setCurrentStep(1);
                  else if (step === 2 && validateStep1()) setCurrentStep(2);
                  else if (step === 3 && validateStep1() && validateStep2()) setCurrentStep(3);
                  else if (step === 4 && validateStep1() && validateStep2()) setCurrentStep(4);
                }}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl transition cursor-pointer text-xs font-semibold ${
                  isActive
                    ? 'bg-emerald-500 text-zinc-950 font-bold shadow-xs'
                    : isDone
                    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200'
                    : 'text-zinc-400 dark:text-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Messages */}
      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center justify-between">
          <span>{errorMsg}</span>
          <button type="button" onClick={() => setErrorMsg(null)} className="cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5" />
            {successMsg}
          </span>
          <button type="button" onClick={() => setSuccessMsg(null)} className="cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Step 1: Details */}
      {currentStep === 1 && (
        <div className="p-5 rounded-3xl bg-white dark:bg-[#0d1829] border border-zinc-200/80 dark:border-white/10 shadow-xs space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                Exam Title *
              </label>
              <input
                id="exam-title"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Calculus: Limits & Derivatives"
                className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                Subject
              </label>
              <input
                id="exam-subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Mathematics, Physics, Chemistry"
                className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                Difficulty Level
              </label>
              <select
                id="exam-difficulty"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
                className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                Time Limit (Minutes)
              </label>
              <input
                id="exam-time"
                type="number"
                min="1"
                max="180"
                value={timeLimit}
                onChange={(e) => setTimeLimit(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
              Description (Optional)
            </label>
            <textarea
              id="exam-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Exam instructions or syllabus goals..."
              className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleNext}
              className="px-5 py-2 rounded-full bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span>Next: Questions</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Questions Editor */}
      {currentStep === 2 && (
        <div className="p-5 rounded-3xl bg-white dark:bg-[#0d1829] border border-zinc-200/80 dark:border-white/10 shadow-xs space-y-4">
          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-zinc-900 dark:text-white">
                Questions ({questions.length})
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Import .txt File button */}
              <button
                type="button"
                onClick={handleTriggerFileInput}
                className="px-3 py-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center gap-1.5 hover:bg-emerald-500/20 cursor-pointer transition"
                title="Import questions from .txt or .json"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Import .txt File</span>
              </button>

              <button
                type="button"
                onClick={onOpenPasteModal}
                className="px-3 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center gap-1.5 hover:bg-blue-500/20 cursor-pointer"
                title="Paste questions as text or JSON"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Paste Text</span>
              </button>

              <button
                type="button"
                onClick={onOpenProfessorModal}
                className="px-3 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold text-xs flex items-center gap-1.5 hover:bg-purple-500/20 cursor-pointer"
                title="Generate prompt"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Prompt</span>
              </button>

              <button
                type="button"
                onClick={handleAddQuestion}
                className="px-3.5 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Add new question"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Question</span>
              </button>
            </div>
          </div>

          {/* Collapsible Questions List */}
          <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
            {questions.map((q, qIndex) => {
              const isExpanded = expandedIndex === qIndex;
              return (
                <div
                  key={q.id || qIndex}
                  className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 overflow-hidden"
                >
                  {/* Accordion Bar */}
                  <div
                    onClick={() => setExpandedIndex(isExpanded ? -1 : qIndex)}
                    className="p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-zinc-100/60 dark:hover:bg-zinc-800/40 transition"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-extrabold text-xs flex items-center justify-center shrink-0">
                        {qIndex + 1}
                      </span>
                      <span className="text-xs sm:text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                        {q.text.trim() ? q.text : <span className="text-zinc-400 italic">Empty question...</span>}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {questions.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveQuestion(qIndex);
                          }}
                          className="p-1 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                          title="Delete question"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-zinc-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-zinc-400" />
                      )}
                    </div>
                  </div>

                  {/* Question Content Form */}
                  {isExpanded && (
                    <div className="p-4 pt-2 border-t border-zinc-200/60 dark:border-zinc-800 space-y-3.5 bg-white dark:bg-[#0a1220]">
                      {/* Question Text */}
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                            Question Prompt
                          </label>

                          {/* Quick Math formula helper tags */}
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-zinc-400 mr-1 flex items-center gap-1">
                              <Calculator className="w-3 h-3" /> Insert:
                            </span>
                            {[
                              { label: 'x²', val: '\\(x^2\\)' },
                              { label: '√x', val: '\\(\\sqrt{x}\\)' },
                              { label: 'a/b', val: '\\(\\frac{a}{b}\\)' },
                              { label: '∫', val: '\\(\\int_{a}^{b} f(x)dx\\)' },
                            ].map(({ label, val }) => (
                              <button
                                key={label}
                                type="button"
                                onClick={() => insertMathSnippet(qIndex, val, 'text')}
                                className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-emerald-500/20 text-zinc-700 dark:text-zinc-300 text-[10px] font-mono cursor-pointer"
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <textarea
                          rows={2}
                          value={q.text}
                          onChange={(e) => updateQuestionText(qIndex, e.target.value)}
                          placeholder="Type question prompt or math formula..."
                          className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                        />
                      </div>

                      {/* Options Grid */}
                      <div className="space-y-2">
                        <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                          Options (Select checkmark for correct answer)
                        </label>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {q.options.map((opt, optIndex) => {
                            const isCorrect = q.correct === optIndex;
                            const char = String.fromCharCode(65 + optIndex);

                            return (
                              <div
                                key={optIndex}
                                className={`flex items-center gap-2 p-2 rounded-xl border transition ${
                                  isCorrect
                                    ? 'border-emerald-500 bg-emerald-500/5'
                                    : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50'
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => updateCorrectOption(qIndex, optIndex)}
                                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition cursor-pointer ${
                                    isCorrect
                                      ? 'bg-emerald-500 text-zinc-950 font-extrabold shadow-xs'
                                      : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-emerald-500/30'
                                  }`}
                                  title={`Mark ${char} as correct`}
                                >
                                  {isCorrect ? '✓' : char}
                                </button>

                                <input
                                  type="text"
                                  value={opt}
                                  onChange={(e) => updateOptionText(qIndex, optIndex, e.target.value)}
                                  placeholder={`Option ${char}`}
                                  className="w-full text-xs sm:text-sm bg-transparent border-none text-zinc-900 dark:text-white focus:outline-none placeholder-zinc-400"
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Explanation */}
                      <div>
                        <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                          Step-by-step Solution (Optional)
                        </label>
                        <textarea
                          rows={2}
                          value={q.explanation || ''}
                          onChange={(e) => updateExplanation(qIndex, e.target.value)}
                          placeholder="Reasoning, proof, or derivation..."
                          className="w-full px-3.5 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="px-4 py-2 rounded-full border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="px-5 py-2 rounded-full bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span>Next: Settings</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Settings */}
      {currentStep === 3 && (
        <div className="p-5 rounded-3xl bg-white dark:bg-[#0d1829] border border-zinc-200/80 dark:border-white/10 shadow-xs space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                Passing Score (%)
              </label>
              <input
                id="exam-pass"
                type="number"
                min="0"
                max="100"
                value={passingScore}
                onChange={(e) => setPassingScore(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                Subject Focus
              </label>
              <select
                id="exam-subjecttype"
                value={subjectType}
                onChange={(e) => setSubjectType(e.target.value as SubjectType)}
                className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer"
              >
                <option value="theory">Theory & Concepts</option>
                <option value="calculation">Mathematical Calculations</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="px-4 py-2 rounded-full border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              type="button"
              onClick={() => setCurrentStep(4)}
              className="px-5 py-2 rounded-full bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span>Next: Review</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Review & Save */}
      {currentStep === 4 && (
        <div className="p-5 rounded-3xl bg-white dark:bg-[#0d1829] border border-zinc-200/80 dark:border-white/10 shadow-xs space-y-4">
          {/* Exam Summary Header */}
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
            <h3 className="text-lg font-bold font-['Syne',sans-serif] text-zinc-900 dark:text-white">
              {name}
            </h3>
            <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
              <span>Subject: <strong className="text-zinc-800 dark:text-zinc-200">{subject || 'General'}</strong></span>
              <span>•</span>
              <span>Difficulty: <strong className="text-zinc-800 dark:text-zinc-200">{difficulty}</strong></span>
              <span>•</span>
              <span>Duration: <strong className="text-zinc-800 dark:text-zinc-200">{timeLimit}m</strong></span>
              <span>•</span>
              <span>Passing: <strong className="text-zinc-800 dark:text-zinc-200">{passingScore}%</strong></span>
              <span>•</span>
              <span>Questions: <strong className="text-zinc-800 dark:text-zinc-200">{questions.length}</strong></span>
            </div>
            {description && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 pt-1 border-t border-zinc-200 dark:border-zinc-800">
                {description}
              </p>
            )}
          </div>

          {/* Questions Summary */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {questions.map((q, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-xs space-y-1"
              >
                <div className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-start gap-2">
                  <span className="text-emerald-500 font-bold shrink-0">Q{idx + 1}:</span>
                  <span className="truncate">{q.text}</span>
                </div>
                <div className="text-emerald-600 dark:text-emerald-400 font-medium pl-6">
                  ✓ Correct: {String.fromCharCode(65 + q.correct)}. {q.options[q.correct]}
                </div>
              </div>
            ))}
          </div>

          {/* Footer Save / Cancel Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="px-4 py-2 rounded-full border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 rounded-full border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 font-semibold text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="saveExamBtn"
                type="button"
                onClick={handleSave}
                className="px-5 py-2 rounded-full bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Save className="w-4 h-4" />
                <span>Save Exam</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper parser for .txt and .json files
function parseTextQuestions(content: string): Question[] {
  // Check if JSON
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((item, idx) => ({
        id: item.id || `q_${Date.now()}_${idx}`,
        text: item.text || item.question || '',
        options: Array.isArray(item.options) ? item.options : ['A', 'B', 'C', 'D'],
        correct: typeof item.correct === 'number' ? item.correct : 0,
        explanation: item.explanation || '',
      }));
    }
  } catch {
    // Continue with text parsing
  }

  const lines = content.split(/\r?\n/);
  const parsedQuestions: Question[] = [];
  let currentQ: { text: string; options: string[]; correct: number; explanation: string } | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const qMatch = line.match(/^(?:(?:Question\s*\d+|Q\d+|\d+)[:.)\s]+)(.+)/i);
    const optMatch = line.match(/^([A-Da-d1-4])[:.)\s]+(.+)/);
    const ansMatch = line.match(/^(?:Answer|Correct)[:.)\s]+([A-Da-d1-4])/i);
    const expMatch = line.match(/^(?:Explanation|Reason)[:.)\s]+(.+)/i);

    if (qMatch) {
      if (currentQ && currentQ.text && currentQ.options.length >= 2) {
        while (currentQ.options.length < 4) {
          currentQ.options.push(`Option ${String.fromCharCode(65 + currentQ.options.length)}`);
        }
        parsedQuestions.push({
          id: `q_${Date.now()}_${parsedQuestions.length}`,
          text: currentQ.text,
          options: currentQ.options.slice(0, 4),
          correct: currentQ.correct,
          explanation: currentQ.explanation,
        });
      }
      currentQ = {
        text: qMatch[1].trim(),
        options: [],
        correct: 0,
        explanation: '',
      };
    } else if (optMatch && currentQ) {
      let optText = optMatch[2].trim();
      let isCorrect = false;
      if (optText.endsWith('*')) {
        isCorrect = true;
        optText = optText.slice(0, -1).trim();
      }
      currentQ.options.push(optText);
      if (isCorrect) {
        currentQ.correct = currentQ.options.length - 1;
      }
    } else if (ansMatch && currentQ) {
      const char = ansMatch[1].toUpperCase();
      const idx = char.charCodeAt(0) - 65;
      if (idx >= 0 && idx < 4) {
        currentQ.correct = idx;
      } else {
        const numIdx = parseInt(char, 10) - 1;
        if (numIdx >= 0 && numIdx < 4) currentQ.correct = numIdx;
      }
    } else if (expMatch && currentQ) {
      currentQ.explanation = expMatch[1].trim();
    } else if (currentQ) {
      if (currentQ.options.length === 0) {
        currentQ.text += ' ' + line;
      } else if (currentQ.explanation) {
        currentQ.explanation += ' ' + line;
      }
    }
  }

  if (currentQ && currentQ.text && currentQ.options.length >= 2) {
    while (currentQ.options.length < 4) {
      currentQ.options.push(`Option ${String.fromCharCode(65 + currentQ.options.length)}`);
    }
    parsedQuestions.push({
      id: `q_${Date.now()}_${parsedQuestions.length}`,
      text: currentQ.text,
      options: currentQ.options.slice(0, 4),
      correct: currentQ.correct,
      explanation: currentQ.explanation,
    });
  }

  return parsedQuestions;
}
