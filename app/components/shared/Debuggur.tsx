// Add this component temporarily in layout.tsx or wherever you suspect the issue

'use client'

import { useEffect, useState } from "react"

export default function ConsoleViewer() {
  const [logs, setLogs] = useState<string[]>([])

  useEffect(() => {
    const originalConsoleLog = console.log
    console.log = (...args) => {
      originalConsoleLog(...args)
      setLogs(prev => [...prev, args.join(" ")].slice(-50)) // last 50 logs
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
    }}>
      {logs.map((log, i) => <div key={i}>{log}</div>)}
    </div>
  )
}
