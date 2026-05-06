import { useState, type JSX, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../features/Authenticator";
import { getAuthErrorMessage, validateEmail, validatePassword } from "../features/AuthErrors";

function LoginPage(): JSX.Element {
    const { signIn, signInGoogle } = useAuth();

    const navigate = useNavigate();
    const location = useLocation();

    // Si RequireAuth redirigió al usuario acá, guarda a dónde quería ir originalmente
    const from = location.state?.from?.pathname || "/tasks";

    // Estado del formulario — cada campo tiene su propio useState (form controlado)
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    // error: mensaje visible al usuario | loading: evita doble submit mientras espera Firebase
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // handleSubmit recibe el evento del <form> — tipo FormEvent<HTMLFormElement>
    async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
        // Sin esto el browser recarga la página (comportamiento default de HTML forms)
        e.preventDefault();

        // Validamos en el cliente antes de llamar a Firebase — más rápido y sin costo
        const emailError = validateEmail(email);
        if (emailError) { setError(emailError); return; }

        const passwordError = validatePassword(password);
        if (passwordError) { setError(passwordError); return; }

        setError("");
        setLoading(true); // Deshabilitamos el botón mientras espera la respuesta
        try {
            await signIn(email, password);
            navigate(from, { replace: true }); // replace: true evita que "atrás" vuelva al login
        } catch (error) {
            setError(getAuthErrorMessage(error));
        } finally {
            // finally se ejecuta siempre, haya error o no — el botón vuelve a habilitarse
            setLoading(false);
        }
    }

    // Google no usa los inputs del form, por eso tiene su propio handler fuera del <form>
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
        <div>
            <h1>Iniciar sesión</h1>
            <hr />

            {/* onSubmit va en el <form>, no en el botón — así Enter también dispara el submit */}
            <form onSubmit={handleSubmit}>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <br />

                <input
                    type="password"
                    placeholder="Contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <br />

                {/* Solo se renderiza si hay un mensaje de error */}
                {error && <p style={{ color: "red" }}>{error}</p>}

                {/* type="submit" dispara el onSubmit del form | disabled previene doble envío */}
                <button type="submit" disabled={loading}>
                    {loading ? "Iniciando sesión..." : "Iniciar sesión"}
                </button>
            </form>

            {/* Fuera del form — Google no necesita los inputs */}
            <button onClick={handleGoogleSignIn} disabled={loading}>
                Iniciar sesión con Google
            </button>

            <p>¿No tenés cuenta? <Link to="/register">Registrate</Link></p>
        </div>
    );
}

export default LoginPage;