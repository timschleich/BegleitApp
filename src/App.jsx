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
function formatDatum(datum) { return new Date(datum).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" }); }

function Card({ children, style }) {
  return <div style={{ background: COLORS.white, borderRadius: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.04)", padding: "16px", ...style }}>{children}</div>;
}
function Btn({ children, onClick, variant = "primary", small, disabled, style }) {
  const s = {
    primary: { background: COLORS.primary, color: "#fff", border: "none" },
    secondary: { background: COLORS.neutral100, color: COLORS.neutral700, border: "none" },
    danger: { background: COLORS.dangerLight, color: COLORS.danger, border: "none" },
    success: { background: COLORS.successLight, color: COLORS.success, border: "none" },
    ghost: { background: "transparent", color: COLORS.primary, border: `1.5px solid ${COLORS.primary}` },
  };
  return <button onClick={onClick} disabled={disabled} style={{ ...s[variant], borderRadius: 10, cursor: disabled ? "not-allowed" : "pointer", padding: small ? "6px 14px" : "11px 20px", fontSize: small ? 13 : 15, fontWeight: 600, opacity: disabled ? 0.5 : 1, ...style }}>{children}</button>;
}
function Input({ label, value, onChange, type = "text", placeholder }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: COLORS.neutral700, marginBottom: 5 }}>{label}</label>}
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${COLORS.neutral300}`, fontSize: 15, boxSizing: "border-box", WebkitAppearance: "none" }} />
    </div>
  );
}
function Badge({ color = COLORS.primary, bg, children }) {
  return <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, color, background: bg || color + "18" }}>{children}</span>;
}
function Spinner() {
  return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 60 }}>
    <div style={{ width: 36, height: 36, border: `3px solid ${COLORS.neutral100}`, borderTop: `3px solid ${COLORS.primary}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
  </div>;
}

// ── LOGIN ────────────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("login");

  async function handleAuth() {
    setLoading(true); setErr("");
    if (mode === "login") {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: pw });
      if (error) { setErr("E-Mail oder Passwort falsch."); setLoading(false); return; }
      onLogin(data.user);
    } else {
      const { error } = await supabase.auth.signUp({ email, password: pw });
      if (error) { setErr(error.message); setLoading(false); return; }
      setErr("✅ Registrierung erfolgreich! Bitte anmelden.");
      setMode("login");
    }
    setLoading(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(160deg, ${COLORS.primaryDark} 0%, ${COLORS.primary} 50%, #3D8FA8 100%)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', system-ui, sans-serif", padding: "20px" }}>
      <div style={{ marginBottom: 36, textAlign: "center" }}>
        <div style={{ fontSize: 52, marginBottom: 10 }}>🤝</div>
        <div style={{ color: "#fff", fontWeight: 800, fontSize: 28, letterSpacing: -0.5 }}>BegleitApp</div>
        <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 15, marginTop: 4 }}>Schulbegleitung & Individual</div>
      </div>
      <div style={{ width: "100%", maxWidth: 380, background: COLORS.white, borderRadius: 20, padding: "28px 24px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <h2 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 700 }}>{mode === "login" ? "Anmelden" : "Registrieren"}</h2>
        <p style={{ margin: "0 0 24px", fontSize: 14, color: COLORS.neutral500 }}>DSGVO-konform · Daten in Europa</p>
        <Input label="E-Mail" value={email} onChange={setEmail} type="email" placeholder="name@email.de" />
        <Input label="Passwort" value={pw} onChange={setPw} type="password" placeholder="Mindestens 6 Zeichen" />
        {err && <div style={{ background: err.startsWith("✅") ? COLORS.successLight : COLORS.dangerLight, color: err.startsWith("✅") ? COLORS.success : COLORS.danger, borderRadius: 10, padding: "11px 14px", fontSize: 14, marginBottom: 14 }}>{err}</div>}
        <Btn onClick={handleAuth} disabled={loading} style={{ width: "100%", marginBottom: 14, fontSize: 16 }}>
          {loading ? "Bitte warten..." : mode === "login" ? "Anmelden" : "Registrieren"}
        </Btn>
        <button onClick={() => setMode(m => m === "login" ? "register" : "login")} style={{ background: "none", border: "none", color: COLORS.primary, fontSize: 14, cursor: "pointer", width: "100%", textAlign: "center", padding: "4px" }}>
          {mode === "login" ? "Noch kein Account? Registrieren" : "Bereits registriert? Anmelden"}
        </button>
      </div>
    </div>
  );
}

// ── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ user, isAdmin, onNavigate }) {
  const [kinder, setKinder] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.from("kinder").select("*").eq("begleiter_id", user.id).then(({ data }) => { setKinder(data || []); setLoading(false); });
  }, []);
  const heute = new Date().toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" });
  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: "0 0 4px", fontSize: 26, fontWeight: 800, color: COLORS.neutral900 }}>Guten Tag 👋</h1>
        <p style={{ margin: 0, color: COLORS.neutral500, fontSize: 15 }}>{heute}</p>
      </div>
      {isAdmin && (
        <Card style={{ marginBottom: 14, background: COLORS.accentLight, border: `1.5px solid ${COLORS.accent}50` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: 32 }}>⚙️</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>Admin-Bereich</div>
              <div style={{ fontSize: 13, color: COLORS.neutral600, marginTop: 2 }}>Mitarbeiter, Kinder & Budgets</div>
            </div>
            <Btn small variant="ghost" onClick={() => onNavigate("admin")}>Öffnen →</Btn>
          </div>
        </Card>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
        <Card style={{ textAlign: "center", padding: "20px 14px" }}>
          <div style={{ fontSize: 32 }}>🧒</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: COLORS.primary, margin: "8px 0 4px" }}>{loading ? "..." : kinder.length}</div>
          <div style={{ fontSize: 13, color: COLORS.neutral500 }}>Betreute Kinder</div>
        </Card>
        <Card style={{ textAlign: "center", padding: "20px 14px" }}>
          <div style={{ fontSize: 32 }}>📋</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: COLORS.success, margin: "8px 0 4px" }}>{kinder.length}</div>
          <div style={{ fontSize: 13, color: COLORS.neutral500 }}>Nachweise</div>
        </Card>
      </div>
      {!loading && kinder.length === 0 && (
        <Card style={{ background: COLORS.primaryLight, border: `1.5px solid ${COLORS.primary}30`, textAlign: "center", padding: "28px 20px" }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>🤝</div>
          <div style={{ fontWeight: 700, color: COLORS.primary, fontSize: 17 }}>Willkommen!</div>
          <div style={{ fontSize: 14, color: COLORS.neutral500, marginTop: 6, lineHeight: 1.5 }}>
            {isAdmin ? "Lege im Admin-Bereich Kinder und Mitarbeiter an." : "Der Admin weist dir bald Kinder zu."}
          </div>
        </Card>
      )}
      {kinder.length > 0 && (
        <Card>
          <h3 style={{ margin: "0 0 14px", fontSize: 16, fontWeight: 700 }}>Meine Kinder</h3>
          {kinder.map(k => (
            <div key={k.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: `1px solid ${COLORS.neutral100}` }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{k.kuerzel}</div>
                <div style={{ fontSize: 13, color: COLORS.neutral500 }}>{k.schule} · Kl. {k.klasse}</div>
              </div>
              <Btn variant="ghost" small onClick={() => onNavigate("nachweis")}>Nachweis →</Btn>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

// ── BETREUUNGSNACHWEIS ───────────────────────────────────────────────────────
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

  if (loading) return <Spinner />;
  if (kinder.length === 0) return (
    <Card style={{ textAlign: "center", padding: 32 }}>
      <div style={{ fontSize: 44, marginBottom: 12 }}>📋</div>
      <div style={{ fontWeight: 700, fontSize: 17 }}>Keine Kinder zugewiesen</div>
      <div style={{ fontSize: 14, color: COLORS.neutral500, marginTop: 6 }}>Der Admin weist dir bald Kinder zu.</div>
    </Card>
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Nachweis {saving && <span style={{ fontSize: 13, color: COLORS.neutral500 }}>💾</span>}</h1>
      </div>

      {/* Filter Karte */}
      <Card style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: COLORS.neutral700, display: "block", marginBottom: 5 }}>Kind</label>
            <select value={kindId} onChange={e => setKindId(e.target.value)}
              style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: `1.5px solid ${COLORS.neutral300}`, fontSize: 15, WebkitAppearance: "none", background: COLORS.white }}>
              {kinder.map(k => <option key={k.id} value={k.id}>{k.kuerzel} – {k.schule}</option>)}
            </select>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: COLORS.neutral700, display: "block", marginBottom: 5 }}>Monat</label>
              <select value={monat} onChange={e => setMonat(Number(e.target.value))}
                style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: `1.5px solid ${COLORS.neutral300}`, fontSize: 15, WebkitAppearance: "none", background: COLORS.white }}>
                {MONATE.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: COLORS.neutral700, display: "block", marginBottom: 5 }}>Jahr</label>
              <select value={jahr} onChange={e => setJahr(Number(e.target.value))}
                style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: `1.5px solid ${COLORS.neutral300}`, fontSize: 15, WebkitAppearance: "none", background: COLORS.white }}>
                {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: COLORS.neutral700, display: "block", marginBottom: 5 }}>Geplante Stunden / Monat</label>
            <input type="number" value={budget} onChange={e => updateBudget(e.target.value)} min={0} step={0.25}
              style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: `1.5px solid ${ueberschritten ? COLORS.danger : COLORS.neutral300}`, fontSize: 15, boxSizing: "border-box" }} />
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
        <div style={{ background: COLORS.primaryLight, borderRadius: 12, padding: "14px" }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.primary }}>{fmtHDez(budget)}</div>
          <div style={{ fontSize: 12, color: COLORS.neutral500, marginTop: 2 }}>Geplant</div>
        </div>
        <div style={{ background: ueberschritten ? COLORS.dangerLight : COLORS.successLight, borderRadius: 12, padding: "14px" }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: ueberschritten ? COLORS.danger : COLORS.success }}>{fmtHDez(gesamtStunden)}</div>
          <div style={{ fontSize: 12, color: COLORS.neutral500, marginTop: 2 }}>Erfasst</div>
        </div>
        <div style={{ background: COLORS.warningLight, borderRadius: 12, padding: "14px" }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.warning }}>{fmtHDez(Math.max(0, budget - gesamtStunden))}</div>
          <div style={{ fontSize: 12, color: COLORS.neutral500, marginTop: 2 }}>Verbleibend</div>
        </div>
        <div style={{ background: COLORS.neutral100, borderRadius: 12, padding: "14px" }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: ueberschritten ? COLORS.danger : COLORS.neutral700 }}>{budget > 0 ? auslastung.toFixed(0) + "%" : "–"}</div>
          <div style={{ fontSize: 12, color: COLORS.neutral500, marginTop: 2 }}>Auslastung</div>
        </div>
      </div>

      {/* Fortschrittsbalken */}
      {budget > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ height: 10, background: COLORS.neutral100, borderRadius: 10, overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: 10, width: Math.min(auslastung, 100) + "%", background: ueberschritten ? COLORS.danger : auslastung > 85 ? COLORS.warning : COLORS.success, transition: "width 0.4s" }} />
          </div>
          {ueberschritten && (
            <div style={{ marginTop: 8, padding: "10px 14px", background: COLORS.dangerLight, borderRadius: 10, color: COLORS.danger, fontSize: 14, fontWeight: 600 }}>
              ⚠️ Budget überschritten! +{fmtHDez(gesamtStunden - budget)}
            </div>
          )}
        </div>
      )}

      {/* Tageseinträge als Cards */}
      <div style={{ marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Einträge – {MONATE[monat - 1]} {jahr}</h3>
        <div style={{ display: "flex", gap: 8, fontSize: 11 }}>
          <span style={{ color: COLORS.ferien }}>🟣 Ferien</span>
          <span style={{ color: COLORS.accent }}>🟡 Feiertag</span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {monatEintraege.map((e, i) => {
          const tagInfo = getTagInfo(e.datum);
          const h = stundenProTag[i];
          const hatEintrag = e.von && e.bis;
          if (tagInfo.typ === "wochenende") return null;

          let cardBg = COLORS.white;
          let borderColor = COLORS.neutral100;
          if (tagInfo.typ === "ferien") { cardBg = COLORS.ferienLight; borderColor = COLORS.ferien + "40"; }
          else if (tagInfo.typ === "feiertag") { cardBg = COLORS.accentLight; borderColor = COLORS.accent + "60"; }
          else if (hatEintrag) { borderColor = COLORS.success + "40"; }

          return (
            <div key={e.datum} style={{ background: cardBg, border: `1.5px solid ${borderColor}`, borderRadius: 12, padding: "12px 14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: tagInfo.frei ? 0 : 10 }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>{wt(e.datum)} {formatDatum(e.datum)}</span>
                  {tagInfo.frei && <span style={{ fontSize: 12, color: tagInfo.typ === "feiertag" ? COLORS.accent : tagInfo.typ === "ferien" ? COLORS.ferien : COLORS.neutral500, marginLeft: 8 }}>{tagInfo.grund}</span>}
                </div>
                {hatEintrag && <div style={{ fontWeight: 800, fontSize: 16, color: COLORS.primary }}>{h.toFixed(2)}h</div>}
              </div>

              {!tagInfo.frei && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 80px", gap: 8 }}>
                  <div>
                    <label style={{ fontSize: 11, color: COLORS.neutral500, display: "block", marginBottom: 3 }}>Von</label>
                    <input type="time" value={e.von || ""} onChange={ev => updateEintrag(e.datum, "von", ev.target.value)}
                      style={{ width: "100%", padding: "9px 10px", borderRadius: 8, border: `1.5px solid ${COLORS.neutral300}`, fontSize: 15, WebkitAppearance: "none" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: COLORS.neutral500, display: "block", marginBottom: 3 }}>Bis</label>
                    <input type="time" value={e.bis || ""} onChange={ev => updateEintrag(e.datum, "bis", ev.target.value)}
                      style={{ width: "100%", padding: "9px 10px", borderRadius: 8, border: `1.5px solid ${COLORS.neutral300}`, fontSize: 15, WebkitAppearance: "none" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: COLORS.neutral500, display: "block", marginBottom: 3 }}>Pause</label>
                    <input type="number" min={0} step={5} value={e.pause || ""} onChange={ev => updateEintrag(e.datum, "pause", Number(ev.target.value))} placeholder="0"
                      style={{ width: "100%", padding: "9px 8px", borderRadius: 8, border: `1.5px solid ${COLORS.neutral300}`, fontSize: 15 }} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summe */}
      <Card style={{ marginTop: 14, background: COLORS.primaryLight, border: `1.5px solid ${COLORS.primary}30` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 13, color: COLORS.neutral500 }}>Gesamt {MONATE[monat - 1]}</div>
            <div style={{ fontSize: 13, color: COLORS.neutral500 }}>Geplant: {fmtHDez(budget)}</div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: ueberschritten ? COLORS.danger : COLORS.primary }}>{fmtHDez(gesamtStunden)}</div>
        </div>
      </Card>

      {/* Unterschriften */}
      <Card style={{ marginTop: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <div><div style={{ borderTop: `1.5px solid ${COLORS.neutral700}`, marginTop: 44, paddingTop: 6 }}><span style={{ fontSize: 11, color: COLORS.neutral500 }}>Unterschrift Betreuer/in</span></div></div>
          <div><div style={{ borderTop: `1.5px solid ${COLORS.neutral700}`, marginTop: 44, paddingTop: 6 }}><span style={{ fontSize: 11, color: COLORS.neutral500 }}>Stempel Einrichtung</span></div></div>
        </div>
      </Card>
    </div>
  );
}

// ── ADMIN ─────────────────────────────────────────────────────────────────────
function AdminBereich() {
  const [tab, setTab] = useState("kinder");
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
    setTimeout(() => setMsg(""), 3000);
  }

  if (loading) return <Spinner />;

  return (
    <div>
      <h1 style={{ margin: "0 0 20px", fontSize: 22, fontWeight: 800 }}>⚙️ Admin</h1>

      {/* Tab Bar */}
      <div style={{ display: "flex", background: COLORS.neutral100, borderRadius: 12, padding: 4, marginBottom: 20 }}>
        {[["kinder", "🧒 Kinder"], ["mitarbeiter", "👤 Team"], ["ferien", "🏖 Ferien"]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            flex: 1, padding: "10px 8px", borderRadius: 9, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
            background: tab === id ? COLORS.white : "transparent",
            color: tab === id ? COLORS.primary : COLORS.neutral500,
            boxShadow: tab === id ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
          }}>{label}</button>
        ))}
      </div>

      {msg && <div style={{ padding: "12px 16px", borderRadius: 10, background: msg.startsWith("✅") ? COLORS.successLight : COLORS.dangerLight, color: msg.startsWith("✅") ? COLORS.success : COLORS.danger, marginBottom: 16, fontSize: 14 }}>{msg}</div>}

      {/* Kinder */}
      {tab === "kinder" && (
        <div>
          <Btn onClick={() => setShowKindForm(s => !s)} style={{ width: "100%", marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            + Kind anlegen
          </Btn>
          {showKindForm && (
            <Card style={{ marginBottom: 14 }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700 }}>Neues Kind</h3>
              <Input label="Kürzel (z.B. K001)" value={kindForm.kuerzel} onChange={v => setKindForm(f => ({ ...f, kuerzel: v }))} />
              <Input label="Schule / Einrichtung" value={kindForm.schule} onChange={v => setKindForm(f => ({ ...f, schule: v }))} />
              <Input label="Klasse" value={kindForm.klasse} onChange={v => setKindForm(f => ({ ...f, klasse: v }))} />
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: COLORS.neutral700, display: "block", marginBottom: 5 }}>Begleiter/in</label>
                <select value={kindForm.begleiter_id} onChange={e => setKindForm(f => ({ ...f, begleiter_id: e.target.value }))}
                  style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: `1.5px solid ${COLORS.neutral300}`, fontSize: 15, WebkitAppearance: "none", background: COLORS.white }}>
                  <option value="">– wählen –</option>
                  {mitarbeiter.map(m => <option key={m.id} value={m.id}>{m.name || m.email}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <Btn onClick={kindSpeichern} disabled={!kindForm.kuerzel || !kindForm.schule} style={{ flex: 1 }}>Speichern</Btn>
                <Btn variant="secondary" onClick={() => setShowKindForm(false)} style={{ flex: 1 }}>Abbrechen</Btn>
              </div>
            </Card>
          )}
          {kinder.length === 0 && <p style={{ color: COLORS.neutral500, textAlign: "center", padding: "32px 0" }}>Noch keine Kinder angelegt</p>}
          {kinder.map(k => {
            const begl = mitarbeiter.find(m => m.id === k.begleiter_id);
            return (
              <Card key={k.id} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: COLORS.primaryLight, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: COLORS.primary, fontSize: 12 }}>{k.kuerzel}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{k.schule}</div>
                    <div style={{ fontSize: 13, color: COLORS.neutral500 }}>Kl. {k.klasse} · {begl ? begl.name || begl.email : "Kein Begleiter"}</div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Mitarbeiter */}
      {tab === "mitarbeiter" && (
        <div>
          <Card style={{ marginBottom: 14, background: COLORS.primaryLight, border: `1.5px solid ${COLORS.primary}30` }}>
            <div style={{ fontSize: 14, color: COLORS.primary, lineHeight: 1.6 }}>
              💡 Mitarbeiter registrieren sich unter <strong>begleit-app.vercel.app</strong> selbst. Danach erscheinen sie hier.
            </div>
          </Card>
          {mitarbeiter.length === 0 && <p style={{ color: COLORS.neutral500, textAlign: "center", padding: "32px 0" }}>Noch keine Mitarbeiter registriert</p>}
          {mitarbeiter.map(m => (
            <Card key={m.id} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 44, background: COLORS.primary + "20", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: COLORS.primary, fontSize: 16 }}>
                  {(m.name || m.email || "?").slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{m.name || "Kein Name"}</div>
                  <div style={{ fontSize: 13, color: COLORS.neutral500 }}>{m.email}</div>
                </div>
                <Badge color={m.role === "admin" ? COLORS.accent : COLORS.primary}>{m.role || "begleiter"}</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Ferien */}
      {tab === "ferien" && (
        <div>
          <Card style={{ marginBottom: 14 }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 16, fontWeight: 700 }}>🏖 Schulferien Bayern 2026</h3>
            {SCHULFERIEN_2026.map(f => (
              <div key={f.von} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${COLORS.neutral100}` }}>
                <span style={{ fontWeight: 600, fontSize: 15 }}>{f.name}</span>
                <span style={{ fontSize: 13, color: COLORS.neutral500 }}>{new Date(f.von).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })} – {new Date(f.bis).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })}</span>
              </div>
            ))}
          </Card>
          <Card>
            <h3 style={{ margin: "0 0 14px", fontSize: 16, fontWeight: 700 }}>🎉 Feiertage Bayern 2026</h3>
            {FEIERTAGE_2026.map(f => (
              <div key={f.datum} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${COLORS.neutral100}` }}>
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

// ── HAUPT APP ─────────────────────────────────────────────────────────────────
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
    { id: "dashboard", label: "Start", icon: "🏠" },
    { id: "nachweis", label: "Nachweis", icon: "📋" },
    ...(isAdmin ? [{ id: "admin", label: "Admin", icon: "⚙️" }] : []),
  ];

  const pages = {
    dashboard: <Dashboard user={user} isAdmin={isAdmin} onNavigate={setPage} />,
    nachweis: <Betreuungsnachweis user={user} />,
    admin: isAdmin ? <AdminBereich /> : null,
  };

  return (
    <div style={{ minHeight: "100vh", background: COLORS.neutral50, fontFamily: "'Inter', system-ui, sans-serif", paddingBottom: 80 }}>
      {/* Top Bar */}
      <div style={{ background: COLORS.white, borderBottom: `1px solid ${COLORS.neutral100}`, padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 22 }}>🤝</span>
          <span style={{ fontWeight: 800, fontSize: 18, color: COLORS.neutral900 }}>BegleitApp</span>
          {isAdmin && <Badge color={COLORS.accent}>Admin</Badge>}
        </div>
        <button onClick={() => supabase.auth.signOut()} style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.neutral500, fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}>
          Abmelden
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: "20px 16px", maxWidth: 600, margin: "0 auto" }}>
        {pages[page]}
      </div>

      {/* Tab Bar unten */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
        background: COLORS.white, borderTop: `1px solid ${COLORS.neutral100}`,
        display: "flex", padding: "8px 0 12px",
        paddingBottom: "calc(8px + env(safe-area-inset-bottom))",
        boxShadow: "0 -2px 16px rgba(0,0,0,0.06)",
      }}>
        {NAV.map(n => (
          <button key={n.id} onClick={() => setPage(n.id)} style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
            border: "none", cursor: "pointer", background: "transparent", padding: "4px 0",
          }}>
            <span style={{ fontSize: 24 }}>{n.icon}</span>
            <span style={{ fontSize: 11, fontWeight: page === n.id ? 700 : 500, color: page === n.id ? COLORS.primary : COLORS.neutral500 }}>{n.label}</span>
            {page === n.id && <div style={{ width: 20, height: 3, background: COLORS.primary, borderRadius: 2, marginTop: 1 }} />}
          </button>
        ))}
      </div>
    </div>
  );
}
