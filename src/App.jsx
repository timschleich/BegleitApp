import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import { getTagInfo, FEIERTAGE_2026, SCHULFERIEN_2026 } from "./feiertage";

const ADMIN_EMAIL = "t.schleich@servus-inklusion.de";

const COLORS = {
  primary: "#2D6A8A", primaryLight: "#E8F4FA", primaryDark: "#1A4A63",
  accent: "#E8A020", accentLight: "#FEF3DC",
  success: "#2E7D52", successLight: "#E6F4EC",
  danger: "#B83232", dangerLight: "#FAEAEA",
  warning: "#C47A00", warningLight: "#FFF3CD",
  ferien: "#7B5EA7", ferienLight: "#F0EBF8",
  neutral50: "#F7F8FA", neutral100: "#EEF0F4", neutral300: "#C4CBD6",
  neutral500: "#7A8699", neutral700: "#3D4756", neutral900: "#1A2030",
  white: "#FFFFFF",
};

function minuten(von, bis) {
  if (!von || !bis) return 0;
  const [vh, vm] = von.split(":").map(Number);
  const [bh, bm] = bis.split(":").map(Number);
  return Math.max(0, (bh * 60 + bm) - (vh * 60 + vm));
}
function stunden(von, bis, pause = 0) { return Math.max(0, (minuten(von, bis) - pause) / 60); }
function fmtHDez(h) { return h.toFixed(2) + " Std."; }
function monatsTage(jahr, monat) {
  const tage = [];
  const d = new Date(jahr, monat - 1, 1);
  while (d.getMonth() === monat - 1) { tage.push(d.toISOString().slice(0, 10)); d.setDate(d.getDate() + 1); }
  return tage;
}
const WOCHENTAGE = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
const MONATE = ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];
function wt(datum) { return WOCHENTAGE[new Date(datum).getDay()]; }
function formatDatum(datum) { return new Date(datum).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }); }

function Card({ children, style }) {
  return <div style={{ background: "#fff", borderRadius: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.04)", padding: "20px 24px", ...style }}>{children}</div>;
}
function Btn({ children, onClick, variant = "primary", small, disabled, style }) {
  const s = {
    primary: { background: COLORS.primary, color: "#fff", border: "none" },
    secondary: { background: COLORS.neutral100, color: COLORS.neutral700, border: "none" },
    danger: { background: COLORS.dangerLight, color: COLORS.danger, border: "none" },
    success: { background: COLORS.successLight, color: COLORS.success, border: "none" },
    ghost: { background: "transparent", color: COLORS.primary, border: `1.5px solid ${COLORS.primary}` },
  };
  return <button onClick={onClick} disabled={disabled} style={{ ...s[variant], borderRadius: 8, cursor: disabled ? "not-allowed" : "pointer", padding: small ? "5px 12px" : "9px 18px", fontSize: small ? 12 : 14, fontWeight: 600, opacity: disabled ? 0.5 : 1, ...style }}>{children}</button>;
}
function Input({ label, value, onChange, type = "text", placeholder }) {
  return (
    <div style={{ marginBottom: 12 }}>
      {label && <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: COLORS.neutral700, marginBottom: 4 }}>{label}</label>}
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: "100%", padding: "8px 11px", borderRadius: 7, border: `1.5px solid ${COLORS.neutral300}`, fontSize: 14, boxSizing: "border-box" }} />
    </div>
  );
}
function Badge({ color = COLORS.primary, bg, children }) {
  return <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, color, background: bg || color + "18" }}>{children}</span>;
}
function Spinner() {
  return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
    <div style={{ width: 32, height: 32, border: `3px solid ${COLORS.neutral100}`, borderTop: `3px solid ${COLORS.primary}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
  </div>;
}

const Icon = {
  logout: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>,
  dashboard: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  nachweis: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="9" x2="9" y2="21"/></svg>,
  team: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  plus: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  warn: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  shield: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
};

function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("login");

  async function handleLogin() {
    setLoading(true); setErr("");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pw });
    if (error) { setErr("E-Mail oder Passwort falsch."); setLoading(false); return; }
    onLogin(data.user); setLoading(false);
  }

  async function handleRegister() {
    setLoading(true); setErr("");
    const { error } = await supabase.auth.signUp({ email, password: pw });
    if (error) { setErr(error.message); setLoading(false); return; }
    setErr("✅ Bestätigungsmail gesendet!"); setLoading(false);
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
          <h2 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 700 }}>{mode === "login" ? "Anmelden" : "Registrieren"}</h2>
          <p style={{ margin: "0 0 20px", fontSize: 13, color: COLORS.neutral500 }}>DSGVO-konform · Kinderdaten pseudonymisiert</p>
          <Input label="E-Mail" value={email} onChange={setEmail} type="email" placeholder="vorname.name@email.de" />
          <Input label="Passwort" value={pw} onChange={setPw} type="password" placeholder="Mindestens 6 Zeichen" />
          {err && <div style={{ background: err.startsWith("✅") ? COLORS.successLight : COLORS.dangerLight, color: err.startsWith("✅") ? COLORS.success : COLORS.danger, borderRadius: 8, padding: "9px 13px", fontSize: 13, marginBottom: 12 }}>{err}</div>}
          <Btn onClick={mode === "login" ? handleLogin : handleRegister} disabled={loading} style={{ width: "100%", marginBottom: 12 }}>
            {loading ? "Bitte warten..." : mode === "login" ? "Anmelden" : "Registrieren"}
          </Btn>
          <button onClick={() => setMode(m => m === "login" ? "register" : "login")} style={{ background: "none", border: "none", color: COLORS.primary, fontSize: 13, cursor: "pointer", width: "100%", textAlign: "center" }}>
            {mode === "login" ? "Noch kein Account? Registrieren" : "Bereits registriert? Anmelden"}
          </button>
        </Card>
        <p style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          {Icon.shield} DSGVO-konform · Daten in Europa
        </p>
      </div>
    </div>
  );function AdminBereich() {
  const [tab, setTab] = useState("mitarbeiter");
  const [mitarbeiter, setMitarbeiter] = useState([]);
  const [kinder, setKinder] = useState([]);
  const [loading, setLoading] = useState(true);
  const [kindForm, setKindForm] = useState({ kuerzel: "", schule: "", klasse: "", begleiter_id: "" });
  const [showKindForm, setShowKindForm] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => { ladeDaten(); }, []);

  async function ladeDaten() {
    setLoading(true);
    const { data: ma } = await supabase.from("profiles").select("*");
    const { data: ki } = await supabase.from("kinder").select("*");
    setMitarbeiter(ma || []);
    setKinder(ki || []);
    setLoading(false);
  }

  async function kindSpeichern() {
    if (!kindForm.kuerzel || !kindForm.schule) return;
    const { error } = await supabase.from("kinder").insert([kindForm]);
    if (!error) { setMsg("✅ Kind gespeichert!"); setKindForm({ kuerzel: "", schule: "", klasse: "", begleiter_id: "" }); setShowKindForm(false); ladeDaten(); }
    else setMsg("❌ " + error.message);
  }

  if (loading) return <Spinner />;

  return (
    <div>
      <h2 style={{ margin: "0 0 20px", fontSize: 22, fontWeight: 700 }}>⚙️ Admin-Bereich</h2>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {["mitarbeiter", "kinder", "ferien"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600, background: tab === t ? COLORS.primary : COLORS.neutral100, color: tab === t ? "#fff" : COLORS.neutral700 }}>
            {t === "mitarbeiter" ? "👤 Mitarbeiter" : t === "kinder" ? "🧒 Kinder" : "🏖 Ferien"}
          </button>
        ))}
      </div>
      {msg && <div style={{ padding: "10px 14px", borderRadius: 8, background: msg.startsWith("✅") ? COLORS.successLight : COLORS.dangerLight, color: msg.startsWith("✅") ? COLORS.success : COLORS.danger, marginBottom: 16, fontSize: 13 }}>{msg}</div>}

      {tab === "mitarbeiter" && (
        <Card>
          <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700 }}>Mitarbeiter ({mitarbeiter.length})</h3>
          <p style={{ fontSize: 13, color: COLORS.neutral500, marginBottom: 16 }}>Mitarbeiter müssen sich zuerst selbst registrieren. Danach erscheinen sie hier.</p>
          {mitarbeiter.length === 0 && <p style={{ color: COLORS.neutral500, textAlign: "center", padding: "20px 0" }}>Noch keine Mitarbeiter registriert</p>}
          {mitarbeiter.map(m => (
            <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: COLORS.neutral50, borderRadius: 10, marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: 36, background: COLORS.primary + "20", color: COLORS.primary, fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {(m.name || m.email || "?").slice(0, 2).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{m.name || "Kein Name"}</div>
                <div style={{ fontSize: 12, color: COLORS.neutral500 }}>{m.email}</div>
              </div>
              <Badge color={m.role === "admin" ? COLORS.accent : COLORS.primary}>{m.role || "begleiter"}</Badge>
            </div>
          ))}
        </Card>
      )}

      {tab === "kinder" && (
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Kinder ({kinder.length})</h3>
            <Btn small onClick={() => setShowKindForm(s => !s)} style={{ display: "flex", alignItems: "center", gap: 6 }}>{Icon.plus} Anlegen</Btn>
          </div>
          {showKindForm && (
            <div style={{ padding: 16, background: COLORS.neutral50, borderRadius: 10, marginBottom: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
                <Input label="Kürzel (z.B. K005)" value={kindForm.kuerzel} onChange={v => setKindForm(f => ({ ...f, kuerzel: v }))} />
                <Input label="Klasse" value={kindForm.klasse} onChange={v => setKindForm(f => ({ ...f, klasse: v }))} />
                <div style={{ gridColumn: "1/-1" }}><Input label="Schule / Einrichtung" value={kindForm.schule} onChange={v => setKindForm(f => ({ ...f, schule: v }))} /></div>
                <div style={{ gridColumn: "1/-1" }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.neutral700, display: "block", marginBottom: 4 }}>Begleiter/in</label>
                  <select value={kindForm.begleiter_id} onChange={e => setKindForm(f => ({ ...f, begleiter_id: e.target.value }))}
                    style={{ width: "100%", padding: "8px 11px", borderRadius: 7, border: `1.5px solid ${COLORS.neutral300}`, fontSize: 14, marginBottom: 12 }}>
                    <option value="">– wählen –</option>
                    {mitarbeiter.map(m => <option key={m.id} value={m.id}>{m.name || m.email}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <Btn onClick={kindSpeichern} disabled={!kindForm.kuerzel || !kindForm.schule}>Speichern</Btn>
                <Btn variant="secondary" onClick={() => setShowKindForm(false)}>Abbrechen</Btn>
              </div>
            </div>
          )}
          {kinder.map(k => {
            const begl = mitarbeiter.find(m => m.id === k.begleiter_id);
            return (
              <div key={k.id} style={{ display: "flex", gap: 12, alignItems: "center", padding: "10px 14px", background: COLORS.neutral50, borderRadius: 10, marginBottom: 8 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: COLORS.primaryLight, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: COLORS.primary, fontSize: 11 }}>{k.kuerzel}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{k.schule} · Kl. {k.klasse}</div>
                  <div style={{ fontSize: 12, color: COLORS.neutral500 }}>{begl ? begl.name || begl.email : "Kein Begleiter"}</div>
                </div>
              </div>
            );
          })}
        </Card>
      )}

      {tab === "ferien" && (
        <div>
          <Card style={{ marginBottom: 16 }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 16, fontWeight: 700 }}>🏖 Schulferien Bayern 2026</h3>
            {SCHULFERIEN_2026.map(f => (
              <div key={f.von} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${COLORS.neutral100}` }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{f.name}</span>
                <span style={{ fontSize: 13, color: COLORS.neutral500 }}>{new Date(f.von).toLocaleDateString("de-DE")} – {new Date(f.bis).toLocaleDateString("de-DE")}</span>
              </div>
            ))}
          </Card>
          <Card>
            <h3 style={{ margin: "0 0 14px", fontSize: 16, fontWeight: 700 }}>🎉 Feiertage Bayern 2026</h3>
            {FEIERTAGE_2026.map(f => (
              <div key={f.datum} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${COLORS.neutral100}` }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{f.name}</span>
                <span style={{ fontSize: 13, color: COLORS.neutral500 }}>{new Date(f.datum).toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit" })}</span>
              </div>
            ))}
          </Card>
        </div>
      )}
    </div>
  );
}

function Betreuungsnachweis({ user }) {
  const jetzt = new Date();
  const [jahr, setJahr] = useState(jetzt.getFullYear());
  const [monat, setMonat] = useState(jetzt.getMonth() + 1);
  const [kindId, setKindId] = useState("");
  const [kinder, setKinder] = useState([]);
  const [eintraege, setEintraege] = useState([]);
  const [budget, setBudget] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [druckModus, setDruckModus] = useState(false);

  useEffect(() => { ladeKinder(); }, []);
  useEffect(() => { if (kindId) { ladeEintraege(); ladeBudget(); } }, [kindId, jahr, monat]);

  async function ladeKinder() {
    const { data } = await supabase.from("kinder").select("*").eq("begleiter_id", user.id);
    setKinder(data || []);
    if (data && data.length > 0) setKindId(data[0].id);
    setLoading(false);
  }

  async function ladeEintraege() {
    const von = `${jahr}-${String(monat).padStart(2, "0")}-01`;
    const bis = `${jahr}-${String(monat).padStart(2, "0")}-31`;
    const { data } = await supabase.from("zeiteintraege").select("*").eq("user_id", user.id).eq("kind_id", kindId).gte("datum", von).lte("datum", bis);
    setEintraege(data || []);
  }

  async function ladeBudget() {
    const { data } = await supabase.from("budgets").select("*").eq("user_id", user.id).eq("kind_id", kindId).eq("jahr", jahr).eq("monat", monat).single();
    setBudget(data?.geplante_stunden || 0);
  }

  async function updateBudget(val) {
    const v = parseFloat(val) || 0;
    setBudget(v);
    await supabase.from("budgets").upsert({ user_id: user.id, kind_id: kindId, jahr, monat, geplante_stunden: v }, { onConflict: "user_id,kind_id,jahr,monat" });
  }

  async function updateEintrag(datum, feld, wert) {
    setSaving(true);
    const existing = eintraege.find(e => e.datum === datum);
    if (existing) {
      await supabase.from("zeiteintraege").update({ [feld]: wert || null }).eq("id", existing.id);
    } else {
      await supabase.from("zeiteintraege").insert([{ user_id: user.id, kind_id: kindId, datum, [feld]: wert || null }]);
    }
    await ladeEintraege();
    setSaving(false);
  }

  const tage = monatsTage(jahr, monat);
  const monatEintraege = tage.map(datum => eintraege.find(e => e.datum === datum) || { datum });
  const stundenProTag = monatEintraege.map(e => stunden(e.von, e.bis, e.pause || 0));
  const gesamtStunden = stundenProTag.reduce((s, h) => s + h, 0);
  const ueberschritten = budget > 0 && gesamtStunden > budget;
  const auslastung = budget > 0 ? (gesamtStunden / budget) * 100 : 0;
  const kind = kinder.find(k => k.id === kindId);
  const tdBase = { padding: "4px 6px", fontSize: 13, borderBottom: `1px solid ${COLORS.neutral100}`, verticalAlign: "middle" };
  const thBase = { padding: "7px 6px", fontSize: 11, fontWeight: 700, color: COLORS.neutral500, borderBottom: `2px solid ${COLORS.neutral300}`, background: COLORS.neutral50, textAlign: "left" };

  if (loading) return <Spinner />;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Betreuungsnachweis {saving && <span style={{ fontSize: 13, color: COLORS.neutral500 }}>💾...</span>}</h2>
        <Btn variant="secondary" small onClick={() => setDruckModus(d => !d)}>🖨 {druckModus ? "Bearbeiten" : "Druckansicht"}</Btn>
      </div>
      <Card style={{ marginBottom: 16, padding: "14px 18px" }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.neutral700, display: "block", marginBottom: 4 }}>Kind</label>
            <select value={kindId} onChange={e => setKindId(e.target.value)} style={{ padding: "7px 11px", borderRadius: 7, border: `1.5px solid ${COLORS.neutral300}`, fontSize: 14 }}>
              {kinder.map(k => <option key={k.id} value={k.id}>{k.kuerzel} – {k.schule}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.neutral700, display: "block", marginBottom: 4 }}>Monat</label>
            <select value={monat} onChange={e => setMonat(Number(e.target.value))} style={{ padding: "7px 11px", borderRadius: 7, border: `1.5px solid ${COLORS.neutral300}`, fontSize: 14 }}>
              {MONATE.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.neutral700, display: "block", marginBottom: 4 }}>Jahr</label>
            <select value={jahr} onChange={e => setJahr(Number(e.target.value))} style={{ padding: "7px 11px", borderRadius: 7, border: `1.5px solid ${COLORS.neutral300}`, fontSize: 14 }}>
              {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.neutral700, display: "block", marginBottom: 4 }}>Geplante Stunden</label>
            <input type="number" value={budget} onChange={e => updateBudget(e.target.value)} min={0} step={0.25}
              style={{ padding: "7px 11px", borderRadius: 7, border: `1.5px solid ${ueberschritten ? COLORS.danger : COLORS.neutral300}`, fontSize: 14, width: 110 }} />
          </div>
        </div>
      </Card>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, marginBottom: 14 }}>
        {[
          { label: "Geplant", value: fmtHDez(budget), color: COLORS.primary, bg: COLORS.primaryLight },
          { label: "Erfasst", value: fmtHDez(gesamtStunden), color: ueberschritten ? COLORS.danger : COLORS.success, bg: ueberschritten ? COLORS.dangerLight : COLORS.successLight },
          { label: "Verbleibend", value: fmtHDez(Math.max(0, budget - gesamtStunden)), color: COLORS.warning, bg: COLORS.warningLight },
          { label: "Auslastung", value: budget > 0 ? auslastung.toFixed(0) + "%" : "–", color: ueberschritten ? COLORS.danger : COLORS.neutral700, bg: COLORS.neutral100 },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: 12, padding: "12px 14px" }}>
            <div style={{ fontSize: 19, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: COLORS.neutral500, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>
      {budget > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ height: 8, background: COLORS.neutral100, borderRadius: 10, overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: 10, width: Math.min(auslastung, 100) + "%", background: ueberschritten ? COLORS.danger : auslastung > 85 ? COLORS.warning : COLORS.success }} />
          </div>
          {ueberschritten && <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, padding: "9px 13px", background: COLORS.dangerLight, borderRadius: 8, color: COLORS.danger, fontSize: 13, fontWeight: 600 }}>{Icon.warn} Budget überschritten! +{fmtHDez(gesamtStunden - budget)}</div>}
        </div>
      )}
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", background: COLORS.primaryLight, borderBottom: `2px solid ${COLORS.neutral100}` }}>
          <h3 style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 800, color: COLORS.primaryDark, textAlign: "center" }}>Betreuungsnachweis</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 20px", fontSize: 13 }}>
            <div><span style={{ color: COLORS.neutral500 }}>Betreuer/in: </span><strong>{user.email}</strong></div>
            <div><span style={{ color: COLORS.neutral500 }}>Monat/Jahr: </span><strong>{MONATE[monat - 1]} {jahr}</strong></div>
            <div><span style={{ color: COLORS.neutral500 }}>Kind: </span><strong>{kind?.kuerzel}</strong></div>
            <div><span style={{ color: COLORS.neutral500 }}>Einrichtung: </span><strong>{kind?.schule}</strong></div>
          </div>
        </div>
        <div style={{ padding: "6px 14px", background: COLORS.neutral50, display: "flex", gap: 14, fontSize: 11, borderBottom: `1px solid ${COLORS.neutral100}`, flexWrap: "wrap" }}>
          <span style={{ color: COLORS.ferien }}>🟣 Schulferien</span>
          <span style={{ color: COLORS.accent }}>🟡 Feiertag</span>
          <span style={{ color: COLORS.neutral400 }}>⬛ Wochenende</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 680 }}>
            <thead>
              <tr>
                <th style={{ ...thBase, width: 32 }}>Tag</th>
                <th style={{ ...thBase, width: 85 }}>Datum</th>
                <th style={{ ...thBase }}>Info</th>
                <th style={{ ...thBase, width: 75 }}>Von</th>
                <th style={{ ...thBase, width: 75 }}>Bis</th>
                <th style={{ ...thBase, width: 55 }}>Pause</th>
                <th style={{ ...thBase, width: 65, color: COLORS.primary }}>Std.</th>
                <th style={{ ...thBase, width: 75, color: COLORS.warning }}>FZ Von</th>
                <th style={{ ...thBase, width: 75, color: COLORS.warning }}>FZ Bis</th>
                <th style={{ ...thBase, color: COLORS.warning }}>Grund</th>
              </tr>
            </thead>
            <tbody>
              {monatEintraege.map((e, i) => {
                const tagInfo = getTagInfo(e.datum);
                const h = stundenProTag[i];
                const hatEintrag = e.von && e.bis;
                let rowBg = COLORS.white;
                if (tagInfo.typ === "ferien") rowBg = COLORS.ferienLight;
                else if (tagInfo.typ === "feiertag") rowBg = COLORS.accentLight;
                else if (tagInfo.typ === "wochenende") rowBg = COLORS.neutral50;
                return (
                  <tr key={e.datum} style={{ background: rowBg }}>
                    <td style={{ ...tdBase, fontWeight: 700, fontSize: 11, color: COLORS.neutral500 }}>{wt(e.datum)}</td>
                    <td style={{ ...tdBase, fontSize: 12 }}>{formatDatum(e.datum)}</td>
                    <td style={{ ...tdBase, fontSize: 11, color: tagInfo.typ === "feiertag" ? COLORS.accent : tagInfo.typ === "ferien" ? COLORS.ferien : COLORS.neutral300 }}>{tagInfo.grund || ""}</td>
                    <td style={{ ...tdBase, padding: "2px 4px" }}>
                      {druckModus || tagInfo.frei ? <span style={{ fontSize: 12, opacity: tagInfo.frei ? 0.4 : 1 }}>{e.von || "–"}</span> :
                        <input type="time" value={e.von || ""} onChange={ev => updateEintrag(e.datum, "von", ev.target.value)} style={{ width: "100%", padding: "3px 5px", borderRadius: 5, border: `1.5px solid ${COLORS.neutral300}`, fontSize: 12 }} />}
                    </td>
                    <td style={{ ...tdBase, padding: "2px 4px" }}>
                      {druckModus || tagInfo.frei ? <span style={{ fontSize: 12, opacity: tagInfo.frei ? 0.4 : 1 }}>{e.bis || "–"}</span> :
                        <input type="time" value={e.bis || ""} onChange={ev => updateEintrag(e.datum, "bis", ev.target.value)} style={{ width: "100%", padding: "3px 5px", borderRadius: 5, border: `1.5px solid ${COLORS.neutral300}`, fontSize: 12 }} />}
                    </td>
                    <td style={{ ...tdBase, padding: "2px 4px" }}>
                      {druckModus || tagInfo.frei ? <span style={{ fontSize: 12, opacity: tagInfo.frei ? 0.4 : 1 }}>{e.pause ? e.pause + "'" : "–"}</span> :
                        <input type="number" min={0} step={5} value={e.pause || ""} onChange={ev => updateEintrag(e.datum, "pause", Number(ev.target.value))} placeholder="0" style={{ width: "100%", padding: "3px 5px", borderRadius: 5, border: `1.5px solid ${COLORS.neutral300}`, fontSize: 12 }} />}
                    </td>
                    <td style={{ ...tdBase, fontWeight: 700, color: hatEintrag ? COLORS.primary : COLORS.neutral300 }}>{hatEintrag ? h.toFixed(2) : "–"}</td>
                    <td style={{ ...tdBase, padding: "2px 4px" }}>
                      {druckModus || tagInfo.frei ? <span style={{ fontSize: 11, opacity: 0.4 }}>{e.fehl_von || "–"}</span> :
                        <input type="time" value={e.fehl_von || ""} onChange={ev => updateEintrag(e.datum, "fehl_von", ev.target.value)} style={{ width: "100%", padding: "3px 5px", borderRadius: 5, border: `1.5px solid ${COLORS.neutral300}`, fontSize: 11 }} />}
                    </td>
                    <td style={{ ...tdBase, padding: "2px 4px" }}>
                      {druckModus || tagInfo.frei ? <span style={{ fontSize: 11, opacity: 0.4 }}>{e.fehl_bis || "–"}</span> :
                        <input type="time" value={e.fehl_bis || ""} onChange={ev => updateEintrag(e.datum, "fehl_bis", ev.target.value)} style={{ width: "100%", padding: "3px 5px", borderRadius: 5, border: `1.5px solid ${COLORS.neutral300}`, fontSize: 11 }} />}
                    </td>
                    <td style={{ ...tdBase, padding: "2px 4px" }}>
                      {druckModus || tagInfo.frei ? <span style={{ fontSize: 11, opacity: 0.4 }}>{e.fehl_grund || ""}</span> :
                        <input type="text" value={e.fehl_grund || ""} onChange={ev => updateEintrag(e.datum, "fehl_grund", ev.target.value)} placeholder="Grund..." style={{ width: "100%", padding: "3px 5px", borderRadius: 5, border: `1.5px solid ${COLORS.neutral300}`, fontSize: 11 }} />}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: COLORS.primaryLight }}>
                <td colSpan={4} style={{ ...tdBase, fontWeight: 700, borderTop: `2px solid ${COLORS.primary}30` }}>Geplant: <strong>{fmtHDez(budget)}</strong></td>
                <td colSpan={2} style={{ ...tdBase, fontWeight: 700, borderTop: `2px solid ${COLORS.primary}30` }}>Gesamt:</td>
                <td style={{ ...tdBase, fontWeight: 800, fontSize: 14, color: ueberschritten ? COLORS.danger : COLORS.success, borderTop: `2px solid ${COLORS.primary}30` }}>{fmtHDez(gesamtStunden)}</td>
                <td colSpan={3} style={{ ...tdBase, fontSize: 12, color: ueberschritten ? COLORS.danger : COLORS.neutral500, borderTop: `2px solid ${COLORS.primary}30` }}>
                  {ueberschritten ? `⚠️ +${fmtHDez(gesamtStunden - budget)} über Budget` : `✓ Noch ${fmtHDez(budget - gesamtStunden)} verfügbar`}
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

function Dashboard({ user, isAdmin, onNavigate }) {
  const [kinder, setKinder] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.from("kinder").select("*").eq("begleiter_id", user.id).then(({ data }) => { setKinder(data || []); setLoading(false); });
  }, []);
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800 }}>Guten Tag 👋</h2>
        <p style={{ margin: 0, color: COLORS.neutral500, fontSize: 14 }}>{new Date().toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
      </div>
      {isAdmin && (
        <Card style={{ marginBottom: 16, background: COLORS.accentLight, border: `1.5px solid ${COLORS.accent}40` }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <span style={{ fontSize: 24 }}>⚙️</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700 }}>Admin-Bereich</div>
              <div style={{ fontSize: 13, color: COLORS.neutral600 }}>Mitarbeiter, Kinder & Budgets verwalten</div>
            </div>
            <Btn small variant="ghost" onClick={() => onNavigate("admin")}>Öffnen →</Btn>
          </div>
        </Card>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 20 }}>
        <Card style={{ padding: "16px 18px" }}><div style={{ fontSize: 24 }}>🧒</div><div style={{ fontSize: 26, fontWeight: 800, color: COLORS.primary, marginTop: 6 }}>{loading ? "..." : kinder.length}</div><div style={{ fontSize: 12, color: COLORS.neutral500 }}>Betreute Kinder</div></Card>
        <Card style={{ padding: "16px 18px" }}><div style={{ fontSize: 24 }}>📋</div><div style={{ fontSize: 26, fontWeight: 800, color: COLORS.success, marginTop: 6 }}>{kinder.length}</div><div style={{ fontSize: 12, color: COLORS.neutral500 }}>Nachweise</div></Card>
      </div>
      {!loading && kinder.length === 0 && (
        <Card style={{ background: COLORS.primaryLight, border: `1.5px solid ${COLORS.primary}30` }}>
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🤝</div>
            <div style={{ fontWeight: 700, color: COLORS.primary }}>Willkommen bei BegleitApp!</div>
            <div style={{ fontSize: 13, color: COLORS.neutral500, marginTop: 4 }}>{isAdmin ? "Lege im Admin-Bereich Kinder und Mitarbeiter an." : "Der Admin weist dir bald Kinder zu."}</div>
          </div>
        </Card>
      )}
      {kinder.length > 0 && (
        <Card>
          <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700 }}>Meine Kinder</h3>
          {kinder.map(k => (
            <div key={k.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: `1px solid ${COLORS.neutral100}` }}>
              <div><span style={{ fontWeight: 700 }}>{k.kuerzel}</span><span style={{ fontSize: 13, color: COLORS.neutral500, marginLeft: 10 }}>{k.schule} · Kl. {k.klasse}</span></div>
              <Btn variant="ghost" small onClick={() => onNavigate("nachweis")}>Nachweis →</Btn>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState("dashboard");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setUser(session?.user || null); setLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => { setUser(session?.user || null); });
    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><Spinner /></div>;
  if (!user) return <LoginScreen onLogin={setUser} />;

  const isAdmin = user.email === ADMIN_EMAIL;
  const NAV = [
    { id: "dashboard", label: "Übersicht", icon: Icon.dashboard },
    { id: "nachweis", label: "Nachweis", icon: Icon.nachweis },
    ...(isAdmin ? [{ id: "admin", label: "Admin", icon: Icon.team }] : []),
  ];
  const pages = {
    dashboard: <Dashboard user={user} isAdmin={isAdmin} onNavigate={setPage} />,
    nachweis: <Betreuungsnachweis user={user} />,
    admin: isAdmin ? <AdminBereich /> : null,
  };

  return (
    <div style={{ minHeight: "100vh", background: COLORS.neutral50, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ position: "sticky", top: 0, zIndex: 100, background: COLORS.white, borderBottom: `1px solid ${COLORS.neutral100}`, padding: "0 20px", height: 58, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>🤝</span>
          <span style={{ fontWeight: 800, fontSize: 17, color: COLORS.neutral900 }}>BegleitApp</span>
          {isAdmin && <Badge color={COLORS.accent}>Admin</Badge>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 12, color: COLORS.neutral500 }}>{user.email}</span>
          <button onClick={() => supabase.auth.signOut()} style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.neutral500, display: "flex" }}>{Icon.logout}</button>
        </div>
      </div>
      <div style={{ display: "flex", maxWidth: 1180, margin: "0 auto" }}>
        <aside style={{ width: 200, flexShrink: 0, padding: "20px 10px", position: "sticky", top: 58, height: "calc(100vh - 58px)", display: "flex", flexDirection: "column", gap: 3 }}>
          {NAV.map(n => (
            <button key={n.id} onClick={() => setPage(n.id)} style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 14px", borderRadius: 9, border: "none", cursor: "pointer", width: "100%", textAlign: "left", background: page === n.id ? COLORS.primaryLight : "transparent", color: page === n.id ? COLORS.primary : COLORS.neutral700, fontWeight: page === n.id ? 700 : 500, fontSize: 14 }}>
              <span style={{ opacity: page === n.id ? 1 : 0.55 }}>{n.icon}</span>{n.label}
            </button>
          ))}
          <div style={{ marginTop: "auto", padding: "14px 14px 6px", fontSize: 11, color: COLORS.neutral300, lineHeight: 1.8 }}>🔒 DSGVO-konform<br/>🇩🇪 Daten in Europa<br/>Pseudonymisiert</div>
        </aside>
        <main style={{ flex: l
      1, padding: "26px 18px 60px", minWidth: 0 }}>{pages[page]}</main>
      </div>
    </div>
  );
}

  
}
