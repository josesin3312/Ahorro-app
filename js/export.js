// Sistema de Ahorro Mensual - Exportación a Excel

// Nombres de los meses en español (usar variable global de app.js)
const monthNamesExport = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

// Función principal para exportar a Excel
function exportToExcel() {
    // Usar variable global de transactions
    const trans = window.transactions || [];
    
    if (trans.length === 0) {
        window.showNotification('No hay datos para exportar', 'warning');
        return;
    }

    // Crear datos para Excel
    const excelData = trans.map(t => ({
        'Fecha': formatDateForExcel(t.date),
        'Tipo': t.type === 'deposit' ? 'Depósito' : 'Retiro',
        'Mes': monthNamesExport[t.month - 1],
        'Año': t.year,
        'Descripción': t.description,
        'Monto (Q)': t.type === 'deposit' ? t.amount : -t.amount,
        'Fecha Registro': formatDateTime(t.createdAt)
    }));

    // Calcular totales
    const totalDeposited = trans
        .filter(t => t.type === 'deposit')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalWithdrawn = trans
        .filter(t => t.type === 'withdrawal')
        .reduce((sum, t) => sum + t.amount, 0);

    const balance = totalDeposited - totalWithdrawn;

    // Agregar fila de totales
    const summaryData = [
        { 'Fecha': '', 'Tipo': '', 'Mes': '', 'Año': '', 'Descripción': 'TOTAL DEPOSITADO', 'Monto (Q)': totalDeposited, 'Fecha Registro': '' },
        { 'Fecha': '', 'Tipo': '', 'Mes': '', 'Año': '', 'Descripción': 'TOTAL RETIRADO', 'Monto (Q)': -totalWithdrawn, 'Fecha Registro': '' },
        { 'Fecha': '', 'Tipo': '', 'Mes': '', 'Año': '', 'Descripción': 'SALDO ACTUAL', 'Monto (Q)': balance, 'Fecha Registro': '' }
    ];

    // Combinar datos con resumen
    const allData = [...excelData, ...summaryData];

    // Crear libro de trabajo
    const wb = XLSX.utils.book_new();
    
    // Crear hoja de cálculo
    const ws = XLSX.utils.json_to_sheet(allData);

    // Ajustar ancho de columnas
    const colWidths = [
        { wch: 15 },  // Fecha
        { wch: 12 },  // Tipo
        { wch: 15 },  // Mes
        { wch: 10 },  // Año
        { wch: 30 },  // Descripción
        { wch: 15 },  // Monto
        { wch: 20 }   // Fecha Registro
    ];
    ws['!cols'] = colWidths;

    // Agregar hoja al libro
    XLSX.utils.book_append_sheet(wb, ws, 'Historial de Ahorros');

    // Generar nombre de archivo con fecha
    const date = new Date();
    const fileName = `Ahorro_Mensual_${date.getFullYear()}_${String(date.getMonth() + 1).padStart(2, '0')}_${String(date.getDate()).padStart(2, '0')}.xlsx`;

    // Descargar archivo
    XLSX.writeFile(wb, fileName);

    window.showNotification('Excel exportado exitosamente', 'success');
}

// Formatear fecha para Excel (DD/MM/AAAA)
function formatDateForExcel(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

// Formatear fecha y hora
function formatDateTime(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
}

// Cargar biblioteca SheetJS dinámicamente si no está disponible
function loadSheetJS() {
    return new Promise((resolve, reject) => {
        if (typeof XLSX !== 'undefined') {
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// Exportar con carga dinámica de la biblioteca
async function exportToExcelSafe() {
    try {
        await loadSheetJS();
        exportToExcel();
    } catch (error) {
        console.error('Error al cargar biblioteca Excel:', error);
        showNotification('Error al exportar. Por favor intenta de nuevo.', 'error');
    }
}

// Hacer disponible globalmente
window.exportToExcel = exportToExcel;
window.exportToExcelSafe = exportToExcelSafe;
window.exportBackupJSON = exportBackupJSON;

// También exportar la función directamente
window.exportToExcelDirect = exportToExcel;
window.exportBackupJSONDirect = exportBackupJSON;

// Función de Backup JSON (nuevo)
function exportBackupJSON() {
    const trans = window.transactions || [];
    
    if (trans.length === 0) {
        window.showNotification('No hay datos para backup', 'warning');
        return;
    }

    const data = {
        transactions: trans,
        metadata: {
            exportedAt: new Date().toISOString(),
            totalTransactions: trans.length,
            totalDeposited: trans.filter(t => t.type === 'deposit').reduce((s, t) => s + t.amount, 0),
            totalWithdrawn: trans.filter(t => t.type === 'withdrawal').reduce((s, t) => s + t.amount, 0),
            balance: calculateBalance() // Usar función global si existe
        },
        format: 'ahorro-mensual-backup-v1'
    };

    const date = new Date();
    const fileName = `backup_ahorro_${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}.json`;

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    window.showNotification(`Backup guardado: ${fileName}`, 'success');
}

// Soporte para calculateBalance si no existe global
function calculateBalance() {
    const trans = window.transactions || [];
    const deposited = trans.filter(t => t.type === 'deposit').reduce((s, t) => s + t.amount, 0);
    const withdrawn = trans.filter(t => t.type === 'withdrawal').reduce((s, t) => s + t.amount, 0);
    return deposited - withdrawn;
}


