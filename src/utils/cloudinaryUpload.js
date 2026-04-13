import { apiFetch } from '../api/client'

export async function uploadToCloudinary(file, folder = 'chat-images') {
  const sig = await apiFetch('/api/upload/sign', {
    method: 'POST',
    body: JSON.stringify({ folder }),
  })

  const formData = new FormData()
  formData.append('file', file)
  formData.append('api_key', sig.api_key)
  formData.append('timestamp', sig.timestamp)
  formData.append('signature', sig.signature)
  formData.append('folder', sig.folder)

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${sig.cloud_name}/auto/upload`,
    { method: 'POST', body: formData }
  )
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data.secure_url
}
