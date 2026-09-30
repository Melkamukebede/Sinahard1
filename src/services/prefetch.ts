/**
 * Module Prefetcher & Warm-up Service
 * Pre-downloads critical application modules and dynamic chunks in the background.
 * Ensures clicking "Create", "Practice", or opening modals renders instantly (0ms) without network latency.
 */

let _createWizardPromise: Promise<unknown> | null = null;
let _practiceModalPromise: Promise<unknown> | null = null;
let _pasteModalPromise: Promise<unknown> | null = null;
let _professorModalPromise: Promise<unknown> | null = null;
let _curatedModalPromise: Promise<unknown> | null = null;

export function prefetchCreateWizard(): Promise<unknown> {
  if (!_createWizardPromise && typeof window !== 'undefined') {
    _createWizardPromise = import('../components/CreateExamWizard').catch((err) => {
      _createWizardPromise = null;
      console.warn('CreateExamWizard prefetch retry needed:', err);
    });
  }
  return _createWizardPromise || Promise.resolve();
}

export function prefetchPracticeModal(): Promise<unknown> {
  if (!_practiceModalPromise && typeof window !== 'undefined') {
    _practiceModalPromise = import('../components/PracticeModal').catch((err) => {
      _practiceModalPromise = null;
      console.warn('PracticeModal prefetch retry needed:', err);
    });
  }
  return _practiceModalPromise || Promise.resolve();
}

export function prefetchPasteModal(): Promise<unknown> {
  if (!_pasteModalPromise && typeof window !== 'undefined') {
    _pasteModalPromise = import('../components/PasteJsonModal').catch((err) => {
      _pasteModalPromise = null;
    });
  }
  return _pasteModalPromise || Promise.resolve();
}

export function prefetchProfessorModal(): Promise<unknown> {
  if (!_professorModalPromise && typeof window !== 'undefined') {
    _professorModalPromise = import('../components/ProfessorModal').catch((err) => {
      _professorModalPromise = null;
    });
  }
  return _professorModalPromise || Promise.resolve();
}

export function prefetchCuratedModal(): Promise<unknown> {
  if (!_curatedModalPromise && typeof window !== 'undefined') {
    _curatedModalPromise = import('../components/CuratedExamsModal').catch((err) => {
      _curatedModalPromise = null;
    });
  }
  return _curatedModalPromise || Promise.resolve();
}

/**
 * Eagerly warm up critical modules during idle browser cycles immediately upon app startup.
 */
export function warmUpAppModules(): void {
  const warm = () => {
    prefetchCreateWizard();
    prefetchPracticeModal();
    // Warm up secondary modals slightly after primary modules
    setTimeout(() => {
      prefetchPasteModal();
      prefetchProfessorModal();
      prefetchCuratedModal();
    }, 300);
  };

  if (typeof window !== 'undefined') {
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(warm, { timeout: 800 });
    } else {
      setTimeout(warm, 50);
    }
  }
}
