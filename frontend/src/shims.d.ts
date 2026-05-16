declare module 'react-dom/client'
declare module 'clsx'
declare module 'recharts'
declare module 'axios'
declare module 'zustand'

// Generic fallback for modules without types
declare module '*' {
  const v: any
  export default v
}
