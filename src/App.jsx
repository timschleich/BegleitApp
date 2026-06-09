import { useState, useEffect } from "react";

const COLORS = {
  primary: "#2D6A8A", primaryLight: "#E8F4FA", primaryDark: "#1A4A63",
  accent: "#E8A020", accentLight: "#FEF3DC",
  success: "#2E7D52", successLight: "#E6F4EC",
  danger: "#B83232", dangerLight: "#FAEAEA",
  warning: "#C47A00", warningLight: "#FFF3CD",
  neutral50: "#F7F8FA", neutral100: "#EEF0F4", neutral300: "#C4CBD6",
  neutral500: "#7A8699", neutral700: "#3D4756", neutral900: "#1A2030",
  white: "#FFFFFF",
};

const DEMO_USERS = [
  { id: 1, name: "Maria Huber", role: "admin", email: "m.huber@begleitung.de", initials: "MH" },
  { id: 2, name: "Thomas Klein", role: "begleiter", email: "t.klein@begleitung.de", initials: "TK" },
  { id: 3, name: "Sandra Berger", role: "begleiter", email: "s.berger@begleitung.de", initials: "SB" },
];
const DEMO_KINDER = [
  { id: "K001", kuerzel: "K001", name: "Seppi M.", schule: "Grundschule Untermeitingen", klasse: "3a", begleiter: 2 },
  { id: "K002", kuerzel: "K002", name: "Lena B.", schule: "Realschule Nord", klasse: "5b", begleiter: 2 },
  { id: "K003", kuerzel: "K003", name: "Max T.", schule: "Grundschule Untermeitingen", klasse: "2c", begleiter: 3 },
  { id: "K004", kuerzel: "K004", name: "Anna P.", schule: "Förderschule West", klasse: "4a", begleiter: 3 },
];
const DEMO_BUDGETS = [
  { userId: 2, kindId: "K001", jahr: 2026, monat: 4, geplanteStunden: 63.5 },
  { userId: 2, kindId: "K001", jahr: 2026, monat: 6, geplanteStunden: 63.5 },
  { userId: 2, kindId: "K002", jahr: 2026, monat: 6, geplanteStunden: 40.0 },
  { userId: 3, kindId: "K003", jahr: 2026, monat: 6, geplanteStunden: 50.0 },
];
const APRIL_EINTRAEGE = [
  { datum: "2026-04-14", von: "07:45", bis: "12:00", pause: 0 },
  { datum: "2026-04-15", von: "07:45", bis: "11:30", pause: 0 },
  { datum: "2026-04-16", von: "07:45", bis: "12:30", pause: 0 },
  { datum: "2026-04-17", von: "07:45", bis: "12:30", pause: 0 },
  { datum: "2026-04-22", von: "07:45", bis: "13:15", pause: 0 },
  { datum: "2026-04-28", von: "07:45", bis: "12:00", pause: 0 },
  { datum: "2026-04-29", von: "07:45", bis: "11:30", pause: 0 },
  { datum: "2026-04-30", von: "07:45", bis: "12:30", pause: 0 },
];
const DEMO_ZEITEN_INIT = [
  ...APRIL_EINTRAEGE.map((e, i) => ({ id: i + 1, userId: 2, kindId: "K001", ...e, fehlzeit: false, fehlVon: "", fehlBis: "", fehlGrund: "", status: "abgeschlossen" })),
  { id: 20, userId: 2, kindId: "K002", datum: "2026-06-09", von: "13:30", bis: "15:30", pause: 0, fehlzeit: false, fehlVon: "", fehlBis: "", fehlGrund: "", status: "abgeschlossen" },
  { id: 21, userId: 3, kindId: "K003", datum: "2026-06-09", von: "08:00", bis: "12:30", pause: 0, fehlzeit: false, fehlVon: "", fehlBis: "", fehlGrund: "", status: "abgeschlossen" },
];
const DEMO_VERTRETUNGEN = [
  { id: 1, datum: "2026-06-11", kindId: "K001", vertretenVon: 3, anfrageVon: 2, status: "offen", grund: "Arzttermin" },
  { id: 2, datum: "2026-06-12", kindId: "K003", vertretenVon: null, anfrageVon: 3, status: "gesucht", grund: "Urlaub" },
];
const DEMO_DOKUMENTE = [
  { id: 1, name: "Lohnabrechnung Mai 2026", typ: "lohn", datum: "2026-05-31", userId: 2, groesse: "124 KB" },
  { id: 2, name: "Lohnabrechnung April 2026", typ: "lohn", datum: "2026-04-30", userId: 2, groesse: "121 KB" },
  { id: 3, name: "Arbeitsvertrag", typ: "vertrag", datum: "2025-09-01", userId: 2, groesse: "340 KB" },
];

function minuten(von, bis) {
  if (!von || !bis) return 0;
  const [vh, vm] = von.split(":").map(Number);
  const [bh, bm] = bis.split(":").map(Number);
  return Math.max(0, (bh * 60 + bm) - (vh * 60 + vm));
}
function stunden(von, bis, pause = 0) { return Math.max(0, (minuten(von, bis) - pause) / 60); }
function fmtHDez(h) { return h.toFixed(2) + " Std."; }
function heute() { return new Date().toISOString().slice(0, 10); }
function monatsTage(jahr, monat) {
  const tage = [];
  const d = new Date(jahr, monat - 1, 1);
  while (d.getMonth() === monat - 1) { tage.push(d.toISOString().slice(0, 10)); d.setDate(d.getDate() + 1); }
  return tage;
}
const WOCHENTAGE = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
function wt(datum) { return WOCHENTAGE[new Date(datum).getDay()]; }
function istWochenende(datum) { const d = new Date(datum).getDay(); return d === 0 || d === 6; }
function formatDatum(datum) { return new Date(datum).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }); }

function Badge({ color = COLORS.primary, bg, children }) {
  return <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, color, background: bg || color + "18" }}>{children}</span>;
}
function Card({ children, style }) {
  return <div style={{ background: COLORS.white, borderRadius: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.04)", padding: "20px 24px", ...style }}>{children}</div>;
}
function Btn({ children, onClick, variant = "primary", small, disabled, style }) {
  const s = {
    primary: { background: COLORS.primary, color: "#fff", border: "none" },
    secondary: { background: COLORS.neutral100, color: COLORS.neutral700, border: "none" },
    danger: { background: COLORS.dangerLight, color: COLORS.danger, border: `1px solid ${COLORS.danger}30` },
    success: { background: COLORS.successLight, color: COLORS.success, border: `1px solid ${COLORS.success}30` },
    ghost: { background: "transparent", color: COLORS.primary, border: `1.5px solid ${COLORS.primary}` },
    warning: { background: COLORS.warningLight, color: COLORS.warning, border: `1px solid ${COLORS.warning}40` },
  };
  return <button onClick={onClick} disabled={disabled} style={{ ...s[variant], borderRadius: 8, cursor: disabled ? "not-allowed" : "pointer", padding: small ? "5px 12px" : "9px 18px", fontSize: small ? 12 : 14, fontWeight: 600, opacity: disabled ? 0.5 : 1, transition: "all 0.15s", ...style }}>{children}</button>;
}
function Input({ label, value, onChange, type = "text", placeholder, small }) {
  return (
    <div style={{ marginBottom: small ? 0 : 12 }}>
      {label && <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: COLORS.neutral700, marginBottom: 4 }}>{label}</label>}
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: "100%", padding: small ? "5px 8px" : "8px 11px", borderRadius: 7, border: `1.5px solid ${COLORS.neutral300}`, fontSize: small ? 13 : 14, background: COLORS.white, color: COLORS.neutral900, boxSizing: "border-box" }} />
    </div>
  );
}
function Avatar({ initials, size = 36, color = COLORS.primary }) {
  return <div style={{ width: size, height: size, borderRadius: size, background: color + "20", color, fontWeight: 700, fontSize: size * 0.38, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{initials}</div>;
}

const Icon = {
  clock: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>,
  swap: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4"/></svg>,
  doc: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  team: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  shield: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  logout: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>,
  plus: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  dashboard: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  nachweis: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="9" x2="9" y2="21"/></svg>,
  print: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>,
  warn: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
};

function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("t.klein@begleitung.de");
  const [pw, setPw] = useState("demo1234");
  const [err, setErr] = useState("");
  function handleLogin() {
    const user = DEMO_USERS.find(u => u.email === email);
    if (!user || pw !== "demo1234") { setErr("E-Mail oder Passwort falsch."); return; }
    onLogin(user);
  }
  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(135deg, ${COLORS.primaryDark} 0%, ${COLORS.primary} 60%, #3D8FA8 100%)`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 400, padding: "0 16px" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,0.12)", borderRadius: 16, padding: "12px 24px" }}>
            <span style={{ fontSize: 28 }}>🤝</span>
            <div style={{ textAlign: "left" }}>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: 20 }}>BegleitApp</div>
              <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 12 }}>Schulbegleitung & Individual</div>
            </div>
          </div>
        </div>
        <Card>
          <h2 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 700 }}>Anmelden</h2>
          <p style={{ margin: "0 0 22px", fontSize: 13, color: COLORS.neutral500 }}>DSGVO-konform · Kinderdaten pseudonymisiert</p>
          <Input label="E-Mail" value={email} onChange={setEmail} type="email" />
          <Input label="Passwort" value={pw} onChange={setPw} type="password" />
          {err && <div style={{ background: COLORS.dangerLight, color: COLORS.danger, borderRadius: 8, padding: "9px 13px", fontSize: 13, marginBottom: 12 }}>{err}</div>}
          <Btn onClick={handleLogin} style={{ width: "100%" }}>Anmelden</Btn>
          <div style={{ marginTop: 18, padding: 12, background: COLORS.neutral50, borderRadius: 8, fontSize: 12, color: COLORS.neutral500 }}>
            <strong style={{ color: COLORS.neutral700 }}>Demo (PW: demo1234)</strong><br />
            Admin: m.huber@begleitung.de<br />
            Begleiter: t.klein@begleitung.de
          </div>
        </Card>
      </div>
    </div>
  );
}
function Betreuungsnachweis({ user }) {
  const jetzt = new Date();
  const [jahr, setJahr] = useState(jetzt.getFullYear());
  const [monat, setMonat] = useState(jetzt.getMonth() + 1);
  const [kindId, setKindId] = useState("");
  const [zeiten, setZeiten] = useState(DEMO_ZEITEN_INIT);
  const [budgets, setBudgets] = useState(DEMO_BUDGETS);
  const [druckModus, setDruckModus] = useState(false);
  const meineKinder = DEMO_KINDER.filter(k => k.begleiter === user.id || user.role === "admin");
  useEffect(() => { if (meineKinder.length > 0 && !kindId) setKindId(meineKinder[0].id); }, [user.id]);
  const kind = DEMO_KINDER.find(k => k.id === kindId);
  const budget = budgets.find(b => b.userId === user.id && b.kindId === kindId && b.jahr === jahr && b.monat === monat);
  const geplanteStunden = budget?.geplanteStunden || 0;
  const tage = monatsTage(jahr, monat);
  const monatEintraege = tage.map(datum => zeiten.find(z => z.userId === user.id && z.kindId === kindId && z.datum === datum) || { datum, von: "", bis: "", pause: 0, fehlzeit: false, fehlVon: "", fehlBis: "", fehlGrund: "", _leer: true });
  const stundenProTag = monatEintraege.map(e => stunden(e.von, e.bis, e.pause || 0));
  const gesamtStunden = stundenProTag.reduce((s, h) => s + h, 0);
  const ueberschritten = geplanteStunden > 0 && gesamtStunden > geplanteStunden;
  const auslastung = geplanteStunden > 0 ? (gesamtStunden / geplanteStunden) * 100 : 0;
  function updateEintrag(datum, feld, wert) {
    setZeiten(prev => {
      const existing = prev.find(z => z.userId === user.id && z.kindId === kindId && z.datum === datum);
      if (existing) return prev.map(z => z.userId === user.id && z.kindId === kindId && z.datum === datum ? { ...z, [feld]: wert } : z);
      return [...prev, { id: Date.now(), userId: user.id, kindId, datum, von: "", bis: "", pause: 0, fehlzeit: false, fehlVon: "", fehlBis: "", fehlGrund: "", status: "offen", [feld]: wert }];
    });
  }
  function updateBudget(val) {
    const v = parseFloat(val) || 0;
    setBudgets(prev => {
      const ex = prev.find(b => b.userId === user.id && b.kindId === kindId && b.jahr === jahr && b.monat === monat);
      if (ex) return prev.map(b => b.userId === user.id && b.kindId === kindId && b.jahr === jahr && b.monat === monat ? { ...b, geplanteStunden: v } : b);
      return [...prev, { userId: user.id, kindId, jahr, monat, geplanteStunden: v }];
    });
  }
  const MONATE = ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];
  const tdBase = { padding: "5px 7px", fontSize: 13, borderBottom: `1px solid ${COLORS.neutral100}`, verticalAlign: "middle" };
  const thBase = { padding: "8px 7px", fontSize: 12, fontWeight: 700, color: COLORS.neutral500, borderBottom: `2px solid ${COLORS.neutral300}`, background: COLORS.neutral50, textAlign: "left" };
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Betreuungsnachweis</h2>
        <Btn variant="secondary" small onClick={() => setDruckModus(d => !d)} style={{ display: "flex", alignItems: "center", gap: 6 }}>{Icon.print} {druckModus ? "Bearbeiten" : "Druckansicht"}</Btn>
      </div>
      <Card style={{ marginBottom: 20, padding: "16px 20px" }}>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.neutral700, display: "block", marginBottom: 4 }}>Kind</label>
            <select value={kindId} onChange={e => setKindId(e.target.value)} style={{ padding: "8px 12px", borderRadius: 8, border: `1.5px solid ${COLORS.neutral300}`, fontSize: 14, minWidth: 160 }}>
              {meineKinder.map(k => <option key={k.id} value={k.id}>{k.kuerzel} – {k.schule}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.neutral700, display: "block", marginBottom: 4 }}>Monat</label>
            <select value={monat} onChange={e => setMonat(Number(e.target.value))} style={{ padding: "8px 12px", borderRadius: 8, border: `1.5px solid ${COLORS.neutral300}`, fontSize: 14 }}>
              {MONATE.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.neutral700, display: "block", marginBottom: 4 }}>Jahr</label>
            <select value={jahr} onChange={e => setJahr(Number(e.target.value))} style={{ padding: "8px 12px", borderRadius: 8, border: `1.5px solid ${COLORS.neutral300}`, fontSize: 14 }}>
              {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.neutral700, display: "block", marginBottom: 4 }}>Geplante Stunden</label>
            <input type="number" value={geplanteStunden} onChange={e => updateBudget(e.target.value)} min={0} step={0.25} style={{ padding: "8px 12px", borderRadius: 8, border: `1.5px solid ${ueberschritten ? COLORS.danger : COLORS.neutral300}`, fontSize: 14, width: 120 }} />
          </div>
        </div>
      </Card>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 16 }}>
        {[
          { label: "Geplant", value: fmtHDez(geplanteStunden), color: COLORS.primary, bg: COLORS.primaryLight },
          { label: "Erfasst", value: fmtHDez(gesamtStunden), color: ueberschritten ? COLORS.danger : COLORS.success, bg: ueberschritten ? COLORS.dangerLight : COLORS.successLight },
          { label: "Verbleibend", value: fmtHDez(Math.max(0, geplanteStunden - gesamtStunden)), color: COLORS.warning, bg: COLORS.warningLight },
          { label: "Auslastung", value: geplanteStunden > 0 ? auslastung.toFixed(0) + "%" : "–", color: ueberschritten ? COLORS.danger : COLORS.neutral700, bg: COLORS.neutral100 },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: 12, padding: "14px 18px" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: COLORS.neutral500, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>
      {geplanteStunden > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ height: 10, background: COLORS.neutral100, borderRadius: 10, overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: 10, transition: "width 0.4s", width: Math.min(auslastung, 100) + "%", background: ueberschritten ? COLORS.danger : auslastung > 85 ? COLORS.warning : COLORS.success }} />
          </div>
          {ueberschritten && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, padding: "10px 14px", background: COLORS.dangerLight, borderRadius: 8, color: COLORS.danger, fontSize: 13, fontWeight: 600 }}>
              {Icon.warn} Stundenbudget überschritten! +{fmtHDez(gesamtStunden - geplanteStunden)}
            </div>
          )}
        </div>
      )}
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "18px 20px", borderBottom: `2px solid ${COLORS.neutral100}`, background: COLORS.primaryLight }}>
          <h3 style={{ margin: "0 0 10px", fontSize: 17, fontWeight: 800, color: COLORS.primaryDark, textAlign: "center" }}>Betreuungsnachweis</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 24px", fontSize: 13 }}>
            <div><span style={{ color: COLORS.neutral500 }}>Betreuer/in: </span><strong>{user.name}</strong></div>
            <div><span style={{ color: COLORS.neutral500 }}>Monat/Jahr: </span><strong>{MONATE[monat - 1]} {jahr}</strong></div>
            <div><span style={{ color: COLORS.neutral500 }}>Kind: </span><strong>{kind?.kuerzel}</strong></div>
            <div><span style={{ color: COLORS.neutral500 }}>Einrichtung: </span><strong>{kind?.schule}</strong></div>
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
            <thead>
              <tr>
                <th style={{ ...thBase, width: 36 }}>Tag</th>
                <th style={{ ...thBase, width: 90 }}>Datum</th>
                <th style={{ ...thBase, width: 80, borderLeft: `2px solid ${COLORS.primary}30` }}>Von</th>
                <th style={{ ...thBase, width: 80 }}>Bis</th>
                <th style={{ ...thBase, width: 60 }}>Pause</th>
                <th style={{ ...thBase, width: 70, color: COLORS.primary }}>Std.</th>
                <th style={{ ...thBase, width: 80, borderLeft: `2px solid ${COLORS.accent}40`, color: COLORS.warning }}>FZ Von</th>
                <th style={{ ...thBase, width: 80, color: COLORS.warning }}>FZ Bis</th>
                <th style={{ ...thBase, color: COLORS.warning }}>Grund</th>
              </tr>
            </thead>
            <tbody>
              {monatEintraege.map((e, i) => {
                const istWE = istWochenende(e.datum);
                const h = stundenProTag[i];
                const hatEintrag = e.von && e.bis;
                return (
                  <tr key={e.datum} style={{ background: istWE ? COLORS.neutral50 : COLORS.white, opacity: istWE ? 0.5 : 1 }}>
                    <td style={{ ...tdBase, fontWeight: 700, fontSize: 12, color: COLORS.neutral500 }}>{wt(e.datum)}</td>
                    <td style={{ ...tdBase, fontSize: 13 }}>{formatDatum(e.datum)}</td>
                    <td style={{ ...tdBase, borderLeft: `2px solid ${COLORS.primary}20`, padding: "3px 5px" }}>
                      {druckModus ? <span>{e.von || "–"}</span> : <input type="time" value={e.von || ""} disabled={istWE} onChange={ev => updateEintrag(e.datum, "von", ev.target.value)} style={{ width: "100%", padding: "4px 6px", borderRadius: 6, border: `1.5px solid ${COLORS.neutral300}`, fontSize: 13 }} />}
                    </td>
                    <td style={{ ...tdBase, padding: "3px 5px" }}>
                      {druckModus ? <span>{e.bis || "–"}</span> : <input type="time" value={e.bis || ""} disabled={istWE} onChange={ev => updateEintrag(e.datum, "bis", ev.target.value)} style={{ width: "100%", padding: "4px 6px", borderRadius: 6, border: `1.5px solid ${COLORS.neutral300}`, fontSize: 13 }} />}
                    </td>
                    <td style={{ ...tdBase, padding: "3px 5px" }}>
                      {druckModus ? <span>{e.pause ? e.pause + "'" : "–"}</span> : <input type="number" min={0} step={5} value={e.pause || ""} disabled={istWE} onChange={ev => updateEintrag(e.datum, "pause", Number(ev.target.value))} placeholder="0" style={{ width: "100%", padding: "4px 6px", borderRadius: 6, border: `1.5px solid ${COLORS.neutral300}`, fontSize: 13 }} />}
                    </td>
                    <td style={{ ...tdBase, fontWeight: 700, color: hatEintrag ? COLORS.primary : COLORS.neutral300 }}>{hatEintrag ? h.toFixed(2) : "–"}</td>
                    <td style={{ ...tdBase, borderLeft: `2px solid ${COLORS.accent}30`, padding: "3px 5px" }}>
                      {druckModus ? <span>{e.fehlVon || "–"}</span> : <input type="time" value={e.fehlVon || ""} disabled={istWE} onChange={ev => updateEintrag(e.datum, "fehlVon", ev.target.value)} style={{ width: "100%", padding: "4px 6px", borderRadius: 6, border: `1.5px solid ${COLORS.neutral300}`, fontSize: 12 }} />}
                    </td>
                    <td style={{ ...tdBase, padding: "3px 5px" }}>
                      {druckModus ? <span>{e.fehlBis || "–"}</span> : <input type="time" value={e.fehlBis || ""} disabled={istWE} onChange={ev => updateEintrag(e.datum, "fehlBis", ev.target.value)} style={{ width: "100%", padding: "4px 6px", borderRadius: 6, border: `1.5px solid ${COLORS.neutral300}`, fontSize: 12 }} />}
                    </td>
                    <td style={{ ...tdBase, padding: "3px 5px" }}>
                      {druckModus ? <span>{e.fehlGrund || ""}</span> : <input type="text" value={e.fehlGrund || ""} disabled={istWE} onChange={ev => updateEintrag(e.datum, "fehlGrund", ev.target.value)} placeholder="Grund..." style={{ width: "100%", padding: "4px 6px", borderRadius: 6, border: `1.5px solid ${COLORS.neutral300}`, fontSize: 12 }} />}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: COLORS.primaryLight }}>
                <td colSpan={3} style={{ ...tdBase, fontWeight: 700, borderTop: `2px solid ${COLORS.primary}30` }}>Geplant: <strong>{fmtHDez(geplanteStunden)}</strong></td>
                <td colSpan={2} style={{ ...tdBase, fontWeight: 700, borderTop: `2px solid ${COLORS.primary}30` }}>Gesamt:</td>
                <td style={{ ...tdBase, fontWeight: 800, fontSize: 14, color: ueberschritten ? COLORS.danger : COLORS.success, borderTop: `2px solid ${COLORS.primary}30` }}>{fmtHDez(gesamtStunden)}</td>
                <td colSpan={3} style={{ ...tdBase, fontWeight: 700, fontSize: 12, color: ueberschritten ? COLORS.danger : COLORS.neutral500, borderTop: `2px solid ${COLORS.primary}30`, borderLeft: `2px solid ${COLORS.accent}30` }}>
                  {ueberschritten ? `⚠️ +${fmtHDez(gesamtStunden - geplanteStunden)} über Budget` : `✓ Noch ${fmtHDez(geplanteStunden - gesamtStunden)} verfügbar`}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div style={{ padding: "20px 24px", borderTop: `2px solid ${COLORS.neutral100}`, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
          <div><div style={{ borderTop: `1.5px solid ${COLORS.neutral700}`, marginTop: 40, paddingTop: 6 }}><span style={{ fontSize: 12, color: COLORS.neutral500 }}>Unterschrift Betreuer/in</span></div></div>
          <div><div style={{ borderTop: `1.5px solid ${COLORS.neutral700}`, marginTop: 40, paddingTop: 6 }}><span style={{ fontSize: 12, color: COLORS.neutral500 }}>Unterschrift + Stempel Einrichtung</span></div></div>
        </div>
      </Card>
    </div>
  );
}

function Vertretungen({ user }) {
  const [verts, setVerts] = useState(DEMO_VERTRETUNGEN);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ kindId: "", datum: "", grund: "" });
  const meineKinder = DEMO_KINDER.filter(k => k.begleiter === user.id || user.role === "admin");
  function anfragen() {
    if (!form.kindId || !form.datum) return;
    setVerts(v => [...v, { id: v.length + 1, datum: form.datum, kindId: form.kindId, vertretenVon: null, anfrageVon: user.id, status: "gesucht", grund: form.grund }]);
    setForm({ kindId: "", datum: "", grund: "" }); setShowForm(false);
  }
  function annehmen(id) { setVerts(v => v.map(x => x.id === id ? { ...x, vertretenVon: user.id, status: "bestätigt" } : x)); }
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Vertretungen</h2>
        <Btn small onClick={() => setShowForm(s => !s)} style={{ display: "flex", alignItems: "center", gap: 6 }}>{Icon.plus} Anfragen</Btn>
      </div>
      {showForm && (
        <Card style={{ marginBottom: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.neutral700, display: "block", marginBottom: 4 }}>Kind</label>
              <select value={form.kindId} onChange={e => setForm(f => ({ ...f, kindId: e.target.value }))} style={{ width: "100%", padding: "8px 11px", borderRadius: 7, border: `1.5px solid ${COLORS.neutral300}`, fontSize: 14, marginBottom: 12 }}>
                <option value="">– wählen –</option>
                {meineKinder.map(k => <option key={k.id} value={k.id}>{k.kuerzel}</option>)}
              </select>
            </div>
            <Input label="Datum" value={form.datum} onChange={v => setForm(f => ({ ...f, datum: v }))} type="date" />
            <div style={{ gridColumn: "1/-1" }}><Input label="Grund" value={form.grund} onChange={v => setForm(f => ({ ...f, grund: v }))} /></div>
            <div style={{ gridColumn: "1/-1", display: "flex", gap: 10 }}>
              <Btn onClick={anfragen} disabled={!form.kindId || !form.datum}>Stellen</Btn>
              <Btn variant="secondary" onClick={() => setShowForm(false)}>Abbrechen</Btn>
            </div>
          </div>
        </Card>
      )}
      <Card>
        {verts.map(v => {
          const anfrager = DEMO_USERS.find(u => u.id === v.anfrageVon);
          const vertreter = DEMO_USERS.find(u => u.id === v.vertretenVon);
          return (
            <div key={v.id} style={{ border: `1.5px solid ${v.status === "bestätigt" ? COLORS.success + "40" : COLORS.neutral300}`, borderRadius: 12, padding: "13px 16px", marginBottom: 10, background: v.status === "bestätigt" ? COLORS.successLight : COLORS.white }}>
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 700 }}>Kind {v.kindId} · {new Date(v.datum).toLocaleDateString("de-DE")}</div>
                  <div style={{ fontSize: 13, color: COLORS.neutral500 }}>Von: {anfrager?.name} · {v.grund}</div>
                  {vertreter && <div style={{ fontSize: 13, color: COLORS.success, fontWeight: 600 }}>✓ {vertreter.name}</div>}
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <Badge color={v.status === "bestätigt" ? COLORS.success : COLORS.accent}>{v.status}</Badge>
                  {v.status === "gesucht" && v.anfrageVon !== user.id && <Btn variant="success" small onClick={() => annehmen(v.id)}>Übernehmen</Btn>}
                </div>
              </div>
            </div>
          );
        })}
      </Card>
    </div>
  );
}

function Dokumente({ user }) {
  const meineDoks = DEMO_DOKUMENTE.filter(d => d.userId === user.id || user.role === "admin");
  const typColors = { lohn: COLORS.primary, vertrag: COLORS.accent };
  const typLabels = { lohn: "Lohnabrechnung", vertrag: "Vertrag" };
  return (
    <div>
      <h2 style={{ margin: "0 0 20px", fontSize: 22, fontWeight: 700 }}>Dokumente & Lohn</h2>
      <Card>
        {meineDoks.map(d => (
          <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "11px 14px", background: COLORS.neutral50, borderRadius: 10, marginBottom: 8, flexWrap: "wrap" }}>
            <span style={{ color: COLORS.neutral500 }}>{Icon.doc}</span>
            <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 14 }}>{d.name}</div><div style={{ fontSize: 12, color: COLORS.neutral500 }}>{d.datum} · {d.groesse}</div></div>
            <Badge color={typColors[d.typ]}>{typLabels[d.typ]}</Badge>
            <Btn variant="ghost" small>⬇ Download</Btn>
          </div>
        ))}
      </Card>
    </div>
  );
}

function Dashboard({ user, onNavigate }) {
  const offeneVerts = DEMO_VERTRETUNGEN.filter(v => v.status === "gesucht" && v.anfrageVon !== user.id).length;
  const meineKinder = DEMO_KINDER.filter(k => k.begleiter === user.id || user.role === "admin");
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800 }}>Guten Tag, {user.name.split(" ")[0]} 👋</h2>
        <p style={{ margin: 0, color: COLORS.neutral500, fontSize: 14 }}>{new Date().toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 20 }}>
        {[
          { icon: "🧒", label: "Betreute Kinder", value: meineKinder.length, color: COLORS.primary },
          { icon: "🔄", label: "Offene Vertretungen", value: offeneVerts, color: COLORS.accent },
          { icon: "📁", label: "Dokumente", value: DEMO_DOKUMENTE.filter(d => d.userId === user.id).length, color: COLORS.neutral700 },
        ].map(s => (
          <Card key={s.label} style={{ padding: "16px 18px" }}>
            <div style={{ fontSize: 24 }}>{s.icon}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color, marginTop: 6 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: COLORS.neutral500 }}>{s.label}</div>
          </Card>
        ))}
      </div>
      <Card>
        <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700 }}>Meine Kinder</h3>
        {meineKinder.map(k => (
          <div key={k.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: `1px solid ${COLORS.neutral100}` }}>
            <div><span style={{ fontWeight: 700 }}>{k.kuerzel}</span><span style={{ fontSize: 13, color: COLORS.neutral500, marginLeft: 10 }}>{k.schule}</span></div>
            <Btn variant="ghost" small onClick={() => onNavigate("nachweis")}>Nachweis →</Btn>
          </div>
        ))}
      </Card>
    </div>
  );
}

function Team() {
  return (
    <div>
      <h2 style={{ margin: "0 0 20px", fontSize: 22, fontWeight: 700 }}>Team</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 14 }}>
        {DEMO_USERS.map(u => (
          <Card key={u.id}>
            <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 12 }}>
              <Avatar initials={u.initials} size={44} />
              <div><div style={{ fontWeight: 700, fontSize: 15 }}>{u.name}</div><div style={{ fontSize: 12, color: COLORS.neutral500 }}>{u.email}</div></div>
            </div>
            <Badge color={u.role === "admin" ? COLORS.accent : COLORS.primary}>{u.role === "admin" ? "Admin" : "Begleiter/in"}</Badge>
          </Card>
        ))}
      </div>
    </div>
  );
}

const NAV = [
  { id: "dashboard", label: "Übersicht", icon: Icon.dashboard, roles: ["admin", "begleiter"] },
  { id: "nachweis", label: "Nachweis", icon: Icon.nachweis, roles: ["admin", "begleiter"] },
  { id: "vertretung", label: "Vertretungen", icon: Icon.swap, roles: ["admin", "begleiter"] },
  { id: "dokumente", label: "Dokumente", icon: Icon.doc, roles: ["admin", "begleiter"] },
  { id: "team", label: "Team", icon: Icon.team, roles: ["admin"] },
];

export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dashboard");
  if (!user) return <LoginScreen onLogin={setUser} />;
  const navItems = NAV.filter(n => n.roles.includes(user.role));
  const pages = {
    dashboard: <Dashboard user={user} onNavigate={setPage} />,
    nachweis: <Betreuungsnachweis user={user} />,
    vertretung: <Vertretungen user={user} />,
    dokumente: <Dokumente user={user} />,
    team: <Team />,
  };
  return (
    <div style={{ minHeight: "100vh", background: COLORS.neutral50, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ position: "sticky", top: 0, zIndex: 100, background: COLORS.white, borderBottom: `1px solid ${COLORS.neutral100}`, padding: "0 20px", height: 58, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>🤝</span>
          <span style={{ fontWeight: 800, fontSize: 17, color: COLORS.neutral900 }}>BegleitApp</span>
          {user.role === "admin" && <Badge color={COLORS.accent}>Admin</Badge>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar initials={user.initials} size={32} />
          <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.neutral700 }}>{user.name}</span>
          <button onClick={() => setUser(null)} style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.neutral500, display: "flex" }}>{Icon.logout}</button>
        </div>
      </div>
      <div style={{ display: "flex", maxWidth: 1180, margin: "0 auto" }}>
        <aside style={{ width: 210, flexShrink: 0, padding: "20px 10px", position: "sticky", top: 58, height: "calc(100vh - 58px)", overflowY: "auto", display: "flex", flexDirection: "column", gap: 3 }}>
          {navItems.map(n => (
            <button key={n.id} onClick={() => setPage(n.id)} style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 14px", borderRadius: 9, border: "none", cursor: "pointer", width: "100%", textAlign: "left", background: page === n.id ? COLORS.primaryLight : "transparent", color: page === n.id ? COLORS.primary : COLORS.neutral700, fontWeight: page === n.id ? 700 : 500, fontSize: 14 }}>
              <span style={{ opacity: page === n.id ? 1 : 0.55 }}>{n.icon}</span>{n.label}
            </button>
          ))}
          <div style={{ marginTop: "auto", padding: "14px 14px 6px", fontSize: 11, color: COLORS.neutral300, lineHeight: 1.8 }}>🔒 DSGVO-konform<br/>Pseudonymisiert</div>
        </aside>
        <main style={{ flex: 1, padding: "26px 18px 60px", minWidth: 0 }}>
          {pages[page]}
        </main>
      </div>
    </div>
  );
}
