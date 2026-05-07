import type { JSX } from "react";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../features/Authenticator";
import { addTask, subscribeToTasksByUser, updateTask, deleteTask } from "../services/taskService";
import type { Task } from "../types/task";
import { EmailSummaryButton } from "../components/EmailSummaryButton";
import styles from "./styles/Tasks.module.css";

function TasksPage(): JSX.Element {
    const { user, logOut } = useAuth();
    const uid = user?.uid || null;

    // Estados
    const [tasks,             setTasks          ] = useState<Task[]>([]);
    const [title,             setTitle          ] = useState("");
    const [description,       setDescription    ] = useState("");
    const [editingId,         setEditingId      ] = useState<string | null>(null);
    const [editTitle,         setEditTitle      ] = useState("");
    const [editDescription,   setEditDescription] = useState("");
    const [showForm,          setShowForm       ] = useState(false);
    const [loading,           setLoading        ] = useState(false);
    const [error,             setError          ] = useState<string | null>(null);

    const canSubmit = useMemo(
        () => Boolean(uid) && title.trim().length > 0 && !loading,
        [uid, title, loading]
    );

    // Suscripcion en tiempo real de tareas
    useEffect(() => {
        if (!uid) {
            setTasks([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        const unsubscribe = subscribeToTasksByUser(
            (data) => {
                setTasks(data);
                setLoading(false);
            },
            () => {
                setError("No se pudieron cargar las tareas.");
                setLoading(false);
            }
        );

        return unsubscribe;
    }, [uid]);

    // Handlers
    async function handleLogOut() {
        try { await logOut(); }
        catch { setError("No se pudo cerrar la sesión."); }
    }

    async function handleAddTask(e: React.FormEvent) {
        e.preventDefault();
        if (!uid) { setError("Necesitás iniciar sesión para crear tareas."); return; }
        const cleanTitle = title.trim();
        if (!cleanTitle) return;
        try {
            setLoading(true);
            setError(null);
            await addTask({ title: cleanTitle, description: description.trim() });
            setTitle("");
            setDescription("");
            setShowForm(false);
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : "Unknown error";
            if (message.toLowerCase().includes("permission") || message.toLowerCase().includes("insufficient")) {
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

    async function handleUpdateTask(e: React.FormEvent, taskId: string) {
        e.preventDefault();
        if (!editTitle.trim()) return;
        try {
            setLoading(true);
            setError(null);
            // LLama al servicio de actualización con los nuevos datos
            await updateTask(taskId, { title: editTitle.trim(), description: editDescription.trim() });
            setEditingId(null);
            setEditTitle("");
            setEditDescription("");
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
        <div className={styles.page}>
            <main className={styles.container}>

                {/* Cabecera */}
                <header className={styles.header}>
                    <h1 className={styles.title}>Mis tareas</h1>
                    <div className={styles.headerActions}>
                        {!showForm && (
                            <button className={styles.btnPrimary} onClick={() => setShowForm(true)}>
                                + Nueva tarea
                            </button>
                        )}
                        <button className={styles.btnLogOut} onClick={handleLogOut}>
                            Cerrar sesión
                        </button>
                    </div>
                </header>

                {/* Formulario nueva tarea */}
                {showForm && (
                    <form className={styles.formCard} onSubmit={handleAddTask}>
                        <input
                            className={styles.inputField}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Título de la tarea"
                            aria-label="Título de la tarea"
                            autoFocus
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

                {/* Mensajes de estado */}
                {error && (
                    <p className={`${styles.statusMessage} ${styles.statusError}`} role="alert">
                        {error}
                    </p>
                )}
                {loading && tasks.length === 0 && (
                    <p className={`${styles.statusMessage} ${styles.statusMuted}`}>
                        Cargando tareas...
                    </p>
                )}
                {!loading && !error && tasks.length === 0 && uid && (
                    <p className={`${styles.statusMessage} ${styles.statusMuted}`}>
                        No tenés tareas todavía. ¡Creá una!
                    </p>
                )}

                {/* Lista de tareas */}
                <section className={styles.taskList} aria-label="Lista de tareas">
                    {tasks.map((t) => (
                        <article
                            key={t.id}
                            className={`${styles.taskItem} ${t.completed ? styles.taskItemCompleted : ""}`}
                        >
                            {editingId === t.id ? (
                                /* Modo edición */
                                <form
                                    className={styles.editForm}
                                    onSubmit={(e) => handleUpdateTask(e, t.id)}
                                >
                                    <input
                                        className={styles.inputField}
                                        value={editTitle}
                                        onChange={(e) => setEditTitle(e.target.value)}
                                        autoFocus
                                        aria-label="Editar título"
                                    />
                                    <textarea
                                        className={styles.inputField}
                                        value={editDescription}
                                        onChange={(e) => setEditDescription(e.target.value)}
                                        aria-label="Editar descripción"
                                    />
                                    <div className={styles.formActions}>
                                        <button className={styles.btnSecondary} type="button" onClick={cancelEdit}>
                                            Cancelar
                                        </button>
                                        <button
                                            className={styles.btnPrimary}
                                            type="submit"
                                            disabled={loading || !editTitle.trim()}
                                        >
                                            {loading ? "..." : "Guardar"}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <>
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
                                            <p className={styles.taskDescription}>{t.description}</p>
                                        )}
                                    </div>
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
                        </article>
                    ))}
                </section>

                {/* Botón de resumen por email */}
                {uid && user?.email && (
                    <div className={styles.summarySection}>
                        <EmailSummaryButton
                            tasks={tasks}
                            userEmail={user.email}
                            className={styles.btnSecondary}
                        />
                    </div>
                )}

            </main>
        </div>
    );
}

// Sé que se podría haber organizado en más componentes, pero se hizo lo que se pudo con el tiempo que se tenía. <3

export default TasksPage;