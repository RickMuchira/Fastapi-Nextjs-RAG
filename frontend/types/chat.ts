export interface ChatMessage {
  id: string
  type: "user" | "assistant"
  content: string
  timestamp: Date
  saved?: boolean
  isStreaming?: boolean
}

export interface ChatSession {
  id: string
  unitId: number
  unitName: string
  coursePath: string
  messages: ChatMessage[]
  timestamp: Date
}

export interface Course {
  id: number
  name: string
}

export interface Year {
  id: number
  name: string
}

export interface Semester {
  id: number
  name: string
}

export interface Unit {
  id: number
  name: string
}
