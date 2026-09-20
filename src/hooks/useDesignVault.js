import { onAuthStateChanged, signInAnonymously } from 'firebase/auth'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore'
import { useCallback, useEffect, useState } from 'react'
import { auth, db, isFirebaseConfigured } from '../firebase/firebase'

// Anonymous auth for now — enough to scope "my saved designs" per browser
// without requiring an account system before there's anything worth
// saving an account for. Real sign-in is a later, separate decision.
export function useDesignVault() {
  const [user, setUser] = useState(null)
  const [savedDesigns, setSavedDesigns] = useState([])
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isFirebaseConfigured) return undefined

    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      if (nextUser) {
        setUser(nextUser)
      } else {
        signInAnonymously(auth).catch((err) => setError(err.message))
      }
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    if (!isFirebaseConfigured || !user) return undefined

    const designsQuery = query(collection(db, 'designs'), where('ownerId', '==', user.uid))
    const unsubscribe = onSnapshot(
      designsQuery,
      (snapshot) => {
        setSavedDesigns(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })))
      },
      (err) => setError(err.message),
    )
    return unsubscribe
  }, [user])

  const saveDesign = useCallback(
    async (name, designData) => {
      if (!isFirebaseConfigured || !user) return
      setStatus('saving')
      setError(null)
      try {
        await addDoc(collection(db, 'designs'), {
          ownerId: user.uid,
          type: 'murrini',
          schemaVersion: 2,
          name,
          visibility: 'private',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          canvas: designData.canvas,
          elements: designData.elements,
          pattern: designData.pattern,
          extrusion: designData.extrusion,
          thumbnailUrl: designData.thumbnailUrl ?? null,
        })
        setStatus('idle')
      } catch (err) {
        setError(err.message)
        setStatus('error')
      }
    },
    [user],
  )

  const deleteDesign = useCallback(async (id) => {
    if (!isFirebaseConfigured) return
    try {
      await deleteDoc(doc(db, 'designs', id))
    } catch (err) {
      setError(err.message)
    }
  }, [])

  return {
    isConfigured: isFirebaseConfigured,
    user,
    savedDesigns,
    status,
    error,
    saveDesign,
    deleteDesign,
  }
}
