# 🚀 Guía de Build y Deployment

## 📋 Scripts Disponibles

### Desarrollo
```bash
npm run dev
```
- Ejecuta la aplicación en modo desarrollo con **nodemon**
- Recarga automáticamente cuando detecta cambios en archivos `.ts`
- No requiere compilación previa
- Ideal para desarrollo local

### Build (Compilación)
```bash
npm run build
```
- Compila el código TypeScript a JavaScript
- Copia las vistas `.ejs` al directorio `dist`
- Genera la carpeta `dist/` lista para producción

**Proceso del build:**
1. `tsc` - Compila archivos `.ts` → `.js` en `dist/`
2. `copy-views` - Copia `src/views/` → `dist/views/`

### Producción
```bash
npm start
```
- Ejecuta la aplicación compilada desde `dist/app.js`
- **Requiere haber ejecutado `npm run build` primero**
- Usa Node.js directamente (sin ts-node)
- Mejor rendimiento que modo desarrollo

### Limpieza
```bash
npm run clean
```
- Elimina completamente la carpeta `dist/`
- Útil antes de hacer un build limpio

---

## 🔄 Flujo de Trabajo Completo

### Para Desarrollo Local
```bash
# Opción 1: Modo desarrollo (recomendado)
npm run dev

# Opción 2: Build + Start
npm run build
npm start
```

### Para Producción
```bash
# 1. Limpiar build anterior (opcional)
npm run clean

# 2. Compilar aplicación
npm run build

# 3. Iniciar servidor
npm start
```

---

## 📁 Estructura de Directorios

### Antes del Build
```
sysadmin-forum/
├── src/
│   ├── app.ts
│   ├── modules/
│   ├── shared/
│   └── views/          ← Vistas EJS aquí
│       ├── layout/
│       ├── auth/
│       ├── home/
│       └── ...
├── public/             ← Archivos estáticos (CSS, JS, imágenes)
└── package.json
```

### Después del Build
```
sysadmin-forum/
├── dist/               ← Código compilado
│   ├── app.js         ← Punto de entrada compilado
│   ├── modules/       ← Módulos compilados (.js)
│   ├── shared/        ← Utilidades compiladas (.js)
│   └── views/         ← Vistas EJS copiadas
│       ├── layout/
│       ├── auth/
│       └── ...
├── public/            ← Se sirve directamente (no se copia)
└── ...
```

---

## ⚙️ Configuración de Rutas

### En `app.ts`
```typescript
// Configuración de vistas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Archivos estáticos
app.use(express.static(path.join(__dirname, '../public')))
```

**Importante:**
- En desarrollo: `__dirname` = `src/`
- En producción: `__dirname` = `dist/`
- Las vistas se buscan en `views/` relativo a `__dirname`
- Los archivos estáticos siempre están en `../public` (un nivel arriba)

---

## 🐛 Solución de Problemas

### Error: "Cannot find module 'views/...'"
**Causa:** Las vistas no se copiaron a `dist/`

**Solución:**
```bash
npm run build  # Asegúrate de usar el build completo
```

### Error: "Cannot find static files"
**Causa:** La ruta a `public/` es incorrecta

**Verificar en `app.ts`:**
```typescript
app.use(express.static(path.join(__dirname, '../public')))
```

### La aplicación no refleja cambios
**En desarrollo:**
```bash
npm run dev  # Usa nodemon para auto-reload
```

**En producción:**
```bash
npm run clean
npm run build
npm start
```

---

## 📝 Notas Importantes

1. **Siempre ejecuta `npm run build` antes de `npm start`**
   - `npm start` ejecuta el código compilado en `dist/`
   - Si no hay build, no habrá nada que ejecutar

2. **Los archivos en `public/` NO se copian a `dist/`**
   - Se sirven directamente desde `public/`
   - No es necesario copiarlos

3. **Las vistas `.ejs` SÍ se copian a `dist/views/`**
   - Express las busca en `dist/views/` cuando está en producción
   - El script `copy-views` se encarga de esto

4. **Modo desarrollo vs Producción**
   - Desarrollo: `npm run dev` (usa ts-node, no requiere build)
   - Producción: `npm run build && npm start` (usa node, requiere build)

---

## 🚀 Deployment a Servidor

### Preparación
```bash
# 1. Asegúrate de tener todas las dependencias
npm install

# 2. Compila la aplicación
npm run build

# 3. Verifica que dist/ se creó correctamente
dir dist  # Windows
ls dist   # Linux/Mac
```

### Variables de Entorno
Crea un archivo `.env` en producción:
```env
PORT=4000
JWT_SECRET=tu_clave_secreta_super_segura
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=sysadmin_db
```

### Iniciar en Producción
```bash
npm start
```

### Con PM2 (Recomendado para producción)
```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar aplicación
pm2 start dist/app.js --name "sysadmin-forum"

# Ver logs
pm2 logs sysadmin-forum

# Reiniciar
pm2 restart sysadmin-forum

# Detener
pm2 stop sysadmin-forum
```

---

## ✅ Checklist Pre-Deployment

- [ ] Ejecutar `npm run clean`
- [ ] Ejecutar `npm run build`
- [ ] Verificar que `dist/views/` contiene todas las vistas
- [ ] Verificar que `dist/modules/` contiene todos los módulos
- [ ] Configurar variables de entorno (`.env`)
- [ ] Probar localmente con `npm start`
- [ ] Verificar conexión a base de datos
- [ ] Verificar que archivos estáticos se sirven correctamente

---

## 📚 Recursos Adicionales

- [TypeScript Compiler Options](https://www.typescriptlang.org/tsconfig)
- [Express.js Static Files](https://expressjs.com/en/starter/static-files.html)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
