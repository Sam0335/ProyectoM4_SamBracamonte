import type { JSX } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../features/Authenticator";
import styles from "./styles/Auth.module.css";

function LandingPage(): JSX.Element {
    const { user } = useAuth();

    return (
        <div className={styles.page}>
            <div className={styles.card}>
                <h1 className={styles.title}>Bienvenido</h1>
                <p className={styles.subtitle}>Seleccioná una opción para continuar</p>
                <hr className={styles.divider} />

                {/* Los Link actúan como botones — primer hijo = primario, segundo = outline */}
                <div className={styles.actions}>
                    <Link to="/login">Iniciar sesión</Link>
                    <Link to="/register">Registrarse</Link>
                </div>

                {/* Solo se muestra si el usuario ya está autenticado */}
                {user && (
                    <div className={styles.loggedIn}>
                        <h2 className={styles.loggedInTitle}>Ya tenés una sesión activa</h2>
                        <div className={styles.actions}>
                            <Link to="/tasks">Ir al panel de usuario</Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default LandingPage;