import type { JSX, ReactNode } from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../services/firebase.config";
import { createUserWithEmailAndPassword, GoogleAuthProvider, onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup, signOut } from "firebase/auth";
import type { User, UserCredential } from "firebase/auth";

interface AuthContextValue {
    user: User | null;
    loading: boolean;
    signUp: (email: string, password: string) => Promise<UserCredential>;
    signIn: (email: string, password: string) => Promise<UserCredential>;
    signInGoogle: () => Promise<UserCredential>;
    logOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function Authenticator({ children }: { children: ReactNode }): JSX.Element {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const signUp = (email: string, password: string) =>
        createUserWithEmailAndPassword(auth, email, password);

    const signIn = (email: string, password: string) =>
        signInWithEmailAndPassword(auth, email, password);
    
    const signInGoogle = () =>
        signInWithPopup(auth, new GoogleAuthProvider);

    const logOut = () =>
        signOut(auth);

    const value: AuthContextValue = { user, loading, signUp, signIn, signInGoogle, logOut };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
    const context = useContext(AuthContext);
    if (context === null) {
        throw new Error("useAuth debe usarse dentro de un <Authenticator>");
    }
    return context;
}
