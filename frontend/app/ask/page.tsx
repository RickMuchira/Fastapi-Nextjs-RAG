// app/ask/page.tsx

"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/navbar";
import { SparklesCore } from "@/components/sparkles";
import ChatSidebar from "@/components/chat/chat-sidebar";
import ChatWindow from "@/components/chat/chat-window";
import PDFPreviewPanel from "@/components/pdf-preview-panel";
import UnitSelector from "@/components/chat/unit-selector"; // (only used if you kept the top selector)
import { toast, Toaster } from "sonner";
import axios from "axios";
import type { ChatSession, ChatMessage } from "@/types/chat";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

interface DocumentWithPath {
  id: number;
  filename: string;
  filepath: string;
  course_path: string;
}

export default function AskQuestionPage() {
  // chat
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] =
    useState<string | null>(null);

  // unit & pdf state
  const [selectedUnit, setSelectedUnit] = useState<{
    unitId: number;
    unitName: string;
    coursePath: string;
  } | null>(null);
  const [unitPdfs, setUnitPdfs] = useState<DocumentWithPath[]>([]);
  const [selectedPdfId, setSelectedPdfId] = useState<number | null>(null);

  // load / save sessions
  useEffect(() => {
    const raw = localStorage.getItem("chatSessions");
    if (raw) {
      try {
        const sessions = JSON.parse(raw);
        setChatSessions(
          sessions.map((s: any) => ({
            ...s,
            timestamp: new Date(s.timestamp),
            messages: s.messages.map((m: any) => ({
              ...m,
              timestamp: new Date(m.timestamp),
            })),
          }))
        );
      } catch {}
    }
  }, []);
  useEffect(() => {
    localStorage.setItem("chatSessions", JSON.stringify(chatSessions));
  }, [chatSessions]);

  // fetch PDFs on unit change
  useEffect(() => {
    if (!selectedUnit) {
      setUnitPdfs([]);
      setSelectedPdfId(null);
      return;
    }
    axios
      .get<DocumentWithPath[]>(
        `${API_BASE_URL}/units/${selectedUnit.unitId}/documents/`
      )
      .then((res) => {
        setUnitPdfs(res.data);
        setSelectedPdfId(res.data.length ? res.data[0].id : null);
      })
      .catch(() => {
        toast.error("Could not load PDFs for that unit");
        setUnitPdfs([]);
        setSelectedPdfId(null);
      });
  }, [selectedUnit]);

  const getPdfUrl = (id: number | null) =>
    id ? `${API_BASE_URL}/documents/download/${id}` : null;

  // chat helpers
  const getCurrentSession = () =>
    chatSessions.find((s) => s.id === currentSessionId) || null;

  const createNewSession = (
    unitId: number,
    unitName: string,
    coursePath: string
  ) => {
    const id = Date.now().toString();
    const newSess: ChatSession = {
      id,
      unitId,
      unitName,
      coursePath,
      messages: [],
      timestamp: new Date(),
    };
    setChatSessions((prev) => [newSess, ...prev]);
    setCurrentSessionId(id);
    return id;
  };

  const addMessage = (sid: string, msg: ChatMessage) =>
    setChatSessions((prev) =>
      prev.map((s) =>
        s.id === sid ? { ...s, messages: [...s.messages, msg] } : s
      )
    );

  const updateMessage = (
    sid: string,
    mid: string,
    updates: Partial<ChatMessage>
  ) =>
    setChatSessions((prev) =>
      prev.map((s) =>
        s.id === sid
          ? {
              ...s,
              messages: s.messages.map((m) =>
                m.id === mid ? { ...m, ...updates } : m
              ),
            }
          : s
      )
    );

  const deleteSession = (sid: string) => {
    setChatSessions((prev) => prev.filter((s) => s.id !== sid));
    if (currentSessionId === sid) setCurrentSessionId(null);
    toast.success("Chat session deleted");
  };

  return (
    <div className="min-h-screen flex flex-col bg-black/[0.96] text-white relative overflow-hidden">
      {/* Background sparkles */}
      <div className="absolute inset-0 z-0">
        <SparklesCore
          id="tsparticlesfullpage"
          background="transparent"
          minSize={0.4}
          maxSize={1.0}
          particleDensity={50}
          className="w-full h-full"
          particleColor="#FFFFFF"
        />
      </div>

      <div className="relative z-10 flex flex-col h-screen">
        <Navbar />

        {/* three‐column grid */}
        <div className="flex flex-1 overflow-hidden">
          {/* ← sidebar */}
          <ChatSidebar
            sessions={chatSessions}
            currentSessionId={currentSessionId}
            onSelectSession={setCurrentSessionId}
            onDeleteSession={deleteSession}
            onNewSession={() => setCurrentSessionId(null)}
          />

          {/* ↔ center: chat + bottom controls */}
          <ChatWindow
            currentSession={getCurrentSession()}
            onCreateSession={createNewSession}
            onAddMessage={addMessage}
            onUpdateMessage={updateMessage}

            /** ← these five are *required* **/
            selectedUnit={selectedUnit}
            onUnitSelect={setSelectedUnit}
            unitPdfs={unitPdfs}
            selectedPdfId={selectedPdfId}
            onPdfSelect={setSelectedPdfId}
          />

          {/* → pdf preview */}
          <div className="w-1/3 p-4 border-l border-white/10 overflow-y-auto">
            <PDFPreviewPanel pdfUrl={getPdfUrl(selectedPdfId)} />
          </div>
        </div>
      </div>

      <Toaster />
    </div>
  );
}
