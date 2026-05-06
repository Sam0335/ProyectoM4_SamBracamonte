import type { JSX } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../features/Authenticator";

function LandingPage(): JSX.Element {
    const { user } = useAuth();
    return (
        <div>
            <h1>Bienvenido</h1>
            <hr />
            <p>Selecciona una opción para continuar</p>

            <div>
                <Link to="/login">
                    <button>Iniciar sesión</button>
                </Link>
                <br />

                <Link to="/register">
                    <button>Registrarse</button>
                </Link>
                <br />
                <hr />

                {user && (
                    <>
                        <h2>Ya estas logeado...</h2>
                        <Link to="/tasks">
                            <button>Ir al panel de usuario</button>
                        </Link>
                    </>
                )}
            </div>
        </div>
    );
}

export default LandingPage;
