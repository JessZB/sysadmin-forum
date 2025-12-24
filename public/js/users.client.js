// Formateador para el Rol (Badges)
function roleFormatter(value, row, index) {
    if (value === 'admin') {
        return '<span class="badge bg-danger">Administrador</span>';
    } else if (value === 'analista') {
        return '<span class="badge bg-primary">Analista</span>';
    } else {
        return '<span class="badge bg-secondary">Visualizador</span>';
    }
}

// Formateador para Fechas
function dateFormatter(value) {
    if (!value) return '-';
    return new Date(value).toLocaleDateString();
}

// Formateador para Botones de Acción
function actionFormatter(value, row, index) {
    // row contiene el objeto usuario completo (id, username, role...)
    
    // Botón Editar
    let botones = `
        <button class="btn btn-sm btn-outline-primary me-1" 
            onclick="abrirModalEditar('${row.id}', '${row.username}', '${row.role}')">
            <i class="bi bi-pencil"></i>
        </button>
    `;

    // Botón Eliminar (Validación visual contra el usuario actual)
    // Usamos la variable global currentUserId definida en el EJS
    if (row.id !== currentUserId) {
        botones += `
            <button class="btn btn-sm btn-outline-danger" 
                onclick="eliminarUsuario('${row.id}')">
                <i class="bi bi-trash"></i>
            </button>
        `;
    } else {
        botones += `
            <button class="btn btn-sm btn-secondary" disabled title="No puedes eliminarte a ti mismo">
                <i class="bi bi-trash"></i>
            </button>
        `;
    }

    return '<div class="text-end">' + botones + '</div>';
}

// Hacer globales las funciones para que Bootstrap Table las encuentre en el HTML
window.roleFormatter = roleFormatter;
window.dateFormatter = dateFormatter;
window.actionFormatter = actionFormatter;

const modalEl = document.getElementById('modalUsuario');
const modal = new bootstrap.Modal(modalEl);

// 1. Abrir Modal para CREAR
function abrirModalCrear() {
    document.getElementById('modalTitulo').innerText = 'Nuevo Usuario';
    document.getElementById('userId').value = ''; // ID vacío = Crear
    document.getElementById('formUsuario').reset();
    document.getElementById('passHelp').innerText = 'Requerido.';
    document.getElementById('password').required = true;
    modal.show();
}

// 2. Abrir Modal para EDITAR
function abrirModalEditar(id, username, role) {
    document.getElementById('modalTitulo').innerText = 'Editar Usuario';
    document.getElementById('userId').value = id;
    document.getElementById('username').value = username;
    document.getElementById('role').value = role;
    document.getElementById('password').value = ''; // Limpiar pass
    document.getElementById('passHelp').innerText = 'Dejar vacío para mantener la actual.';
    document.getElementById('password').required = false;
    modal.show();
}

async function guardarUsuario() {
    const id = document.getElementById('userId').value;
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;

    if (!username) return Swal.fire('Error', 'El usuario es obligatorio', 'warning');
    if (!id && !password) return Swal.fire('Error', 'La contraseña es obligatoria para nuevos usuarios', 'warning');

  const url = id ? `/users/${id}` : '/users';
    const method = id ? 'PUT' : 'POST';

    try {
        // 1. Bloqueamos pantalla mientras procesa (Esto lo dejamos modal por seguridad)
        Swal.fire({
            title: 'Guardando...',
            text: 'Por favor espere',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });

        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, role })
        });

        const result = await response.json();

        // Cerramos el loading inmediatamente
        Swal.close(); 

        if (result.success) {
            // 2. OCULTAR MODAL Y REFRESCAR
            const modalEl = document.getElementById('modalUsuario');
            const modal = bootstrap.Modal.getInstance(modalEl);
            modal.hide();

            // 3. MOSTRAR TOAST DE ÉXITO (NUEVO)
            showSuccessToast('Usuario guardado correctamente');

            // 4. Recargar tabla
            $('#tablaUsuarios').bootstrapTable('refresh');
            
        } else {
            // 5. MOSTRAR TOAST DE ERROR (NUEVO)
            showErrorToast(result.error || 'Error desconocido');
        }
    } catch (error) {
        Swal.close();
        console.error(error);
        showErrorToast('Error de conexión con el servidor');
    }
}

// 4. Eliminar con SweetAlert (Confirmación bonita)
async function eliminarUsuario(id) {
    const confirmacion = await Swal.fire({
        title: '¿Estás seguro?',
        text: "No podrás revertir esta acción",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    });

    if (!confirmacion.isConfirmed) return;

    try {
        Swal.fire({ title: 'Eliminando...', didOpen: () => Swal.showLoading() });

        const response = await fetch(`/users/${id}`, { method: 'DELETE' });
        const result = await response.json();
        
         if (result.success) {
            // USAMOS TOAST AQUÍ
            showSuccessToast('El usuario ha sido eliminado');
            
            // Refrescar tabla
            $('#tablaUsuarios').bootstrapTable('refresh');
        } else {
            showErrorToast(result.error);
        }
    } catch (error) {
        Swal.close();
        showErrorToast('Error al intentar eliminar');
    }
}