import {
    collection,
    addDoc,
    getDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    serverTimestamp,
    doc,
    updateDoc,
    onSnapshot,
    type Unsubscribe,
} from "firebase/firestore";
import { db, auth } from "./firebase.config";
import type { Task, NewTaskInput } from "../types/task";

// Verificar si el usuario está autenticado y lanzar error si no lo está
function checkAuth() {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error("No estás autenticado. Inicia sesión para crear tareas.");
    return userId;
}

// Suscribe las tareas del usuario actual en tiempo real
export function subscribeToTasksByUser(
    onTasksChange: (tasks: Task[]) => void,
    onError?: (error: Error) => void
): Unsubscribe {
    const userId = checkAuth();

    const taskQuery = query(
        collection(db, "tasks"), 
        where("userId", "==", userId), 
        orderBy("createdAt", "desc")
    );

    return onSnapshot(
        taskQuery,
        (snapshot) => {
            const tasks = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data() as Omit<Task, "id">,
            }));

            onTasksChange(tasks);
        },
        (error) => {
            onError?.(error);
        }
    );
}

// Crea una tarea
export async function addTask(input: NewTaskInput): Promise<Task> {
    const userId = checkAuth();

    const payload: Omit<Task, "id"> = {
        userId,
        title: input.title,
        description: input.description || "",
        completed: false,
        createdAt: serverTimestamp() as unknown as Task["createdAt"],
    };

    const docRef = await addDoc(collection(db, "tasks"), payload);
    return { id: docRef.id, ...payload };
}

// Actualiza una tarea existente
export async function updateTask(taskId: string, updates: Partial<Omit<Task, "id" | "userId" | "createdAt">>): Promise<void> {
    const docRef = doc(db, "tasks", taskId);
    await updateDoc(docRef, { ...updates });
}

// Elimina una tarea por su ID
export async function deleteTask(taskId: string): Promise<void> {
    try {
        const userId = checkAuth();

        const ref = doc(db, "tasks", taskId);
        const snap = await getDoc(ref);
    
        if (!snap.exists()) {
            throw new Error("Tarea no encontrada");
        }
        
        const task = snap.data() as Omit<Task, "id">;
    
        if (task.userId !== userId) {
            throw new Error("No estas autorizado para eliminar esta tarea");
        }
    
        await deleteDoc(ref);
    } catch (e) {
    const message =
      e instanceof Error ? e.message : "Unknown error";
    if (
      message.toLowerCase().includes("permission") ||
      message.toLowerCase().includes("insufficient")
    ) {
      throw new Error(
        "Permisos insuficientes (Reglas de Firestore)."
      );
    }
    throw new Error(message || "No se pudo eliminar la tarea.");
  }
}
