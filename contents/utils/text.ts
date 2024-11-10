export const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text
    
    const halfLength = Math.floor(maxLength / 2)
    const start = text.slice(0, halfLength)
    const end = text.slice(-halfLength)
    
    return `${start}...${end}`
  }
  
  export const stripHtml = (html: string) => {
    const doc = new DOMParser().parseFromString(html, 'text/html')
    return doc.body.textContent || ""
  }