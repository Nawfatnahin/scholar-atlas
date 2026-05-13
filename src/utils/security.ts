export async function validateFileHeader(file: File): Promise<boolean> {
  // Prevent double extensions like .pdf.exe
  const nameParts = file.name.split(".");
  if (nameParts.length > 2) {
    const lastExt = nameParts[nameParts.length - 1].toLowerCase();
    const secondLastExt = nameParts[nameParts.length - 2].toLowerCase();
    const suspiciousExts = ["exe", "bat", "sh", "js", "vbs", "scr"];
    if (suspiciousExts.includes(lastExt) || suspiciousExts.includes(secondLastExt)) {
      return false;
    }
  }

  const header = await file.slice(0, 4).arrayBuffer();
  const arr = new Uint8Array(header);
  
  // PDF: %PDF (25 50 44 46)
  if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
    return arr[0] === 0x25 && arr[1] === 0x50 && arr[2] === 0x44 && arr[3] === 0x46;
  }
  
  // PNG: 89 50 4E 47
  if (file.type === "image/png" || file.name.endsWith(".png")) {
    return arr[0] === 0x89 && arr[1] === 0x50 && arr[2] === 0x4E && arr[3] === 0x47;
  }
  
  // JPEG: FF D8 FF
  if (file.type === "image/jpeg" || file.name.endsWith(".jpg") || file.name.endsWith(".jpeg")) {
    return arr[0] === 0xFF && arr[1] === 0xD8 && arr[2] === 0xFF;
  }

  // WebP: RIFF .... WEBP
  if (file.type === "image/webp" || file.name.endsWith(".webp")) {
    return arr[0] === 0x52 && arr[1] === 0x49 && arr[2] === 0x46 && arr[3] === 0x46;
  }

  return true; // Default to true for other types if allowed
}
