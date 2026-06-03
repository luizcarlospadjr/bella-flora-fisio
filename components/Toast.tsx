import React, { createContext, useContext, useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastContextType {
  showToast: (message: string, type: ToastType) => void
  showSuccess: (message: string) => void
  showError: (message: string) => void
  showWarning: (message: string) => void
  showInfo: (message: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback((message: string, type: ToastType) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, message, type }])
    
    // Auto remove after 4 seconds
    setTimeout(() => {
      removeToast(id)
    }, 4000)
  }, [removeToast])

  const showSuccess = useCallback((message: string) => showToast(message, 'success'), [showToast])
  const showError = useCallback((message: string) => showToast(message, 'error'), [showToast])
  const showWarning = useCallback((message: string) => showToast(message, 'warning'), [showToast])
  const showInfo = useCallback((message: string) => showToast(message, 'info'), [showToast])

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showWarning, showInfo }}>
      {children}
      
      {/* Toast Portal Container */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95, transition: { duration: 0.15 } }}
              layout
              onClick={() => removeToast(toast.id)}
              className={`
                pointer-events-auto cursor-pointer w-full rounded-2xl border p-4 shadow-lg backdrop-blur-md flex items-start gap-3 transition-all hover:scale-[1.01] active:scale-[0.99]
                ${toast.type === 'success' && 'bg-emerald-50/90 border-emerald-200/80 text-emerald-950'}
                ${toast.type === 'error' && 'bg-rose-50/90 border-rose-200/80 text-rose-950'}
                ${toast.type === 'warning' && 'bg-amber-50/90 border-amber-200/80 text-amber-950'}
                ${toast.type === 'info' && 'bg-purple-50/90 border-purple-200/80 text-purple-950'}
              `}
            >
              <div className="shrink-0 mt-0.5">
                {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-600" />}
                {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-600" />}
                {toast.type === 'info' && <Info className="w-5 h-5 text-purple-700" />}
              </div>
              <div className="flex-1 text-xs font-semibold leading-relaxed">
                {toast.message}
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation()
                  removeToast(toast.id)
                }}
                className="shrink-0 text-slate-400 hover:text-slate-600 active:scale-90 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
