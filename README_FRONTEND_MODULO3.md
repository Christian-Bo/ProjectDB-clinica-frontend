# Frontend modulo 3 - Recepcion, tickets y pantalla publica

## Objetivo
Este parche convierte el frontend base en una interfaz moderna premium para el modulo 3.

## Caracteristicas principales
- Paleta centralizada en una clase reutilizable: `src/theme/clinicaTheme.ts`
- CSS basado en variables para evitar sobrecarga y repeticion
- Toasts globales con estilos unificados por tipo
- Modales reutilizables para seleccion guiada
- Listas amigables con nombres y contexto, no ids visibles
- Integracion con backend del modulo 3 en Railway
- Vista especial para pantalla publica: `/pantalla-publica`

## Variable importante
Crea un archivo `.env.local` con:

```env
NEXT_PUBLIC_API_URL=https://projectdb-clinica-production.up.railway.app
NEXT_PUBLIC_API_TIMEOUT_MS=15000
```

## Comandos
```bash
npm install
npm run build
npm run dev
```

## Rutas
- `/` Dashboard operativo de recepcion
- `/pantalla-publica` Vista de pantalla publica premium

## Observacion
La app consume solamente los endpoints ya implementados en tu backend del modulo 3.
