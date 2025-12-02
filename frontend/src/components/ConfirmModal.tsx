import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { AlertTriangle, Info, HelpCircle, X } from 'lucide-react'

type ConfirmType = 'danger' | 'warning' | 'info'

interface ConfirmOptions {
  title?: string
  message: string
  type?: ConfirmType
  confirmText?: string
  cancelText?: string
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>
}

const ConfirmContext = createContext<ConfirmContextType | null>(null)

export function useConfirm() {
  const context = useContext(ConfirmContext)
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider')
  }
  return context
}

const typeStyles: Record<ConfirmType, { icon: ReactNode; buttonBg: string; iconBg: string }> = {
  danger: {
    icon: <AlertTriangle className="w-6 h-6 text-red-600" />,
    iconBg: 'bg-red-100',
    buttonBg: 'bg-red-600 hover:bg-red-700',
  },
  warning: {
    icon: <AlertTriangle className="w-6 h-6 text-yellow-600" />,
    iconBg: 'bg-yellow-100',
    buttonBg: 'bg-yellow-600 hover:bg-yellow-700',
  },
  info: {
    icon: <HelpCircle className="w-6 h-6 text-blue-600" />,
    iconBg: 'bg-blue-100',
    buttonBg: 'bg-blue-600 hover:bg-blue-700',
  },
}

interface ConfirmState {
  isOpen: boolean
  options: ConfirmOptions
  resolve: ((value: boolean) => void) | null
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConfirmState>({
    isOpen: false,
    options: { message: '' },
    resolve: null,
  })

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({
        isOpen: true,
        options,
        resolve,
      })
    })
  }, [])

  const handleClose = (result: boolean) => {
    if (state.resolve) {
      state.resolve(result)
    }
    setState((prev) => ({ ...prev, isOpen: false, resolve: null }))
  }

  const style = typeStyles[state.options.type || 'info']

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      
      {/* Confirm Modal */}
      {state.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => handleClose(false)}
          />
          
          {/* Modal */}
          <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 animate-scale-in">
            {/* Close button */}
            <button
              onClick={() => handleClose(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-6">
              {/* Icon and Content */}
              <div className="flex gap-4">
                <div className={`flex-shrink-0 w-12 h-12 rounded-full ${style.iconBg} flex items-center justify-center`}>
                  {style.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {state.options.title || 'Xác nhận'}
                  </h3>
                  <p className="text-gray-600">
                    {state.options.message}
                  </p>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 mt-6 justify-end">
                <button
                  onClick={() => handleClose(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                  {state.options.cancelText || 'Hủy'}
                </button>
                <button
                  onClick={() => handleClose(true)}
                  className={`px-4 py-2 text-white rounded-lg font-medium transition-colors ${style.buttonBg}`}
                >
                  {state.options.confirmText || 'Xác nhận'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}
