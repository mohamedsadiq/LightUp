export const truncateText = (text: string, maxLength: number = 100): string => {
  if (text.length <= maxLength) return text;
  
  const halfLength = Math.floor(maxLength / 2);
  const start = text.slice(0, halfLength);
  const end = text.slice(-halfLength);
  
  return `${start}...${end}`;
};

export const stripHtml = (html: string): string => {
  const temp = document.createElement('div');
  temp.innerHTML = html;
  return temp.textContent || temp.innerText || '';
}; 