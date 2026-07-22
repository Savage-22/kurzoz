import { toPng } from 'html-to-image'
import { jsPDF } from 'jspdf'

// #35 · Exporta la grilla del horario a imagen (PNG) o a PDF, 100% en el
// navegador. Recibe el nodo del DOM de la grilla ya renderizada.

const triggerDownload = (dataUrl, filename) => {
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = filename
    link.click()
}

const loadImage = (src) =>
    new Promise((resolve, reject) => {
        const image = new Image()
        image.onload = () => resolve(image)
        image.onerror = reject
        image.src = src
    })

// Captura el nodo (con su ancho real de contenido) a un PNG en alta resolución.
const capture = (node) =>
    toPng(node, { backgroundColor: '#ffffff', pixelRatio: 2, width: node.scrollWidth, height: node.scrollHeight })

export const exportarPng = async (node, filename = 'horario.png') => {
    triggerDownload(await capture(node), filename)
}

// PDF A4 horizontal: la grilla escalada a la página, con un título arriba.
export const exportarPdf = async (node, { filename = 'horario.pdf', titulo = 'Horario' } = {}) => {
    const dataUrl = await capture(node)
    const image = await loadImage(dataUrl)
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 32

    pdf.setFontSize(13)
    pdf.text(titulo, margin, margin)

    const scale = Math.min((pageWidth - margin * 2) / image.width, (pageHeight - margin * 2 - 16) / image.height)
    pdf.addImage(dataUrl, 'PNG', margin, margin + 12, image.width * scale, image.height * scale)
    pdf.save(filename)
}
