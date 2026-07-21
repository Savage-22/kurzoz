export const globalErrorHandler = (error, req, res, next) => {
    const status = error.status || 500

    // En 5xx no se filtran detalles internos al cliente; el stack queda solo en logs
    if (status >= 500) {
        console.error(error)
        return res.status(500).json({ success: false, message: 'Error interno del servidor' })
    }

    const payload = { success: false, message: error.message }
    if (error.errors) payload.errors = error.errors
    return res.status(status).json(payload)
}
