# BEC-Github

🚀 **BEC-Github** es un cliente GitHub restringido para gestionar contenido en **Bitcoin Educational Content**.  

💡 **Proyecto en desarrollo** con **React + Vite + TailwindCSS** en el frontend y **Express + TypeScript** en el backend.

---

## **📌 Requisitos**
- **Node.js** `>=18`
- **pnpm** (`npm install -g pnpm`)
- **Git**

---

## **📥 Instalación**
### **1️⃣ Clonar el repositorio**
```bash
git clone https://github.com/TU_USUARIO/BEC-Github.git
cd BEC-Github
```

### **2️⃣ Instalar dependencias**
```bash
pnpm install
```

---

## **🚀 Ejecución**
### **1️⃣ Backend**
```bash
cd backend
pnpm dev
```
🔹 Servidor Express en `4000`.

### **2️⃣ Frontend**
```bash
pnpm dev
```
🔹 Cliente React en `5173`.

---

## **📂 Estructura**
```bash
BEC-Github/
│── backend/        # Express + TypeScript
│   ├── src/        # Código backend
│   ├── .env        # Variables de entorno
│── src/            # React + Vite
│   ├── assets/     # Imágenes y recursos
│   ├── components/ # Componentes
│   ├── pages/      # Páginas
│── public/         # Archivos estáticos
│── README.md       # Documentación
```

---

## **📌 Variables de entorno**
Crear `.env` en `backend/`:
```ini
PORT=4000
```

---

## **📌 Notas**
- Si el backend no reconoce `cors`:
  ```bash
  pnpm add -D @types/cors
  ```
- Si TailwindCSS falla:
  ```bash
  pnpm install
  ```

---

## **📌 Próximos pasos**
🔹 **Autenticación con GitHub.**  
🔹 **Interfaz para modificar archivos.**  
🔹 **Automatización de Pull Requests.**  

👨‍💻 **¡Contribuciones bienvenidas!** 🚀
### NOTA:
* **🛅🛅🛅Para ejecutar el servidor se requiere una llave de AES-256 que la podes generar con el comando openssl rand -hex 32 y luego guardar ese valor generado en ENCRYPTION_KEY en el archivo .env del Backend**
---
