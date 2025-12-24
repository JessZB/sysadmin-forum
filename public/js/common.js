// ==========================================
// CONFIGURACIÓN GLOBAL DE TOASTS (SweetAlert2)
// ==========================================

// 1. Definimos el estilo base del Toast
const ToastMixin = Swal.mixin({
    toast: true,
    position: 'top-end', // Arriba a la derecha
    showConfirmButton: false,
    timer: 3000, // Dura 3 segundos
    timerProgressBar: true,
    didOpen: (toast) => {
        // Pausar el tiempo si el usuario pasa el mouse por encima
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
    }
});

// 2. Creamos funciones globales para usarlas en cualquier vista

/**
 * Muestra un mensaje de éxito pequeño en la esquina
 * @param {string} message - El texto a mostrar
 */
window.showSuccessToast = (message) => {
    ToastMixin.fire({
        icon: 'success',
        title: message
    });
};

/**
 * Muestra un mensaje de error pequeño en la esquina
 * @param {string} message - El texto a mostrar
 */
window.showErrorToast = (message) => {
    ToastMixin.fire({
        icon: 'error',
        title: message
    });
};

/**
 * Muestra un mensaje de advertencia/info
 * @param {string} message 
 */
window.showInfoToast = (message) => {
    ToastMixin.fire({
        icon: 'info',
        title: message
    });
};