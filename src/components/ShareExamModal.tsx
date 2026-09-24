import React, { useState, useEffect } from 'react';
import {
  Share2,
  Copy,
  Check,
  X,
  ExternalLink,
  MessageCircle,
  GraduationCap,
  Clock,
  HelpCircle,
  Layers,
  Tag,
  Play,
  CheckCircle2,
  Globe,
  Link,
  Loader2,
  CloudCheck,
} from 'lucide-react';
import { Exam } from '../types';
import { publishExamForCloudSharing, SHARE_BASE_URL } from '../services/shareService';

interface ShareExamModalProps {
  exam: Exam | null;
  isOpen: boolean;
  onClose: () => void;
  onStartPractice?: (exam: Exam) => void;
}

export const ShareExamModal: React.FC<ShareExamModalProps> = ({
  exam,
  isOpen,
  onClose,
  onStartPractice,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedSpec, setCopiedSpec] = useState(false);
  const [nativeShareSuccess, setNativeShareSuccess] = useState(false);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'idle' | 'syncing' | 'ready'>('idle');

  // Automatically publish/synchronize exam to Cloud Firestore so any recipient can open it directly in practice mode
  useEffect(() => {
    if (isOpen && exam) {
      setCloudSyncStatus('syncing');
      publishExamForCloudSharing(exam).then((success) => {
        setCloudSyncStatus(success ? 'ready' : 'idle');
      });
    }
  }, [isOpen, exam]);

  if (!isOpen || !exam) return null;

  // Extract clean grade label
  const gradeLabel = (() => {
    if (exam.grade !== undefined && exam.grade !== null && String(exam.grade).trim() !== '') {
      const g = String(exam.grade).trim();
      return g.toLowerCase().startsWith('grade') ? g : `Grade ${g}`;
    }
    const match = exam.name.match(/grade\s*(\d{1,2})/i) || exam.name.match(/g(\d{1,2})/i);
    if (match) return `Grade ${match[1]}`;
    if (/freshman|university|college/i.test(exam.name)) return 'Freshman';
    return 'General';
  })();

  const topicLabel = exam.topic?.trim() || exam.metadata?.topic?.trim() || exam.description?.trim() || 'General Curriculum';
  const questionCount = exam.questions?.length || 0;
  const streamLabel = exam.stream || exam.metadata?.stream || 'General';

  // Generate short sharing link using requested production domain: https://sinahard.pages.dev/
  const compactExamId = (exam.catalogId || exam.id).trim();
  const shortLink = `${SHARE_BASE_URL}/?id=${encodeURIComponent(compactExamId)}`;

  // Formatted exam specification text snippet
  const specSnippet = `📚 Sinahard Exam Specification
━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 Title: ${exam.name}
🎓 Level: ${gradeLabel}
📖 Subject: ${exam.subject || 'General'}
🏷️ Topic: ${topicLabel}
⏱️ Duration: ${exam.timeLimit} Minutes
❓ Questions: ${questionCount} Multiple-Choice Questions
━━━━━━━━━━━━━━━━━━━━━━━━━━━
👉 Practice this exam on Sinahard:
${shortLink}`;

  // Copy link handler
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shortLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // fallback
      const textArea = document.createElement('textarea');
      textArea.value = shortLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // Copy specification snippet handler
  const handleCopySpec = async () => {
    try {
      await navigator.clipboard.writeText(specSnippet);
      setCopiedSpec(true);
      setTimeout(() => setCopiedSpec(false), 2500);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = specSnippet;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedSpec(true);
      setTimeout(() => setCopiedSpec(false), 2500);
    }
  };

  // Device native share API (Mobile / Tablet / Safari / Chrome)
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: exam.name,
          text: specSnippet,
          url: shortLink,
        });
        setNativeShareSuccess(true);
        setTimeout(() => setNativeShareSuccess(false), 2000);
      } catch {
        // User cancelled or share failed
      }
    } else {
      handleCopyLink();
    }
  };

  // Telegram direct share link
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shortLink)}&text=${encodeURIComponent(
    `📚 ${exam.name} (${gradeLabel} - ${exam.subject || 'General'})\n${questionCount} Questions | ${exam.timeLimit} mins`
  )}`;

  // WhatsApp direct share link
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(specSnippet)}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-md overflow-y-auto font-['Plus_Jakarta_Sans',sans-serif]"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-t-[32px] sm:rounded-[32px] bg-white dark:bg-[#070e1a] border border-zinc-200/80 dark:border-white/10 shadow-2xl overflow-hidden backdrop-blur-2xl animate-in fade-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200 max-h-[92vh] sm:max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Indicator Handle */}
        <div className="sm:hidden w-12 h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mt-3 mb-1" />

        {/* Modal Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-zinc-100 dark:border-white/10 flex items-center justify-between shrink-0 bg-white/80 dark:bg-[#070e1a]/80 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 flex items-center justify-center shadow-xs shrink-0">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white font-['Outfit',sans-serif] leading-tight">
                Share Exam
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Generate deep link &amp; study specification
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer active:scale-95"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* Exam Summary Specification Card */}
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-[#0c182b] border border-zinc-200/80 dark:border-white/10 space-y-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-zinc-950 text-white dark:bg-white dark:text-zinc-950">
                <GraduationCap className="w-3 h-3" />
                <span>{gradeLabel}</span>
              </span>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-zinc-200/80 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
                {exam.subject || 'General'}
              </span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                {exam.isDownloaded || exam.sourceType === 'curated_catalog' ? 'Official Exam' : 'User Library'}
              </span>
            </div>

            <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white font-['Outfit',sans-serif] leading-snug">
              {exam.name}
            </h3>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-2 pt-1 text-center">
              <div className="p-2 rounded-xl bg-white dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800">
                <div className="flex items-center justify-center gap-1 text-zinc-500 dark:text-zinc-400 text-[10px] uppercase font-bold">
                  <HelpCircle className="w-3 h-3" />
                  <span>Questions</span>
                </div>
                <span className="text-sm font-bold text-zinc-900 dark:text-white mt-0.5 block">
                  {questionCount}
                </span>
              </div>

              <div className="p-2 rounded-xl bg-white dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800">
                <div className="flex items-center justify-center gap-1 text-zinc-500 dark:text-zinc-400 text-[10px] uppercase font-bold">
                  <Clock className="w-3 h-3" />
                  <span>Time</span>
                </div>
                <span className="text-sm font-bold text-zinc-900 dark:text-white mt-0.5 block">
                  {exam.timeLimit}m
                </span>
              </div>

              <div className="p-2 rounded-xl bg-white dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800">
                <div className="flex items-center justify-center gap-1 text-zinc-500 dark:text-zinc-400 text-[10px] uppercase font-bold">
                  <Layers className="w-3 h-3" />
                  <span>Stream</span>
                </div>
                <span className="text-sm font-bold text-zinc-900 dark:text-white mt-0.5 block truncate">
                  {streamLabel}
                </span>
              </div>
            </div>

            {/* Topic pill */}
            <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 pt-1">
              <Tag className="w-3 h-3 text-zinc-400 shrink-0" />
              <span className="truncate">
                <strong>Topic:</strong> {topicLabel}
              </span>
            </div>
          </div>

          {/* Section 1: Short Sharing Link */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-zinc-900 dark:text-white" />
                <span>1. Direct Short Exam Link</span>
              </label>
              <span className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full border border-zinc-200/80 dark:border-zinc-700 flex items-center gap-1">
                <Link className="w-2.5 h-2.5" />
                <span>{typeof window !== 'undefined' && window.location.host ? window.location.host : 'sinahard.pages.dev'}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-mono text-[11px] sm:text-xs text-zinc-700 dark:text-zinc-300 truncate select-all flex items-center gap-2">
                <span className="truncate">{shortLink}</span>
              </div>
              <button
                type="button"
                id="copy-exam-deeplink-btn"
                onClick={handleCopyLink}
                className={`px-4 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs shrink-0 active:scale-95 ${
                  copiedLink
                    ? 'bg-emerald-600 text-white'
                    : 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 hover:opacity-90'
                }`}
                title="Copy short web link"
              >
                {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? 'Copied!' : 'Copy Short Link'}</span>
              </button>
            </div>
            <div className="flex items-center justify-between gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
              <p>
                Opening this short link on mobile or desktop directly launches this exam in <strong>Practice Mode</strong>.
              </p>
              {cloudSyncStatus === 'syncing' && (
                <span className="shrink-0 flex items-center gap-1 text-zinc-400">
                  <Loader2 className="w-2.5 h-2.5 animate-spin" />
                  <span>Syncing...</span>
                </span>
              )}
              {cloudSyncStatus === 'ready' && (
                <span className="shrink-0 flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                  <CloudCheck className="w-3 h-3" />
                  <span>Cloud Ready</span>
                </span>
              )}
            </div>
          </div>

          {/* Section 2: Shareable Specification Snippet */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
                2. Shareable Exam Specification Snippet
              </label>
              <button
                type="button"
                id="copy-exam-spec-btn"
                onClick={handleCopySpec}
                className="text-xs font-semibold text-zinc-900 dark:text-white hover:underline flex items-center gap-1 cursor-pointer"
              >
                {copiedSpec ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400">Snippet Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Snippet</span>
                  </>
                )}
              </button>
            </div>

            <div className="relative">
              <pre className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-mono text-[11px] text-zinc-800 dark:text-zinc-200 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-40 selection:bg-zinc-300 dark:selection:bg-zinc-700">
                {specSnippet}
              </pre>
            </div>
          </div>

          {/* Section 3: Social & Mobile Messenger Share */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider block">
              3. Quick Share with Study Groups
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {/* Device Native Share */}
              <button
                type="button"
                onClick={handleNativeShare}
                className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 text-zinc-900 dark:text-white text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer active:scale-95 shadow-2xs"
                title="Share via device menu"
              >
                <Share2 className="w-4 h-4 text-zinc-600 dark:text-zinc-300" />
                <span>{nativeShareSuccess ? 'Shared!' : 'Device Share'}</span>
              </button>

              {/* Telegram */}
              <a
                href={telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl border border-sky-500/20 bg-sky-500/10 hover:bg-sky-500/15 text-sky-700 dark:text-sky-300 text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer active:scale-95 shadow-2xs"
                title="Share via Telegram"
              >
                <MessageCircle className="w-4 h-4 text-sky-500" />
                <span>Telegram</span>
              </a>

              {/* WhatsApp */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="col-span-2 sm:col-span-1 p-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer active:scale-95 shadow-2xs"
                title="Share via WhatsApp"
              >
                <ExternalLink className="w-4 h-4 text-emerald-500" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-zinc-100 dark:border-white/10 bg-zinc-50/80 dark:bg-[#070e1a] flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-300 transition cursor-pointer active:scale-95"
          >
            Done
          </button>

          {onStartPractice && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onStartPractice(exam);
              }}
              className="px-5 py-2 rounded-full bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs active:scale-95 hover:opacity-90"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Practice Now</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
