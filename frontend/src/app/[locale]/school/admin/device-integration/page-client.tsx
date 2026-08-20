"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import RoleGuard from "@/components/school/RoleGuard";

export default function DeviceIntegrationDocClient() {
  const t = useTranslations("school.deviceIntegration");
  const locale = useLocale();
  const [activeSection, setActiveSection] = useState("overview");

  const sections = [
    { id: "overview", icon: "📋", label: t("sectionOverview") },
    { id: "architecture", icon: "🏗️", label: t("sectionArchitecture") },
    { id: "models", icon: "🗄️", label: t("sectionModels") },
    { id: "apis", icon: "🔗", label: t("sectionApis") },
    { id: "device-registration", icon: "📝", label: t("sectionDeviceRegistration") },
    { id: "rfid", icon: "💳", label: t("sectionRfid") },
    { id: "smart-cam", icon: "📷", label: t("sectionSmartCam") },
    { id: "mobile-driver", icon: "📱", label: t("sectionMobileDriver") },
    { id: "gps-tracker", icon: "📡", label: t("sectionGpsTracker") },
    { id: "face-sync", icon: "🧠", label: t("sectionFaceSync") },
    { id: "edge-setup", icon: "🖥️", label: t("sectionEdgeSetup") },
    { id: "offline", icon: "📴", label: t("sectionOffline") },
    { id: "payloads", icon: "📦", label: t("sectionPayloads") },
    { id: "security", icon: "🔒", label: t("sectionSecurity") },
    { id: "troubleshoot", icon: "🛠️", label: t("sectionTroubleshoot") },
  ];

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const content = generateMarkdownContent(t, locale);
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = t("downloadFile");
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <RoleGuard allowed={["school_admin", "admin", "developer"]}>
      <div className="min-h-screen" style={{ color: "var(--color-text)" }}>
        {/* Header - no print */}
        <div className="print:hidden sticky top-0 z-40 border-b backdrop-blur-lg" style={{ background: "color-mix(in srgb, var(--color-surface) 85%, transparent)", borderColor: "var(--color-border)" }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
                {t("title")}
              </h1>
              <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
                {t("subtitle")}
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={handlePrint} className="px-4 py-2 rounded-xl text-sm font-bold border transition-all hover:scale-105" style={{ borderColor: "var(--color-border)", background: "var(--color-background)" }}>
                🖨️ {t("print")}
              </button>
              <button onClick={handleDownload} className="px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:scale-105" style={{ background: "var(--color-primary)" }}>
                📥 {t("download")}
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex gap-8">
          {/* Sidebar TOC - no print */}
          <nav className="print:hidden hidden lg:block w-64 shrink-0">
            <div className="sticky top-24 space-y-1">
              {sections.map((s) => (
                <button key={s.id} onClick={() => { setActiveSection(s.id); document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth" }); }} className={`w-full text-right px-3 py-2 rounded-xl text-sm transition-all ${activeSection === s.id ? "font-bold" : ""}`} style={activeSection === s.id ? { background: "var(--color-primary-light)", color: "var(--color-primary)" } : { color: "var(--color-text-muted)" }}>
                  {s.icon} {s.label}
                </button>
              ))}
            </div>
          </nav>

          {/* Content */}
          <main className="flex-1 min-w-0 prose prose-sm max-w-none" style={{ fontFamily: "var(--font-body)" }}>

            {/* Overview */}
            <Section id="overview" title={t("sectionOverview")} icon="📋">
              <p className="leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                {t("overviewDesc")}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 not-prose">
                {[
                  { icon: "📡", title: t("cardGpsTitle"), desc: t("cardGpsDesc") },
                  { icon: "💳", title: t("cardRfidTitle"), desc: t("cardRfidDesc") },
                  { icon: "📷", title: t("cardCamTitle"), desc: t("cardCamDesc") },
                  { icon: "📱", title: t("cardPhoneTitle"), desc: t("cardPhoneDesc") },
                ].map((c, i) => (
                  <div key={i} className="p-5 rounded-2xl border" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
                    <div className="text-3xl mb-2">{c.icon}</div>
                    <h3 className="font-bold text-sm mb-1">{c.title}</h3>
                    <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>{c.desc}</p>
                  </div>
                ))}
              </div>
            </Section>

            {/* Architecture */}
            <Section id="architecture" title={t("archTitle")} icon="🏗️">
              <div className="rounded-2xl border p-6 mt-4 not-prose" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
                <pre className="text-xs leading-relaxed overflow-x-auto" style={{ color: "var(--color-text)", direction: "ltr", textAlign: "left" }}>
{`┌─────────────────────────────────────────────────┐
│          Afaq Platform                            │
│    Backend: Django+DRF  │  Frontend: Next.js      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ Devices  │  │ Telemetry│  │   Scan   │       │
│  │   API    │  │   API    │  │   API    │       │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘       │
│  ┌────┴──────────────┴──────────────┴────────┐   │
│  │       PostgreSQL (Supabase)                │   │
│  └───────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
       ▲                    ▲                    ▲
  ┌────┴────┐         ┌────┴────┐         ┌────┴────┐
  │ GPS/4G  │         │  RFID   │         │ Smart   │
  │ Tracker │         │ Reader  │         │ Camera  │
  └────┬────┘         └────┬────┘         └────┬────┘
       │                    │                    │
  ┌────┴────────────────────┴────────────────────┴────┐
  │              School Bus                            │
  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
  │  │ Driver   │  │  RFID    │  │ Camera + Edge PC  │ │
  │  │ Phone    │  │ Reader   │  │ + AI Model        │ │
  │  │ (PWA)    │  │          │  │                    │ │
  │  └──────────┘  └──────────┘  └──────────────────┘ │
  └───────────────────────────────────────────────────┘`}
                </pre>
              </div>
            </Section>

            {/* Models */}
            <Section id="models" title={t("modelsTitle")} icon="🗄️">
              <ModelTable title="SchoolDevice" desc={t("modelsDeviceDesc")} fields={[
                ["school", "FK → School", t("fieldSchool")],
                ["name", "CharField", t("fieldName")],
                ["device_type", "Choice", "gps_tracker | rfid_reader | facial_camera | mobile_app"],
                ["device_identifier", "CharField (unique)", t("fieldIdentifier")],
                ["api_token", "TextField", t("fieldToken")],
                ["assigned_bus", "FK → SchoolBus", t("fieldBus")],
                ["assigned_gate", "CharField", t("fieldGate")],
                ["status", "Choice", "offline | online | maintenance"],
                ["last_seen_at", "DateTimeField", t("fieldLastSeen")],
              ]} />
              <ModelTable title="BusLocationLog" desc={t("modelsGpsLogDesc")} fields={[
                ["bus", "FK → SchoolBus", t("fieldSchool")],
                ["device", "FK → SchoolDevice", t("fieldDevice")],
                ["latitude", "DecimalField", t("fieldLat")],
                ["longitude", "DecimalField", t("fieldLng")],
                ["speed", "DecimalField", t("fieldSpeed")],
                ["heading", "DecimalField", t("fieldHeading")],
                ["timestamp", "DateTimeField", t("fieldTimestamp")],
              ]} />
              <ModelTable title="DeviceEvent" desc={t("modelsEventDesc")} fields={[
                ["device", "FK → SchoolDevice", t("fieldDevice")],
                ["event_type", "Choice", "rfid_tap | facial_recognition"],
                ["student", "FK → User", t("fieldStudent")],
                ["direction", "Choice", t("fieldDirection")],
                ["timestamp", "DateTimeField", t("fieldTimestamp")],
                ["raw_payload", "JSONField", t("fieldRaw")],
              ]} />
              <ModelTable title="BusStop" desc={t("modelsStopDesc")} fields={[
                ["route", "FK → BusRoute", t("fieldRoute")],
                ["name", "CharField", t("fieldStopName")],
                ["latitude", "DecimalField", t("fieldLat")],
                ["longitude", "DecimalField", t("fieldLng")],
                ["order", "PositiveIntegerField", t("fieldOrder")],
                ["is_active", "BooleanField", t("fieldActive")],
              ]} />
            </Section>

            {/* APIs */}
            <Section id="apis" title={t("apisTitle")} icon="🔗">
              <ApiTable rows={[
                ["GET/POST", "/api/v1/schools/devices/", t("apiDeviceCrud"), t("authAdminReadOnly")],
                ["POST", "/api/v1/schools/devices/<id>/regenerate-token/", t("apiRegenToken"), t("authAdmin")],
                ["POST", "/api/v1/schools/devices/<id>/heartbeat/", t("apiHeartbeat"), t("authAny")],
                ["POST", "/api/v1/schools/telemetry/", t("apiTelemetry"), t("authAny")],
                ["POST", "/api/v1/schools/scan/", t("apiScan"), t("authAny")],
                ["GET", "/api/v1/schools/buses/live/", t("apiLive"), t("authAny")],
                ["GET/POST", "/api/v1/schools/bus-stops/", t("apiStops"), t("authAdminReadOnly")],
              ]} />
            </Section>

            {/* Device Registration */}
            <Section id="device-registration" title={t("regTitle")} icon="📝">
              <StepList steps={t.raw("regSteps")} />
            </Section>

            {/* RFID */}
            <Section id="rfid" title={t("rfidTitle")} icon="💳">
              <StepList steps={t.raw("rfidSteps")} />
              <div className="rounded-2xl border p-5 mt-4 not-prose" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
                <h4 className="font-bold text-sm mb-2">{t("rfidPayloadTitle")}</h4>
                <pre className="text-xs overflow-x-auto" style={{ direction: "ltr", textAlign: "left", color: "var(--color-text)" }}>
{`POST /api/v1/schools/scan/
{
  "device_identifier": "RFID-GATE-001",
  "student_id": 105,
  "event_type": "rfid_tap",
  "direction": "board",
  "timestamp": "2026-08-20T07:30:00Z"
}`}
                </pre>
              </div>
            </Section>

            {/* Smart Camera */}
            <Section id="smart-cam" title={t("camTitle")} icon="📷">
              <p className="leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                {t("camDesc")}
              </p>
              <StepList steps={t.raw("camSteps")} />
              <div className="rounded-2xl border p-5 mt-4 not-prose" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
                <h4 className="font-bold text-sm mb-2">{t("camHowTitle")}</h4>
                <pre className="text-xs overflow-x-auto" style={{ direction: "ltr", textAlign: "left", color: "var(--color-text)" }}>
{`1. Capture video from IP camera via RTSP
2. Extract frames every second
3. Detect faces in frame (Face Detection)
4. Extract face encoding (Face Encoding)
5. Compare with local database (Local DB)
   ├── Match → extract student_id
   └── No match → skip
6. Build JSON payload
7. POST to /api/v1/schools/scan/
   ├── Success → show confirmation on screen
   └── Connection failure → store in local SQLite
8. On reconnection → send buffered data (Batch Sync)`}
                </pre>
              </div>
            </Section>

            {/* Mobile Driver */}
            <Section id="mobile-driver" title={t("driverTitle")} icon="📱">
              <StepList steps={t.raw("driverSteps")} />
              <div className="rounded-2xl border p-5 mt-4 not-prose" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
                <h4 className="font-bold text-sm mb-2">{t("driverDataTitle")}</h4>
                <pre className="text-xs overflow-x-auto" style={{ direction: "ltr", textAlign: "left", color: "var(--color-text)" }}>
{`// GPS — every 10 seconds
POST /api/v1/schools/telemetry/
{
  "device_identifier": "DRIVER-PHONE-101",
  "latitude": 31.9539,
  "longitude": 35.9106,
  "speed": 45.0,
  "heading": 180.0
}

// Student card scan
POST /api/v1/schools/scan/
{
  "device_identifier": "DRIVER-PHONE-101",
  "student_id": 105,
  "event_type": "rfid_tap",
  "direction": "board"
}`}
                </pre>
              </div>
            </Section>

            {/* GPS Tracker */}
            <Section id="gps-tracker" title={t("gpsTitle")} icon="📡">
              <StepList steps={t.raw("gpsSteps")} />
            </Section>

            {/* Face Sync */}
            <Section id="face-sync" title={t("faceTitle")} icon="🧠">
              <p className="leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                {t("faceDesc")}
              </p>
              <div className="rounded-2xl border p-5 mt-4 not-prose" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
                <h4 className="font-bold text-sm mb-3">{t("faceWhyTitle")}</h4>
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                      <th className="py-2 text-start">{t("facePhotoHeader")}</th>
                      <th className="py-2 text-start">{t("faceEmbedHeader")}</th>
                    </tr>
                  </thead>
                  <tbody style={{ color: "var(--color-text-secondary)" }}>
                    <tr><td className="py-1">{t("facePhotoLarge")}</td><td className="py-1">{t("faceEmbedSmall")}</td></tr>
                    <tr><td className="py-1">{t("facePhotoPrivacy")}</td><td className="py-1">{t("faceEmbedReverse")}</td></tr>
                    <tr><td className="py-1">{t("facePhotoLight")}</td><td className="py-1">{t("faceEmbedStable")}</td></tr>
                    <tr><td className="py-1">{t("facePhotoHeavy")}</td><td className="py-1">{t("faceEmbedLight")}</td></tr>
                  </tbody>
                </table>
              </div>
              <StepList steps={t.raw("faceSteps")} />
            </Section>

            {/* Edge Setup */}
            <Section id="edge-setup" title={t("edgeTitle")} icon="🖥️">
              <h4 className="font-bold text-sm mt-6 mb-3">{t("edgeHardwareTitle")}</h4>
              <table className="w-full text-xs not-prose rounded-2xl border overflow-hidden" style={{ borderColor: "var(--color-border)" }}>
                <thead><tr style={{ background: "var(--color-background)" }}>
                  <th className="px-4 py-2 text-start">{t("edgeComponent")}</th>
                  <th className="px-4 py-2 text-start">{t("edgeSpecs")}</th>
                  <th className="px-4 py-2 text-start">{t("edgeReason")}</th>
                </tr></thead>
                <tbody>
                  <tr className="border-t" style={{ borderColor: "var(--color-border)" }}><td className="px-4 py-2 font-bold">{t("edgeRPi")}</td><td className="px-4 py-2">{t("edgeRPiSpec")}</td><td className="px-4 py-2" style={{ color: "var(--color-text-secondary)" }}>{t("edgeRPiReason")}</td></tr>
                  <tr className="border-t" style={{ borderColor: "var(--color-border)" }}><td className="px-4 py-2 font-bold">{t("edgeCamera")}</td><td className="px-4 py-2">{t("edgeCameraSpec")}</td><td className="px-4 py-2" style={{ color: "var(--color-text-secondary)" }}>{t("edgeCameraReason")}</td></tr>
                  <tr className="border-t" style={{ borderColor: "var(--color-border)" }}><td className="px-4 py-2 font-bold">{t("edgeRouter")}</td><td className="px-4 py-2">{t("edgeRouterSpec")}</td><td className="px-4 py-2" style={{ color: "var(--color-text-secondary)" }}>{t("edgeRouterReason")}</td></tr>
                  <tr className="border-t" style={{ borderColor: "var(--color-border)" }}><td className="px-4 py-2 font-bold">{t("edgeUps")}</td><td className="px-4 py-2">{t("edgeUpsSpec")}</td><td className="px-4 py-2" style={{ color: "var(--color-text-secondary)" }}>{t("edgeUpsReason")}</td></tr>
                  <tr className="border-t" style={{ borderColor: "var(--color-border)" }}><td className="px-4 py-2 font-bold">{t("edgeSsd")}</td><td className="px-4 py-2">{t("edgeSsdSpec")}</td><td className="px-4 py-2" style={{ color: "var(--color-text-secondary)" }}>{t("edgeSsdReason")}</td></tr>
                </tbody>
              </table>
              <h4 className="font-bold text-sm mt-6 mb-3">{t("edgeSetupTitle")}</h4>
              <pre className="text-xs overflow-x-auto rounded-2xl border p-4 not-prose" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)", direction: "ltr", textAlign: "left", color: "var(--color-text)" }}>
{`# 1. Install Python and libraries
sudo apt update && sudo apt install -y python3 python3-pip python3-venv
python3 -m venv /opt/afaq/venv
source /opt/afaq/venv/bin/activate
pip install opencv-python face_recognition requests numpy

# 2. Setup config file
sudo mkdir -p /opt/afaq
sudo nano /opt/afaq/config.json   # Enter required values
sudo chmod 600 /opt/afaq/config.json

# 3. Setup auto-start service
sudo nano /etc/systemd/system/afaq-bus-agent.service
# (See full content in documentation)

sudo systemctl daemon-reload
sudo systemctl enable afaq-bus-agent
sudo systemctl start afaq-bus-agent

# 4. Verify
sudo systemctl status afaq-bus-agent
sudo journalctl -u afaq-bus-agent -f`}
              </pre>
              <div className="rounded-2xl border p-5 mt-4 not-prose" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
                <h4 className="font-bold text-sm mb-2">{t("edgeConfigTitle")}</h4>
                <pre className="text-xs overflow-x-auto" style={{ direction: "ltr", textAlign: "left", color: "var(--color-text)" }}>
{`{
  "server_url": "https://api.afaq.app/api/v1/schools/scan/",
  "telemetry_url": "https://api.afaq.app/api/v1/schools/telemetry/",
  "faces_sync_url": "https://api.afaq.app/api/v1/schools/bus-routes/{route_id}/students/faces/",
  "device_identifier": "CAM-BUS-101",
  "api_token": "YOUR_DEVICE_API_TOKEN_HERE",
  "bus_id": 12,
  "route_id": 5,
  "camera_url": "rtsp://admin:password@192.168.1.100:554/stream",
  "sync_interval_seconds": 300,
  "telemetry_interval_seconds": 10,
  "offline_buffer_max": 1000
}`}
                </pre>
              </div>
            </Section>

            {/* Offline */}
            <Section id="offline" title={t("offlineTitle")} icon="📴">
              <div className="rounded-2xl border p-6 mt-4 not-prose" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
                <pre className="text-xs leading-relaxed overflow-x-auto" style={{ color: "var(--color-text)", direction: "ltr", textAlign: "left" }}>
{`┌──────────────────────────────────────────────────────┐
│           ${t("offlineDiagram").padEnd(40)}│
│                                                      │
│  1. ${t("offlineNoInternet").padEnd(48)}│
│     └── ${t("offlineSavedLocal").padEnd(42)}│
│                                                      │
│  2. ${t("offlineOnReconnect").padEnd(47)}│
│     ├── ${t("offlineFetchEvents").padEnd(42)}│
│     ├── ${t("offlineBatchSync").padEnd(44)}│
│     ├── ${t("offlineDeleteLocal").padEnd(40)}│
│     └── ${t("offlineSyncFaces").padEnd(42)}│
│                                                      │
│  3. ${t("offlineEdgePC").padEnd(45)}│
│     └── ${t("offlineNoDriver").padEnd(42)}│
└──────────────────────────────────────────────────────┘`}
                </pre>
              </div>
            </Section>

            {/* Payloads */}
            <Section id="payloads" title={t("payloadTitle")} icon="📦">
              <h4 className="font-bold text-sm mt-4 mb-2">{t("payloadGpsTitle")}</h4>
              <pre className="text-xs overflow-x-auto rounded-2xl border p-4 not-prose" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)", direction: "ltr", textAlign: "left", color: "var(--color-text)" }}>
{`POST /api/v1/schools/telemetry/
{
  "device_identifier": "string (required)",
  "bus_number": "string (optional — for bus lookup)",
  "latitude": "decimal (required)",
  "longitude": "decimal (required)",
  "speed": "decimal (optional)",
  "heading": "decimal (optional — in degrees)",
  "timestamp": "ISO 8601 (optional)"
}`}
              </pre>
              <h4 className="font-bold text-sm mt-6 mb-2">{t("payloadScanTitle")}</h4>
              <pre className="text-xs overflow-x-auto rounded-2xl border p-4 not-prose" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)", direction: "ltr", textAlign: "left", color: "var(--color-text)" }}>
{`POST /api/v1/schools/scan/
{
  "device_identifier": "string (required)",
  "student_id": "integer (optional)",
  "event_type": "rfid_tap | facial_recognition (required)",
  "direction": "board | exit (required)",
  "timestamp": "ISO 8601 (optional)",
  "raw_payload": {
    "card_uid": "string (optional — for RFID)",
    "confidence": "decimal (optional — for cameras)"
  }
}`}
              </pre>
            </Section>

            {/* Security */}
            <Section id="security" title={t("securityTitle")} icon="🔒">
              <div className="space-y-3 not-prose">
                {[
                  { icon: "🔑", title: t("secTokenTitle"), desc: t("secTokenDesc") },
                  { icon: "🔒", title: t("secTlsTitle"), desc: t("secTlsDesc") },
                  { icon: "🛡️", title: t("secRateTitle"), desc: t("secRateDesc") },
                  { icon: "📷", title: t("secPrivacyTitle"), desc: t("secPrivacyDesc") },
                  { icon: "📴", title: t("secOfflineTitle"), desc: t("secOfflineDesc") },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 p-4 rounded-2xl border" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
                    <div className="text-2xl shrink-0">{item.icon}</div>
                    <div>
                      <h4 className="font-bold text-sm">{item.title}</h4>
                      <p className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            {/* Troubleshooting */}
            <Section id="troubleshoot" title={t("troubleshootTitle")} icon="🛠️">
              <div className="space-y-3 not-prose">
                {[
                  { q: t("troubQ1"), a: t("troubA1") },
                  { q: t("troubQ2"), a: t("troubA2") },
                  { q: t("troubQ3"), a: t("troubA3") },
                  { q: t("troubQ4"), a: t("troubA4") },
                  { q: t("troubQ5"), a: t("troubA5") },
                ].map((item, i) => (
                  <div key={i} className="p-4 rounded-2xl border" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
                    <h4 className="font-bold text-sm mb-1">❓ {item.q}</h4>
                    <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>{item.a}</p>
                  </div>
                ))}
              </div>
            </Section>

          </main>
        </div>
      </div>
    </RoleGuard>
  );
}

function Section({ id, title, icon, children }: { id: string; title: string; icon: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-12 scroll-mt-24">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ fontFamily: "var(--font-heading)" }}>
        <span>{icon}</span> {title}
      </h2>
      {children}
    </section>
  );
}

function StepList({ steps }: { steps: string[] }) {
  return (
    <ol className="space-y-3 not-prose mt-4">
      {steps.map((step, i) => (
        <li key={i} className="flex gap-3 items-start">
          <span className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: "var(--color-primary)" }}>{i + 1}</span>
          <span className="text-sm leading-relaxed pt-0.5" style={{ color: "var(--color-text-secondary)" }}>{step}</span>
        </li>
      ))}
    </ol>
  );
}

function ModelTable({ title, desc, fields }: { title: string; desc: string; fields: string[][] }) {
  return (
    <div className="mb-6 not-prose">
      <h4 className="font-bold text-sm mb-1">{title}</h4>
      <p className="text-xs mb-3" style={{ color: "var(--color-text-secondary)" }}>{desc}</p>
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--color-border)" }}>
        <table className="w-full text-xs">
          <thead><tr style={{ background: "var(--color-background)" }}>
            <th className="px-4 py-2 text-start">Field</th>
            <th className="px-4 py-2 text-start">Type</th>
            <th className="px-4 py-2 text-start">Description</th>
          </tr></thead>
          <tbody>
            {fields.map((f, i) => (
              <tr key={i} className="border-t" style={{ borderColor: "var(--color-border)" }}>
                <td className="px-4 py-2 font-mono font-bold">{f[0]}</td>
                <td className="px-4 py-2" style={{ color: "var(--color-text-secondary)" }}>{f[1]}</td>
                <td className="px-4 py-2" style={{ color: "var(--color-text-secondary)" }}>{f[2]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ApiTable({ rows }: { rows: string[][] }) {
  return (
    <div className="rounded-2xl border overflow-hidden not-prose mt-4" style={{ borderColor: "var(--color-border)" }}>
      <table className="w-full text-xs">
        <thead><tr style={{ background: "var(--color-background)" }}>
          <th className="px-4 py-2 text-start">Method</th>
          <th className="px-4 py-2 text-start">Endpoint</th>
          <th className="px-4 py-2 text-start">Description</th>
          <th className="px-4 py-2 text-start">Auth</th>
        </tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t" style={{ borderColor: "var(--color-border)" }}>
              <td className="px-4 py-2"><span className="font-mono font-bold px-2 py-0.5 rounded-lg text-xs" style={{ background: "var(--color-primary-light)", color: "var(--color-primary)" }}>{r[0]}</span></td>
              <td className="px-4 py-2 font-mono">{r[1]}</td>
              <td className="px-4 py-2" style={{ color: "var(--color-text-secondary)" }}>{r[2]}</td>
              <td className="px-4 py-2" style={{ color: "var(--color-text-secondary)" }}>{r[3]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function generateMarkdownContent(t: ReturnType<typeof useTranslations>, locale: string): string {
  const dateStr = new Date().toLocaleDateString(locale === "ar" ? "ar-JO" : "en-US", { year: "numeric", month: "long", day: "numeric" });
  return `# ${t("title")}
# Smart Device Integration Guide — Afaq Tech Platform

> ${dateStr}
> ${t("subtitle")}

---

## 1. ${t("sectionOverview")}

${t("overviewDesc")}

## 2. ${t("sectionArchitecture")}

Platform (Django+DRF) ← APIs (/telemetry/, /scan/) ← PostgreSQL (Supabase)
    ↑
External devices (GPS, RFID, Smart Camera, Phone)

## 3. ${t("regTitle")}

${t.raw("regSteps").map((s: string, i: number) => `${i + 1}. ${s}`).join("\n")}

## 4. ${t("rfidTitle")}

${t.raw("rfidSteps").map((s: string) => `- ${s}`).join("\n")}

## 5. ${t("camTitle")}

${t("camDesc")}

${t.raw("camSteps").map((s: string) => `- ${s}`).join("\n")}

## 6. ${t("driverTitle")}

${t.raw("driverSteps").map((s: string) => `- ${s}`).join("\n")}

## 7. ${t("faceTitle")}

${t("faceDesc")}

${t.raw("faceSteps").map((s: string) => `- ${s}`).join("\n")}

## 8. ${t("sectionOffline")}

${t("offlineNoInternet")} → ${t("offlineSavedLocal")}
${t("offlineOnReconnect")}
- ${t("offlineFetchEvents")}
- ${t("offlineBatchSync")}
- ${t("offlineDeleteLocal")}
- ${t("offlineSyncFaces")}

${t("offlineEdgePC")}
└── ${t("offlineNoDriver")}

## 9. ${t("sectionSecurity")}

- ${t("secTokenTitle")}: ${t("secTokenDesc")}
- ${t("secTlsTitle")}: ${t("secTlsDesc")}
- ${t("secPrivacyTitle")}: ${t("secPrivacyDesc")}
- ${t("secOfflineTitle")}: ${t("secOfflineDesc")}

## 10. ${t("sectionTroubleshoot")}

${t.raw("troubQ1")}: ${t.raw("troubA1")}
${t.raw("troubQ2")}: ${t.raw("troubA2")}
${t.raw("troubQ3")}: ${t.raw("troubA3")}
${t.raw("troubQ4")}: ${t.raw("troubA4")}
${t.raw("troubQ5")}: ${t.raw("troubA5")}

---
Generated from Afaq Tech Platform — afaq.app
`;
}
