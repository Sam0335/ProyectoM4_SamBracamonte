import type { JSX, ReactNode } from "react";
import { useAuth } from "../features/Authenticator";
import { Navigate, useLocation } from "react-router-dom";

function RequireAuth({ children }: { children: ReactNode }): JSX.Element {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) return <p>Cargando sesion...</p>
    if (!user) return <Navigate to="/" state={{ from: location }} replace />
    
    return <>{children}</>;
}

export default RequireAuth;