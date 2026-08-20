"use client";

import { useState, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";

interface AudioPlayerProps {
  text: string;
  className?: string;
}

const PROVIDERS = [
  { value: "edge", label: "Edge TTS (Free)" },
  { value: "gemini", label: "Gemini" },
  { value: "elevenlabs", label: "ElevenLabs" },
];

export default function AudioPlayer({ text, className = "" }: AudioPlayerProps) {
  const t = useTranslations("school.voice");
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState("edge");
  const [speed, setSpeed] = useState(1.0);
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  const stopCurrent = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
  }, []);

  const handlePlay = useCallback(async () => {
    if (playing) {
      stopCurrent();
      setPlaying(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.post(
        "/schools/voice/synthesize/",
        { text, provider, speed },
        { responseType: "blob", timeout: 60000 }
      );

      const blob = new Blob([res.data], { type: "audio/mpeg" });
      const url = URL.createObjectURL(blob);
      blobUrlRef.current = url;

      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => {
        setPlaying(false);
        stopCurrent();
      };

      audio.onerror = () => {
        setPlaying(false);
        setError(t("playbackError"));
        stopCurrent();
      };

      await audio.play();
      setPlaying(true);
    } catch {
      setError(t("synthesisFailed"));
    } finally {
      setLoading(false);
    }
  }, [text, provider, speed, playing, stopCurrent, t]);

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {/* Play Button */}
      <button
        onClick={handlePlay}
        disabled={loading || !text}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all hover:scale-105 disabled:opacity-50"
        style={{ background: playing ? "var(--color-error)" : "var(--color-primary)" }}
        title={t("listenToLesson")}
      >
        {loading ? (
          <span className="animate-spin">⏳</span>
        ) : playing ? (
          "⏸"
        ) : (
          "🔊"
        )}
        <span>{playing ? t("stop") : t("listen")}</span>
      </button>

      {/* Settings Toggle */}
      <button
        onClick={() => setShowSettings(!showSettings)}
        className="px-2 py-1.5 rounded-xl text-xs font-bold transition-all hover:scale-105"
        style={{
          background: showSettings ? "var(--color-primary-light)" : "var(--color-background)",
          color: showSettings ? "var(--color-primary)" : "var(--color-text-muted)",
          border: "1px solid var(--color-border)",
        }}
        title={t("settings")}
      >
        ⚙️
      </button>

      {/* Settings Panel */}
      {showSettings && (
        <div
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs border"
          style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
        >
          <label className="flex items-center gap-1">
            <span style={{ color: "var(--color-text-muted)" }}>{t("provider")}:</span>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="px-1 py-0.5 rounded text-xs border outline-none"
              style={{ background: "var(--color-background)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
            >
              {PROVIDERS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-1">
            <span style={{ color: "var(--color-text-muted)" }}>{t("speed")}:</span>
            <select
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="px-1 py-0.5 rounded text-xs border outline-none"
              style={{ background: "var(--color-background)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
            >
              <option value={0.5}>0.5x</option>
              <option value={0.75}>0.75x</option>
              <option value={1.0}>1.0x</option>
              <option value={1.25}>1.25x</option>
              <option value={1.5}>1.5x</option>
              <option value={2.0}>2.0x</option>
            </select>
          </label>
        </div>
      )}

      {/* Error */}
      {error && (
        <span className="text-xs font-bold" style={{ color: "var(--color-error)" }}>
          {error}
        </span>
      )}
    </div>
  );
}
