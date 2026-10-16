import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { FormModel, FormResponse } from '../types/form';

// -------------------------------------------------------------
// Forms Service
// -------------------------------------------------------------

export function subscribeUserForms(
  userId: string,
  onUpdate: (forms: FormModel[]) => void,
  onError?: (err: Error) => void
) {
  const path = 'forms';
  const q = query(collection(db, path), where('ownerId', '==', userId));

  return onSnapshot(
    q,
    (snapshot) => {
      const forms: FormModel[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        forms.push({
          ...(data as FormModel),
          id: docSnap.id,
        });
      });
      onUpdate(forms);
    },
    (err) => {
      if (onError) onError(err);
      handleFirestoreError(err, OperationType.LIST, path);
    }
  );
}

export async function getPublishedForm(formId: string): Promise<FormModel | null> {
  const path = `forms/${formId}`;
  try {
    const snap = await getDoc(doc(db, 'forms', formId));
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      ...(data as FormModel),
      id: snap.id,
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
  }
}

export async function saveFormToFirestore(form: FormModel, userId: string): Promise<void> {
  const path = `forms/${form.id}`;
  try {
    const payload = {
      ...form,
      ownerId: userId,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'forms', form.id), payload, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteFormFromFirestore(formId: string): Promise<void> {
  const path = `forms/${formId}`;
  try {
    await deleteDoc(doc(db, 'forms', formId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// -------------------------------------------------------------
// Form Responses Subcollection Service
// -------------------------------------------------------------

export function subscribeFormResponses(
  formId: string,
  onUpdate: (responses: FormResponse[]) => void,
  onError?: (err: Error) => void
) {
  const path = `forms/${formId}/responses`;
  const q = collection(db, 'forms', formId, 'responses');

  return onSnapshot(
    q,
    (snapshot) => {
      const resps: FormResponse[] = [];
      snapshot.forEach((docSnap) => {
        resps.push({
          ...(docSnap.data() as FormResponse),
          id: docSnap.id,
        });
      });
      onUpdate(resps);
    },
    (err) => {
      if (onError) onError(err);
      handleFirestoreError(err, OperationType.LIST, path);
    }
  );
}

export async function submitResponseToFirestore(
  formId: string,
  response: FormResponse
): Promise<string> {
  const path = `forms/${formId}/responses/${response.id}`;
  try {
    const respRef = doc(db, 'forms', formId, 'responses', response.id);
    await setDoc(respRef, {
      ...response,
      submittedAt: new Date().toISOString(),
    });

    // Increment submission count on form document if present
    const formRef = doc(db, 'forms', formId);
    const formSnap = await getDoc(formRef);
    if (formSnap.exists()) {
      const current = formSnap.data()?.submissionCount || 0;
      await updateDoc(formRef, { submissionCount: current + 1 });
    }

    return response.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function updateResponseStatusInFirestore(
  formId: string,
  responseId: string,
  status: 'valid' | 'flagged' | 'excluded'
): Promise<void> {
  const path = `forms/${formId}/responses/${responseId}`;
  try {
    const respRef = doc(db, 'forms', formId, 'responses', responseId);
    await updateDoc(respRef, { status });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function updateResponseNotesInFirestore(
  formId: string,
  responseId: string,
  internalNotes: string
): Promise<void> {
  const path = `forms/${formId}/responses/${responseId}`;
  try {
    const respRef = doc(db, 'forms', formId, 'responses', responseId);
    await updateDoc(respRef, { internalNotes });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function deleteResponseFromFirestore(
  formId: string,
  responseId: string
): Promise<void> {
  const path = `forms/${formId}/responses/${responseId}`;
  try {
    const respRef = doc(db, 'forms', formId, 'responses', responseId);
    await deleteDoc(respRef);

    // Decrement counter
    const formRef = doc(db, 'forms', formId);
    const formSnap = await getDoc(formRef);
    if (formSnap.exists()) {
      const current = formSnap.data()?.submissionCount || 0;
      if (current > 0) {
        await updateDoc(formRef, { submissionCount: current - 1 });
      }
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}
