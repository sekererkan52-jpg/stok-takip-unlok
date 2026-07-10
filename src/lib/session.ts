const encoder = new TextEncoder();
const decoder = new TextDecoder();

const SECRET = process.env.SESSION_SECRET || "default-very-long-and-secure-fallback-secret-key-32-chars";

async function getCryptoKey() {
  const keyData = encoder.encode(SECRET);
  return crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function base64urlEncode(str: string): string {
  const bytes = encoder.encode(str);
  let binString = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binString += String.fromCharCode(bytes[i]);
  }
  return btoa(binString)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function base64urlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binString = atob(base64);
  const bytes = new Uint8Array(binString.length);
  for (let i = 0; i < binString.length; i++) {
    bytes[i] = binString.charCodeAt(i);
  }
  return decoder.decode(bytes);
}

export async function signToken(payload: any): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64urlEncode(JSON.stringify(header));
  
  // Add expiration (7 days from now)
  const enrichedPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
  };
  const encodedPayload = base64urlEncode(JSON.stringify(enrichedPayload));
  const dataToSign = `${encodedHeader}.${encodedPayload}`;
  
  const key = await getCryptoKey();
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(dataToSign)
  );
  
  const signatureArray = Array.from(new Uint8Array(signatureBuffer));
  let signatureString = "";
  for (let i = 0; i < signatureArray.length; i++) {
    signatureString += String.fromCharCode(signatureArray[i]);
  }
  const signature = btoa(signatureString)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
  
  return `${dataToSign}.${signature}`;
}

export async function verifyToken(token: string): Promise<any | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    
    const [encodedHeader, encodedPayload, signature] = parts;
    const dataToSign = `${encodedHeader}.${encodedPayload}`;
    
    const key = await getCryptoKey();
    
    // Decode base64url signature back to array buffer
    let base64 = signature.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
      base64 += "=";
    }
    const binString = atob(base64);
    const signatureBuffer = new Uint8Array(binString.length);
    for (let i = 0; i < binString.length; i++) {
      signatureBuffer[i] = binString.charCodeAt(i);
    }
    
    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBuffer,
      encoder.encode(dataToSign)
    );
    
    if (!isValid) return null;
    
    const payload = JSON.parse(base64urlDecode(encodedPayload));
    
    // Check expiration
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      return null;
    }
    
    return payload;
  } catch (e) {
    console.error("verifyToken error:", e);
    return null;
  }
}
