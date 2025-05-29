import { useEffect, useRef } from "react"

type SSECallback = (token: string) => void

export default function useSSE(
  url: string | null,
  onToken: SSECallback,
  onDone: () => void,
  options?: { start: boolean }
) {
  const esRef = useRef<EventSource | null>(null)

  useEffect(() => {
    if (!url || options?.start === false) return
    esRef.current?.close() // Always close any previous stream

    const es = new EventSource(url)
    es.onmessage = (e) => onToken(e.data)
    es.addEventListener("end", () => {
      es.close()
      onDone()
    })
    es.onerror = () => {
      es.close()
      onDone()
    }
    esRef.current = es

    return () => es.close()
    // eslint-disable-next-line
  }, [url, options?.start])
}
