import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User, 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: User | null;
  loading: boolean;
  isAdmin: boolean;
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  signInWithGoogle: () => Promise<void>;
  updateProfileDetails: (details: Partial<UserProfile>) => Promise<void>;
  signOut: () => Promise<void>;
}

const ADMIN_EMAIL = "adityasonihyderabad@gmail.com";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('diamond_current_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.uid === 'student_aakash_verma' || parsed.email?.includes('example.com')) {
          localStorage.removeItem('diamond_current_user');
          return null;
        }
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const [activeRole, setActiveRole] = useState<UserRole>(() => {
    try {
      const saved = localStorage.getItem('diamond_active_role');
      return (saved as UserRole) || 'customer';
    } catch {
      return 'customer';
    }
  });

  useEffect(() => {
    // Purge any remnant demo user
    const saved = localStorage.getItem('diamond_current_user');
    if (saved && (saved.includes('student_aakash_verma') || saved.includes('example.com'))) {
      localStorage.removeItem('diamond_current_user');
      setUser(null);
    }

    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        const isSuperAdmin = fbUser.email?.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim();
        const profile: UserProfile = {
          uid: fbUser.uid,
          email: fbUser.email || "",
          name: fbUser.displayName || fbUser.email?.split('@')[0] || "Student",
          photoURL: fbUser.photoURL || undefined,
          role: isSuperAdmin ? 'admin' : 'customer',
          createdAt: fbUser.metadata.creationTime || new Date().toISOString()
        };
        setUser(profile);
        localStorage.setItem('diamond_current_user', JSON.stringify(profile));
        if (isSuperAdmin) {
          setActiveRole('admin');
          localStorage.setItem('diamond_active_role', 'admin');
        }
      } else {
        // Not logged in via Firebase
        setUser(null);
        localStorage.removeItem('diamond_current_user');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleRoleChange = (role: UserRole) => {
    // Only the verified admin email can switch to admin role
    if (role === 'admin' && user?.email?.toLowerCase().trim() !== ADMIN_EMAIL.toLowerCase().trim()) {
      setActiveRole('customer');
      localStorage.setItem('diamond_active_role', 'customer');
      return;
    }
    setActiveRole(role);
    localStorage.setItem('diamond_active_role', role);
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      const isSuperAdmin = fbUser.email?.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim();
      const profile: UserProfile = {
        uid: fbUser.uid,
        email: fbUser.email || "",
        name: fbUser.displayName || "Student",
        photoURL: fbUser.photoURL || undefined,
        role: isSuperAdmin ? 'admin' : 'customer',
        createdAt: new Date().toISOString()
      };
      setUser(profile);
      localStorage.setItem('diamond_current_user', JSON.stringify(profile));
      if (isSuperAdmin) {
        setActiveRole('admin');
        localStorage.setItem('diamond_active_role', 'admin');
      }
    } catch (error: any) {
      console.warn("Google Sign-In notice:", error?.message || error);
      if (error?.code !== 'auth/popup-closed-by-user' && error?.code !== 'auth/cancelled-popup-request') {
        alert("Google Sign-In was cancelled or failed. Please sign in with your Google account to proceed.");
      }
    } finally {
      setLoading(false);
    }
  };

  const updateProfileDetails = async (details: Partial<UserProfile>) => {
    if (!user) return;
    const updated = { ...user, ...details, updatedAt: new Date().toISOString() };
    setUser(updated);
    localStorage.setItem('diamond_current_user', JSON.stringify(updated));
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      console.warn("Sign out err:", e);
    }
    setUser(null);
    localStorage.removeItem('diamond_current_user');
    setActiveRole('customer');
    localStorage.setItem('diamond_active_role', 'customer');
  };

  // Only adityasonihyderabad@gmail.com is granted admin privileges
  const isAdmin = Boolean(user && user.email?.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim());

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        isAdmin,
        activeRole,
        setActiveRole: handleRoleChange,
        signInWithGoogle,
        updateProfileDetails,
        signOut
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
