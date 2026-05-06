import type { Timestamp } from "firebase/firestore";

//* Para Base de Datos
export type Task = {
    id: string;
    userId: string;
    title: string;
    description?: string;
    completed: boolean;
    createdAt?: Timestamp;
};

//* Para Usuario
export type NewTaskInput = {
    title: string;
    description?: string;
}
