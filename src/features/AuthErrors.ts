interface FirebaseAuthError {
  code: string;
  message: string;
}

const errorMessages: Record<string, string> = {
  "auth/invalid-credential": "Email o contraseña incorrectos.",
  "auth/user-not-found": "No existe una cuenta con este correo.",
  "auth/wrong-password": "Email o contraseña incorrectos.",
  "auth/email-already-in-use": "Ese email ya está registrado.",
  "auth/invalid-email": "El email no es válido.",
  "auth/weak-password": "La contraseña es muy débil (mínimo 6 caracteres).",
  "auth/too-many-requests": "Demasiados intentos. Probá más tarde.",
};

export function getAuthErrorMessage(error: unknown): string {
  const firebaseError = error as FirebaseAuthError;
  return errorMessages[firebaseError.code] || "Error de autenticación. Intentalo de nuevo.";
}

export function validateEmail(email: string): string {
  if (!email) return "El email es requerido";
  if (!email.includes("@")) return "El email debe contener @";
  const [domain] = email.split("@");
  if (!domain || !domain.includes(".")) return "El email debe tener un punto después del @";
  return "";
}

export function validatePassword(password: string): string {
  if (!password) return "La contraseña es requerida";
  if (password.length <= 6) return "La contraseña debe tener mínimo 6 caracteres";
  if (password.length >= 20) return "La contraseña debe tener máximo 20 caracteres"
  return "";
}





