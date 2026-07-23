// ==========================================
// CONTROL DE AHORRO MENSUAL - INDEXEDDB CORE
// ==========================================

const DB_NAME = 'AhorrosDB';
const DB_VERSION = 1;
let db = null;

let transacciones = [];
let metaAhorro = parseFloat(localStorage.getItem('meta_ahorro_val')) || 10000.00;
let chartAhorrosInstance = null;

// --- 1. INICIALIZACIÓN Y CONEXIÓN A INDEXEDDB ---
document.addEventListener('DOMContentLoaded', () => {
  // Establecer fecha de hoy por defecto
  const inputFecha = document.getElementById('txtFecha');
  if (inputFecha) {
    const hoy = new Date().toISOString().split('T')[0];
    inputFecha.value = hoy;
  }

  initDB();

  // Event Listeners
  document.getElementById('formTransaccion').addEventListener('submit', agregarTransaccion);
  document.getElementById('btnDefinirMeta').addEventListener('click', definirMeta);
  document.getElementById('txtBuscar').addEventListener('input', filtrarHistorial);
  document.getElementById('btnExportCSV').addEventListener('click', exportarCSV);
  document.getElementById('btnExportJSON').addEventListener('click', exportarJSON);
  document.getElementById('btnImportJSON').addEventListener('click', () => document.getElementById('fileImportJSON').click());
  document.getElementById('fileImportJSON').addEventListener('change', importarJSON);
});

function initDB() {
  const request = indexedDB.open(DB_NAME, DB_VERSION);

  request.onupgradeneeded = (e) => {
    db = e.target.result;
    if (!db.objectStoreNames.contains('transacciones')) {
      const store = db.createObjectStore('transacciones', { keyPath: 'id', autoIncrement: true });
      store.createIndex('fecha', 'fecha', { unique: false });
      store.createIndex('tipo', 'tipo', { unique: false });
    }
  };

  request.onsuccess = (e) => {
    db = e.target.result;
    cargarTransacciones();
  };

  request.onerror = (e) => {
    console.error('Error al abrir IndexedDB:', e.target.error);
  };
}

// --- 2. CARGAR Y RENDERIZAR DATOS ---
function cargarTransacciones() {
  const tx = db.transaction('transacciones', 'readonly');
  const store = tx.objectStore('transacciones');
  const request = store.getAll();

  request.onsuccess = () => {
    transacciones = request.result || [];
    actualizarInterfaz();
  };
}

function actualizarInterfaz() {
  calcularResumen();
  renderizarTabla(transacciones);
  renderizarGrafico();
}

// --- 3. CÁLCULO DE RESUMEN Y METAS ---
function calcularResumen() {
  let totalDep = 0;
  let totalRet = 0;

  transacciones.forEach(t => {
    if (t.tipo === 'deposito') totalDep += t.monto;
    else if (t.tipo === 'retiro') totalRet += t.monto;
  });

  const totalAhorrado = totalDep - totalRet;

  document.getElementById('txtTotalAhorrado').innerText = `Q${totalAhorrado.toFixed(2)}`;
  document.getElementById('txtTotalDepositado').innerText = `Q${totalDep.toFixed(2)}`;
  document.getElementById('txtTotalRetirado').innerText = `Q${totalRet.toFixed(2)}`;
  document.getElementById('txtTransaccionesCount').innerText = `${transacciones.length} movimientos registrados`;

  // Meta
  document.getElementById('txtMetaMonto').innerText = `Q${metaAhorro.toFixed(2)}`;
  const porcentaje = metaAhorro > 0 ? Math.min(100, Math.max(0, (totalAhorrado / metaAhorro) * 100)) : 0;
  document.getElementById('barMetaProgress').style.width = `${porcentaje}%`;
  document.getElementById('txtMetaPercent').innerText = `${porcentaje.toFixed(1)}% alcanzado de la meta`;
}

// --- 4. AGREGAR / ELIMINAR TRANSACCIONES ---
function agregarTransaccion(e) {
  e.preventDefault();

  const tipo = document.getElementById('cboTipo').value;
  const monto = parseFloat(document.getElementById('txtMonto').value);
  const fecha = document.getElementById('txtFecha').value;
  const concepto = document.getElementById('txtConcepto').value.trim() || (tipo === 'deposito' ? 'Ahorro / Depósito' : 'Retiro / Gastos');

  if (!monto || monto <= 0 || !fecha) {
    alert('Por favor ingrese un monto válido y una fecha.');
    return;
  }

  const nuevaTransaccion = { tipo, monto, fecha, concepto };

  const tx = db.transaction('transacciones', 'readwrite');
  const store = tx.objectStore('transacciones');
  const request = store.add(nuevaTransaccion);

  request.onsuccess = () => {
    document.getElementById('txtMonto').value = '';
    document.getElementById('txtConcepto').value = '';
    cargarTransacciones();
  };
}

function eliminarTransaccion(id) {
  const confirmacion = confirm('¿Estás seguro de que deseas eliminar este registro?');
  if (!confirmacion) return;

  const tx = db.transaction('transacciones', 'readwrite');
  const store = tx.objectStore('transacciones');
  const request = store.delete(id);

  request.onsuccess = () => {
    cargarTransacciones();
  };
}

function definirMeta() {
  const nuevaMeta = prompt('Ingresa tu nueva meta de ahorro en Quetzales (Q):', metaAhorro);
  if (nuevaMeta !== null) {
    const val = parseFloat(nuevaMeta);
    if (!isNaN(val) && val > 0) {
      metaAhorro = val;
      localStorage.setItem('meta_ahorro_val', metaAhorro);
      calcularResumen();
    } else {
      alert('Ingresa un monto válido.');
    }
  }
}

// --- 5. RENDER TABLA E HISTORIAL ---
function renderizarTabla(lista) {
  const tbody = document.getElementById('tblHistorial');
  tbody.innerHTML = '';

  if (lista.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center" style="color: var(--text-muted); padding: 20px;">No hay movimientos registrados.</td></tr>`;
    return;
  }

  // Ordenar de más reciente a más antiguo
  const ordenados = [...lista].sort((a,b) => new Date(b.fecha) - new Date(a.fecha));

  ordenados.forEach(item => {
    const tr = document.createElement('tr');
    const esDep = item.tipo === 'deposito';
    const badgeClass = esDep ? 'badge-deposito' : 'badge-retiro';
    const signo = esDep ? '+' : '-';
    const colorClass = esDep ? 'color: var(--success)' : 'color: var(--danger)';

    tr.innerHTML = `
      <td>${item.fecha}</td>
      <td><span class="badge ${badgeClass}">${item.tipo.toUpperCase()}</span></td>
      <td>${item.concepto}</td>
      <td class="text-right" style="font-weight: 700; ${colorClass}">${signo}Q${item.monto.toFixed(2)}</td>
      <td class="text-center">
        <button onclick="eliminarTransaccion(${item.id})" class="btn-danger-sm">🗑️ Borrar</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function filtrarHistorial(e) {
  const busqueda = e.target.value.toLowerCase();
  const filtrados = transacciones.filter(t => t.concepto.toLowerCase().includes(busqueda) || t.fecha.includes(busqueda));
  renderizarTabla(filtrados);
}

// --- 6. GRÁFICO DINÁMICO MEJORADO ---
function renderizarGrafico() {
  const canvas = document.getElementById('chartAhorros');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // Agrupar movimientos por mes
  const ultimosMeses = {};
  const datosOrdenados = [...transacciones].sort((a,b) => new Date(a.fecha) - new Date(b.fecha));

  datosOrdenados.forEach(t => {
    const f = new Date(t.fecha + 'T00:00:00');
    const key = `${f.toLocaleString('es', { month: 'short' }).toUpperCase()} ${f.getFullYear()}`;
    if (!ultimosMeses[key]) ultimosMeses[key] = { dep: 0, ret: 0 };
    if (t.tipo === 'deposito') ultimosMeses[key].dep += t.monto;
    else ultimosMeses[key].ret += t.monto;
  });

  const labels = Object.keys(ultimosMeses);
  const dataDepositos = labels.map(k => ultimosMeses[k].dep);
  const dataRetiros = labels.map(k => ultimosMeses[k].ret);

  if (chartAhorrosInstance) {
    chartAhorrosInstance.destroy();
  }

  chartAhorrosInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Depósitos (Q)',
          data: dataDepositos,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          fill: true,
          tension: 0.35,
          pointRadius: 6,
          pointHoverRadius: 8,
          pointBackgroundColor: '#10b981',
          borderWidth: 3
        },
        {
          label: 'Retiros (Q)',
          data: dataRetiros,
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.15)',
          fill: true,
          tension: 0.35,
          pointRadius: 6,
          pointHoverRadius: 8,
          pointBackgroundColor: '#ef4444',
          borderWidth: 3
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: '#9ca3af', font: { size: 12, weight: '600' } }
        },
        tooltip: {
          backgroundColor: '#1f2736',
          titleColor: '#fff',
          bodyColor: '#10b981',
          borderColor: '#2a3447',
          borderWidth: 1,
          padding: 12,
          callbacks: {
            label: function(context) {
              return ` ${context.dataset.label}: Q${context.raw.toFixed(2)}`;
            }
          }
        }
      },
      scales: {
        x: {
          ticks: { color: '#9ca3af', font: { size: 11 } },
          grid: { color: 'rgba(42, 52, 71, 0.5)' }
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: '#9ca3af',
            font: { size: 11 },
            callback: function(value) { return 'Q' + value; }
          },
          grid: { color: 'rgba(42, 52, 71, 0.5)' }
        }
      }
    }
  });
}

// --- 7. EXPORTACIÓN Y RESPALDO ---
function exportarCSV() {
  if (transacciones.length === 0) {
    alert('No hay datos para exportar.');
    return;
  }
  let csvContent = "data:text/csv;charset=utf-8,ID,Fecha,Tipo,Concepto,Monto(Q)\n";
  transacciones.forEach(t => {
    csvContent += `${t.id},"${t.fecha}","${t.tipo}","${t.concepto}",${t.monto}\n`;
  });
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `ahorros_export_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function exportarJSON() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(transacciones, null, 2));
  const dlAnchor = document.createElement('a');
  dlAnchor.setAttribute("href", dataStr);
  dlAnchor.setAttribute("download", `ahorros_backup_${new Date().toISOString().split('T')[0]}.json`);
  dlAnchor.click();
}

function importarJSON(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const datosImportados = JSON.parse(event.target.result);
      if (Array.isArray(datosImportados)) {
        if (confirm('¿Deseas reemplazar la base de datos actual con este respaldo?')) {
          const tx = db.transaction('transacciones', 'readwrite');
          const store = tx.objectStore('transacciones');
          store.clear().onsuccess = () => {
            datosImportados.forEach(item => {
              delete item.id; // regenerar id autoincremental
              store.add(item);
            });
            cargarTransacciones();
            alert('¡Respaldo cargado con éxito!');
          };
        }
      } else {
        alert('El archivo no contiene un formato de respaldo válido.');
      }
    } catch (err) {
      alert('Error al leer el archivo JSON.');
    }
  };
  reader.readAsText(file);
}