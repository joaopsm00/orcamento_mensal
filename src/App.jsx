import React, { useEffect, useRef, useState } from "react";
import { supabase } from "./supabaseClient";

const PALETTE = ["#C79A3D", "#1D4E6B", "#3FB6C4", "#A8DEDF", "#8B6B2E", "#5B7FA6", "#9B6B9E", "#6B9E7A"];

const fmt = (n) => (n || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const THEMES = [
  { id: "classico", label: "Clássico", bg: "#EFEEF3", accent: "#1F2024" },
  { id: "verde", label: "Verde", bg: "#EAF6EE", accent: "#1B7A43" },
  { id: "azul", label: "Azul", bg: "#EAF1FB", accent: "#1D4E8C" },
  { id: "roxo", label: "Roxo", bg: "#F1EDFB", accent: "#5B3FA6" },
  { id: "dourado", label: "Dourado", bg: "#FBF3E6", accent: "#9C6B15" },
];

function applyTheme(themeId) {
  const theme = THEMES.find((t) => t.id === themeId) || THEMES[0];
  document.documentElement.style.setProperty("--orc-bg", theme.bg);
  document.documentElement.style.setProperty("--orc-accent", theme.accent);
  try {
    localStorage.setItem("salva-money-theme", themeId);
  } catch (e) {
    /* ignore storage errors */
  }
}

function loadSavedTheme() {
  try {
    return localStorage.getItem("salva-money-theme") || "classico";
  } catch (e) {
    return "classico";
  }
}

function nowData() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthKeyOf(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthLabel(date) {
  const raw = date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function colorForName(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

const STYLES = `
  * { box-sizing: border-box; }
  .orc-root { min-height: 100vh; background: var(--orc-bg, #EFEEF3); font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1F2024; padding: 16px; }
  .orc-header { display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; }
  .orc-header-top { display: flex; justify-content: space-between; align-items: center; }
  .orc-title { font-size: 19px; font-weight: 600; margin: 0; }
  .orc-date-pill { display: flex; align-items: center; gap: 10px; background: #fff; border-radius: 10px; padding: 8px 14px; font-size: 13px; color: #4A4A55; box-shadow: 0 1px 2px rgba(0,0,0,0.04); align-self: flex-start; }
  .orc-saldo-bar { display: flex; justify-content: space-between; align-items: center; background: #fff; border-radius: 12px; padding: 10px 16px; margin-bottom: 12px; font-size: 13px; color: #4A4A55; box-shadow: 0 1px 2px rgba(0,0,0,0.04); }
  .orc-card { background: #fff; border-radius: 16px; padding: 16px; box-shadow: 0 1px 2px rgba(0,0,0,0.04); }
  .orc-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; gap: 8px; flex-wrap: wrap; }
  .orc-card-title { font-weight: 600; font-size: 14px; }
  .orc-row-head { display: grid; grid-template-columns: 46px 1fr 78px 72px; font-size: 11px; color: #9B9AA5; padding: 6px 2px; }
  .orc-row { display: grid; grid-template-columns: 46px 1fr 78px 72px; align-items: center; padding: 10px 2px; border-top: 1px solid #F0F0F3; font-size: 12.5px; gap: 4px; }
  .orc-edit-row { display: grid; grid-template-columns: 46px 1fr 78px 72px; align-items: center; gap: 8px; padding: 10px 2px; border-top: 1px solid #F0F0F3; background: #FAFAFC; }
  .orc-donut-wrap { display: flex; flex-direction: column; align-items: center; justify-content: center; }
  .orc-legend-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 12px; margin-top: 14px; width: 100%; }
  .orc-footer-total { display: flex; justify-content: flex-end; padding-top: 10px; font-weight: 600; font-size: 13px; }
  .orc-footer-split { display: flex; flex-direction: column; gap: 4px; padding-top: 10px; font-weight: 600; font-size: 12.5px; }
  .orc-carousel { display: flex; overflow-x: auto; scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
  .orc-carousel::-webkit-scrollbar { display: none; }
  .orc-page { flex: 0 0 100%; min-width: 100%; scroll-snap-align: start; box-sizing: border-box; padding-right: 2px; }
  .orc-dots { display: flex; justify-content: center; gap: 6px; margin-top: 14px; }
  .orc-dot { width: 6px; height: 6px; border-radius: 50%; background: #D8D7DE; cursor: pointer; border: none; padding: 0; transition: width 0.2s ease, background 0.2s ease; }
  .orc-dot.active { background: var(--orc-accent, #1F2024); width: 16px; border-radius: 3px; }
  .orc-hero { display: flex; flex-direction: column; gap: 6px; padding-bottom: 14px; margin-bottom: 14px; border-bottom: 1px solid #F0F0F3; }
  .orc-hero-top { display: flex; align-items: center; gap: 8px; }
  .orc-hero-icon { width: 30px; height: 30px; border-radius: 9px; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; }
  .orc-hero-label { font-size: 12px; letter-spacing: 0.4px; color: #9B9AA5; }
  .orc-hero-value { font-size: 30px; font-weight: 700; line-height: 1.1; }
  .orc-hero-badge { font-size: 11px; background: #E7E9FB; color: #5C55C9; border-radius: 6px; padding: 3px 8px; display: inline-block; align-self: flex-start; }
  .orc-inner-grid { display: grid; grid-template-columns: 1fr; gap: 14px; }
  .orc-desktop-tabs { display: none; gap: 24px; margin-bottom: 14px; }
  .orc-desktop-tab-btn { border: none; background: transparent; font-size: 14px; padding-bottom: 8px; cursor: pointer; }
  .auth-wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--orc-bg, #EFEEF3); font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 16px; }
  .auth-card { background: #fff; border-radius: 16px; padding: 28px 24px; width: 100%; max-width: 360px; box-shadow: 0 2px 10px rgba(0,0,0,0.06); }
  .auth-input { border: 1px solid #E4E3EA; border-radius: 8px; padding: 12px; font-size: 16px; width: 100%; box-sizing: border-box; margin-bottom: 10px; font-family: inherit; }
  .auth-btn { width: 100%; border: none; background: var(--orc-accent, #1F2024); color: #fff; padding: 12px; border-radius: 8px; font-size: 15px; font-weight: 600; cursor: pointer; }
  .auth-toggle { text-align: center; margin-top: 14px; font-size: 13px; color: #9B9AA5; cursor: pointer; }
  .auth-error { color: #D65B5B; font-size: 13px; margin-bottom: 10px; }

  @media (min-width: 860px) {
    .orc-root { padding: 28px 40px; }
    .orc-header { flex-direction: row; justify-content: space-between; align-items: center; }
    .orc-title { font-size: 22px; }
    .orc-inner-grid { grid-template-columns: 1.6fr 1fr; }
    .orc-row-head, .orc-row, .orc-edit-row { grid-template-columns: 70px 1fr 100px 76px; font-size: 13px; }
    .orc-carousel { overflow-x: hidden; scroll-snap-type: none; }
    .orc-dots { display: none; }
    .orc-desktop-tabs { display: flex; }
  }
`;

const inputStyle = {
  border: "1px solid #E4E3EA",
  borderRadius: 6,
  padding: "5px 8px",
  fontSize: 16,
  outline: "none",
  fontFamily: "inherit",
  width: "100%",
  boxSizing: "border-box",
};

const pillBtnStyle = {
  border: "none",
  background: "#F7F7FA",
  color: "#4A4A55",
  fontSize: 12,
  padding: "7px 12px",
  borderRadius: 8,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const iconBtnStyle = {
  border: "none",
  background: "transparent",
  color: "#C9C8D1",
  fontSize: 14,
  cursor: "pointer",
  padding: "8px",
  lineHeight: 1,
  minWidth: 32,
  minHeight: 32,
};

const monthArrowStyle = {
  border: "none",
  background: "transparent",
  color: "#B7B6C0",
  cursor: "pointer",
  fontSize: 15,
  padding: "4px 6px",
  lineHeight: 1,
};

// ============================================================
// TELA DE LOGIN / CADASTRO
// ============================================================
function AuthScreen() {
  const [mode, setMode] = useState("login"); // 'login' | 'signup'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(traduzErro(error.message));
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError(traduzErro(error.message));
      else setInfo("Conta criada! Verifique seu e-mail para confirmar (se a confirmação estiver ativada no seu projeto).");
    }
    setLoading(false);
  }

  function traduzErro(msg) {
    if (msg.includes("Invalid login credentials")) return "E-mail ou senha incorretos.";
    if (msg.includes("already registered")) return "Esse e-mail já tem uma conta.";
    if (msg.includes("Password should be")) return "A senha precisa ter pelo menos 6 caracteres.";
    return msg;
  }

  return (
    <div className="auth-wrap">
      <style>{STYLES}</style>
      <div className="auth-card">
        <h2 style={{ margin: "0 0 4px", fontSize: 20 }}>Salva Money</h2>
        <p style={{ margin: "0 0 20px", fontSize: 13, color: "#9B9AA5" }}>
          {mode === "login" ? "Entre na sua conta" : "Crie sua conta gratuita"}
        </p>

        {error && <div className="auth-error">{error}</div>}
        {info && <div style={{ color: "#2E8B57", fontSize: 13, marginBottom: 10 }}>{info}</div>}

        <form onSubmit={handleSubmit}>
          <input
            className="auth-input"
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="auth-input"
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar conta"}
          </button>
        </form>

        <div
          className="auth-toggle"
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setError("");
            setInfo("");
          }}
        >
          {mode === "login" ? "Não tem conta? Criar uma agora" : "Já tem conta? Entrar"}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// APP PRINCIPAL — decide entre tela de login e o dashboard
// ============================================================
export default function App() {
  const [session, setSession] = useState(undefined); // undefined = carregando, null = deslogado, object = logado

  useEffect(() => {
    applyTheme(loadSavedTheme());
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return (
      <div className="auth-wrap">
        <style>{STYLES}</style>
        <span style={{ color: "#9B9AA5" }}>Carregando...</span>
      </div>
    );
  }

  if (!session) return <AuthScreen />;

  return <Dashboard user={session.user} />;
}

// ============================================================
// HOOK: CRUD de lançamentos (receita / fixa / variavel / reserva) via Supabase
// ============================================================
function useEntriesCRUD(userId, tipo, monthKey) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ nome: "", valor: "", data: "" });
  const [error, setError] = useState(false);

  async function load() {
    setLoading(true);
    let query = supabase.from("entries").select("*").eq("user_id", userId).eq("tipo", tipo);
    query = monthKey ? query.eq("month_key", monthKey) : query.is("month_key", null);
    const { data } = await query.order("created_at", { ascending: true });
    setItems(data || []);
    setLoading(false);
  }

  useEffect(() => {
    if (userId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, tipo, monthKey]);

  function startEdit(item) {
    setEditingId(item.id);
    setAdding(false);
    setError(false);
    setDraft({ nome: item.nome, valor: String(item.valor), data: item.data });
  }
  function startAdd() {
    setAdding(true);
    setEditingId(null);
    setError(false);
    setDraft({ nome: "", valor: "", data: nowData() });
  }
  function cancel() {
    setEditingId(null);
    setAdding(false);
    setError(false);
    setDraft({ nome: "", valor: "", data: "" });
  }

  async function save() {
    const valorNum = parseFloat(draft.valor.toString().replace(",", "."));
    const dataFinal = draft.data.trim() || nowData();
    if (!draft.nome.trim() || isNaN(valorNum) || valorNum <= 0) {
      setError(true);
      return;
    }
    if (adding) {
      const row = {
        user_id: userId,
        tipo,
        month_key: monthKey || null,
        data: dataFinal,
        nome: draft.nome.trim(),
        valor: valorNum,
      };
      const { data } = await supabase.from("entries").insert(row).select().single();
      if (data) setItems((prev) => [...prev, data]);
    } else if (editingId != null) {
      const { data } = await supabase
        .from("entries")
        .update({ nome: draft.nome.trim(), valor: valorNum, data: dataFinal })
        .eq("id", editingId)
        .select()
        .single();
      if (data) setItems((prev) => prev.map((d) => (d.id === editingId ? data : d)));
    }
    cancel();
  }

  async function remove(id) {
    await supabase.from("entries").delete().eq("id", id);
    setItems((prev) => prev.filter((d) => d.id !== id));
    if (editingId === id) cancel();
  }

  return { items, loading, editingId, adding, draft, setDraft, startEdit, startAdd, cancel, save, remove, error };
}

// ============================================================
// DASHBOARD
// ============================================================
function Dashboard({ user }) {
  const [tab, setTab] = useState("receita");
  const pages = ["receita", "fixas", "variavel", "investir", "reserva"];
  const carouselRef = useRef(null);
  const fromCarouselScroll = useRef(false);
  const rafRef = useRef(null);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const mKey = monthKeyOf(currentMonth);

  const [themeId, setThemeId] = useState(loadSavedTheme());
  const [showThemePicker, setShowThemePicker] = useState(false);

  function chooseTheme(id) {
    setThemeId(id);
    applyTheme(id);
    setShowThemePicker(false);
  }

  function goToTab(id) {
    setTab(id);
  }
  function prevMonth() {
    setCurrentMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }
  function nextMonth() {
    setCurrentMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }

  useEffect(() => {
    const el = carouselRef.current;
    if (el && !fromCarouselScroll.current) {
      const idx = pages.indexOf(tab);
      const target = idx * el.clientWidth;
      if (Math.abs(el.scrollLeft - target) > 2) {
        const isDesktop = typeof window !== "undefined" && window.innerWidth >= 860;
        el.scrollTo({ left: target, behavior: isDesktop ? "auto" : "smooth" });
      }
    }
    fromCarouselScroll.current = false;
  }, [tab]);

  function handleCarouselScroll(e) {
    const el = e.target;
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      if (el.clientWidth === 0) return;
      const idx = Math.round(el.scrollLeft / el.clientWidth);
      const newTab = pages[idx];
      if (newTab && newTab !== tab) {
        fromCarouselScroll.current = true;
        setTab(newTab);
      }
    });
  }

  const receitaCRUD = useEntriesCRUD(user.id, "receita", mKey);
  const fixasCRUD = useEntriesCRUD(user.id, "fixa", mKey);
  const variavelCRUD = useEntriesCRUD(user.id, "variavel", mKey);
  const reservaCRUD = useEntriesCRUD(user.id, "reserva", null);

  // Investimentos
  const [investimentos, setInvestimentos] = useState([]);
  const [investEditingId, setInvestEditingId] = useState(null);
  const [investAdding, setInvestAdding] = useState(false);
  const [investDraft, setInvestDraft] = useState({ categoria: "", valorInvestido: "", rentabilidade: "", periodo: "mes", data: "" });

  async function loadInvestimentos() {
    const { data } = await supabase.from("investimentos").select("*").eq("user_id", user.id).order("created_at");
    setInvestimentos(data || []);
  }
  useEffect(() => {
    loadInvestimentos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function investStartAdd() {
    setInvestAdding(true);
    setInvestEditingId(null);
    setInvestDraft({ categoria: "", valorInvestido: "", rentabilidade: "", periodo: "mes", data: nowData() });
  }
  function investStartEdit(item) {
    setInvestEditingId(item.id);
    setInvestAdding(false);
    setInvestDraft({
      categoria: item.categoria,
      valorInvestido: String(item.valor_investido),
      rentabilidade: String(item.rentabilidade),
      periodo: item.periodo || "mes",
      data: item.data_aporte || "",
    });
  }
  function investCancel() {
    setInvestEditingId(null);
    setInvestAdding(false);
    setInvestDraft({ categoria: "", valorInvestido: "", rentabilidade: "", periodo: "mes", data: "" });
  }
  async function investSave() {
    const vi = parseFloat(investDraft.valorInvestido.toString().replace(",", "."));
    const rb = parseFloat(investDraft.rentabilidade.toString().replace(",", ".")) || 0;
    const dataFinal = investDraft.data.trim() || nowData();
    if (!investDraft.categoria.trim() || isNaN(vi) || vi <= 0) return;
    if (investAdding) {
      const row = {
        user_id: user.id,
        categoria: investDraft.categoria.trim(),
        valor_investido: vi,
        rentabilidade: rb,
        periodo: investDraft.periodo,
        data_aporte: dataFinal,
      };
      const { data } = await supabase.from("investimentos").insert(row).select().single();
      if (data) setInvestimentos((prev) => [...prev, data]);
    } else if (investEditingId != null) {
      const { data } = await supabase
        .from("investimentos")
        .update({ categoria: investDraft.categoria.trim(), valor_investido: vi, rentabilidade: rb, periodo: investDraft.periodo, data_aporte: dataFinal })
        .eq("id", investEditingId)
        .select()
        .single();
      if (data) setInvestimentos((prev) => prev.map((d) => (d.id === investEditingId ? data : d)));
    }
    investCancel();
  }
  async function investRemove(id) {
    await supabase.from("investimentos").delete().eq("id", id);
    setInvestimentos((prev) => prev.filter((d) => d.id !== id));
    if (investEditingId === id) investCancel();
  }

  // Meta da reserva (settings)
  const [metaReserva, setMetaReservaState] = useState(15000);
  const [editingMeta, setEditingMeta] = useState(false);
  const [metaDraft, setMetaDraft] = useState("");

  useEffect(() => {
    async function loadSettings() {
      const { data } = await supabase.from("settings").select("*").eq("user_id", user.id).single();
      if (data) setMetaReservaState(data.meta_reserva);
      else await supabase.from("settings").insert({ user_id: user.id, meta_reserva: 15000 });
    }
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function setMeta(novoValor) {
    setMetaReservaState(novoValor);
    await supabase.from("settings").upsert({ user_id: user.id, meta_reserva: novoValor });
  }

  const totalReceita = receitaCRUD.items.reduce((s, d) => s + Number(d.valor), 0);
  const totalFixas = fixasCRUD.items.reduce((s, d) => s + Number(d.valor), 0);
  const totalVariavel = variavelCRUD.items.reduce((s, d) => s + Number(d.valor), 0);
  const totalDespesas = totalFixas + totalVariavel;
  const totalInvestido = investimentos.reduce((s, d) => s + Number(d.valor_investido), 0);
  const totalGanho = investimentos.reduce((s, d) => {
    const taxaMensal = d.periodo === "ano" ? d.rentabilidade / 12 : d.rentabilidade;
    return s + Number(d.valor_investido) * (taxaMensal / 100);
  }, 0);
  const rentabilidadeMedia = totalInvestido > 0 ? (totalGanho / totalInvestido) * 100 : 0;
  const totalReserva = reservaCRUD.items.reduce((s, d) => s + Number(d.valor), 0);
  const saldo = totalReceita - totalDespesas - totalInvestido - totalReserva;

  const tabConfig = {
    receita: { crud: receitaCRUD, titulo: "Receita", sinal: "+", cor: "#2E8B57" },
    fixas: { crud: fixasCRUD, titulo: "Despesas fixas", sinal: "-", cor: "#D65B5B" },
    variavel: { crud: variavelCRUD, titulo: "Despesas variáveis", sinal: "-", cor: "#D65B5B" },
  };

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  return (
    <div className="orc-root">
      <style>{STYLES}</style>

      <div className="orc-header">
        <div className="orc-header-top">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <h1 className="orc-title">Salva Money</h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, position: "relative" }}>
            <button
              onClick={() => setShowThemePicker((v) => !v)}
              style={{ ...pillBtnStyle, display: "flex", alignItems: "center", gap: 6 }}
              aria-label="Escolher tema de cores"
            >
              <span
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  background: THEMES.find((t) => t.id === themeId)?.accent,
                  display: "inline-block",
                }}
              />
              Tema
            </button>
            <button onClick={handleLogout} style={pillBtnStyle}>Sair</button>

            {showThemePicker && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  right: 0,
                  background: "#fff",
                  borderRadius: 12,
                  boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                  padding: 12,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  zIndex: 10,
                  minWidth: 150,
                }}
              >
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => chooseTheme(t.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      border: "none",
                      background: themeId === t.id ? "#F2F1F6" : "transparent",
                      padding: "6px 8px",
                      borderRadius: 8,
                      cursor: "pointer",
                      fontSize: 13,
                      textAlign: "left",
                    }}
                  >
                    <span
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: "50%",
                        background: t.accent,
                        border: "2px solid #fff",
                        boxShadow: "0 0 0 1px #E4E3EA",
                        flexShrink: 0,
                      }}
                    />
                    {t.label}
                    {themeId === t.id && <span style={{ marginLeft: "auto", color: t.accent }}>✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="orc-date-pill">
          <button onClick={prevMonth} style={monthArrowStyle} aria-label="Mês anterior">‹</button>
          {formatMonthLabel(currentMonth)}
          <button onClick={nextMonth} style={monthArrowStyle} aria-label="Próximo mês">›</button>
        </div>
      </div>

      <div className="orc-saldo-bar">
        <span>Saldo do mês</span>
        <strong style={{ color: saldo >= 0 ? "var(--orc-accent, #1F2024)" : "#D65B5B" }}>{fmt(saldo)}</strong>
      </div>

      <div className="orc-desktop-tabs">
        {[
          { id: "receita", label: "Receita" },
          { id: "fixas", label: "Despesa fixa" },
          { id: "variavel", label: "Despesa variável" },
          { id: "investir", label: "Investir" },
          { id: "reserva", label: "Reserva de emergência" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => goToTab(t.id)}
            className="orc-desktop-tab-btn"
            style={{
              fontWeight: tab === t.id ? 600 : 400,
              color: tab === t.id ? "var(--orc-accent, #1F2024)" : "#9B9AA5",
              borderBottom: tab === t.id ? "2px solid var(--orc-accent, #1F2024)" : "2px solid transparent",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="orc-carousel" ref={carouselRef} onScroll={handleCarouselScroll}>
        <div className="orc-page">
          <ExpenseSection config={tabConfig.receita} hero={{ icon: "📈", iconBg: "#E3F3E7", label: "RECEITA", value: fmt(totalReceita) }} />
        </div>
        <div className="orc-page">
          <ExpenseSection config={tabConfig.fixas} hero={{ icon: "🧾", iconBg: "#FBE7E7", label: "DESPESA FIXA", value: fmt(totalFixas) }} />
        </div>
        <div className="orc-page">
          <ExpenseSection config={tabConfig.variavel} hero={{ icon: "🛒", iconBg: "#FBE7E7", label: "DESPESA VARIÁVEL", value: fmt(totalVariavel) }} />
        </div>
        <div className="orc-page">
          <InvestmentSection
            items={investimentos}
            editingId={investEditingId}
            adding={investAdding}
            draft={investDraft}
            setDraft={setInvestDraft}
            startAdd={investStartAdd}
            startEdit={investStartEdit}
            cancel={investCancel}
            save={investSave}
            remove={investRemove}
            totalInvestido={totalInvestido}
            totalGanho={totalGanho}
            rentabilidadeMedia={rentabilidadeMedia}
            hero={{
              icon: "💠",
              iconBg: "#E7E9FB",
              label: "INVESTIDO",
              value: fmt(totalInvestido),
              badge: investimentos.length > 0 ? `${rentabilidadeMedia >= 0 ? "+" : ""}${rentabilidadeMedia.toFixed(1)}% a.m.` : null,
            }}
          />
        </div>
        <div className="orc-page">
          <ReservaSection
            crud={reservaCRUD}
            meta={metaReserva}
            setMeta={setMeta}
            editingMeta={editingMeta}
            setEditingMeta={setEditingMeta}
            metaDraft={metaDraft}
            setMetaDraft={setMetaDraft}
            total={totalReserva}
            hero={{
              icon: "🛟",
              iconBg: "#FFF3D6",
              label: "RESERVA",
              value: fmt(totalReserva),
              badge: metaReserva > 0 ? `${Math.min(100, Math.round((totalReserva / metaReserva) * 100))}% da meta` : null,
            }}
          />
        </div>
      </div>

      <div className="orc-dots">
        {pages.map((p) => (
          <button key={p} className={"orc-dot" + (tab === p ? " active" : "")} onClick={() => goToTab(p)} aria-label={`Ir para ${p}`} />
        ))}
      </div>
    </div>
  );
}

function Hero({ icon, iconBg, label, value, badge }) {
  return (
    <div className="orc-hero">
      <div className="orc-hero-top">
        <span className="orc-hero-icon" style={{ background: iconBg }}>{icon}</span>
        <span className="orc-hero-label">{label}</span>
      </div>
      <div className="orc-hero-value">{value}</div>
      {badge && <span className="orc-hero-badge">{badge}</span>}
    </div>
  );
}

function ExpenseSection({ config, hero }) {
  const { crud, titulo, sinal, cor } = config;
  const { items, editingId, adding, draft, setDraft, startEdit, startAdd, cancel, save, remove, error } = crud;

  const colors = {};
  items.forEach((d) => { colors[d.nome] = colorForName(d.nome); });
  const total = items.reduce((s, d) => s + Number(d.valor), 0);
  const donutData = items.map((d) => ({ ...d, pct: total > 0 ? Math.round((Number(d.valor) / total) * 100) : 0 }));

  let cumulative = 0;
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const segments = donutData.map((d) => {
    const frac = total > 0 ? Number(d.valor) / total : 0;
    const dash = frac * circumference;
    const seg = { ...d, dasharray: `${dash} ${circumference - dash}`, offset: -cumulative };
    cumulative += dash;
    return seg;
  });

  return (
    <div className="orc-card">
      <Hero {...hero} />
      <div className="orc-inner-grid">
        <div>
          <div className="orc-card-header">
            <span className="orc-card-title">{titulo}</span>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={pillBtnStyle}>▤ Filtro</button>
              <button style={{ ...pillBtnStyle, background: "#F2F1F6" }} onClick={startAdd}>+ Adicionar</button>
            </div>
          </div>

          <div className="orc-row-head">
            <span>Data</span>
            <span>Categoria</span>
            <span style={{ textAlign: "right" }}>Valor</span>
            <span></span>
          </div>

          {items.map((d) =>
            editingId === d.id ? (
              <EditRow key={d.id} draft={draft} setDraft={setDraft} onSave={save} onCancel={cancel} error={error} />
            ) : (
              <div key={d.id} className="orc-row">
                <span style={{ color: "#9B9AA5" }}>{d.data}</span>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.nome}</span>
                <span style={{ textAlign: "right", color: cor }}>{sinal} {fmt(Number(d.valor))}</span>
                <span style={{ textAlign: "right" }}>
                  <button onClick={() => startEdit(d)} style={iconBtnStyle} aria-label="Editar">✎</button>
                  <button onClick={() => remove(d.id)} style={iconBtnStyle} aria-label="Remover">×</button>
                </span>
              </div>
            )
          )}

          {adding && <EditRow draft={draft} setDraft={setDraft} onSave={save} onCancel={cancel} isNew error={error} />}

          {items.length === 0 && !adding && (
            <div style={{ padding: "16px 4px", fontSize: 13, color: "#B4B3BD" }}>Nenhum item cadastrado nessa categoria ainda.</div>
          )}

          <div className="orc-footer-total" style={{ color: cor }}>{sinal} {fmt(total)}</div>
        </div>

        <div className="orc-donut-wrap">
          {items.length === 0 ? (
            <span style={{ fontSize: 13, color: "#B4B3BD" }}>Sem dados para exibir</span>
          ) : (
            <>
              <svg width="150" height="150" viewBox="0 0 160 160">
                {segments.map((s, i) => (
                  <circle key={i} cx="80" cy="80" r={radius} fill="none" stroke={colors[s.nome]} strokeWidth="18" strokeDasharray={s.dasharray} strokeDashoffset={s.offset} transform="rotate(-90 80 80)" />
                ))}
              </svg>
              <div className="orc-legend-grid">
                {donutData.map((d, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: colors[d.nome], display: "inline-block", flexShrink: 0 }} />
                    <span style={{ color: "#4A4A55", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.pct}% {d.nome}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function InvestmentSection({ items, editingId, adding, draft, setDraft, startAdd, startEdit, cancel, save, remove, totalInvestido, totalGanho, rentabilidadeMedia, hero }) {
  const colors = {};
  items.forEach((d) => { colors[d.categoria] = colorForName(d.categoria); });

  return (
    <div className="orc-card">
      <Hero {...hero} />
      <div className="orc-card-header">
        <span className="orc-card-title">Investimentos</span>
        <button style={{ ...pillBtnStyle, background: "#F2F1F6" }} onClick={startAdd}>+ Adicionar</button>
      </div>

      <div className="orc-row-head" style={{ gridTemplateColumns: "46px 1fr 78px 96px 50px" }}>
        <span>Data</span>
        <span>Categoria</span>
        <span style={{ textAlign: "right" }}>Investido</span>
        <span style={{ textAlign: "right" }}>Rentab.</span>
        <span></span>
      </div>

      {items.map((d) =>
        editingId === d.id ? (
          <InvestEditRow key={d.id} draft={draft} setDraft={setDraft} onSave={save} onCancel={cancel} />
        ) : (
          <div key={d.id} className="orc-row" style={{ gridTemplateColumns: "46px 1fr 78px 96px 50px" }}>
            <span style={{ color: "#9B9AA5" }}>{d.data_aporte}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 6, overflow: "hidden" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: colors[d.categoria], display: "inline-block", flexShrink: 0 }} />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.categoria}</span>
            </span>
            <span style={{ textAlign: "right" }}>{fmt(Number(d.valor_investido))}</span>
            <span style={{ textAlign: "right", color: d.rentabilidade >= 0 ? "#2E8B57" : "#D65B5B" }}>
              {d.rentabilidade >= 0 ? "+" : ""}{Number(d.rentabilidade).toFixed(1)}% {d.periodo === "ano" ? "a.a." : "a.m."}
              <div style={{ fontSize: 10.5, color: "#9B9AA5" }}>{fmt(Number(d.valor_investido) * (d.rentabilidade / 100))}</div>
            </span>
            <span style={{ textAlign: "right" }}>
              <button onClick={() => startEdit(d)} style={iconBtnStyle} aria-label="Editar">✎</button>
              <button onClick={() => remove(d.id)} style={iconBtnStyle} aria-label="Remover">×</button>
            </span>
          </div>
        )
      )}

      {adding && <InvestEditRow draft={draft} setDraft={setDraft} onSave={save} onCancel={cancel} isNew />}

      {items.length === 0 && !adding && (
        <div style={{ padding: "16px 4px", fontSize: 13, color: "#B4B3BD" }}>Nenhum investimento cadastrado ainda.</div>
      )}

      <div className="orc-footer-split">
        <span>Total investido: {fmt(totalInvestido)}</span>
        <span style={{ color: rentabilidadeMedia >= 0 ? "#2E8B57" : "#D65B5B" }}>
          Rentabilidade média: {rentabilidadeMedia >= 0 ? "+" : ""}{rentabilidadeMedia.toFixed(1)}% a.m. ({fmt(totalGanho)}/mês)
        </span>
      </div>
    </div>
  );
}

function ReservaSection({ crud, meta, setMeta, editingMeta, setEditingMeta, metaDraft, setMetaDraft, total, hero }) {
  const { items, editingId, adding, draft, setDraft, startEdit, startAdd, cancel, save, remove, error } = crud;
  const pct = meta > 0 ? Math.min(100, Math.round((total / meta) * 100)) : 0;
  const falta = Math.max(0, meta - total);

  function submitMeta() {
    const n = parseFloat(metaDraft.toString().replace(",", "."));
    if (!isNaN(n) && n >= 0) setMeta(n);
    setEditingMeta(false);
  }

  return (
    <div className="orc-card">
      <Hero {...hero} />
      <div className="orc-card-header">
        <span className="orc-card-title">Reserva de emergência</span>
        {editingMeta ? (
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "#9B9AA5" }}>Meta:</span>
            <input
              autoFocus
              value={metaDraft}
              onChange={(e) => setMetaDraft(e.target.value)}
              placeholder={String(meta)}
              inputMode="decimal"
              style={{ ...inputStyle, width: 100 }}
              onKeyDown={(e) => { if (e.key === "Enter") submitMeta(); if (e.key === "Escape") setEditingMeta(false); }}
            />
            <button onClick={submitMeta} style={{ ...iconBtnStyle, color: "#2E8B57" }} aria-label="Salvar">✓</button>
          </div>
        ) : (
          <button onClick={() => { setMetaDraft(String(meta)); setEditingMeta(true); }} style={{ ...pillBtnStyle, display: "flex", alignItems: "center", gap: 6 }}>
            Meta: {fmt(meta)} ✎
          </button>
        )}
      </div>

      <div style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 6 }}>
          <span style={{ color: "#4A4A55" }}>{fmt(total)} guardado</span>
          <span style={{ color: "#9B9AA5" }}>{pct}%</span>
        </div>
        <div style={{ width: "100%", height: 10, background: "#F0F0F3", borderRadius: 6, overflow: "hidden" }}>
          <div style={{ width: `${pct}%`, height: "100%", background: pct >= 100 ? "#2E8B57" : "#C79A3D", borderRadius: 6, transition: "width 0.3s ease" }} />
        </div>
        {falta > 0 && <div style={{ fontSize: 12, color: "#9B9AA5", marginTop: 6 }}>Faltam {fmt(falta)} para atingir a meta</div>}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, borderTop: "1px solid #F0F0F3", paddingTop: 14, flexWrap: "wrap", gap: 8 }}>
        <span style={{ fontSize: 13, color: "#9B9AA5" }}>Aportes</span>
        <button style={{ ...pillBtnStyle, background: "#F2F1F6" }} onClick={startAdd}>+ Adicionar aporte</button>
      </div>

      <div className="orc-row-head">
        <span>Data</span>
        <span>Descrição</span>
        <span style={{ textAlign: "right" }}>Valor</span>
        <span></span>
      </div>

      {items.map((d) =>
        editingId === d.id ? (
          <EditRow key={d.id} draft={draft} setDraft={setDraft} onSave={save} onCancel={cancel} error={error} />
        ) : (
          <div key={d.id} className="orc-row">
            <span style={{ color: "#9B9AA5" }}>{d.data}</span>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.nome}</span>
            <span style={{ textAlign: "right", color: "#2E8B57" }}>+ {fmt(Number(d.valor))}</span>
            <span style={{ textAlign: "right" }}>
              <button onClick={() => startEdit(d)} style={iconBtnStyle} aria-label="Editar">✎</button>
              <button onClick={() => remove(d.id)} style={iconBtnStyle} aria-label="Remover">×</button>
            </span>
          </div>
        )
      )}

      {adding && <EditRow draft={draft} setDraft={setDraft} onSave={save} onCancel={cancel} isNew error={error} />}

      {items.length === 0 && !adding && (
        <div style={{ padding: "16px 4px", fontSize: 13, color: "#B4B3BD" }}>Nenhum aporte registrado ainda.</div>
      )}
    </div>
  );
}

function EditRow({ draft, setDraft, onSave, onCancel, isNew, error }) {
  const errStyle = error ? { borderColor: "#D65B5B" } : {};
  return (
    <div className="orc-edit-row">
      <input
        value={draft.data}
        onChange={(e) => setDraft({ ...draft, data: e.target.value })}
        placeholder="DD/MM"
        style={{ ...inputStyle, padding: "5px 4px", fontSize: 13, textAlign: "center" }}
      />
      <input
        autoFocus={isNew}
        value={draft.nome}
        onChange={(e) => setDraft({ ...draft, nome: e.target.value })}
        placeholder="Nome da categoria"
        style={{ ...inputStyle, ...(!draft.nome.trim() ? errStyle : {}) }}
      />
      <input
        value={draft.valor}
        onChange={(e) => setDraft({ ...draft, valor: e.target.value })}
        placeholder="0,00"
        inputMode="decimal"
        style={{ ...inputStyle, textAlign: "right" }}
        onKeyDown={(e) => { if (e.key === "Enter") onSave(); if (e.key === "Escape") onCancel(); }}
      />
      <span style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
        <button onClick={onSave} style={{ ...iconBtnStyle, color: "#2E8B57" }} aria-label="Salvar">✓</button>
        <button onClick={onCancel} style={iconBtnStyle} aria-label="Cancelar">×</button>
      </span>
    </div>
  );
}

function InvestEditRow({ draft, setDraft, onSave, onCancel, isNew }) {
  return (
    <div className="orc-edit-row" style={{ gridTemplateColumns: "1fr", display: "flex", flexWrap: "wrap", gap: 8 }}>
      <input value={draft.data} onChange={(e) => setDraft({ ...draft, data: e.target.value })} placeholder="DD/MM" style={{ ...inputStyle, flex: "0 1 60px", textAlign: "center" }} />
      <input autoFocus={isNew} value={draft.categoria} onChange={(e) => setDraft({ ...draft, categoria: e.target.value })} placeholder="Categoria (ex: Ações)" style={{ ...inputStyle, flex: "1 1 auto", minWidth: 100 }} />
      <input value={draft.valorInvestido} onChange={(e) => setDraft({ ...draft, valorInvestido: e.target.value })} placeholder="0,00" inputMode="decimal" style={{ ...inputStyle, textAlign: "right", flex: "1 1 auto", minWidth: 70 }} />
      <input value={draft.rentabilidade} onChange={(e) => setDraft({ ...draft, rentabilidade: e.target.value })} placeholder="% ex: 8,5" inputMode="decimal" style={{ ...inputStyle, textAlign: "right", flex: "1 1 auto", minWidth: 70 }} onKeyDown={(e) => { if (e.key === "Enter") onSave(); if (e.key === "Escape") onCancel(); }} />
      <select value={draft.periodo} onChange={(e) => setDraft({ ...draft, periodo: e.target.value })} style={{ ...inputStyle, flex: "1 1 auto", minWidth: 70 }}>
        <option value="mes">a.m.</option>
        <option value="ano">a.a.</option>
      </select>
      <span style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
        <button onClick={onSave} style={{ ...iconBtnStyle, color: "#2E8B57" }} aria-label="Salvar">✓</button>
        <button onClick={onCancel} style={iconBtnStyle} aria-label="Cancelar">×</button>
      </span>
    </div>
  );
}
