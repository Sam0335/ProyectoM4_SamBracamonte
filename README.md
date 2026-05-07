# ProyectoM4 - Sam Bracamonte

Aplicación web de gestión de tareas construida con React, TypeScript y Vite. Permite registrar usuarios, iniciar sesión con email/contraseña o con Google, crear y administrar tareas personales almacenadas en Firestore y enviar por email un resumen del estado de esas tareas.

## URL del deploy en Vercel

https://proyectom4-sambracamonte.vercel.app

## Descripción del proyecto

La aplicación está pensada como una To-Do App con autenticación y persistencia en la nube. Cada usuario puede:

- Registrarse o iniciar sesión.
- Acceder a una vista protegida.
- Crear, editar, completar y eliminar tareas.
- Visualizar únicamente sus propias tareas.
- Enviarse un resumen por email con sus tareas pendientes y completadas.

El frontend consume Firebase Authentication para la sesión, Firestore para la persistencia y un endpoint serverless desplegable en Vercel para el envío de emails mediante AWS SES.

## Stack principal

- React 19
- TypeScript
- Vite
- React Router DOM
- Firebase Authentication
- Cloud Firestore
- AWS SES
- Vercel

## Decisiones arquitectónicas

### 1. Frontend SPA con React Router

Se eligió una arquitectura SPA porque el proyecto tiene una navegación simple y centrada en estados de usuario. Las rutas `/`, `/login`, `/register` y `/tasks` se resuelven del lado cliente, y `vercel.json` incluye un rewrite para que Vercel redirija cualquier ruta a `index.html`.

### 2. Autenticación centralizada con Context

La autenticación se encapsuló en `src/features/Authenticator.tsx` usando Context API. Eso permite exponer `user`, `loading`, `signUp`, `signIn`, `signInGoogle` y `logOut` a toda la app sin prop drilling.

### 3. Rutas protegidas

La pantalla de tareas está protegida con `RequireAuth`, de modo que un usuario no autenticado no puede entrar a `/tasks`. Esto mantiene la lógica de acceso separada del resto de la UI.

### 4. Servicios separados para acceso a datos

La lógica de Firestore quedó en `src/services/taskService.ts`. Esta separación evita mezclar la UI con las operaciones CRUD y hace más claro el mantenimiento del proyecto.

### 5. Backend mínimo con función serverless

El envío de emails no se hace directamente desde el frontend. En su lugar, el botón de resumen llama al endpoint `api/send-email.ts`, que usa AWS SES del lado servidor. Esta decisión evita exponer credenciales sensibles en el cliente.

### 6. Aislamiento de datos por usuario

Las tareas se consultan filtrando por `userId`, y al eliminar una tarea se verifica además que pertenezca al usuario autenticado. Esto refuerza el modelo de datos por usuario.

## Estructura general

```text
src/
  ↳ components/        # Componentes reutilizables
  ↳ features/          # Auth context y validaciones de autenticación
  ↳ pages/             # Pantallas principales
  ↳ services/          # Firebase config y lógica de Firestore
  ↳ types/             # Tipos de TypeScript
  ↳ api/
    ↳ send-email.ts      # Función serverless para enviar resúmenes por email
```

## Instrucciones de instalación

### Requisitos previos

- Node.js 18 o superior
- npm
- Un proyecto de Firebase con Authentication y Firestore habilitado como base de datos.
- Una cuenta/configuración de AWS SES con un email verificado

### Firebase Authentication

Hay que habilitar:

- Email/Password
- Google Sign-In

### Firestore

Debe existir la colección `tasks`. Cada documento sigue esta estructura lógica:

```ts
{
  userId: string;
  title: string;
  description?: string;
  completed: boolean;
  createdAt?: Timestamp;
}
```
## Pasos para desplegar en local

1. Clonar el repositorio:

```bash
git clone https://github.com/Sam0335/ProyectoM4_SamBracamonte.git
cd ProyectoM4_SamBracamonte
```

2. Instalar dependencias:

```bash
npm install
```

3. Crear el archivo de entorno a partir del ejemplo:

```bash
cp .env.example .env
```

4. Completar las variables de entorno con tus propias credenciales.

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_APP_ID=

AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
AWS_VERIFIED_EMAIL=
```

 Variables de AWS SES:

- `AWS_ACCESS_KEY_ID`: access key con permisos para enviar emails.
- `AWS_SECRET_ACCESS_KEY`: secret key correspondiente.
- `AWS_REGION`: región donde está configurado SES.
- `AWS_VERIFIED_EMAIL`: email verificado en SES que se usa como remitente.

5. Levantar el entorno local:

```bash
npm run dev
```

6. Para generar build de producción:

```bash
npm run build
```


## Uso de IA en el proceso de trabajo

La IA se integró como herramienta de apoyo durante el desarrollo y la documentación. Su mayor valor estuvo en acelerar tareas como el orden de ideas, la reestructuración de código, la clarificación de dudas y la revisión de redacción.

Entre las buenas prácticas que deja su uso en este proyecto:

- Usar IA para iterar más rápido, pero no para aceptar respuestas sin validar primero.
- Mantener separadas las credenciales y la lógica sensible del frontend.
- Pedir ayuda para documentar y clarificar decisiones técnicas o estéticas.
- Contrastar siempre las sugerencias con el contexto real del proyecto.
