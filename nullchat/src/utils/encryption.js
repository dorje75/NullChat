
export async function deriveKey(accessKey, roomId) {
  const encoder = new TextEncoder()

  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(accessKey),
    'PBKDF2',
    false,        
    ['deriveKey'] 
  )

  
  return crypto.subtle.deriveKey(
    {
      name:       'PBKDF2',
      salt:       encoder.encode('nullchat-v1-' + roomId), 
      iterations: 100000,   
      hash:       'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 }, 
    false,          
    ['encrypt', 'decrypt']
  )
}



export async function encryptMessage(key, plaintext) {
  
  const iv = crypto.getRandomValues(new Uint8Array(12))

  const encoded = new TextEncoder().encode(plaintext)

  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  )

  
  return {
    ciphertext: bufferToBase64(ciphertextBuffer),
    iv:         bufferToBase64(iv),
  }
}



export async function decryptMessage(key, ciphertext, iv) {
  try {
    const plaintextBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: base64ToBuffer(iv) },
      key,
      base64ToBuffer(ciphertext)
    )
    return new TextDecoder().decode(plaintextBuffer)
  } catch {
    
    return '[decryption failed]'
  }
}


function bufferToBase64(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
}

function base64ToBuffer(base64) {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}