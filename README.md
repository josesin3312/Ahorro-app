# 💰 Control de Ahorro Mensual (PWA)

Aplicación web progresiva (PWA) para la gestión de finanzas personales, control de depósitos, retiros y seguimiento de metas de ahorro.

## 🚀 Características Principales

- **Base de Datos Local (IndexedDB):** Almacenamiento persistente de alta velocidad y capacidad sin los límites de `localStorage`.
- **Soporte Offline Completo (PWA):** Funciona totalmente sin conexión a internet gracias a Service Workers y un archivo de Manifiesto web.
- **Gráficos Financieros Interactivos:** Visualización de tendencias de ingresos y egresos por mes con Chart.js.
- **Respaldo y Exportación de Datos:** Exportación a formato CSV e importación/exportación de respaldos en JSON.
- **Diseño Moderno y Responsivo:** Interfaz adaptable a computadoras, tablets y teléfonos móviles en modo oscuro.

## 🛠️ Tecnologías Utilizadas

- **HTML5 / CSS3** (CSS Grid, Flexbox, CSS Variables)
- **JavaScript Vanilla (ES6+)**
- **IndexedDB API**
- **Service Workers & Web App Manifest**
- **Chart.js**

## 📂 Estructura del Proyecto

```text
├── index.html        # Estructura principal y marcadores
├── styles.css        # Estilos visuales y diseño responsivo
├── app.js            # Lógica de la aplicación e integración con IndexedDB
├── sw.js             # Service Worker para almacenamiento en caché offline
├── manifest.json     # Configuración para la instalación PWA
├── icon-512x512.png  # Ícono oficial de la aplicación
└── README.md         # Documentación del proyecto