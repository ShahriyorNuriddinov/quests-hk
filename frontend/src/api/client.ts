import axios from 'axios'

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' })

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

export function imgUrl(path: string | undefined | null): string | undefined {
  if (!path) return undefined
  if (path.startsWith('http')) return path
  return path
}

export default api
