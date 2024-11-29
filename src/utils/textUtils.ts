export const chunkString = (str: string): string[] => {
  const words: string[] = str.split(" ");
  const chunks: string[] = [];
  
  for (let i = 0; i < words.length; i += 2) {
    const chunk = words.slice(i, i + 2);
    if (chunk.length === 2) {
      chunks.push(chunk.join(" "));
    } else {
      chunks.push(chunk[0]);
    }
  }
  
  return chunks;
}; 