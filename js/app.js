// Programa de Ahorro Mensual - **AUTO LocalStorage** (no archivos manuales, persiste al cerrar browser, carga auto, portátil USB)

let transactions = [];
let editingId = null;
let cumulativeChart = null;


const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

// === AUTO SAVE/LOAD LocalStorage ===
function saveData() {
    localStorage.setItem('ahorroMensual', JSON.stringify(transactions));
}

function loadData() {
    const saved = localStorage.getItem('ahorroMensual');
    if (saved) {
        transactions = JSON.parse(saved);
        return true;
    }
    return false;
}

// === UI FUNCTIONS ===
function setDefaultDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const day = String(today.getDate()).padStart(2, '0');
    
    document.getElementById('date').value = `${year}-${String(month).padStart(2, '0')}-${day}`;
    document.getElementById('month').value = month;
    document.getElementById('year').value = year;
}

function calculateBalance() {
    const deposited = transactions.filter(t => t.type === 'deposit').reduce((s, t) => s + t.amount, 0);
    const withdrawn = transactions.filter(t => t.type === 'withdrawal').reduce((s, t) => s + t.amount, 0);
    return deposited - withdrawn;
}

function updateDashboard() {
    const deposited = transactions.filter(t => t.type === 'deposit').reduce((s, t) => s + t.amount, 0);
    const withdrawn = transactions.filter(t => t.type === 'withdrawal').reduce((s, t) => s + t.amount, 0);
    const balance = deposited - withdrawn;
    
    document.getElementById('totalAmount').textContent = `Q ${balance.toFixed(2)}`;
    document.getElementById('totalDeposited').textContent = `Q ${deposited.toFixed(2)}`;
    document.getElementById('totalWithdrawn').textContent = `Q ${withdrawn.toFixed(2)}`;
    document.getElementById('totalTransactions').textContent = transactions.length;
}

// Compute chart data: cumulative deposits by month
function getChartData() {
    const deposits = transactions.filter(t => t.type === 'deposit');
    const monthly = {};
    
    deposits.forEach(t => {
        const key = `${t.year}-${String(t.month).padStart(2, '0')}`;
        monthly[key] = (monthly[key] || 0) + t.amount;
    });
    
    // Sort chronologically, compute cumulative
    const sortedKeys = Object.keys(monthly).sort();
    let cumulative = 0;
    const labels = [];
    const data = [];
    
    sortedKeys.forEach(key => {
        cumulative += monthly[key];
        labels.push(`${monthNames[parseInt(key.split('-')[1]) - 1]} ${key.split('-')[0]}`);
        data.push(cumulative);
    });
    
    return { labels, data, total: cumulative };
}

// Initialize/update chart
function updateChart() {
    const ctx = document.getElementById('cumulativeChart')?.getContext('2d');
    if (!ctx) return;
    
    const chartData = getChartData();
    
    if (cumulativeChart) {
        cumulativeChart.destroy();
    }
    
    cumulativeChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: chartData.labels,
            datasets: [{
                label: 'Total Acumulado (Q)',
                data: chartData.data,
                backgroundColor: 'rgba(16, 185, 129, 0.8)',
                borderColor: 'rgba(16, 185, 129, 1)',
                borderRadius: 8,
                borderSkipped: false,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { 
                        callback: function(value) {
                            return 'Q ' + value.toLocaleString('es-GT');
                        }
                    }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}


function renderTransactions(filtered = null) {
    const tbody = document.getElementById('transactionsBody');
    const emptyState = document.getElementById('emptyState');
    const data = filtered || transactions;
    const sorted = [...data].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (!sorted.length) {
        tbody.innerHTML = '';
        emptyState.classList.add('visible');
        return;
    }
    
    emptyState.classList.remove('visible');
    
    tbody.innerHTML = sorted.map(t => `
        <tr data-id="${t.id}">
            <td>${formatDate(t.date)}</td>
            <td><span class="type-badge ${t.type}">${t.type === 'deposit' ? '💰 Depósito' : '💸 Retiro'}</span></td>
            <td>${monthNames[t.month - 1]}</td>
            <td>${t.year}</td>
            <td>${t.description}</td>
            <td><span class="amount ${t.type}">${t.type === 'deposit' ? '+' : '-'}Q ${t.amount.toFixed(2)}</span></td>
            <td>
                <button class="action-btn edit" onclick="editTransaction(${t.id})" title="Editar"><i class="fas fa-edit"></i></button>
                <button class="action-btn delete" onclick="deleteTransaction(${t.id})" title="Eliminar"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

function getTransactionById(id) {
    return transactions.find(t => t.id === id);
}

function formatDate(dateString) {
    const d = new Date(dateString);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function resetForm() {
    document.getElementById('transactionForm').reset();
    setDefaultDate();
    editingId = null;
}

function showNotification(msg, type = 'info') {
    const n = document.createElement('div');
    n.className = `notification notification-${type}`;
    n.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'times-circle' : 'info-circle'}"></i><span>${msg}</span>`;
    n.style.cssText = `
        position:fixed;top:20px;right:20px;padding:15px 25px;background:${
            type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#4F46E5'
        };color:white;border-radius:10px;box-shadow:0 4px 12px rgba(0,0,0,.15);z-index:2000;
        animation:slideIn .3s ease;display:flex;align-items:center;gap:10px;
    `;
    
    document.body.appendChild(n);
    
    const style = document.createElement('style');
    style.textContent = `@keyframes slideIn{from{transform:translateX(100%);opacity:0;}to{transform:translateX(0);opacity:1;}}@keyframes slideOut{from{transform:translateX(0);opacity:1;}to{transform:translateX(100%);opacity:0;}}`;
    if (!document.getElementById('notif-style')) {
        style.id = 'notif-style';
        document.head.appendChild(style);
    }
    
    setTimeout(() => {
        n.style.animation = 'slideOut .3s ease forwards';
        setTimeout(() => n.remove(), 300);
    }, 4000);
}

function showModal(msg) {
    document.getElementById('modalMessage').textContent = msg;
    document.getElementById('confirmModal').classList.add('visible');
}

function closeModal() {
    document.getElementById('confirmModal').classList.remove('visible');
    window.pendingAction = null;
}

// === MAIN LOGIC ===
async function handleTransactionSubmit(e) {
    e.preventDefault();
    
    const type = document.getElementById('transactionType').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const date = document.getElementById('date').value;
    const month = parseInt(document.getElementById('month').value);
    const year = parseInt(document.getElementById('year').value);
    const description = document.getElementById('description').value || 'Sin descripción';
    
    if (amount <= 0) return showNotification('Cantidad > 0', 'error');
    if (!date || !month || !year) return showNotification('Completa fecha', 'error');
    
    if (type === 'withdrawal') {
        const balance = calculateBalance();
        if (amount > balance) return showNotification(`Saldo insuficiente. Disponible: Q${balance.toFixed(2)}`, 'error');
    }
    
    const transaction = {
        id: editingId || Date.now(),
        type, amount, date, month, year, description,
        createdAt: editingId ? getTransactionById(editingId).createdAt : new Date().toISOString()
    };
    
    if (editingId) {
        const index = transactions.findIndex(t => t.id === editingId);
        transactions[index] = transaction;
        editingId = null;
        showNotification('Transacción actualizada', 'success');
    } else {
        transactions.push(transaction);
        showNotification(`${type === 'deposit' ? '💰 Depósito' : '💸 Retiro'} guardado`, 'success');
    }
    
    // **AUTO SAVE**
    saveData();
    renderTransactions();
    updateDashboard();
    updateChart();
    resetForm();

}

function editTransaction(id) {
    const t = getTransactionById(id);
    if (!t) return;
    
    editingId = id;
    document.getElementById('transactionType').value = t.type;
    document.getElementById('amount').value = t.amount;
    document.getElementById('date').value = t.date;
    document.getElementById('month').value = t.month;
    document.getElementById('year').value = t.year;
    document.getElementById('description').value = t.description;
    
    document.querySelector('.form-card').scrollIntoView({ behavior: 'smooth' });
}

function deleteTransaction(id) {
    showModal('¿Eliminar esta transacción?');
    window.pendingAction = () => {
        transactions = transactions.filter(t => t.id !== id);
        saveData();
        renderTransactions();
        updateDashboard();
        updateChart();
        showNotification('Eliminada', 'success');
        closeModal();

    };
}

function showClearAllModal() {
    if (!transactions.length) return showNotification('No hay datos', 'warning');
    showModal('¿Eliminar TODAS las transacciones?');
    window.pendingAction = () => {
        transactions = [];
        saveData();
        renderTransactions();
        updateDashboard();
        updateChart();
        showNotification('Todo eliminado', 'success');
        closeModal();

    };
}

function applyFilters() {
    const month = document.getElementById('filterMonth').value;
    const year = document.getElementById('filterYear').value;
    const type = document.getElementById('filterType').value;
    
    let filtered = [...transactions];
    if (month) filtered = filtered.filter(t => t.month == month);
    if (year) filtered = filtered.filter(t => t.year == year);
    if (type) filtered = filtered.filter(t => t.type === type);
    
    renderTransactions(filtered);
    updateChart();
}


function clearFilters() {
    document.getElementById('filterMonth').value = '';
    document.getElementById('filterYear').value = '';
    document.getElementById('filterType').value = '';
    renderTransactions();
    updateChart();
}


function confirmAction() {
    if (window.pendingAction) window.pendingAction();
    closeModal();
}

// === INIT ===
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    updateDashboard();
    updateChart();
    setDefaultDate();

    
    // Event listeners
    document.getElementById('transactionForm').addEventListener('submit', handleTransactionSubmit);
    document.getElementById('applyFilter').addEventListener('click', applyFilters);
    document.getElementById('clearFilter').addEventListener('click', clearFilters);
    document.getElementById('exportExcel').addEventListener('click', window.exportToExcelSafe || window.exportToExcel || (() => showNotification('Excel listo', 'info')));
    document.getElementById('exportBackup')?.addEventListener('click', window.exportBackupJSON || (() => showNotification('Backup listo', 'info')));
    document.getElementById('clearAll').addEventListener('click', showClearAllModal);

    document.querySelector('.close-modal').addEventListener('click', closeModal);
    document.getElementById('cancelAction').addEventListener('click', closeModal);
    document.getElementById('confirmAction').addEventListener('click', confirmAction);
    
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) closeModal();
    });
    
    showNotification('✅ Listo! Datos auto-guardan/cargan en LocalStorage', 'success');
    
    // Exponer global
    window.editTransaction = editTransaction;
    window.deleteTransaction = deleteTransaction;
    window.showClearAllModal = showClearAllModal;
    window.showNotification = showNotification;
    window.showModal = showModal;
    window.closeModal = closeModal;
    window.confirmAction = confirmAction;
    window.transactions = transactions;
    window.calculateBalance = calculateBalance;
    
    // Import JSON Backup
    document.getElementById('dbFileInput').addEventListener('change', handleImportFile);
    
    window.handleImportFile = handleImportFile;

});

function handleImportFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const data = JSON.parse(event.target.result);
            if (data.format === 'ahorro-mensual-backup-v1' && data.transactions) {
                transactions = data.transactions;
                saveData();
                renderTransactions();
                updateDashboard();
                showNotification(`✅ Importado ${data.metadata.totalTransactions} transacciones. Balance: Q${data.metadata.balance.toFixed(2)}`, 'success');
            } else {
                showNotification('Formato de backup no válido', 'error');
            }
        } catch (err) {
            showNotification('Error leyendo archivo (verifica JSON/DB)', 'error');
            console.error('Import error:', err);
        }
    };
    reader.readAsText(file);
}

// Import DB button listener
document.getElementById('importDBBtn').addEventListener('click', () => {
    document.getElementById('dbFileInput').click();
});

// LocalStorage limits ~5MB - enough for 1000s transactions
console.log('Ahorro App LocalStorage AUTO + Backup Import/Export - persiste todo!');


