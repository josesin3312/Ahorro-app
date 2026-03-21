# TODO: Gráfica + PWA Service Worker ✅ COMPLETADO

## ✅ Gráfica de Barras (Original)
- **Posición superior** (después dashboard).
- Acumulado depósitos mes-mes (curva subiendo).
- Verde responsive Chart.js, actualiza live.

## ✅ Service Worker PWA (Nuevo)
### Archivos creados:
- **`sw.js`**: Cache app (network-first + offline fallback).
- **`manifest.json`**: Icono/app name para install.

### Integración:
- **index.html**: `<link rel="manifest">` + SW register.
- **Funciona**: 
  - ✅ Online: Rápido (cache assets).
  - ✅ Offline: App carga + LocalStorage persiste datos.
  - ✅ Install como app (Chrome/Android).

## 🔧 Probar PWA:
```
1. Abre index.html (Chrome)
2. DevTools > Application > Service Workers → Registrado ✅
3. Offline toggle → App sigue funcionando (datos safe).
4. Address bar → "Instalar app" icono 🏠
```

**Reversible**: Borra `sw.js`, `manifest.json`, script SW.

¡**App completa PWA con gráfica**! 💰📱
