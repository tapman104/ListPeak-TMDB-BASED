import { strToU8, strFromU8, zlibSync, unzlibSync } from 'fflate';
import QRCode from 'qrcode';
import type { ExportPayload } from './storage/adapter';

export async function exportToQR(payload: ExportPayload): Promise<string> {
  const jsonStr = JSON.stringify(payload);
  const buf = strToU8(jsonStr);
  const compressed = zlibSync(buf, { level: 9 });
  
  // Convert to base64
  let binary = '';
  const len = compressed.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(compressed[i]);
  }
  const base64 = btoa(binary);

  if (base64.length > 2800) {
    throw new Error(`QR_TOO_LARGE: size is ${base64.length} bytes`);
  }
  
  return base64;
}

export async function importFromQR(raw: string): Promise<ExportPayload> {
  const binary = atob(raw);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  
  const decompressed = unzlibSync(bytes);
  const jsonStr = strFromU8(decompressed);
  const payload = JSON.parse(jsonStr) as ExportPayload;
  
  // Basic validation
  if (!payload.version || !Array.isArray(payload.watchlist)) {
    throw new Error('INVALID_PAYLOAD');
  }
  
  return payload;
}

export async function generateQRDataURL(data: string): Promise<string> {
  return QRCode.toDataURL(data, { errorCorrectionLevel: 'L', margin: 2, scale: 4 });
}
