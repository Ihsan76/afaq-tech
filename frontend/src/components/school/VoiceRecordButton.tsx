"use client";

import { useState, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";

interface VoiceRecordButtonProps {
  onTranscribed: (text: string) => void;
  className?: string;
}

export default function VoiceRecordButton({ onTranscribed, className = "" }: VoiceRecordButtonProps) {
  const t = useTranslations("school.voice");
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleRecord = useCallback(async () => {
    if (recording) {
      stopRecording();
      return;
    }

    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());

        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        if (blob.size < 100) return;

        setTranscribing(true);
        try {
          const formData = new FormData();
          formData.append("audio", blob, "recording.webm");

          const res = await api.post("/schools/voice/transcribe/", formData, {
            headers: { "Content-Type": "multipart/form-data" },
            timeout: 60000,
          });

          if (res.data.text) {
            onTranscribed(res.data.text);
          }
        } catch {
          setError(t("transcriptionFailed"));
        } finally {
          setTranscribing(false);
          setDuration(0);
        }
      };

      mediaRecorder.start();
      setRecording(true);
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch {
      setError(t("microphoneDenied"));
    }
  }, [recording, stopRecording, onTranscribed, t]);

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <button
        onClick={handleRecord}
        disabled={transcribing}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all hover:scale-105 disabled:opacity-50"
        style={{
          background: recording ? "#ef4444" : transcribing ? "#f59e0b" : "var(--color-primary)",
          animation: recording ? "pulse 1s infinite" : undefined,
        }}
      >
        {transcribing ? (
          <span className="animate-spin">⏳</span>
        ) : recording ? (
          "⏹"
        ) : (
          "🎤"
        )}
        <span>
          {transcribing
            ? t("transcribing")
            : recording
              ? `${t("stopRecording")} ${formatDuration(duration)}`
              : t("record")}
        </span>
      </button>

      {error && (
        <span className="text-xs font-bold" style={{ color: "var(--color-error)" }}>
          {error}
        </span>
      )}
    </div>
  );
}
