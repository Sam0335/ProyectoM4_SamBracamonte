import { useState } from "react";
import type { Task } from "../types/task";

type EmailSummaryButtonProps = {
  tasks: Task[];
  userEmail: string; // Recibe el email del usuario logueado
  endpoint?: string; // Por defecto usa la ruta de nuestro endpoint
  className?: string; // Para poder pasarle estilos desde el TasksPage
};

export const EmailSummaryButton = ({
  tasks,
  userEmail,
  endpoint = "/api/send-email",
  className,
}: EmailSummaryButtonProps) => {
  // Maneja 4 estados
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  // Estructura del texto del correo
  const buildSummary = (tasks: Task[]) => {
    // Filtros de tareas por estado de completado
    const pending = tasks.filter((t) => !t.completed);
    const completed = tasks.filter((t) => t.completed);

    let summaryText = "Resumen de tus tareas:\n\n";

    if (pending.length > 0) {
      summaryText += "💔 TAREAS PENDIENTES:\n";
      summaryText += "------------------------\n";
      pending.forEach((t) => {
        summaryText += `• ${t.title}\n`;
        if (t.description) {
          summaryText += `  ↳ ${t.description}\n`;
        }
        summaryText += "\n";
      });
    }

    if (completed.length > 0) {
      summaryText += "❤️ TAREAS COMPLETADAS:\n";
      summaryText += "------------------------\n";
      completed.forEach((t) => {
        summaryText += `- ${t.title}\n`;
        if (t.description) {
          summaryText += `  ↳ ${t.description}\n`;
        }
        summaryText += "\n";
      });
    }

    if (tasks.length === 0) {
      summaryText += "No tenés tareas en tu lista.\n";
    }

    return summaryText;
  };

  const handleSend = async () => {
      // Evita hacer mas llamados si ya está procesando el envio o no hay email
    if (status === "loading" || !userEmail) return;
    
    setStatus("loading");

    const bodyText = buildSummary(tasks);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: userEmail,
          subject: "Resumen de tus tareas",
          body: bodyText,
        }),
      });

      if (response.ok) {
        setStatus("success");
      } else {
        setStatus("error");
      }
    } catch (err) {
      setStatus("error");
    } finally {
      // Después de 3 segundos, sin importar el resultado, vuelve al estado inicial
      setTimeout(() => {
        setStatus("idle");
      }, 3000);
    }
  };

  return (
    <button
      onClick={handleSend}
      disabled={status === "loading" || !userEmail}
      className={className}
    >
      {status === "idle" && "Enviar resumen por email"}
      {status === "loading" && "Enviando..."}
      {status === "success" && "¡Enviado!"}
      {status === "error" && "Error al enviar"}
    </button>
  );
};