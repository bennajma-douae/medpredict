import { useState, useEffect, useRef } from "react";
import {
  Stethoscope, LayoutDashboard, ClipboardList, Pill, History,
  Plus, X, Brain, Activity, FileText, CheckCircle, AlertCircle,
  Info, ChevronDown, ChevronUp, Sparkles, User, Shield,
  TrendingUp, Clock, Search, Trash2, Edit3, Save,
  ArrowRight, Package, FlaskConical, Syringe, Star,
  BarChart3, Users, Calendar, Zap, MessageSquare,
  ChevronRight, RefreshCw, Download, Eye, Filter
} from "lucide-react";

const API = "http://localhost:5001";

// ═══════════════════════════════════════════════════════════
// DESIGN TOKENS
// ═══════════════════════════════════════════════════════════
const T = {
  bg:      "#F0F4FA",
  panel:   "#ffffff",
  card:    "#ffffff",
  border:  "#e2e8f4",
  border2: "#cbd5e8",
  accent:  "#2563eb",
  purple:  "#7c3aed",
  emerald: "#059669",
  amber:   "#d97706",
  rose:    "#e11d48",
  text:    "#0f172a",
  muted:   "#64748b",
  dim:     "#94a3b8",
};

// ═══════════════════════════════════════════════════════════
// SHARED COMPONENTS
// ═══════════════════════════════════════════════════════════

const Badge = ({ color = T.accent, children, small }) => (
  <span style={{
    background: color + "22", color, border: `1px solid ${color}44`,
    borderRadius: 8, padding: small ? "2px 8px" : "4px 12px",
    fontSize: small ? 9 : 11, fontWeight: 800, letterSpacing: 1
  }}>{children}</span>
);

const Tag = ({ label, onRemove, color = T.accent }) => (
  <span style={{
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "5px 12px", borderRadius: 20, background: color + "18",
    border: `1px solid ${color}33`, color, fontSize: 12, fontWeight: 600
  }}>
    {label}
    {onRemove && (
      <X size={11} style={{ cursor: "pointer", opacity: 0.7 }} onClick={onRemove} />
    )}
  </span>
);

const Field = ({ label, children, style }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 6, ...style }}>
    {label && <label style={{ fontSize: 10, fontWeight: 800, color: T.muted, textTransform: "uppercase", letterSpacing: 2 }}>{label}</label>}
    {children}
  </div>
);

const Input = ({ style, ...props }) => (
  <input style={{
    background: "#f8fafc", border: `1.5px solid ${T.border}`,
    borderRadius: 12, padding: "11px 14px", color: T.text,
    fontSize: 13, fontWeight: 500, outline: "none", width: "100%", boxSizing: "border-box",
    transition: "border-color 0.15s", ...style
  }}
  onFocus={e => e.target.style.borderColor = T.accent}
  onBlur={e => e.target.style.borderColor = T.border}
  {...props} />
);

const Select = ({ style, children, ...props }) => (
  <select style={{
    background: "#f8fafc", border: `1.5px solid ${T.border}`,
    borderRadius: 12, padding: "11px 14px", color: T.text,
    fontSize: 13, fontWeight: 500, outline: "none", width: "100%",
    appearance: "none", ...style
  }} {...props}>{children}</select>
);

const Btn = ({ variant = "primary", icon: Icon, children, style, ...props }) => {
  const styles = {
    primary: { background: `linear-gradient(135deg, ${T.accent}, ${T.purple})`, color: "white", border: "none" },
    ghost:   { background: "transparent", color: T.muted, border: `1.5px solid ${T.border}` },
    danger:  { background: T.rose + "22", color: T.rose, border: `1.5px solid ${T.rose}44` },
    success: { background: T.emerald + "22", color: T.emerald, border: `1.5px solid ${T.emerald}44` },
    outline: { background: "transparent", color: T.accent, border: `1.5px solid ${T.accent}55` },
  };
  return (
    <button style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
      padding: "11px 20px", borderRadius: 12, fontWeight: 700, fontSize: 12,
      cursor: "pointer", transition: "all 0.15s", letterSpacing: 0.5,
      ...styles[variant], ...style
    }} {...props}>
      {Icon && <Icon size={15} />}
      {children}
    </button>
  );
};

const Card = ({ children, style, glow }) => (
  <div style={{
    background: T.card, border: `1px solid ${T.border}`,
    borderRadius: 20, padding: 24,
    boxShadow: glow ? `0 0 40px ${T.accent}15` : "none",
    ...style
  }}>{children}</div>
);

const SectionTitle = ({ icon: Icon, color = T.accent, children }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
    <div style={{ background: color + "22", padding: 8, borderRadius: 10, display: "flex" }}>
      <Icon size={16} color={color} />
    </div>
    <span style={{ fontWeight: 800, fontSize: 13, color: T.text, textTransform: "uppercase", letterSpacing: 1.5 }}>
      {children}
    </span>
  </div>
);

const ConfidenceBadge = ({ pct }) => {
  const val = parseFloat(pct);
  const color = val >= 60 ? T.emerald : val >= 30 ? T.amber : T.rose;
  return <Badge color={color} small>{pct}</Badge>;
};

// ═══════════════════════════════════════════════════════════
// SIDEBAR
// ═══════════════════════════════════════════════════════════

const links = [
  { id: "dashboard",    label: "Vue d'ensemble",  icon: LayoutDashboard },
  { id: "consultation", label: "Consultation IA", icon: Brain },
  { id: "pharmacy",     label: "Pharmacie",       icon: Pill },
  { id: "history",      label: "Historique",      icon: History },
];

function Sidebar({ page, setPage }) {
  return (
    <aside style={{
      width: 230, background: T.panel, borderRight: `1px solid ${T.border}`,
      display: "flex", flexDirection: "column", padding: "24px 14px",
      position: "sticky", top: 0, height: "100vh", flexShrink: 0
    }}>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 36, padding: "0 8px" }}>
        <div style={{ background: `linear-gradient(135deg, ${T.accent}, ${T.purple})`, borderRadius: 14, padding: 10 }}>
          <Stethoscope size={20} color="white" />
        </div>
        <div>
          <div style={{ fontWeight: 900, fontSize: 17, color: T.text, letterSpacing: "-1px" }}>MedPredict</div>
          <div style={{ fontSize: 8, color: T.muted, fontWeight: 800, textTransform: "uppercase", letterSpacing: 2 }}>
            AI Clinical Suite
          </div>
        </div>
      </div>

      <div style={{ fontSize: 9, color: T.dim, fontWeight: 800, textTransform: "uppercase", letterSpacing: 3, padding: "0 10px", marginBottom: 8 }}>
        Menu Principal
      </div>

      <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
        {links.map(({ id, label, icon: Icon }) => {
          const active = page === id;
          return (
            <button key={id} onClick={() => setPage(id)} style={{
              display: "flex", alignItems: "center", gap: 11,
              padding: "10px 12px", borderRadius: 12, border: "none",
              background: active ? `linear-gradient(135deg, ${T.accent}22, ${T.purple}18)` : "transparent",
              color: active ? T.accent : T.muted,
              cursor: "pointer", fontWeight: active ? 700 : 500, fontSize: 13,
              borderLeft: `2px solid ${active ? T.accent : "transparent"}`,
              transition: "all 0.15s", textAlign: "left", width: "100%", fontFamily: "inherit"
            }}>
              <Icon size={16} />
              {label}
            </button>
          );
        })}
      </nav>

      {/* Status */}
      <div style={{ background: T.emerald + "12", border: `1px solid ${T.emerald}25`, borderRadius: 14, padding: "12px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: T.emerald, display: "block" }} />
          <span style={{ fontSize: 9, fontWeight: 800, color: T.emerald, textTransform: "uppercase", letterSpacing: 2 }}>Système Actif</span>
        </div>
        <div style={{ fontSize: 10, color: T.muted, lineHeight: 1.6 }}>
          API: localhost:5001<br />
          <span style={{ color: T.emerald }}>ML Model Ready</span>
        </div>
      </div>
    </aside>
  );
}

// ═══════════════════════════════════════════════════════════
// DASHBOARD PAGE
// ═══════════════════════════════════════════════════════════

function DashboardPage({ navigate }) {
  const stats = [
    { label: "Consultations Aujourd'hui", value: "12", icon: Stethoscope, color: T.accent, delta: "+3" },
    { label: "Précision du Modèle", value: "94.2%", icon: Brain, color: T.purple, delta: "+0.4%" },
    { label: "Ordonnances Émises", value: "8", icon: Pill, color: T.emerald, delta: "+2" },
    { label: "Rapports PDF", value: "7", icon: FileText, color: T.amber, delta: "ce jour" },
  ];

  const recentActivity = [
    { patient: "Jean Dupont", diag: "Pneumonie", conf: "82%", time: "14:32", status: "finalisé" },
    { patient: "Marie Lambert", diag: "Grippe Saisonnière", conf: "74%", time: "13:15", status: "finalisé" },
    { patient: "Ahmed Ben Ali", diag: "Bronchite", conf: "61%", time: "11:48", status: "en cours" },
    { patient: "Sophie Martin", diag: "Migraine", conf: "55%", time: "10:22", status: "finalisé" },
  ];

  return (
    <div style={{ padding: "32px 36px", maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: T.text, margin: 0, letterSpacing: "-1px" }}>
          Tableau de bord
        </h1>
        <p style={{ color: T.muted, fontSize: 13, marginTop: 6 }}>
          Vue d'ensemble de l'activité clinique — {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 28 }}>
        {stats.map(({ label, value, icon: Icon, color, delta }) => (
          <Card key={label} style={{ position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: color + "10" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 11, color: T.muted, fontWeight: 700, marginBottom: 8, letterSpacing: 0.5 }}>{label}</div>
                <div style={{ fontSize: 30, fontWeight: 900, color: T.text, letterSpacing: "-1px" }}>{value}</div>
                <div style={{ fontSize: 11, color, fontWeight: 700, marginTop: 4 }}>{delta}</div>
              </div>
              <div style={{ background: color + "20", padding: 10, borderRadius: 12 }}>
                <Icon size={20} color={color} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 20 }}>
        {/* Recent consultations */}
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <SectionTitle icon={ClipboardList} color={T.accent}>Consultations Récentes</SectionTitle>
            <Btn variant="ghost" style={{ padding: "7px 14px", fontSize: 11 }}>Voir tout</Btn>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Patient", "Diagnostic", "Confiance", "Heure", "Statut"].map(h => (
                  <th key={h} style={{ textAlign: "left", fontSize: 9, fontWeight: 800, color: T.muted, textTransform: "uppercase", letterSpacing: 2, padding: "0 12px 12px 0" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentActivity.map((r, i) => (
                <tr key={i} style={{ borderTop: `1px solid ${T.border}` }}>
                  <td style={{ padding: "14px 12px 14px 0", fontSize: 13, fontWeight: 700, color: T.text }}>{r.patient}</td>
                  <td style={{ padding: "14px 12px 14px 0", fontSize: 12, color: T.muted }}>{r.diag}</td>
                  <td style={{ padding: "14px 12px 14px 0" }}><ConfidenceBadge pct={r.conf} /></td>
                  <td style={{ padding: "14px 12px 14px 0", fontSize: 12, color: T.muted }}>{r.time}</td>
                  <td style={{ padding: "14px 0 14px 0" }}>
                    <Badge color={r.status === "finalisé" ? T.emerald : T.amber} small>
                      {r.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {/* Quick actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card>
            <SectionTitle icon={Zap} color={T.purple}>Actions Rapides</SectionTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { label: "Nouvelle Consultation", icon: Brain, color: T.accent, target: "consultation" },
                { label: "Gérer Pharmacie", icon: Pill, color: T.purple, target: "pharmacy" },
                { label: "Voir Historique", icon: History, color: T.emerald, target: "history" },
              ].map(({ label, icon: Icon, color, target }) => (
                <button key={label} onClick={() => navigate(target)} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "13px 16px",
                  background: color + "10", border: `1px solid ${color}25`, borderRadius: 14,
                  color, fontWeight: 700, fontSize: 13, cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                  transition: "all 0.15s"
                }}>
                  <Icon size={16} />
                  {label}
                  <ChevronRight size={14} style={{ marginLeft: "auto", opacity: 0.6 }} />
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <SectionTitle icon={BarChart3} color={T.amber}>Performance IA</SectionTitle>
            {[
              { label: "Précision Test", val: 94 },
              { label: "Rappel Moyen", val: 87 },
              { label: "F1-Score", val: 91 },
            ].map(({ label, val }) => (
              <div key={label} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 5 }}>
                  <span style={{ color: T.muted, fontWeight: 600 }}>{label}</span>
                  <span style={{ color: T.text, fontWeight: 800 }}>{val}%</span>
                </div>
                <div style={{ height: 5, background: T.border, borderRadius: 10 }}>
                  <div style={{ height: "100%", width: `${val}%`, background: `linear-gradient(90deg, ${T.accent}, ${T.purple})`, borderRadius: 10 }} />
                </div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// CONSULTATION PAGE
// ═══════════════════════════════════════════════════════════

const ExplanationPanel = ({ expl }) => {
  const [open, setOpen] = useState(false);
  if (!expl) return null;
  return (
    <div style={{ marginTop: 10 }}>
      <button onClick={() => setOpen(v => !v)} style={{
        display: "flex", alignItems: "center", gap: 5, background: "none", border: "none",
        color: T.muted, fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: 2,
        cursor: "pointer", padding: 0, fontFamily: "inherit"
      }}>
        <Sparkles size={10} /> Explication IA {open ? <ChevronUp size={10}/> : <ChevronDown size={10}/>}
      </button>
      {open && (
        <div style={{ marginTop: 8, paddingLeft: 12, borderLeft: `2px solid ${T.accent}44`, fontSize: 11, color: T.muted, lineHeight: 1.7 }}>
          {expl.key_symptoms?.length > 0 && (
            <div><span style={{ color: T.text, fontWeight: 700 }}>Symptômes clés :</span> {expl.key_symptoms.join(", ").replace(/_/g, " ")}</div>
          )}
          <div><span style={{ color: T.text, fontWeight: 700 }}>Sexe :</span> {expl.sex_influence}</div>
          <div><span style={{ color: T.text, fontWeight: 700 }}>Antécédents :</span> {expl.history_influence}</div>
          <div style={{ fontStyle: "italic", opacity: 0.7, marginTop: 4 }}>{expl.score_delta_pct}</div>
        </div>
      )}
    </div>
  );
};

function ConsultationPage({ navigate }) {
  const [patient, setPatient] = useState({ name: "", age: "", gender: "" });
  const [historyInput, setHistoryInput] = useState("");
  const [medicalHistory, setMedicalHistory] = useState([]);
  const [symptoms, setSymptoms] = useState([]);
  const [inputSymptom, setInputSymptom] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [selectedDisease, setSelectedDisease] = useState(null);
  const [doctorNotes, setDoctorNotes] = useState("");
  const [step, setStep] = useState(1); // 1=patient, 2=symptoms, 3=results

  const addHistory = () => {
    const v = historyInput.trim();
    if (!v || medicalHistory.includes(v)) return;
    setMedicalHistory([...medicalHistory, v]);
    setHistoryInput("");
  };

  const addSymptom = () => {
    const v = inputSymptom.trim();
    if (!v || symptoms.includes(v)) return;
    setSymptoms([...symptoms, v]);
    setInputSymptom("");
  };

  const analyze = async () => {
    if (symptoms.length === 0) return;
    setLoading(true); setAiResult(null); setSelectedDisease(null);
    try {
      const res = await fetch(`${API}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symptoms, sex: patient.gender || null, medical_history: medicalHistory, age: patient.age ? parseInt(patient.age) : null, top_n: 3 }),
      });
      const data = await res.json();
      if (data.success) { setAiResult(data); setSelectedDisease(data.predictions[0]?.disease || null); setStep(3); }
      else alert(data.error || "Erreur IA.");
    } catch { alert("Erreur de connexion."); }
    finally { setLoading(false); }
  };

  const handleFinalize = async () => {
    if (!selectedDisease) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/finalize`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patient: { ...patient, medical_history: medicalHistory }, selected_disease: selectedDisease, symptoms, notes: doctorNotes, medications: [], ai_result: aiResult }),
      });
      const data = await res.json();
      if (data.success) {
        window.open(`${API}${data.report_url}`, "_blank");
      } else alert(data.error || "Erreur PDF.");
    } finally { setLoading(false); }
  };

  const goToPharmacy = () => {
    navigate("pharmacy", { patient, selectedDisease, symptoms, aiResult, doctorNotes });
  };

  // Step indicator
  const steps = ["Profil Patient", "Anamnèse", "Résultats & Validation"];

  return (
    <div style={{ padding: "32px 36px", maxWidth: 1300 }}>
      {/* Header */}
      <div style={{ marginBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: T.text, margin: 0, letterSpacing: "-0.5px" }}>
            Consultation IA
          </h1>
          <p style={{ color: T.muted, fontSize: 12, marginTop: 5 }}>Diagnostic assisté par intelligence artificielle</p>
        </div>
        {/* Step indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {steps.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <button onClick={() => i < step && setStep(i + 1)} style={{
                display: "flex", alignItems: "center", gap: 7, padding: "8px 14px", borderRadius: 10,
                background: step === i + 1 ? T.accent + "22" : step > i + 1 ? T.emerald + "18" : T.border,
                border: `1.5px solid ${step === i + 1 ? T.accent : step > i + 1 ? T.emerald : T.border}`,
                color: step === i + 1 ? T.accent : step > i + 1 ? T.emerald : T.muted,
                fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit"
              }}>
                <span style={{ width: 18, height: 18, borderRadius: "50%", background: step > i + 1 ? T.emerald : T.border2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 900, color: step > i + 1 ? T.panel : T.muted }}>
                  {step > i + 1 ? "✓" : i + 1}
                </span>
                {s}
              </button>
              {i < 2 && <ChevronRight size={12} color={T.dim} />}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 20 }}>
        {/* LEFT: Patient + Symptoms */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Patient Card */}
          <Card>
            <SectionTitle icon={User} color={T.accent}>Profil Patient</SectionTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Field label="Nom complet">
                <Input placeholder="ex: Jean Dupont" value={patient.name} onChange={e => setPatient({...patient, name: e.target.value})} />
              </Field>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <Field label="Âge">
                  <Input type="number" placeholder="25" value={patient.age} onChange={e => setPatient({...patient, age: e.target.value})} />
                </Field>
                <Field label="Sexe">
                  <Select value={patient.gender} onChange={e => setPatient({...patient, gender: e.target.value})}>
                    <option value="">—</option>
                    <option value="M">Masculin</option>
                    <option value="F">Féminin</option>
                  </Select>
                </Field>
              </div>

              <Field label="Antécédents médicaux">
                <div style={{ display: "flex", gap: 6 }}>
                  <Input placeholder="ex: Diabète…" value={historyInput}
                    onChange={e => setHistoryInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && addHistory()} />
                  <button onClick={addHistory} style={{ background: T.accent + "22", border: `1px solid ${T.accent}44`, borderRadius: 10, padding: "0 12px", color: T.accent, cursor: "pointer" }}>
                    <Plus size={16} />
                  </button>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                  {medicalHistory.map((h, i) => (
                    <Tag key={i} label={h} color={T.amber} onRemove={() => setMedicalHistory(medicalHistory.filter((_, j) => j !== i))} />
                  ))}
                </div>
              </Field>

              {(patient.gender || medicalHistory.length > 0) && (
                <div style={{ background: T.accent + "10", border: `1px solid ${T.accent}20`, borderRadius: 12, padding: "10px 14px", display: "flex", gap: 8 }}>
                  <Info size={13} color={T.accent} style={{ flexShrink: 0, marginTop: 1 }} />
                  <p style={{ fontSize: 11, color: T.accent, margin: 0, opacity: 0.8, lineHeight: 1.6 }}>
                    Le contexte patient sera utilisé pour ajuster les scores prédictifs.
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Symptoms Card */}
          <Card>
            <SectionTitle icon={ClipboardList} color={T.purple}>Anamnèse</SectionTitle>
            <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
              <Input placeholder="Ajouter un symptôme…" value={inputSymptom}
                onChange={e => setInputSymptom(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addSymptom()} />
              <button onClick={addSymptom} style={{ background: T.purple + "22", border: `1px solid ${T.purple}44`, borderRadius: 10, padding: "0 12px", color: T.purple, cursor: "pointer", flexShrink: 0 }}>
                <Plus size={16} />
              </button>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, minHeight: 40 }}>
              {symptoms.length === 0 && <p style={{ color: T.muted, fontSize: 12, fontStyle: "italic" }}>Aucun symptôme saisi…</p>}
              {symptoms.map((s, i) => (
                <Tag key={i} label={s} color={T.text} onRemove={() => setSymptoms(symptoms.filter((_, j) => j !== i))} />
              ))}
            </div>

            <Btn icon={loading ? Activity : Brain}
              onClick={analyze} disabled={loading || symptoms.length === 0}
              style={{ width: "100%", marginTop: 20, padding: "14px", fontSize: 12, letterSpacing: 1.5,
                opacity: (loading || symptoms.length === 0) ? 0.5 : 1, cursor: symptoms.length === 0 ? "not-allowed" : "pointer" }}>
              {loading ? "Analyse en cours…" : "Lancer l'Analyse Prédictive"}
            </Btn>
          </Card>
        </div>

        {/* RIGHT: Results */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* AI Results */}
          <Card glow={!!aiResult} style={{ flex: aiResult ? "none" : 1 }}>
            <SectionTitle icon={Shield} color={T.purple}>Résultats de l'Analyse IA</SectionTitle>

            {!aiResult && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 0", opacity: 0.2 }}>
                <Activity size={52} color={T.muted} />
                <p style={{ color: T.muted, marginTop: 16, fontSize: 13, fontWeight: 700 }}>En attente de données…</p>
              </div>
            )}

            {aiResult && (
              <div>
                {/* Context bar */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 12, padding: "12px 16px", background: T.border + "80", borderRadius: 12, marginBottom: 20, fontSize: 11 }}>
                  <span style={{ color: T.muted }}>Symptômes reconnus : <b style={{ color: T.text }}>{aiResult.n_recognized}</b></span>
                  {aiResult.patient_context?.sex && <span style={{ color: T.muted }}>Sexe : <b style={{ color: T.text }}>{aiResult.patient_context.sex}</b></span>}
                  {aiResult.model_accuracy && <span style={{ color: T.muted }}>Précision modèle : <b style={{ color: T.emerald }}>{(aiResult.model_accuracy * 100).toFixed(1)}%</b></span>}
                </div>

                <p style={{ fontSize: 10, fontWeight: 800, color: T.muted, textTransform: "uppercase", letterSpacing: 2, marginBottom: 14 }}>
                  Sélectionner le diagnostic retenu :
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {aiResult.predictions.map((p, i) => {
                    const active = selectedDisease === p.disease;
                    const val = parseFloat(p.confidence_pct);
                    const color = val >= 60 ? T.emerald : val >= 30 ? T.amber : T.rose;
                    return (
                      <button key={i} onClick={() => setSelectedDisease(p.disease)} style={{
                        textAlign: "left", padding: "18px 20px", borderRadius: 16, cursor: "pointer",
                        background: active ? `linear-gradient(135deg, ${T.accent}15, ${T.purple}10)` : T.panel,
                        border: `2px solid ${active ? T.accent : T.border}`,
                        transition: "all 0.15s", position: "relative", fontFamily: "inherit"
                      }}>
                        {active && <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: `linear-gradient(180deg, ${T.accent}, ${T.purple})`, borderRadius: "16px 0 0 16px" }} />}

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ fontSize: 9, fontWeight: 900, padding: "3px 8px", borderRadius: 6, background: active ? T.accent : T.border2, color: active ? "white" : T.muted }}>
                              #{p.rank}
                            </span>
                            <span style={{ fontSize: 15, fontWeight: 800, color: T.text }}>{p.disease}</span>
                          </div>
                          <ConfidenceBadge pct={p.confidence_pct} />
                        </div>

                        {/* Progress bar */}
                        <div style={{ height: 4, background: T.border, borderRadius: 10, marginBottom: 4 }}>
                          <div style={{ height: "100%", width: p.confidence_pct, background: color, borderRadius: 10, transition: "width 0.6s ease" }} />
                        </div>

                        <ExplanationPanel expl={p.explanation} />
                      </button>
                    );
                  })}
                </div>

                {aiResult.symptoms_unknown?.length > 0 && (
                  <div style={{ display: "flex", gap: 10, padding: "12px 14px", background: T.amber + "10", border: `1px solid ${T.amber}30`, borderRadius: 12, marginTop: 16 }}>
                    <AlertCircle size={14} color={T.amber} style={{ flexShrink: 0 }} />
                    <p style={{ fontSize: 11, color: T.amber, margin: 0 }}>
                      Symptômes non reconnus : {aiResult.symptoms_unknown.join(", ")}
                    </p>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Validation + Actions */}
          {selectedDisease && (
            <Card style={{ background: "#f8fafc", border: `1px solid ${T.accent}30` }}>
              <SectionTitle icon={CheckCircle} color={T.emerald}>Validation Médicale</SectionTitle>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {/* Diagnosis selected */}
                <div style={{ background: T.emerald + "10", border: `1px solid ${T.emerald}25`, borderRadius: 14, padding: "16px 18px" }}>
                  <div style={{ fontSize: 9, fontWeight: 800, color: T.emerald, textTransform: "uppercase", letterSpacing: 2, marginBottom: 6 }}>
                    Pathologie retenue
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 900, color: T.text, display: "flex", alignItems: "center", gap: 8 }}>
                    {selectedDisease} <CheckCircle size={17} color={T.emerald} />
                  </div>
                </div>

                {/* Notes */}
                <Field label="Observations cliniques">
                  <textarea value={doctorNotes} onChange={e => setDoctorNotes(e.target.value)}
                    placeholder="Observations du médecin…"
                    style={{ background: "#f1f5f9", border: `1.5px solid ${T.border}`, borderRadius: 12, padding: "10px 14px",
                      color: T.text, fontSize: 12, resize: "none", height: 72, outline: "none", fontFamily: "inherit" }}
                  />
                </Field>
              </div>

              {/* Action buttons */}
              <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                <Btn icon={Pill} variant="success" onClick={goToPharmacy} style={{ flex: 1, padding: "13px" }}>
                  Aller à la Pharmacie
                </Btn>
                <Btn icon={FileText} onClick={handleFinalize} disabled={loading}
                  style={{ flex: 1, padding: "13px", opacity: loading ? 0.5 : 1 }}>
                  Générer Rapport PDF
                </Btn>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PHARMACY PAGE
// ═══════════════════════════════════════════════════════════

const ROUTES = ["PO", "IV", "IM", "SC", "Top.", "Inh.", "SL", "PR"];

const DRUG_DB = [
  { name: "Amoxicilline", class: "Antibiotique", defaultDose: "500mg", defaultFreq: "3×/j", defaultDur: "7j", route: "PO" },
  { name: "Paracétamol", class: "Antalgique", defaultDose: "1g", defaultFreq: "4×/j", defaultDur: "5j", route: "PO" },
  { name: "Ibuprofène", class: "AINS", defaultDose: "400mg", defaultFreq: "3×/j", defaultDur: "5j", route: "PO" },
  { name: "Oméprazole", class: "IPP", defaultDose: "20mg", defaultFreq: "1×/j", defaultDur: "14j", route: "PO" },
  { name: "Metformine", class: "Antidiabétique", defaultDose: "500mg", defaultFreq: "2×/j", defaultDur: "30j", route: "PO" },
  { name: "Salbutamol", class: "Bronchodilatateur", defaultDose: "2 bouffées", defaultFreq: "4×/j", defaultDur: "7j", route: "Inh." },
  { name: "Prednisolone", class: "Corticoïde", defaultDose: "20mg", defaultFreq: "1×/j", defaultDur: "5j", route: "PO" },
  { name: "Azithromycine", class: "Antibiotique", defaultDose: "500mg", defaultFreq: "1×/j", defaultDur: "3j", route: "PO" },
];

function PharmacyPage({ consultData, navigate }) {
  const [medications, setMedications] = useState([]);
  const [search, setSearch] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [showDB, setShowDB] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const classes = [...new Set(DRUG_DB.map(d => d.class))];

  const addMed = (drug) => {
    setMedications(prev => [...prev, {
      name: drug?.name || "", dosage: drug?.defaultDose || "",
      frequency: drug?.defaultFreq || "", duration: drug?.defaultDur || "",
      route: drug?.route || "PO", notes: ""
    }]);
    setShowDB(false);
  };

  const updateMed = (i, field, val) =>
    setMedications(prev => prev.map((m, j) => j === i ? { ...m, [field]: val } : m));
  const removeMed = (i) =>
    setMedications(prev => prev.filter((_, j) => j !== i));

  const filtered = DRUG_DB.filter(d =>
    (!filterClass || d.class === filterClass) &&
    (!search || d.name.toLowerCase().includes(search.toLowerCase()) || d.class.toLowerCase().includes(search.toLowerCase()))
  );

  const handleGeneratePDF = async () => {
    if (!consultData?.selectedDisease) {
      alert("Aucune consultation active. Lancez d'abord une consultation IA.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/finalize`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient: { ...consultData.patient, medical_history: consultData.patient?.medical_history || [] },
          selected_disease: consultData.selectedDisease,
          symptoms: consultData.symptoms || [],
          notes: consultData.doctorNotes || "",
          medications,
          ai_result: consultData.aiResult,
        }),
      });
      const data = await res.json();
      if (data.success) window.open(`${API}${data.report_url}`, "_blank");
      else alert(data.error || "Erreur génération PDF.");
    } finally { setLoading(false); }
  };

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return (
    <div style={{ padding: "32px 36px", maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: T.text, margin: 0, letterSpacing: "-0.5px" }}>
            Pharmacie & Ordonnances
          </h1>
          <p style={{ color: T.muted, fontSize: 12, marginTop: 5 }}>Gestion des prescriptions médicamenteuses</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn variant="ghost" icon={Save} onClick={handleSave} style={{ fontSize: 12 }}>
            {saved ? "Sauvegardé ✓" : "Sauvegarder"}
          </Btn>
          <Btn icon={FileText} onClick={handleGeneratePDF} disabled={loading || medications.length === 0}
            style={{ fontSize: 12, opacity: (loading || medications.length === 0) ? 0.5 : 1 }}>
            {loading ? "Génération…" : "Générer Ordonnance PDF"}
          </Btn>
        </div>
      </div>

      {/* Consultation context banner */}
      {consultData?.selectedDisease && (
        <div style={{ background: T.accent + "12", border: `1px solid ${T.accent}25`, borderRadius: 14, padding: "14px 20px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
          <CheckCircle size={16} color={T.accent} />
          <div style={{ fontSize: 12 }}>
            <span style={{ color: T.muted }}>Consultation active : </span>
            <span style={{ color: T.text, fontWeight: 700 }}>{consultData.patient?.name || "Patient"}</span>
            <span style={{ color: T.muted }}> — Diagnostic : </span>
            <span style={{ color: T.accent, fontWeight: 700 }}>{consultData.selectedDisease}</span>
          </div>
          <button onClick={() => navigate("consultation")} style={{ marginLeft: "auto", background: "none", border: "none", color: T.accent, cursor: "pointer", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", gap: 5, fontFamily: "inherit" }}>
            Retour consultation <ChevronRight size={12} />
          </button>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20 }}>
        {/* Prescription list */}
        <div>
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <SectionTitle icon={Pill} color={T.purple}>Ordonnance Active</SectionTitle>
              <Btn variant="outline" icon={Plus} onClick={() => setShowDB(v => !v)} style={{ fontSize: 11, padding: "8px 14px" }}>
                Ajouter médicament
              </Btn>
            </div>

            {/* DB Picker */}
            {showDB && (
              <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 16, padding: 16, marginBottom: 20 }}>
                <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                  <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, background: "#f1f5f9", border: `1px solid ${T.border}`, borderRadius: 10, padding: "8px 12px" }}>
                    <Search size={13} color={T.muted} />
                    <input placeholder="Rechercher un médicament…" value={search} onChange={e => setSearch(e.target.value)}
                      style={{ background: "none", border: "none", outline: "none", color: T.text, fontSize: 12, width: "100%", fontFamily: "inherit" }} />
                  </div>
                  <Select value={filterClass} onChange={e => setFilterClass(e.target.value)} style={{ width: 160, fontSize: 11 }}>
                    <option value="">Toutes classes</option>
                    {classes.map(c => <option key={c} value={c}>{c}</option>)}
                  </Select>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 8, maxHeight: 260, overflowY: "auto" }}>
                  {filtered.map((drug, i) => (
                    <button key={i} onClick={() => addMed(drug)} style={{
                      display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4,
                      padding: "12px 14px", background: "#f1f5f9", border: `1px solid ${T.border}`,
                      borderRadius: 12, cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                      transition: "border-color 0.15s"
                    }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = T.purple + "66"}
                      onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
                      <span style={{ fontWeight: 700, fontSize: 13, color: T.text }}>{drug.name}</span>
                      <span style={{ fontSize: 10, color: T.purple }}>{drug.class}</span>
                      <span style={{ fontSize: 10, color: T.muted }}>{drug.defaultDose} · {drug.defaultFreq} · {drug.route}</span>
                    </button>
                  ))}
                  {filtered.length === 0 && <p style={{ color: T.muted, fontSize: 12, gridColumn: "span 2" }}>Aucun résultat.</p>}
                </div>
                <button onClick={() => addMed(null)} style={{ marginTop: 10, width: "100%", padding: "9px", background: "none", border: `1.5px dashed ${T.border2}`, borderRadius: 10, color: T.muted, fontSize: 11, cursor: "pointer", fontWeight: 700, fontFamily: "inherit" }}>
                  + Saisie libre
                </button>
              </div>
            )}

            {/* Column headers */}
            {medications.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1.5fr 1fr 0.8fr 36px", gap: 8, padding: "0 0 8px", borderBottom: `1px solid ${T.border}`, marginBottom: 12 }}>
                {["Médicament", "Dose", "Fréquence", "Durée", "Voie", ""].map((h, i) => (
                  <span key={i} style={{ fontSize: 9, fontWeight: 800, color: T.muted, textTransform: "uppercase", letterSpacing: 2 }}>{h}</span>
                ))}
              </div>
            )}

            {/* Medication rows */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {medications.map((med, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1.5fr 1fr 0.8fr 36px", gap: 8, alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${T.border}40` }}>
                  <input value={med.name} onChange={e => updateMed(i, "name", e.target.value)}
                    placeholder="Médicament" style={{ background: "#f1f5f9", border: `1px solid ${T.border}`, borderRadius: 8, padding: "8px 10px", color: T.text, fontSize: 12, outline: "none", fontFamily: "inherit" }} />
                  <input value={med.dosage} onChange={e => updateMed(i, "dosage", e.target.value)}
                    placeholder="500mg" style={{ background: "#f1f5f9", border: `1px solid ${T.border}`, borderRadius: 8, padding: "8px 10px", color: T.text, fontSize: 12, outline: "none", fontFamily: "inherit" }} />
                  <input value={med.frequency} onChange={e => updateMed(i, "frequency", e.target.value)}
                    placeholder="3×/j" style={{ background: "#f1f5f9", border: `1px solid ${T.border}`, borderRadius: 8, padding: "8px 10px", color: T.text, fontSize: 12, outline: "none", fontFamily: "inherit" }} />
                  <input value={med.duration} onChange={e => updateMed(i, "duration", e.target.value)}
                    placeholder="7j" style={{ background: "#f1f5f9", border: `1px solid ${T.border}`, borderRadius: 8, padding: "8px 10px", color: T.text, fontSize: 12, outline: "none", fontFamily: "inherit" }} />
                  <select value={med.route} onChange={e => updateMed(i, "route", e.target.value)}
                    style={{ background: "#f1f5f9", border: `1px solid ${T.border}`, borderRadius: 8, padding: "8px 6px", color: T.text, fontSize: 11, outline: "none", fontFamily: "inherit", appearance: "none" }}>
                    {ROUTES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <button onClick={() => removeMed(i)} style={{ background: T.rose + "15", border: `1px solid ${T.rose}30`, borderRadius: 8, padding: 8, color: T.rose, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>

            {medications.length === 0 && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "50px 0", opacity: 0.3 }}>
                <Pill size={40} color={T.muted} />
                <p style={{ color: T.muted, fontSize: 13, marginTop: 12, fontWeight: 600 }}>Aucun médicament prescrit</p>
              </div>
            )}
          </Card>

          {/* Notes zone */}
          {medications.length > 0 && (
            <Card style={{ marginTop: 16 }}>
              <SectionTitle icon={MessageSquare} color={T.amber}>Instructions & Précautions</SectionTitle>
              <textarea placeholder="Conseils d'administration, contre-indications spécifiques, instructions patient…"
                rows={4}
                style={{ width: "100%", background: "#f1f5f9", border: `1.5px solid ${T.border}`, borderRadius: 12, padding: "12px 16px", color: T.text, fontSize: 12, resize: "vertical", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
            </Card>
          )}
        </div>

        {/* RIGHT: Summary */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card>
            <SectionTitle icon={ClipboardList} color={T.emerald}>Récapitulatif</SectionTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ background: T.panel, borderRadius: 12, padding: "14px 16px" }}>
                <div style={{ fontSize: 9, color: T.muted, fontWeight: 800, textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>Patient</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{consultData?.patient?.name || "—"}</div>
                <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{consultData?.patient?.age ? `${consultData.patient.age} ans` : "—"} · {consultData?.patient?.gender === "M" ? "Masculin" : consultData?.patient?.gender === "F" ? "Féminin" : "—"}</div>
              </div>

              <div style={{ background: T.panel, borderRadius: 12, padding: "14px 16px" }}>
                <div style={{ fontSize: 9, color: T.muted, fontWeight: 800, textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>Diagnostic</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: consultData?.selectedDisease ? T.accent : T.muted }}>
                  {consultData?.selectedDisease || "Aucun diagnostic sélectionné"}
                </div>
              </div>

              <div style={{ background: T.panel, borderRadius: 12, padding: "14px 16px" }}>
                <div style={{ fontSize: 9, color: T.muted, fontWeight: 800, textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>
                  Médicaments ({medications.length})
                </div>
                {medications.length === 0 ? (
                  <p style={{ color: T.muted, fontSize: 11 }}>Aucun médicament</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {medications.map((m, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                        <span style={{ color: T.text, fontWeight: 600 }}>{m.name || "—"}</span>
                        <span style={{ color: T.muted }}>{m.dosage} {m.route}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: "flex", flex: "column", gap: 8, marginTop: 4 }}>
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ flex: 1, background: T.purple + "10", border: `1px solid ${T.purple}20`, borderRadius: 10, padding: "10px 12px", textAlign: "center" }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: T.purple }}>{medications.length}</div>
                    <div style={{ fontSize: 9, color: T.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Médicaments</div>
                  </div>
                  <div style={{ flex: 1, background: T.emerald + "10", border: `1px solid ${T.emerald}20`, borderRadius: 10, padding: "10px 12px", textAlign: "center" }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: T.emerald }}>{consultData?.symptoms?.length || 0}</div>
                    <div style={{ fontSize: 9, color: T.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Symptômes</div>
                  </div>
                </div>
              </div>
            </div>

            <Btn icon={FileText} onClick={handleGeneratePDF} disabled={loading || medications.length === 0}
              style={{ width: "100%", marginTop: 16, padding: "13px", fontSize: 11, letterSpacing: 1,
                opacity: (loading || medications.length === 0) ? 0.5 : 1 }}>
              {loading ? "Génération…" : "Générer Ordonnance PDF"}
            </Btn>
          </Card>

          {/* Drug info */}
          <Card>
            <SectionTitle icon={Info} color={T.amber}>Informations</SectionTitle>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <Syringe size={13} color={T.amber} style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 11, color: T.muted, margin: 0, lineHeight: 1.6 }}>
                Toutes les prescriptions seront incluses dans le rapport PDF avec les détails complets d'administration.
              </p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <AlertCircle size={13} color={T.rose} style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 11, color: T.muted, margin: 0, lineHeight: 1.6 }}>
                Vérifiez les interactions médicamenteuses et contre-indications avant validation.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// HISTORY PAGE
// ═══════════════════════════════════════════════════════════

const fakeHistory = [
  { id: "A1B2C3", date: "14/05/2026", patient: "Jean Dupont", age: 45, gender: "M", diag: "Pneumonie", conf: "82%", meds: 3, status: "finalisé" },
  { id: "D4E5F6", date: "14/05/2026", patient: "Marie Lambert", age: 32, gender: "F", diag: "Grippe Saisonnière", conf: "74%", meds: 2, status: "finalisé" },
  { id: "G7H8I9", date: "14/05/2026", patient: "Ahmed Ben Ali", age: 58, gender: "M", diag: "Bronchite", conf: "61%", meds: 1, status: "en cours" },
  { id: "J1K2L3", date: "13/05/2026", patient: "Sophie Martin", age: 27, gender: "F", diag: "Migraine", conf: "55%", meds: 2, status: "finalisé" },
  { id: "M4N5O6", date: "13/05/2026", patient: "Pierre Leclerc", age: 71, gender: "M", diag: "Hypertension", conf: "88%", meds: 2, status: "finalisé" },
  { id: "P7Q8R9", date: "12/05/2026", patient: "Fatima Zahra", age: 39, gender: "F", diag: "Diabète Type 2", conf: "79%", meds: 3, status: "finalisé" },
];

function HistoryPage({ navigate }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("tous");

  const filtered = fakeHistory.filter(h =>
    (filter === "tous" || h.status === filter) &&
    (!search || h.patient.toLowerCase().includes(search.toLowerCase()) || h.diag.toLowerCase().includes(search.toLowerCase()) || h.id.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ padding: "32px 36px", maxWidth: 1200 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: T.text, margin: 0, letterSpacing: "-0.5px" }}>
            Historique des Consultations
          </h1>
          <p style={{ color: T.muted, fontSize: 12, marginTop: 5 }}>{fakeHistory.length} consultations enregistrées</p>
        </div>
        <Btn icon={Brain} onClick={() => navigate("consultation")} style={{ fontSize: 12 }}>
          Nouvelle Consultation
        </Btn>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "9px 14px", flex: 1 }}>
          <Search size={14} color={T.muted} />
          <input placeholder="Rechercher par patient, diagnostic, ID…" value={search} onChange={e => setSearch(e.target.value)}
            style={{ background: "none", border: "none", outline: "none", color: T.text, fontSize: 13, flex: 1, fontFamily: "inherit" }} />
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {["tous", "finalisé", "en cours"].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: "9px 16px", borderRadius: 10, border: `1.5px solid ${filter === f ? T.accent : T.border}`,
              background: filter === f ? T.accent + "20" : "transparent", color: filter === f ? T.accent : T.muted,
              fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", textTransform: "capitalize"
            }}>{f}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["ID", "Date", "Patient", "Âge", "Diagnostic", "Confiance", "Médicaments", "Statut", "Actions"].map(h => (
                <th key={h} style={{ textAlign: "left", fontSize: 9, fontWeight: 800, color: T.muted, textTransform: "uppercase", letterSpacing: 2, padding: "0 12px 14px 0" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={i} style={{ borderTop: `1px solid ${T.border}` }}>
                <td style={{ padding: "14px 12px 14px 0" }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: T.accent, fontFamily: "monospace" }}>{r.id}</span>
                </td>
                <td style={{ padding: "14px 12px 14px 0", fontSize: 12, color: T.muted }}>{r.date}</td>
                <td style={{ padding: "14px 12px 14px 0" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{r.patient}</div>
                  <div style={{ fontSize: 10, color: T.muted }}>{r.gender === "M" ? "Masculin" : "Féminin"}</div>
                </td>
                <td style={{ padding: "14px 12px 14px 0", fontSize: 12, color: T.muted }}>{r.age} ans</td>
                <td style={{ padding: "14px 12px 14px 0", fontSize: 12, fontWeight: 600, color: T.text }}>{r.diag}</td>
                <td style={{ padding: "14px 12px 14px 0" }}><ConfidenceBadge pct={r.conf} /></td>
                <td style={{ padding: "14px 12px 14px 0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Pill size={12} color={T.purple} />
                    <span style={{ fontSize: 12, color: T.muted }}>{r.meds}</span>
                  </div>
                </td>
                <td style={{ padding: "14px 12px 14px 0" }}>
                  <Badge color={r.status === "finalisé" ? T.emerald : T.amber} small>{r.status}</Badge>
                </td>
                <td style={{ padding: "14px 0 14px 0" }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button title="Voir rapport" style={{ background: T.accent + "15", border: `1px solid ${T.accent}30`, borderRadius: 8, padding: "6px 8px", color: T.accent, cursor: "pointer" }}>
                      <Eye size={12} />
                    </button>
                    <button title="Télécharger PDF" style={{ background: T.emerald + "15", border: `1px solid ${T.emerald}30`, borderRadius: 8, padding: "6px 8px", color: T.emerald, cursor: "pointer" }}>
                      <Download size={12} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "50px 0", opacity: 0.3 }}>
            <History size={40} color={T.muted} />
            <p style={{ color: T.muted, marginTop: 12, fontSize: 13 }}>Aucun résultat trouvé</p>
          </div>
        )}
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// ROOT APP
// ═══════════════════════════════════════════════════════════

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [consultData, setConsultData] = useState(null);

  const navigate = (p, data) => {
    if (data) setConsultData(data);
    setPage(p);
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: T.bg, fontFamily: "'DM Sans', 'Inter', sans-serif", color: T.text }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: ${T.bg}; }
        ::-webkit-scrollbar-thumb { background: ${T.border2}; border-radius: 10px; }
        button:disabled { cursor: not-allowed; }
        textarea { resize: vertical; }
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
      `}</style>
      <Sidebar page={page} setPage={navigate} />
      <main style={{ flex: 1, overflowY: "auto", minHeight: "100vh" }}>
        {page === "dashboard"    && <DashboardPage navigate={navigate} />}
        {page === "consultation" && <ConsultationPage navigate={navigate} />}
        {page === "pharmacy"     && <PharmacyPage consultData={consultData} navigate={navigate} />}
        {page === "history"      && <HistoryPage navigate={navigate} />}
      </main>
    </div>
  );
}