import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Official Firebase configuration for PSM Internship Verification Platform
export const firebaseConfig = {
  apiKey: "AIzaSyAymQ8feqFJwipara-YMCGuAL_gKqnO_PI",
  authDomain: "psm-certificate-verifica-e0dfb.firebaseapp.com",
  projectId: "psm-certificate-verifica-e0dfb",
  storageBucket: "psm-certificate-verifica-e0dfb.firebasestorage.app",
  messagingSenderId: "344469068392",
  appId: "1:344469068392:web:e593a388f32324ded039dd",
};

// Initialize or reuse Firebase app safely
export const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const firestore = getFirestore(firebaseApp);
export const storage = getStorage(firebaseApp);

/**
 * Upload an intern profile photograph to Firebase Storage
 * Under storage path: photos/{internId}.{ext}
 */
export async function uploadPhotoToFirebase(file, internId) {
  if (!file) return null;
  const ext = file.name ? file.name.split(".").pop().toLowerCase() : "jpg";
  const storageRef = ref(storage, `photos/${internId}.${ext}`);
  const snapshot = await uploadBytes(storageRef, file, {
    contentType: file.type || "image/jpeg",
  });
  const downloadUrl = await getDownloadURL(snapshot.ref);
  return downloadUrl;
}

/**
 * Sync an intern record into the Firestore 'internships' collection
 * Matches the existing Firestore schema: doc ID = internId
 */
export async function syncInternToFirestore(internData) {
  if (!internData || !internData.intern_id) return null;
  try {
    const docRef = doc(firestore, "internships", internData.intern_id);
    const firestorePayload = {
      internId: internData.intern_id,
      name: internData.full_name || "",
      domain: internData.domain || "",
      Domain: internData.domain || "",
      organisation: internData.internship?.organisation || "Problem Solving Mind",
      Organisation: internData.internship?.organisation || "Problem Solving Mind",
      Duration: internData.internship?.duration_label || "",
      duration: internData.internship?.duration_label || "",
      startDate: internData.internship?.start_date || "",
      endDate: internData.internship?.end_date || "",
      "Certificate status": internData.certificate?.status || "Pending",
      certificateId: internData.certificate?.certificate_id || "",
      photoUrl: internData.photo_url || "",
      updatedAt: new Date().toISOString(),
    };

    if (internData.project) {
      firestorePayload.project = {
        title: internData.project.title || "",
        description: internData.project.description || "",
        technologies: internData.project.technologies || "",
        githubUrl: internData.project.github_url || "",
        status: internData.project.status || "",
        achievements: internData.project.achievements || "",
      };
    }

    if (internData.evaluation && internData.evaluation.is_published) {
      firestorePayload.evaluation = {
        mentorName: internData.mentor?.name || internData.evaluation.mentor_name || "",
        technicalSkills: internData.evaluation.technical_skills,
        problemSolving: internData.evaluation.problem_solving,
        codeQuality: internData.evaluation.code_quality,
        communication: internData.evaluation.communication,
        projectEvaluation: internData.evaluation.project_evaluation || internData.evaluation.teamwork,
        totalMarks: internData.evaluation.total_marks,
        maxTotalMarks: internData.evaluation.max_total_marks || 100,
        percentage: internData.evaluation.percentage,
        grade: internData.evaluation.grade,
        feedback: internData.evaluation.feedback || "",
      };
    }

    await setDoc(docRef, firestorePayload, { merge: true });
    return { success: true };
  } catch (err) {
    console.warn("Firestore sync skipped or denied:", err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Fetch an intern verification record from Firestore directly
 */
export async function getInternFromFirestore(identifier) {
  if (!identifier) return null;
  try {
    const docRef = doc(firestore, "internships", identifier);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() };
    }
  } catch (err) {
    console.warn("Firestore read note:", err.message);
  }
  return null;
}
