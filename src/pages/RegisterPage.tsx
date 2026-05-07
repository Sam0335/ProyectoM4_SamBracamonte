import { useState, type JSX, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../features/Authenticator";
import { getAuthErrorMessage, validateEmail, validatePassword } from "../features/AuthErrors";
import styles from "./styles/Auth.module.css";

function RegisterPage(): JSX.Element {
    const { signUp, signInGoogle } = useAuth();

    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname || "/tasks";

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
        e.preventDefault();

        const emailError = validateEmail(email);
        if (emailError) { setError(emailError); return; }

        const passwordError = validatePassword(password);
        if (passwordError) { setError(passwordError); return; }

        setError("");
        setLoading(true);
        try {
            await signUp(email, password);
            navigate(from, { replace: true });
        } catch (error) {
            setError(getAuthErrorMessage(error));
        } finally {
            setLoading(false);
        }
    }

    async function handleGoogleSignIn(): Promise<void> {
        setError("");
        setLoading(true);
        try {
            await signInGoogle();
            navigate(from, { replace: true });
        } catch (error) {
            setError(getAuthErrorMessage(error));
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className={styles.page}>
            <div className={styles.card}>
                <h1 className={styles.title}>Crear cuenta</h1>
                <p className={styles.subtitle}>Empezá a organizar tus tareas</p>
                <hr className={styles.divider} />

                <form className={styles.form} onSubmit={handleSubmit}>
                    <input
                        className={styles.input}
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />

                    <input
                        className={styles.input}
                        type="password"
                        placeholder="Contraseña"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    {error && <p className={styles.error}>{error}</p>}

                    <button className={styles.btnPrimary} type="submit" disabled={loading}>
                        {loading ? "Creando cuenta..." : "Registrarse"}
                    </button>
                </form>

                <div className={styles.orSeparator}>o</div>

                <button className={styles.btnGoogle} onClick={handleGoogleSignIn} disabled={loading}>
                    <span className={styles.googleIcon} />
                    Registrarse con Google
                </button>

                <p className={styles.footer}>
                    ¿Ya tenés cuenta? <Link to="/login">Iniciá sesión</Link>
                </p>
            </div>
        </div>
    );
}

export default RegisterPage;