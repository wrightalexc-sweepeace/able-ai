'use client'

import { useEffect, useState } from "react"

export default function ConsoleViewer() {
  const [logs, setLogs] = useState<string[]>([])

  useEffect(() => {
    const addLog = (msg: string) => {
      setLogs(prev => [...prev, msg].slice(-50))
    }

    // Save original console methods
    const originalConsoleLog = console.log
    const originalConsoleError = console.error

    // Override console.log
    console.log = (...args) => {
      originalConsoleLog(...args)
      addLog('[log] ' + args.join(' '))
    }

    // Override console.error
    console.error = (...args) => {
      originalConsoleError(...args)
      addLog('[error] ' + args.join(' '))
    }

    // Catch uncaught JS errors
    const handleError = (event: ErrorEvent) => {
      addLog('[uncaught error] ' + event.message + ' at ' + event.filename + ':' + event.lineno + ':' + event.colno)
    }
    window.addEventListener('error', handleError)

    // Catch unhandled promise rejections
    const handleRejection = (event: PromiseRejectionEvent) => {
      addLog('[unhandled rejection] ' + event.reason)
    }
    window.addEventListener('unhandledrejection', handleRejection)

    // Cleanup on unmount
    return () => {
      console.log = originalConsoleLog
      console.error = originalConsoleError
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleRejection)
    }
  }, [])

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      background: 'black',
      color: 'lime',
      fontSize: 12,
      padding: 8,
      maxHeight: '30vh',
      overflowY: 'scroll',
      zIndex: 9999,
      width: '100%',
      whiteSpace: 'pre-wrap',
      fontFamily: 'monospace',
    }}>
      {logs.map((log, i) => <div key={i}>{log}</div>)}
    </div>
  )
}
