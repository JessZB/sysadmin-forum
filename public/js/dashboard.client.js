let refreshInterval;
let timeLeft = 300; // 5 minutos en segundos
let isPaused = false;
let isCoolingDown = false;
let currentTerminalIdForModal = null;
const detailsModal = new bootstrap.Modal(document.getElementById('detailsModal'));

// Almacén temporal de datos para no tener que hacer fetch dos veces al cambiar de tab
let globalTerminalsCache = []; 

document.addEventListener('DOMContentLoaded', () => {
    iniciarTemporizador();
    cargarDatos(); // Carga inicial

    // Pausar timer si el modal está abierto para no interrumpir al usuario
    const modalEl = document.getElementById('detailsModal');
    modalEl.addEventListener('show.bs.modal', () => { isPaused = true; });
    modalEl.addEventListener('hidden.bs.modal', () => { isPaused = false; });
});

/* =========================================
   LÓGICA DEL TEMPORIZADOR
   ========================================= */
function iniciarTemporizador() {
    const timerBadge = document.getElementById('countdownTimer');
    
    clearInterval(refreshInterval);
    refreshInterval = setInterval(() => {
        if (!isPaused) {
            timeLeft--;
            
            // Formatear MM:SS
            const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
            const s = (timeLeft % 60).toString().padStart(2, '0');
            timerBadge.innerText = `${m}:${s}`;
            
            // Cambiar color si queda poco tiempo
            if (timeLeft < 60) timerBadge.className = 'badge bg-warning text-dark border timer-badge';
            else timerBadge.className = 'badge bg-light text-dark border timer-badge';

            if (timeLeft <= 0) {
                forzarRefrescoTotal();
            }
        }
    }, 1000);
}

function forzarRefrescoTotal() {
    // 1. Si ya está en enfriamiento, no hacemos nada
    if (isCoolingDown) return;

    // 2. Ejecutar la carga de datos inmediatamente
    timeLeft = 300; // Reiniciar el temporizador automático (5 min)
    cargarDatos();

    // 3. Iniciar el bloqueo visual (Cooldown)
    iniciarCooldownBoton();
}

function iniciarCooldownBoton() {
    const btn = document.getElementById('btnGlobalRefresh');
    if (!btn) return;

    isCoolingDown = true;
    btn.disabled = true; // Deshabilitar interacción
    
    // Guardamos el contenido original (Icono + Texto)
    const originalContent = '<i class="fa-solid fa-arrows-rotate me-1"></i> Refrescar';
    
    let secondsLeft = 10;

    // Función interna para actualizar el texto
    const updateText = () => {
        btn.innerHTML = `<i class="fa-solid fa-hourglass-half me-1"></i> Espere ${secondsLeft}s`;
        // Opcional: Cambiar clase para que se vea gris/diferente
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-secondary');
    };

    updateText(); // Primera actualización inmediata

    const interval = setInterval(() => {
        secondsLeft--;

        if (secondsLeft <= 0) {
            // FIN DEL COOLDOWN
            clearInterval(interval);
            isCoolingDown = false;
            btn.disabled = false;
            btn.innerHTML = originalContent; // Restaurar texto original
            
            // Restaurar estilo
            btn.classList.remove('btn-secondary');
            btn.classList.add('btn-primary');
        } else {
            updateText();
        }
    }, 1000);
}

function toggleTimer() {
    isPaused = !isPaused;
    const badge = document.getElementById('countdownTimer');
    badge.style.opacity = isPaused ? '0.5' : '1';
    badge.title = isPaused ? "PAUSADO" : "Click para pausar";
}


/* =========================================
   CARGA DE DATOS (Centralizada)
   ========================================= */
async function cargarDatos() {
    const serverGrid = document.getElementById('server-grid');
    const posGrid = document.getElementById('pos-grid');
    const serverMatrix = document.getElementById('server-matrix');
    const posMatrix = document.getElementById('matrix-grid');
    
    // Resetear contenidos
    if(globalTerminalsCache.length === 0) {
        posGrid.innerHTML = '<div class="col-12 text-center py-5"><div class="spinner-border text-primary"></div></div>';
    }

    try {
        const res = await fetch('/dashboard/api/terminals');
        const result = await res.json();
        
        globalTerminalsCache = result.data;
        
        // --- SEPARACIÓN DE ROLES ---
        // 1 es true en MySQL (TINYINT)
        const servers = globalTerminalsCache.filter(t => t.is_server === 1); 
        const terminals = globalTerminalsCache.filter(t => t.is_server === 0);

        // LIMPIEZA
        serverGrid.innerHTML = ''; posGrid.innerHTML = '';
        serverMatrix.innerHTML = ''; posMatrix.innerHTML = '';

        // 1. RENDERIZAR SERVIDORES (Diseño Especial)
        if (servers.length === 0) serverGrid.innerHTML = '<div class="col-12 text-muted small fst-italic">No hay servidores configurados.</div>';
        
        servers.forEach(srv => {
            // Grid Tab
            serverGrid.appendChild(crearTarjetaServidorHTML(srv));
            // Matrix Tab (Usamos col-12 para que sea más ancha)
            serverMatrix.appendChild(crearTablaMatrizHTML(srv, 'col-12'));
        });

        // 2. RENDERIZAR CAJAS (Diseño Estándar)
        if (terminals.length === 0) posGrid.innerHTML = '<div class="col-12 text-muted small fst-italic">No hay cajas registradas.</div>';
        
        terminals.forEach(term => {
            posGrid.appendChild(crearTarjetaHTML(term));
            posMatrix.appendChild(crearTablaMatrizHTML(term, 'col-12 mt-0', 'd-flex flex-row'));
        });

        // 3. CONSULTAR ESTADOS (Para todos)
        globalTerminalsCache.forEach(term => {
            consultarCajaIndividual(term.id);
        });

    } catch (error) {
        showErrorToast('Error inicializando dashboard');
        console.error(error);
    }
}

function crearTarjetaServidorHTML(term) {
    const col = document.createElement('div');
    // El servidor ocupa más espacio visual (col-md-6)
    col.className = 'col-12 col-md-6 col-lg-4'; 
    
    col.innerHTML = `
        <div class="pos-card status-loading server-card" id="card-${term.id}">
            <div class="d-flex w-100 h-100 align-items-center px-4 position-relative">
                
                <div class="me-4" id="icon-${term.id}" style="font-size: 2.5rem;">
                    <i class="fa-solid fa-circle-notch fa-spin text-white opacity-75"></i>
                </div>

                <div class="flex-grow-1" style="z-index: 2;">
                    <h5 class="fw-bold mb-1 text-white">${term.name}</h5>
                    <div class="d-flex align-items-center mb-2 text-white opacity-90">
                        <i class="fa-solid fa-network-wired me-2 small"></i>
                        <span class="font-monospace">${term.ip_address}</span>
                    </div>
                    <span class="badge bg-white bg-opacity-25 text-white border border-white border-opacity-50 fw-semibold">
                        MASTER NODE
                    </span>
                </div>

                <i class="fa-solid fa-server server-icon-large text-white opacity-10"></i>

                <div class="hover-overlay" style="border-radius: 10px;">
                    <button class="view-details-btn shadow" onclick="abrirModalDetalle(${term.id}, '${term.name}', '${term.ip_address}', true)">
                        <i class="fa-solid fa-eye me-1"></i> Gestionar Jobs
                    </button>
                </div>
            </div>
        </div>
    `;
    return col;
}

/* =========================================
   CONSULTA INDIVIDUAL (Core)
   ========================================= */
async function consultarCajaIndividual(id) {
    // --- CAMBIO AQUÍ: Feedback visual inmediato ---
    marcarCargaVisual(id); 
    // ----------------------------------------------

    try {
        const res = await fetch(`/dashboard/api/terminals/${id}/jobs`);
        const result = await res.json();

        if(result.success) {
            const jobs = result.data;
            const serverTime = result.serverTime;
            const estadoGlobal = calcularEstadoGlobal(jobs);

            // A. Actualizar Tarjeta (Tab 1)
            // Esto sobrescribirá el spinner con el icono de éxito/error
            actualizarTarjetaVisual(id, estadoGlobal);

            // B. Actualizar Matriz (Tab 2)
            // Esto sobrescribirá el spinner de la tabla con los datos reales
            renderizarFilasMatriz(id, jobs, serverTime);

        } else {
            marcarErrorVisual(id);
        }
    } catch (error) {
        marcarErrorVisual(id);
    }
}

/* =========================================
   TAB 1: TARJETAS GRID
   ========================================= */
function crearTarjetaHTML(term) {
    const col = document.createElement('div');
    col.className = 'col-12 col-sm-6 col-md-2';
    col.innerHTML = `
        <div class="pos-card status-loading" id="card-${term.id}">
            <div class="pos-icon" id="icon-${term.id}"><i class="fa-solid fa-circle-notch fa-spin"></i></div>
            <h5 class="m-0 fw-bold">${term.name}</h5>
            <small class="d-block opacity-75">${term.ip_address}</small>
            <div class="hover-overlay">
                <button class="view-details-btn shadow" onclick="abrirModalDetalle(${term.id}, '${term.name}', '${term.ip_address}', true)">
                    <i class="fa-solid fa-eye me-1"></i> Ver Detalles
                </button>
            </div>
        </div>
    `;
    return col;
}

function actualizarTarjetaVisual(id, status) {
    const card = document.getElementById(`card-${id}`);
    const iconContainer = document.getElementById(`icon-${id}`);
    if(!card) return;

    card.className = `pos-card status-${status}`;
    
    let icon = 'fa-circle-check';
    if(status === 'error') icon = 'fa-triangle-exclamation';
    if(status === 'warning') icon = 'fa-clock-rotate-left';
    
    iconContainer.innerHTML = `<i class="fa-solid ${icon}"></i>`;
}

/* =========================================
   TAB 2: MATRIZ DETALLADA
   ========================================= */
function crearTablaMatrizHTML(term, colClass = 'col-12 col-md-6', cardClass = '') {
    const col = document.createElement('div');
    col.className = colClass;
    col.innerHTML = `
        <div class="card shadow-none border-0 h-100 ${cardClass}">
            <div class="card-header d-flex justify-content-between align-items-center bg-light">
                <strong>${term.name}</strong>
                <button class="btn btn-sm btn-link text-decoration-none" onclick="consultarCajaIndividual(${term.id})">
                    <i class="fa-solid fa-rotate-right"></i>
                </button>
            </div>
            <div class="card-body p-0 table-responsive">
                <table class="table table-sm mb-0 mini-job-table table-bordered table-hover">
                    <thead class="table-light small text-muted text-center">
                        <tr>
                            <th>Nombre</th>
                            <th>Estado</th>
                            <th>Ejecución</th>
                            <th>Última ejecución</th>
                            <th>Duración</th>
                            <th>Inicio</th>
                        </tr>
                    </thead>
                    <tbody id="matrix-tbody-${term.id}">
                        <tr><td colspan="6" class="text-center py-3 text-muted">Cargando...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
    return col;
}

function renderizarFilasMatriz(id, jobs, serverTime) {
    const tbody = document.getElementById(`matrix-tbody-${id}`);
    if(!tbody) return;
    tbody.innerHTML = '';

    jobs.forEach(job => {
        // --- ESTADO (Outcome) ---
        let outcomeBadge = 'bg-secondary';
        if (job.LastOutcome === 'Exitoso') outcomeBadge = 'bg-success';
        else if (job.LastOutcome === 'Fallido') outcomeBadge = 'bg-danger';
        else if (job.LastOutcome === 'Cancelado') outcomeBadge = 'bg-warning text-dark';
        
        // --- EJECUCIÓN (Execution) ---
        let execBadge = 'bg-secondary';
        let execText = 'Stopped';
        if (job.ExecutionStatus === 'Running') { execBadge = 'bg-warning text-dark'; execText = 'En ejecución'; }
        else if (job.ExecutionStatus === 'Idle') { execBadge = 'bg-light text-dark border'; execText = 'Detenido'; }

        // --- FECHAS ---
        let lastRunDateFmt = '||';
        if (job.LastRunDate) {
            const parts = window.dateFormatter(job.LastRunDate).split(',');
            if (parts.length >= 2) {
                lastRunDateFmt = `${parts[0].trim()} || ${parts[1].trim()}`;
            } else {
                lastRunDateFmt = window.dateFormatter(job.LastRunDate);
            }
        }
        
        // --- DURACIÓN ---
        const duration = calcularDuracion(job.LastRunDate, serverTime, job.ExecutionStatus, job.LastDuration);

        // --- INICIO (Si está corriendo) ---
        let startTime = '-';
        if (job.ExecutionStatus === 'Running' && job.LastRunDate) {
             const parts = window.dateFormatter(job.LastRunDate).split(',');
             if(parts.length >= 2) startTime = parts[1].trim();
        }

        tbody.innerHTML += `
            <tr class="mini-job-row small align-middle">
                <td class="text-truncate" style="max-width: 200px;" title="${job.JobName}">
                    ${job.JobName}
                </td>
                <td class="text-center">
                    <span class="badge ${outcomeBadge} w-100">${job.LastOutcome || 'Desc.'}</span>
                </td>
                <td class="text-center">
                    <span class="badge ${execBadge} w-100">${execText}</span>
                </td>
                <td class="text-center text-muted small">
                    ${lastRunDateFmt}
                </td>
                <td class="text-center font-monospace small">
                    ${duration}
                </td>
                <td class="text-center text-muted small">
                    ${startTime}
                </td>
            </tr>
        `;
    });
}

/* =========================================
   HELPER: INDICADOR VISUAL DE CARGA
   ========================================= */
function marcarCargaVisual(id) {
    // 1. Actualizar Tarjeta del Grid (Tab 1)
    const card = document.getElementById(`card-${id}`);
    const iconContainer = document.getElementById(`icon-${id}`);
    
    if (card && iconContainer) {
        // Limpiamos colores de estado previos
        card.classList.remove('status-success', 'status-warning', 'status-error');
        card.classList.add('status-loading'); // La volvemos gris
        
        // Cambiamos el icono por un spinner
        iconContainer.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin text-secondary"></i>';
    }

    // 2. Actualizar Tabla de Matriz (Tab 2)
    const tbody = document.getElementById(`matrix-tbody-${id}`);
    if (tbody) {
        // Reemplazamos las filas actuales por un mini spinner centrado
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-3 text-muted">
                    <i class="fa-solid fa-circle-notch fa-spin"></i>
                </td>
            </tr>
        `;
    }
}

/* =========================================
   MODAL Y LÓGICA "VER MÁS"
   ========================================= */
async function abrirModalDetalle(id, name, ip, forceRefresh = false) {
    currentTerminalIdForModal = id;
    const modalHeader = document.getElementById('modalHeader');
    
    // 1. Mostrar Modal en estado "Cargando"
    detailsModal.show();
    modalHeader.className = 'modal-header header-loading';
    document.getElementById('modalTitle').innerText = name;
    document.getElementById('modalIp').innerText = ip;
    document.getElementById('modalId').innerText = `ID: ${id}`;
    document.getElementById('jobsTableBody').innerHTML = '<tr><td colspan="5" class="text-center py-5"><div class="spinner-border text-primary"></div><br>Actualizando datos en tiempo real...</td></tr>';

    // 2. Si se pidió refresh forzoso (al hacer click en "Ver más"), consultamos de nuevo
    // Esto actualiza el modal Y TAMBIÉN la tarjeta de fondo (por si cambió el estado)
    if (forceRefresh) {
        consultarCajaIndividual(id).then(() => {
            // Una vez actualizado el dato global, repintamos el modal con esa data fresca
            // (Hacemos un fetch rápido o podríamos haber guardado la data en caché, 
            // pero para asegurar consistencia hacemos el fetch modal específico)
             llenarModalConFetch(id);
        });
    } else {
        llenarModalConFetch(id);
    }
}

async function llenarModalConFetch(id) {
    try {
        const res = await fetch(`/dashboard/api/terminals/${id}/jobs`);
        const result = await res.json();
        
        if(result.success) {
            const jobs = result.data;
            const serverTime = result.serverTime;
            const status = calcularEstadoGlobal(jobs);
            
            // Actualizar header
            const header = document.getElementById('modalHeader');
            header.className = `modal-header header-${status}`;
            
            // Renderizar Tabla
            const tbody = document.getElementById('jobsTableBody');
            tbody.innerHTML = '';
            
            jobs.forEach(job => {
                let badgeClass = 'bg-secondary';
                let icon = '';
                
                // Updated to use LastOutcome instead of LastStatus
                if (job.LastOutcome === 'Exitoso') { badgeClass = 'bg-success'; icon = '<i class="fa-solid fa-check"></i>'; }
                if (job.LastOutcome === 'Fallido') { badgeClass = 'bg-danger'; icon = '<i class="fa-solid fa-xmark"></i>'; }
                if (job.ExecutionStatus === 'Running') { badgeClass = 'bg-warning text-dark'; icon = '<i class="fa-solid fa-gear fa-spin"></i>'; }

                const duration = calcularDuracion(job.LastRunDate, serverTime, job.ExecutionStatus, job.LastDuration);
                const fechaFmt = window.dateFormatter(job.LastRunDate); 
                
                // Limpieza del mensaje para que no rompa el atributo HTML title (escapar comillas)
                const rawMsg = job.LastMessage || '';
                const safeMsg = rawMsg.replace(/"/g, '&quot;'); 

                const displayStatus = job.ExecutionStatus === 'Running' ? 'En Ejecución' : job.LastOutcome;

                tbody.innerHTML += `
                    <tr>
                        <td><span class="badge ${badgeClass}">${icon} ${displayStatus}</span></td>
                        <td class="fw-bold">${job.JobName}</td>
                        <td>
                            <div class="small fw-bold">${duration}</div>
                            <div class="text-muted" style="font-size:0.75rem">${fechaFmt}</div>
                        </td>
                        
                        <td class="small text-muted text-truncate" style="max-width: 150px; cursor: help;" title="${safeMsg}">
                            ${rawMsg}
                        </td>
                        
                        <td>
                            <button class="btn btn-sm btn-outline-dark" onclick="ejecutarJobDesdeModal('${job.JobName}')">
                                <i class="fa-solid fa-play"></i>
                            </button>
                        </td>
                    </tr>
                `;
            });

        }
    } catch (e) { console.error(e); }
}

/* =========================================
   UTILIDADES
   ========================================= */
function calcularEstadoGlobal(jobs) {
    if(!jobs || jobs.length === 0) return 'warning';
    if(jobs.some(j => j.LastOutcome === 'Fallido')) return 'error';
    if(jobs.some(j => j.ExecutionStatus === 'Running')) return 'warning';
    return 'success';
}

function marcarErrorVisual(id) {
    actualizarTarjetaVisual(id, 'error');
    const tbody = document.getElementById(`matrix-tbody-${id}`);
    if(tbody) tbody.innerHTML = '<tr><td colspan="6" class="text-danger text-center"><small>Error de conexión</small></td></tr>';
}

// CÁLCULO DE DURACIÓN
function calcularDuracion(startDateStr, serverDateStr, executionStatus, lastDurationStr) {
    // 1. Si NO está corriendo, devolvemos la duración estática que viene del backend
    if (executionStatus !== 'Running') {
        return lastDurationStr || '00:00:00';
    }

    // 2. Si ESTÁ corriendo, calculamos tiempo transcurrido (serverTime - lastRunDate)
    if (!startDateStr || !serverDateStr) return 'Calculando...';

    const start = new Date(startDateStr);
    const nowServerUTC = new Date(serverDateStr); 

    // AJUSTE DE ZONA HORARIA: serverTime viene en UTC, ajustamos a Caracas (UTC-4)
    // Restamos 4 horas (4 * 60 * 60 * 1000 milisegundos)
    const offsetCaracas = 4 * 60 * 60 * 1000; // 4 horas en milisegundos
    const nowServerCaracas = new Date(nowServerUTC.getTime() - offsetCaracas);

    // Diferencia en milisegundos
    let diff = nowServerCaracas - start;
    
    if (diff < 0) diff = 0; 

    const totalSeconds = Math.floor(diff / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const hStr = hours.toString().padStart(2, '0');
    const mStr = minutes.toString().padStart(2, '0');
    const sStr = seconds.toString().padStart(2, '0');

    return `<span class="text-primary fw-bold"><i class="fa-solid fa-stopwatch me-1"></i> ${hStr}:${mStr}:${sStr}</span>`;
}

// Función de formato de fecha
window.dateFormatter = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}, ${day}/${month}/${year}`;
};

/* =========================================
   ACCIÓN: EJECUTAR JOB DESDE EL MODAL
   ========================================= */
window.ejecutarJobDesdeModal = async (jobName) => {
    // Validación de seguridad
    if (!currentTerminalIdForModal) {
        showErrorToast('No se ha identificado la terminal actual.');
        return;
    }

    // 1. Confirmación con SweetAlert
    const confirm = await Swal.fire({
        title: '¿Ejecutar Job?',
        html: `Vas a iniciar el proceso: <strong>${jobName}</strong><br>en la terminal ID: <strong>${currentTerminalIdForModal}</strong>`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, iniciar',
        cancelButtonText: 'Cancelar'
    });

    if (!confirm.isConfirmed) return;

    try {
        // 2. Feedback inmediato (Toast)
        showInfoToast('Enviando orden al servidor...');

        // 3. Petición al Backend
        const res = await fetch(`/dashboard/api/terminals/${currentTerminalIdForModal}/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jobName })
        });

        const result = await res.json();

        if (result.success) {
            showSuccessToast('Job iniciado correctamente');

            // 4. ACTUALIZACIÓN INTELIGENTE
            // Esperamos 2 segundos para dar tiempo a SQL Server Agent de poner el job en "Running"
            // y luego refrescamos tanto el modal como la tarjeta de fondo.
            
            const btnRefresh = document.getElementById('modalTitle'); // Usamos el título como referencia visual
            if(btnRefresh) btnRefresh.innerHTML += ' <span class="spinner-border spinner-border-sm"></span>';

            setTimeout(() => {
                // Actualiza la tarjeta del Grid y la fila de la Matriz (Tab 1 y 2)
                consultarCajaIndividual(currentTerminalIdForModal);
                
                // Actualiza la tabla del Modal que tienes abierto ahora mismo
                llenarModalConFetch(currentTerminalIdForModal);
            }, 2000);

        } else {
            showErrorToast(result.error || 'Error al intentar iniciar el job');
        }

    } catch (error) {
        console.error(error);
        showErrorToast('Error de comunicación con el servidor');
    }
};