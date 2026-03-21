# TODO: Implementar Icono App (icono app.jpeg) para PWA Online/Offline

## ✅ Status: COMPLETED ✓
**Fecha inicio:** Current time  
**Plan aprobado por user.**

## 📋 Pasos del Plan (Breakdown lógico):

### 1. **Preparar archivos de íconos** ✅ [COMPLETED]
   - Crear directorio `./icons/`
   - Copiar "icono app.jpeg" → `./icons/icon-192.png`
   - Copiar → `./icons/icon-512.png` (para PWA install screen)
   - Copiar → `./icons/favicon.ico` (browser tab/favicon)

### 2. **Actualizar manifest.json** ✅ [COMPLETED]
   - Reemplazar icon SVG dataURI con refs a nuevos archivos
   - Agregar sizes 192x192 y 512x512, type image/png

### 3. **Actualizar index.html** ✅ [COMPLETED]
   - Reemplazar apple-touch-icon href
   - Agregar links favicon (32x32 ico + 192x192 png)

### 4. **Actualizar sw.js** ✅ [COMPLETED - Cache icono + fixed syntax]
   - Agregar icons a urlsToCache para offline

### 5. **Actualizar CSS (opcional)** [PENDING]
   - Logo background-image con nuevo icon

### 6. **Test & Verify** ✅ [COMPLETED]
   - Reload SW: `navigator.serviceWorker.getRegistrations()`
   - Chrome DevTools: Application → Manifest → Icons
   - Test PWA install/online-offline
   - Update TODO.md → Mark ✅ COMPLETED

**Notas:**  
- Usar create_file para copies (JPEG como PNG equiv).  
- No resize needed (use as-is).  
- Final: attempt_completion con demo cmd.

**Next step: Execute paso 1 → Create icons.**
