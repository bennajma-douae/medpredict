/**
 * MedPredict Téléconsultation
 * consultation.js – Jitsi Meet + MediaRecorder + Whisper
 */

"use strict";

// ─── Paramètres URL ───────────────────────────────────────────────
const params     = new URLSearchParams(location.search);
const ROOM_ID    = params.get("room")    || "MedPredict-DEMO";
const ROLE       = params.get("role")    || "doctor";
const PATIENT    = params.get("patient") || "Patient";
const DOCTOR     = params.get("doctor")  || "Médecin";
const RendezVous_ID     = params.get("rdvId") || "";
const MY_NAME    = ROLE === "doctor" ? DOCTOR : PATIENT;

// ─── Configuration backend ────────────────────────────────────────
const BACKEND_URL = "http://localhost:8000";
let JWT_TOKEN = null;

// Récupérer le token depuis le localStorage (si disponible)
try {
    const token = localStorage.getItem('token');
    if (token) JWT_TOKEN = token;
} catch(e) { console.warn("Impossible d'accéder au localStorage"); }

// ─── État global ──────────────────────────────────────────────────
let jitsiApi       = null;
let mediaRecorder  = null;
let audioStream    = null;
let audioChunks    = [];
let recordedBlobs  = [];  // Liste de {blob, label}
let isRecording    = false;
let sessionStart   = Date.now();
let timerInterval  = null;
let recStart       = null;
let recInterval    = null;
let fullTranscript = "";

// ─── Initialisation ───────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  applySessionInfo();
  initJitsi();
  startSessionTimer();
  
  // Détecter fermeture/rafraîchissement de page
  window.addEventListener('beforeunload', (e) => {
      if (ROLE === "doctor" && isRecording) {
          const message = "La consultation n'est pas terminée. Voulez-vous vraiment quitter ?";
          e.preventDefault();
          e.returnValue = message;
          return message;
      }
  });
});

function applySessionInfo() {
  setText("topbarRoom",  ROOM_ID);
  setText("topbarRole",  ROLE === "doctor" ? "👨‍⚕️ Médecin" : "🧑 Patient");
  setText("infoDoctor",  DOCTOR);
  setText("infoPatient", PATIENT);
  document.title = `MedPredict — ${ROOM_ID}`;
}

// ─── Jitsi Meet ───────────────────────────────────────────────────
function initJitsi() {
  const domain  = "meet.jit.si";
  const options = {
    roomName:    ROOM_ID,
    parentNode:  document.getElementById("jitsiContainer"),
    width:       "100%",
    height:      "100%",
    userInfo: {
      displayName: MY_NAME,
    },
    configOverwrite: {
      startWithAudioMuted:  false,
      startWithVideoMuted:  false,
      disableDeepLinking:   true,
      prejoinPageEnabled:   false,
      toolbarButtons: [
        "microphone", "camera", "closedcaptions",
        "desktop", "fullscreen", "hangup", "chat",
        "settings", "raisehand", "tileview",
      ],
    },
    interfaceConfigOverwrite: {
      SHOW_JITSI_WATERMARK: false,
      SHOW_BRAND_WATERMARK: false,
      SHOW_CHROME_EXTENSION_BANNER: false,
      MOBILE_APP_PROMO: false,
      HIDE_DEEP_LINKING_LOGO: true,
      DEFAULT_REMOTE_DISPLAY_NAME: "Participant",
      APP_NAME: "MedPredict",
    },
  };

  try {
    jitsiApi = new JitsiMeetExternalAPI(domain, options);

    jitsiApi.addEventListener("videoConferenceJoined", () => {
      setStatus("connected", "Connecté");
    });

    jitsiApi.addEventListener("participantJoined", (p) => {
      console.log("Participant rejoint :", p.displayName);
    });

    jitsiApi.addEventListener("videoConferenceLeft", () => {
      setStatus("", "Déconnecté");
    });

    jitsiApi.addEventListener("readyToClose", () => {
      endConsultation();
    });

  } catch (e) {
    console.error("Erreur Jitsi:", e);
    setStatus("", "Erreur de connexion Jitsi");
  }
}

// ─── Minuterie de session ─────────────────────────────────────────
function startSessionTimer() {
  sessionStart = Date.now();
  timerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - sessionStart) / 1000);
    setText("timer", formatTime(elapsed));
  }, 1000);
}

// ─── Enregistrement audio ─────────────────────────────────────────
async function toggleRecording() {
  if (isRecording) {
    stopRecording();
  } else {
    await startRecording();
  }
}
window.toggleRecording = toggleRecording;

async function startRecording() {
  try {
    audioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
  } catch (e) {
    showCustomAlert("Accès au microphone refusé. Autorisez le microphone dans les paramètres de votre navigateur.", "⚠️", "Microphone requis");
    return;
  }

  const mimeType = getSupportedMimeType();
  mediaRecorder = new MediaRecorder(audioStream, mimeType ? { mimeType } : {});
  audioChunks   = [];

  mediaRecorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) audioChunks.push(e.data);
  };

  mediaRecorder.onstop = () => {
    const blob  = new Blob(audioChunks, { type: mimeType || "audio/webm" });
    const label = `Segment ${recordedBlobs.length + 1} (${formatTime(Math.floor((Date.now() - recStart) / 1000))})`;
    recordedBlobs.push({ blob, label });
    renderSegmentsList();
    audioChunks = [];
  };

  mediaRecorder.start(500);
  isRecording = true;
  recStart    = Date.now();

  const btn = document.getElementById("recordBtn");
  btn.classList.add("recording");
  btn.innerHTML = '<span class="rec-dot"></span> Arrêter l\'enregistrement';
  show("recIndicator");
  setStatus("recording", "Enregistrement en cours");

  recInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - recStart) / 1000);
    setText("recTimer", formatTime(elapsed));
  }, 1000);
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
  }
  if (audioStream) {
    audioStream.getTracks().forEach(t => t.stop());
    audioStream = null;
  }
  clearInterval(recInterval);
  isRecording = false;

  const btn = document.getElementById("recordBtn");
  btn.classList.remove("recording");
  btn.innerHTML = '<span class="rec-dot"></span> Démarrer l\'enregistrement';
  hide("recIndicator");
  setStatus("connected", "Connecté");
}

function renderSegmentsList() {
  if (recordedBlobs.length === 0) {
    hide("segmentsList");
    return;
  }
  show("segmentsList");
  const ul = document.getElementById("segmentsUl");
  ul.innerHTML = recordedBlobs.map((r, i) =>
    `<li>🎙️ ${r.label}</li>`
  ).join("");
}

// ─── Transcription Whisper ────────────────────────────────────────
async function sendForTranscription() {
  if (recordedBlobs.length === 0) {
    showCustomAlert("Aucun enregistrement disponible.", "⚠️", "Enregistrement");
    return;
  }

  const allBlobs = recordedBlobs.map(r => r.blob);
  const combined = new Blob(allBlobs, { type: allBlobs[0].type });

  hide("transcriptEmpty");
  hide("transcriptResult");
  show("transcriptLoader");
  disable("transcribeBtn");

  const formData = new FormData();
  formData.append("audio", combined, "consultation.webm");

  try {
    const res  = await fetch("/api/transcribe", { method: "POST", body: formData });
    const data = await res.json();

    hide("transcriptLoader");

    if (data.error) {
      showTranscriptError(data.error);
      return;
    }

    fullTranscript = data.transcription;
    displayTranscription(data);

  } catch (e) {
    hide("transcriptLoader");
    showTranscriptError("Impossible de contacter le backend. Vérifiez que Flask est lancé sur le port 5000.");
  } finally {
    enable("transcribeBtn");
  }
}
window.sendForTranscription = sendForTranscription;

function displayTranscription(data) {
  const langLabel = {
    fr: "Français", ar: "العربية", en: "English",
  }[data.language] || data.language;

  setText("transcriptMeta", `🌐 Langue détectée : ${langLabel}`);
  setText("transcriptText", data.transcription || "(Silence ou audio non intelligible)");

  const segEl = document.getElementById("transcriptSegments");
  if (data.segments && data.segments.length) {
    segEl.innerHTML = data.segments.map(s =>
      `<div class="seg-item">
        <span class="seg-time">[${s.start}s→${s.end}s]</span>
        <span>${escHtml(s.text)}</span>
       </div>`
    ).join("");
  } else {
    segEl.innerHTML = "";
  }

  show("transcriptResult");
  hide("transcriptEmpty");
  
  // ✅ Sauvegarder automatiquement la transcription dans le backend
  if (data.transcription && data.transcription.trim()) {
    sendTranscriptionToBackend();
  }
}

function showTranscriptError(msg) {
  show("transcriptEmpty");
  document.getElementById("transcriptEmpty").innerHTML =
    `<span style="color:var(--danger)">❌ Erreur : ${escHtml(msg)}</span>`;
}

// ─── NOUVEAU : Envoyer la transcription au backend ─────────────────
async function sendTranscriptionToBackend() {
    if (!fullTranscript || !JWT_TOKEN) {
        console.warn("Pas de transcription à envoyer ou pas de token");
        return;
    }
    
    if (!RendezVous_ID) {
        console.warn("Pas d'ID de rendez-vous");
        return;
    }
    
    try {
        const response = await fetch(`${BACKEND_URL}/api/consultations/update-transcription/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${JWT_TOKEN}`
            },
            body: JSON.stringify({
                rdv_id: RendezVous_ID,
                transcription: fullTranscript
            })
        });
        
        if (response.ok) {
            console.log("✅ Transcription sauvegardée dans le dossier médical");
        } else {
            console.error("❌ Erreur sauvegarde transcription:", await response.text());
        }
    } catch(e) {
        console.error("❌ Erreur envoi transcription:", e);
    }
}

// ─── Actions sur la transcription ────────────────────────────────
function copyTranscription() {
  navigator.clipboard.writeText(fullTranscript).then(() => showToast("Transcription copiée !", "success"));
}
window.copyTranscription = copyTranscription;

function downloadTranscription() {
  const content = [
    `=== MedPredict – Transcription de consultation ===`,
    `Salle : ${ROOM_ID}`,
    `Médecin : ${DOCTOR}`,
    `Patient : ${PATIENT}`,
    `Date : ${new Date().toLocaleString("fr-FR")}`,
    ``,
    `--- Texte ---`,
    fullTranscript,
  ].join("\n");

  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement("a"), {
    href: url, download: `transcription-${ROOM_ID}.txt`,
  });
  a.click();
  URL.revokeObjectURL(url);
}
window.downloadTranscription = downloadTranscription;

// ─── Terminer la consultation ─────────────────────────────────────
async function endConsultation() {
    if (isRecording) stopRecording();
    
    // Envoyer la transcription au backend
    if (fullTranscript && JWT_TOKEN && RendezVous_ID) {
        await sendTranscriptionToBackend();
    }
    
    // Marquer le RDV comme terminé (si médecin)
    if (ROLE === "doctor" && RendezVous_ID && JWT_TOKEN) {
        try {
            await fetch(`${BACKEND_URL}/api/appointments/${RendezVous_ID}/terminer/`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${JWT_TOKEN}`
                }
            });
            console.log("✅ RDV marqué comme terminé");
        } catch(e) {
            console.error("❌ Erreur fin RDV:", e);
        }
    }
    
    // Nettoyer Jitsi
    if (jitsiApi) {
        try { jitsiApi.dispose(); } catch(_) {}
    }
    clearInterval(timerInterval);
    
    // Notifier le parent (application React) que la consultation est terminée
    if (window.parent !== window) {
        window.parent.postMessage({ 
            type: 'END_CONSULTATION', 
            rdvId: RendezVous_ID,
            transcription: fullTranscript
        }, '*');
    } else {
        // C'est un nouvel onglet, on affiche un message puis on le ferme
        if (ROLE === "doctor") {
            showCustomAlert("Consultation terminée avec succès ! Veuillez retourner sur l'application MedPredict pour finaliser le dossier médical.", "✅", "Consultation terminée");
        } else {
            showCustomAlert("Consultation terminée avec succès. Merci de votre confiance, vous pouvez fermer cet onglet.", "✅", "Consultation terminée");
        }
        
        // Tenter de fermer l'onglet (fonctionne si ouvert par window.open)
        window.close();
        
        // Afficher la modale de fin si le navigateur bloque window.close()
        show("endModal");
    }
}
window.endConsultation = endConsultation;

// ─── Utilitaires ──────────────────────────────────────────────────
function formatTime(sec) {
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function show(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove("hidden");
}

function hide(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add("hidden");
}

function disable(id) {
  const el = document.getElementById(id);
  if (el) el.disabled = true;
}

function enable(id) {
  const el = document.getElementById(id);
  if (el) el.disabled = false;
}

function setStatus(cls, label) {
  const dot = document.getElementById("statusDot");
  if (dot) {
    dot.className = "status-dot" + (cls ? ` ${cls}` : "");
  }
  setText("statusLabel", label);
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function getSupportedMimeType() {
  const types = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/ogg",
  ];
  return types.find(t => MediaRecorder.isTypeSupported(t)) || "";
}