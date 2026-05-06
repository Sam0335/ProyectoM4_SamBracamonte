import { useState, type JSX, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../features/Authenticator";
import { getAuthErrorMessage, validateEmail, validatePassword } from "../features/AuthErrors";

function RegisterPage(): JSX.Element {
    const { signUp, signInGoogle } = useAuth();

    const navigate = useNavigate();
    const location = useLocation();

    // Si RequireAuth redirigió al usuario acá, guarda a dónde quería ir originalmente
    const from = location.state?.from?.pathname || "/tasks";

    // Estado del formulario — form controlado: React maneja el valor de cada input
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    // error: mensaje visible al usuario | loading: evita doble submit mientras espera Firebase
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // handleSubmit recibe el evento del <form> — tipo FormEvent<HTMLFormElement>
    async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
        // Sin esto el browser recarga la página (comportamiento default de HTML forms)
        e.preventDefault();

        // Validamos en el cliente antes de llamar a Firebase — más rápido y sin costo de red
        const emailError = validateEmail(email);
        if (emailError) { setError(emailError); return; }

        const passwordError = validatePassword(password);
        if (passwordError) { setError(passwordError); return; }

        setError("");
        setLoading(true); // Deshabilitamos el botón mientras espera la respuesta
        try {
            await signUp(email, password);
            navigate(from, { replace: true }); // replace: true evita que "atrás" vuelva al register
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
        <div>
            <h1>Crear cuenta</h1>
            <hr />

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

                {error && <p style={{ color: "red" }}>{error}</p>}

                <button type="submit" disabled={loading}>
                    {loading ? "Creando cuenta..." : "Registrarse"}
                </button>
            </form>

            <button onClick={handleGoogleSignIn} disabled={loading}>
                Registrarse con Google
            </button>

            <p>¿Ya tenés cuenta? <Link to="/login">Iniciá sesión</Link></p>
        </div>
    );
}

export default RegisterPage;
