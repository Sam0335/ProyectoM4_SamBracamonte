import type { JSX } from "react";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../features/Authenticator";
import { addTask, getTasksByUser, updateTask, deleteTask } from "../services/taskService";
import type { Task } from "../types/task";
import { EmailSummaryButton } from "../components/EmailSummaryButton";
import styles from "./styles/Tasks.module.css";

function TasksPage(): JSX.Element {

    // Estados
    const [tasks, setTasks] = useState<Task[]>([]);
    const [title, setTitle] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Verifica si el usuario está logueado y obtiene su ID
    const { user, logOut } = useAuth();
    const uid = user?.uid || null;

    const [showForm, setShowForm] = useState(false);

    // Controla si el formulario de nueva tarea está visible o no
    const canSubmit = useMemo(() => {
        return Boolean(uid) && title.trim().length > 0 && !loading;
    }, [uid, title, loading]);

    // Hook que se ejecuta cuando el componente se monta o cuando el usuario cambia.
    useEffect(() => {
        if (!uid) {
            setTasks([]);
            return;
        }

        let cancelled = false;

        (async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await getTasksByUser();
                if (!cancelled) setTasks(data);
            } catch {
                if (!cancelled) setError("No se pudieron cargar las tareas.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => { cancelled = true; };
    }, [uid]);

    // Cierra sesión
    async function handleLogOut() {
        try {
            await logOut();
        } catch {
            setError("No se pudo cerrar la sesión.");
        }
    }
    
    // Se ejecuta cuando se envía el formulario de nueva tarea
    async function handleAddTask(e: React.FormEvent) {
        e.preventDefault();
        if (!uid) {
            setError("Necesitás iniciar sesión para crear tareas.");
            return;
        }

        const cleanTitle = title.trim();
        if (!cleanTitle) return;

        try {
            setLoading(true);
            setError(null);

            const created = await addTask({
                title: cleanTitle,
                description: description.trim(),
            });

            setTitle("");
            setDescription("");
            setShowForm(false);
            setTasks((prev) => [created, ...prev]);

        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : "Unknown error";
            if (e instanceof Error) console.log(e.message);

            if (
                message.toLowerCase().includes("permission") ||
                message.toLowerCase().includes("insufficient")
            ) {
                setError("Permisos insuficientes (permission-denied). Revisá Firestore Rules.");
                return;
            }
            setError("No se pudo crear la tarea.");
        } finally {
            setLoading(false);
        }
    }

    function startEditing(task: Task) {
        setEditingId(task.id);
        setEditTitle(task.title);
        setEditDescription(task.description || "");
}

    function cancelEdit() {
        setEditingId(null);
        setEditTitle("");
        setEditDescription("");
    }
    
    async function handleUpdateTask(taskId: string) {
        if (!editTitle.trim()) return;
        try {
            setLoading(true);
            setError(null);
            // Llama al servicio de actualización con los nuevos datos
            await updateTask(taskId, {
                title: editTitle.trim(),
                description: editDescription.trim(),
            });
            // Actualización optimista del estado local
            setTasks((prev) =>
                prev.map((t) =>
                    t.id === taskId 
                        ? { ...t, title: editTitle.trim(), description: editDescription.trim() } 
                        : t
                )
            );
            setEditingId(null);
        } catch {
            setError("No se pudo actualizar la tarea.");
        } finally {
            setLoading(false);
        }
    }
    
    // Envía el estado invertido del campo completed a Firestore y actualiza sin re-fetch
    async function handleToggle(task: Task) {
        const newCompleted = !task.completed;
        try {
            setError(null);
            await updateTask(task.id, { completed: newCompleted });
            setTasks((prev) =>
                prev.map((t) =>
                    t.id === task.id ? { ...t, completed: newCompleted } : t
                )
            );
        } catch {
            setError("No se pudo actualizar la tarea.");
        }
    }

    // Valida usuario y elimina la tarea especifica de la lista
    async function handleDelete(taskId: string) {
        if (!uid) return;
        try {
            setError(null);
            await deleteTask(taskId);
            setTasks((prev) => prev.filter((t) => t.id !== taskId));
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "No se pudo eliminar la tarea.");
        }
    }

    // Cierra el formulario y limpia los campos
    function handleCancelForm() {
        setShowForm(false);
        setTitle("");
        setDescription("");
        setError(null);
    }

    return (
        <main className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Mis tareas</h1>

                {/*Botón que activa el formulario de nueva tarea*/}
                {!showForm && (
                    <button className={styles.btnPrimary} onClick={() => setShowForm(true)}>
                        + Nueva tarea
                    </button>
                )}

                <button className={styles.btnPrimary} onClick={handleLogOut}>Cerrar Sesión</button>
            </header>

            {/*Formulario para agregar tareas*/}
            {showForm && (
                <form className={styles.formCard} onSubmit={handleAddTask}>
                    <input
                        className={styles.inputField}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Título"
                        aria-label="Título de la tarea"
                    />

                    <textarea
                        className={styles.inputField}
                        value={description}
                        rows={3}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Descripción (opcional)"
                        aria-label="Descripción de la tarea"
                    />

                    <div className={styles.formActions}>
                        <button className={styles.btnSecondary} type="button" onClick={handleCancelForm}>
                            Cancelar
                        </button>
                        <button className={styles.btnPrimary} type="submit" disabled={!canSubmit}>
                            {loading ? "Guardando..." : "Agregar"}
                        </button>
                    </div>
                </form>
            )}

            {/*Mensajes de error*/}
            {error && <p className={`${styles.message} ${styles.messageError}`} role="alert">{error}</p>}

            {/*También mensajes pero de carga*/}
            {loading && tasks.length === 0 && <p className={styles.message}>Cargando tareas...</p>}

            {/*También mensajes pero cuando no hay tareas*/}
            {!loading && !error && tasks.length === 0 && uid && (
                <p className={`${styles.message} ${styles.messageEmpty}`}>No tenés tareas todavía.</p>
            )}

            {/*Lista de tareas*/}
            <section className={styles.taskList}>
                {tasks.map((t) => (
                    <div className={styles.taskItem} key={t.id}>

                        {/*Si la tarea se está editando mostramos el formulario de edicion*/}
                        {editingId === t.id ? (
                            <div className={styles.editModeContainer}>
                                <input
                                    className={styles.inputField}
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    autoFocus
                                />
                                <textarea
                                    className={styles.inputField}
                                    value={editDescription}
                                    onChange={(e) => setEditDescription(e.target.value)}
                                />

                                {/*Botones para guardar o cancelar la edicion*/}
                                <div className={styles.formActions}>
                                    <button className={styles.btnSecondary} onClick={cancelEdit}>
                                        Cancelar
                                    </button>

                                    <button 
                                        className={styles.btnPrimary} 
                                        onClick={() => handleUpdateTask(t.id)}
                                        disabled={loading || !editTitle.trim()}
                                    >
                                        {loading ? "..." : "Guardar"}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/*Si no se está editando muestra la tarea normalmente*/}
                                <input
                                    className={styles.taskCheckbox}
                                    type="checkbox"
                                    checked={t.completed}
                                    onChange={() => handleToggle(t)}
                                    aria-label={`Marcar "${t.title}" como completada`}
                                />

                                <div className={styles.taskContent}>
                                    <span className={`${styles.taskTitle} ${t.completed ? styles.taskTitleCompleted : ""}`}>
                                        {t.title}
                                    </span>
                                    {!t.completed && t.description && (
                                        <p className={styles.taskDescription}>{t.description}</p>)}
                                </div>

                                {/*Acciones de la tarea (editar o eliminar)*/}
                                <div className={styles.taskActions}>
                                    {!t.completed && (
                                        <button className={styles.btnSecondary} onClick={() => startEditing(t)}>
                                            Editar
                                        </button>
                                    )}
                                    <button className={styles.btnDanger} onClick={() => handleDelete(t.id)}>
                                        Eliminar
                                    </button>

                                </div>
                            </>
                        )}
                    </div>
                ))}
            </section>

            {/*Si el usuario está logueado y tiene email, se muestra el botón de enviar resumen*/}
            {uid && user?.email && (
                <EmailSummaryButton 
                    tasks={tasks} 
                    userEmail={user.email} 
                    className={styles.btnPrimary}
                />
            )}

        </main>
    );
}

// Sé que se podría haber organizado en más componentes, pero se hizo lo que se pudo con el tiempo que se tenía. <3

export default TasksPage;