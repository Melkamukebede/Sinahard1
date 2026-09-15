import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Exam, ExamResult, AppUser } from '../types';

const LOCAL_STORAGE_EXAMS = 'exam_master_exams';
const LOCAL_STORAGE_RESULTS = 'exam_master_results';

export const INITIAL_SAMPLE_EXAMS: Exam[] = [
  {
    id: 'sample_math_1',
    name: 'Advanced Mathematics & Calculus',
    title: 'Advanced Mathematics & Calculus',
    subject: 'Mathematics',
    difficulty: 'Medium',
    timeLimit: 25,
    passingScore: 70,
    subjectType: 'calculation',
    description: 'Master quadratic formulas, differentiation, limits, and integral calculus with step-by-step solutions.',
    isPublic: true,
    questions: [
      {
        id: 'q_math_1',
        text: 'What are the real roots of the quadratic equation \\( 2x^2 - 4x - 6 = 0 \\)?',
        options: ['\\( x = 3 \\) and \\( x = -1 \\)', '\\( x = -3 \\) and \\( x = 1 \\)', '\\( x = 2 \\) and \\( x = -3 \\)', '\\( x = 4 \\) and \\( x = -2 \\)'],
        correct: 0,
        explanation: `1. **Divide the equation by 2:**
\\[ x^2 - 2x - 3 = 0 \\]
2. **Factor the quadratic:**
\\[ (x - 3)(x + 1) = 0 \\]
3. **Solve for \\( x \\):**
\\[ x - 3 = 0 \\implies x = 3 \\]
\\[ x + 1 = 0 \\implies x = -1 \\]
**Answer:** \\( x = 3 \\) and \\( x = -1 \\)`
      },
      {
        id: 'q_math_2',
        text: 'What is the derivative with respect to \\( x \\) of \\( f(x) = 3x^4 - 5x^2 + 7 \\)?',
        options: [
          '\\( 12x^3 - 10x \\)',
          '\\( 12x^3 - 5x + 7 \\)',
          '\\( 7x^3 - 10x \\)',
          '\\( 3x^3 - 10x \\)'
        ],
        correct: 0,
        explanation: `1. **Apply the power rule:** \\( \\frac{d}{dx}[x^n] = n x^{n-1} \\)
\\[ \\frac{d}{dx}[3x^4] = 3 \\cdot 4x^3 = 12x^3 \\]
\\[ \\frac{d}{dx}[-5x^2] = -5 \\cdot 2x = -10x \\]
\\[ \\frac{d}{dx}[7] = 0 \\]
2. **Combine the terms:**
\\[ f'(x) = 12x^3 - 10x \\]
**Answer:** \\( 12x^3 - 10x \\)`
      },
      {
        id: 'q_math_3',
        text: 'Evaluate the definite integral: \\[ \\int_{0}^{2} (3x^2 + 2) \\, dx \\]',
        options: ['12', '10', '14', '8'],
        correct: 0,
        explanation: `1. **Find the antiderivative:**
\\[ \\int (3x^2 + 2) \\, dx = x^3 + 2x \\]
2. **Evaluate between limits \\( 0 \\) and \\( 2 \\):**
\\[ [x^3 + 2x]_0^2 = (2^3 + 2(2)) - (0 + 0) = 8 + 4 = 12 \\]
**Answer:** 12`
      },
      {
        id: 'q_math_4',
        text: 'What is the limit as \\( x \\to 0 \\) of \\[ \\lim_{x \\to 0} \\frac{\\sin(3x)}{x} \\]?',
        options: ['3', '1', '0', 'Undefined'],
        correct: 0,
        explanation: `1. **Recall the fundamental trigonometric limit:**
\\[ \\lim_{\\theta \\to 0} \\frac{\\sin(\\theta)}{\\theta} = 1 \\]
2. **Rewrite the expression:**
\\[ \\frac{\\sin(3x)}{x} = 3 \\cdot \\frac{\\sin(3x)}{3x} \\]
3. **Take the limit:**
\\[ 3 \\cdot 1 = 3 \\]
**Answer:** 3`
      }
    ]
  },
  {
    id: 'sample_physics_1',
    name: 'Physics: Classical Mechanics & Energy',
    title: 'Physics: Classical Mechanics & Energy',
    subject: 'Physics',
    difficulty: 'Medium',
    timeLimit: 20,
    passingScore: 70,
    subjectType: 'calculation',
    description: 'Kinematics, Newton\'s laws of motion, work, and conservation of energy.',
    isPublic: true,
    questions: [
      {
        id: 'q_phys_1',
        text: 'A car of mass \\( m = 1200 \\text{ kg} \\) accelerates from rest to \\( v = 20 \\text{ m/s} \\). What is its kinetic energy?',
        options: ['\\( 240,000 \\text{ J} \\)', '\\( 120,000 \\text{ J} \\)', '\\( 480,000 \\text{ J} \\)', '\\( 24,000 \\text{ J} \\)'],
        correct: 0,
        explanation: `1. **Kinetic Energy formula:**
\\[ E_k = \\frac{1}{2} m v^2 \\]
2. **Substitute values:**
\\[ E_k = \\frac{1}{2} (1200)(20^2) = 600 \\times 400 = 240,000 \\text{ J} = 240 \\text{ kJ} \\]
**Answer:** \\( 240,000 \\text{ J} \\)`
      },
      {
        id: 'q_phys_2',
        text: 'According to Newton\'s Second Law, if a net force of \\( 45 \\text{ N} \\) acts on a \\( 5 \\text{ kg} \\) object, what is its acceleration?',
        options: ['\\( 9 \\text{ m/s}^2 \\)', '\\( 225 \\text{ m/s}^2 \\)', '\\( 0.11 \\text{ m/s}^2 \\)', '\\( 40 \\text{ m/s}^2 \\)'],
        correct: 0,
        explanation: `1. **Formula:** \\[ F = ma \\implies a = \\frac{F}{m} \\]
2. **Calculation:**
\\[ a = \\frac{45 \\text{ N}}{5 \\text{ kg}} = 9 \\text{ m/s}^2 \\]
**Answer:** \\( 9 \\text{ m/s}^2 \\)`
      },
      {
        id: 'q_phys_3',
        text: 'An object is dropped from a height \\( h = 20 \\text{ m} \\) in a vacuum where \\( g = 9.8 \\text{ m/s}^2 \\). What is its speed right before hitting the ground?',
        options: ['\\( 19.8 \\text{ m/s} \\)', '\\( 14.0 \\text{ m/s} \\)', '\\( 9.8 \\text{ m/s} \\)', '\\( 39.2 \\text{ m/s} \\)'],
        correct: 0,
        explanation: `1. **Conservation of mechanical energy:**
\\[ mgh = \\frac{1}{2}mv^2 \\implies v = \\sqrt{2gh} \\]
2. **Calculation:**
\\[ v = \\sqrt{2 \\times 9.8 \\times 20} = \\sqrt{392} \\approx 19.8 \\text{ m/s} \\]
**Answer:** \\( 19.8 \\text{ m/s} \\)`
      }
    ]
  },
  {
    id: 'sample_bio_1',
    name: 'Cell Biology & Genetics',
    title: 'Cell Biology & Genetics',
    subject: 'Biology',
    difficulty: 'Easy',
    timeLimit: 15,
    passingScore: 70,
    subjectType: 'theory',
    description: 'Cell structure, organelle functions, DNA replication, and Mendelian inheritance.',
    isPublic: true,
    questions: [
      {
        id: 'q_bio_1',
        text: 'Which cellular organelle is primarily responsible for ATP synthesis via oxidative phosphorylation?',
        options: ['Mitochondria', 'Ribosome', 'Endoplasmic Reticulum', 'Golgi Apparatus'],
        correct: 0,
        explanation: `**Main Idea:** Mitochondria are known as the cellular powerhouses.
*Details:* They generate most of the cell's supply of adenosine triphosphate (ATP), used as a chemical energy currency, through the citric acid cycle and oxidative phosphorylation.
💡 **Memory Trick:** "Mighty Mitochondria Make Muscle Money (ATP)".`
      },
      {
        id: 'q_bio_2',
        text: 'Which nitrogenous base pairs with Adenine (A) in double-stranded DNA?',
        options: ['Thymine (T)', 'Cytosine (C)', 'Guanine (G)', 'Uracil (U)'],
        correct: 0,
        explanation: `**Main Idea:** Complementary base pairing rules in DNA.
*Details:* Adenine pairs exclusively with Thymine via 2 hydrogen bonds (A = T), while Guanine pairs with Cytosine via 3 hydrogen bonds (G ≡ C). In RNA, Uracil replaces Thymine.
💡 **Memory Trick:** **A**pples on **T**rees, **C**ars in **G**arages.`
      },
      {
        id: 'q_bio_3',
        text: 'What is the overall chemical equation for oxygenic photosynthesis?',
        options: [
          '\\( 6\\text{CO}_2 + 6\\text{H}_2\\text{O} + \\text{light} \\to \\text{C}_6\\text{H}_{12}\\text{O}_6 + 6\\text{O}_2 \\)',
          '\\( \\text{C}_6\\text{H}_{12}\\text{O}_6 + 6\\text{O}_2 \\to 6\\text{CO}_2 + 6\\text{H}_2\\text{O} \\)',
          '\\( 2\\text{H}_2 + \\text{O}_2 \\to 2\\text{H}_2\\text{O} \\)',
          '\\( 6\\text{CO}_2 + 6\\text{O}_2 \\to \\text{C}_6\\text{H}_{12}\\text{O}_6 + \\text{light} \\)'
        ],
        correct: 0,
        explanation: `1. **Reactants:** Carbon dioxide and water in the presence of sunlight and chlorophyll.
2. **Products:** Glucose and oxygen.
\\[ 6\\text{CO}_2 + 6\\text{H}_2\\text{O} \\xrightarrow{\\text{photons}} \\text{C}_6\\text{H}_{12}\\text{O}_6 + 6\\text{O}_2 \\]
**Answer:** Option A`
      }
    ]
  }
];

// Local storage helpers
export function getLocalExams(): Exam[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_EXAMS);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_EXAMS, JSON.stringify(INITIAL_SAMPLE_EXAMS));
      return INITIAL_SAMPLE_EXAMS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(LOCAL_STORAGE_EXAMS, JSON.stringify(INITIAL_SAMPLE_EXAMS));
      return INITIAL_SAMPLE_EXAMS;
    }
    return parsed;
  } catch {
    return INITIAL_SAMPLE_EXAMS;
  }
}

export function saveLocalExams(exams: Exam[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_EXAMS, JSON.stringify(exams));
  } catch (err) {
    console.warn('Could not save exams to local storage', err);
  }
}

export function getLocalResults(): ExamResult[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_RESULTS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveLocalResults(results: ExamResult[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_RESULTS, JSON.stringify(results));
  } catch (err) {
    console.warn('Could not save results to local storage', err);
  }
}

// ----------------- FIRESTORE SYNC SERVICE -----------------

export function subscribeToExams(
  user: AppUser | null,
  onUpdate: (exams: Exam[]) => void
): () => void {
  // If user is not authenticated, load local exams
  if (!user) {
    const local = getLocalExams();
    onUpdate(local);
    return () => {};
  }

  // If user is authenticated, listen to real-time updates from Firestore
  try {
    const examsRef = collection(db, 'exams');
    const q = query(examsRef, where('userId', '==', user.uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const firestoreExams: Exam[] = [];
        snapshot.forEach((docSnap) => {
          firestoreExams.push({ id: docSnap.id, ...docSnap.data() } as Exam);
        });

        // Always merge with public samples if user doesn't have any yet
        const local = getLocalExams();
        const mergedMap = new Map<string, Exam>();
        
        // Add sample exams
        INITIAL_SAMPLE_EXAMS.forEach((e) => mergedMap.set(e.id, e));
        // Add local customized exams
        local.forEach((e) => mergedMap.set(e.id, e));
        // Add firestore exams
        firestoreExams.forEach((e) => mergedMap.set(e.id, e));

        const finalExams = Array.from(mergedMap.values());
        saveLocalExams(finalExams);
        onUpdate(finalExams);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'exams');
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn('Firestore subscription fallback:', err);
    onUpdate(getLocalExams());
    return () => {};
  }
}

export function subscribeToResults(
  user: AppUser | null,
  onUpdate: (results: ExamResult[]) => void
): () => void {
  if (!user) {
    onUpdate(getLocalResults());
    return () => {};
  }

  try {
    const resultsRef = collection(db, 'results');
    const q = query(resultsRef, where('userId', '==', user.uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const firestoreResults: ExamResult[] = [];
        snapshot.forEach((docSnap) => {
          firestoreResults.push({ id: docSnap.id, ...docSnap.data() } as ExamResult);
        });

        // Sort by date descending
        firestoreResults.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        saveLocalResults(firestoreResults);
        onUpdate(firestoreResults);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'results');
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn('Firestore results subscription fallback:', err);
    onUpdate(getLocalResults());
    return () => {};
  }
}

export async function saveExamToDb(exam: Exam, user: AppUser | null): Promise<void> {
  const localExams = getLocalExams();
  const existingIndex = localExams.findIndex((e) => e.id === exam.id);
  if (existingIndex >= 0) {
    localExams[existingIndex] = exam;
  } else {
    localExams.unshift(exam);
  }
  saveLocalExams(localExams);

  if (user) {
    try {
      const examDocRef = doc(db, 'exams', exam.id);
      await setDoc(examDocRef, {
        ...exam,
        userId: user.uid,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `exams/${exam.id}`);
    }
  }
}

export async function deleteExamFromDb(examId: string, user: AppUser | null): Promise<void> {
  const localExams = getLocalExams().filter((e) => e.id !== examId);
  saveLocalExams(localExams);

  if (user) {
    try {
      const examDocRef = doc(db, 'exams', examId);
      await deleteDoc(examDocRef);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `exams/${examId}`);
    }
  }
}

export async function saveResultToDb(result: ExamResult, user: AppUser | null): Promise<void> {
  const localResults = getLocalResults();
  const resWithId = {
    ...result,
    id: result.id || 'res_' + Date.now(),
    userId: user ? user.uid : 'guest',
  };
  localResults.unshift(resWithId);
  saveLocalResults(localResults);

  if (user) {
    try {
      const resultDocRef = doc(db, 'results', String(resWithId.id));
      await setDoc(resultDocRef, resWithId);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `results/${resWithId.id}`);
    }
  }
}

export async function deleteResultFromDb(resultId: string | number, user: AppUser | null): Promise<void> {
  const localResults = getLocalResults().filter((r) => String(r.id) !== String(resultId));
  saveLocalResults(localResults);

  if (user) {
    try {
      const resultDocRef = doc(db, 'results', String(resultId));
      await deleteDoc(resultDocRef);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `results/${resultId}`);
    }
  }
}

export async function clearAllResultsFromDb(user: AppUser | null): Promise<void> {
  saveLocalResults([]);

  if (user) {
    try {
      const resultsRef = collection(db, 'results');
      const q = query(resultsRef, where('userId', '==', user.uid));
      const snap = await getDocs(q);
      const deletePromises = snap.docs.map((docSnap) => deleteDoc(docSnap.ref));
      await Promise.all(deletePromises);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'results');
    }
  }
}
