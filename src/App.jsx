import { useState, useEffect } from "react";

const PLANOS = ["Plano I", "Plano II", "Plano III", "Plano Plataforma", "Plano Club"];
const PLANO_VALORES = { "Plano I": 60000, "Plano II": 30000, "Plano III": 20000, "Plano Plataforma": 15000, "Plano Club": 1667 };
const PLANO_CORES = { "Plano I": "#a78bfa", "Plano II": "#fb923c", "Plano III": "#fbbf24", "Plano Plataforma": "#38bdf8", "Plano Club": "#84cc16" };
const STATUS_OPTS = ["Ativo", "Em proposta", "Negociação", "Vencido", "Cancelado"];
const STATUS_CORES = { "Ativo": "#84cc16", "Em proposta": "#fbbf24", "Negociação": "#38bdf8", "Vencido": "#f87171", "Cancelado": "#6b7280" };

const hoje = new Date();
const fmtData = (d) => { if (!d) return "—"; const dt = new Date(d + "T12:00:00"); return dt.toLocaleDateString("pt-BR"); };
const diasAte = (d) => { if (!d) return null; const dt = new Date(d + "T12:00:00"); return Math.ceil((dt - hoje) / 86400000); };
const fmtMoeda = (v) => `R$${Number(v || 0).toLocaleString("pt-BR")}`;

const EMPTY_PATROC = { nome: "", plano: "Plano I", valor: "", status: "Ativo", inicio: "", vencimento: "", contato: "", obs: "" };
const EMPTY_MEMBRO = { nome: "", empresa: "", entrada: "", vencimento: "", status: "Ativo", contato: "", obs: "" };
const EMPTY_META = { mes: new Date().toISOString().slice(0, 7), meta: "", obs: "" };

function useStorage(key, def) {
  const [val, setVal] = useState(def);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get(key);
        if (r && r.value) setVal(JSON.parse(r.value));
      } catch (_) {}
      setLoaded(true);
    })();
  }, [key]);
  const save = async (v) => {
    setVal(v);
    try { await window.storage.set(key, JSON.stringify(v)); } catch (_) {}
  };
  return [val, save, loaded];
}

function Badge({ status }) {
  return (
    <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: `${STATUS_CORES[status]}18`, color: STATUS_CORES[status], border: `1px solid ${STATUS_CORES[status]}40`, letterSpacing: 0.5 }}>{status}</span>
  );
}

function AlertaDias({ dias, label }) {
  if (dias === null) return null;
  const cor = dias < 0 ? "#f87171" : dias <= 15 ? "#fb923c" : dias <= 30 ? "#fbbf24" : dias <= 60 ? "#38bdf8" : "#84cc16";
  const txt = dias < 0 ? `Vencido há ${Math.abs(dias)}d` : dias === 0 ? "Vence hoje!" : `${dias}d para vencer`;
  return <span style={{ fontSize: 10, color: cor, background: `${cor}15`, border: `1px solid ${cor}30`, borderRadius: 10, padding: "2px 7px" }}>{txt}</span>;
}

export default function App() {
  const [aba, setAba] = useState("visao");
  const [patrocinadores, setPatrocinadores] = useStorage("pwr_patrocinadores", []);
  const [membros, setMembros] = useStorage("pwr_membros", []);
  const [metas, setMetas] = useStorage("pwr_metas", []);
  const [loaded, setLoaded] = useState(false);

  const [modalP, setModalP] = useState(null); // null | "new" | index
  const [modalM, setModalM] = useState(null);
  const [modalMeta, setModalMeta] = useState(null);
  const [formP, setFormP] = useState(EMPTY_PATROC);
  const [formM, setFormM] = useState(EMPTY_MEMBRO);
  const [formMeta, setFormMeta] = useState(EMPTY_META);

  useEffect(() => { setTimeout(() => setLoaded(true), 600); }, []);

  // KPIs
  const patAtivos = patrocinadores.filter(p => p.status === "Ativo");
  const mrrPatroc = patAtivos.reduce((s, p) => s + Number(p.valor || PLANO_VALORES[p.plano] || 0), 0);
  const membrosAtivos = membros.filter(m => m.status === "Ativo");
  const mrrClub = membrosAtivos.length * 1667;
  const mrrTotal = mrrPatroc + mrrClub;

  const mesAtual = new Date().toISOString().slice(0, 7);
  const metaMes = metas.find(m => m.mes === mesAtual);
  const pctMeta = metaMes ? Math.min(100, Math.round((mrrTotal / Number(metaMes.meta)) * 100)) : null;

  const alertas30P = patrocinadores.filter(p => { const d = diasAte(p.vencimento); return d !== null && d >= 0 && d <= 30 && p.status === "Ativo"; });
  const alertas30M = membros.filter(m => { const d = diasAte(m.vencimento); return d !== null && d >= 0 && d <= 30 && m.status === "Ativo"; });
  const vencidosP = patrocinadores.filter(p => { const d = diasAte(p.vencimento); return d !== null && d < 0 && p.status !== "Cancelado"; });
  const vencidosM = membros.filter(m => { const d = diasAte(m.vencimento); return d !== null && d < 0 && m.status !== "Cancelado"; });
  const totalAlertas = alertas30P.length + alertas30M.length + vencidosP.length + vencidosM.length;

  // Helpers modal
  const abrirModalP = (idx) => {
    if (idx === "new") { setFormP({ ...EMPTY_PATROC }); setModalP("new"); }
    else { setFormP({ ...patrocinadores[idx] }); setModalP(idx); }
  };
  const salvarP = () => {
    const arr = [...patrocinadores];
    if (modalP === "new") arr.push(formP);
    else arr[modalP] = formP;
    setPatrocinadores(arr); setModalP(null);
  };
  const deletarP = (idx) => { const arr = patrocinadores.filter((_, i) => i !== idx); setPatrocinadores(arr); };

  const abrirModalM = (idx) => {
    if (idx === "new") { setFormM({ ...EMPTY_MEMBRO }); setModalM("new"); }
    else { setFormM({ ...membros[idx] }); setModalM(idx); }
  };
  const salvarM = () => {
    const arr = [...membros];
    if (modalM === "new") arr.push(formM);
    else arr[modalM] = formM;
    setMembros(arr); setModalM(null);
  };
  const deletarM = (idx) => { const arr = membros.filter((_, i) => i !== idx); setMembros(arr); };

  const salvarMeta = () => {
    const arr = metas.filter(m => m.mes !== formMeta.mes);
    arr.push(formMeta);
    setMetas(arr); setModalMeta(null);
  };

  const inputStyle = { background: "#0d0d18", border: "1px solid #2a2a3a", borderRadius: 8, color: "#E8E4DC", padding: "8px 12px", fontSize: 13, width: "100%", boxSizing: "border-box", fontFamily: "Georgia, serif" };
  const labelStyle = { fontSize: 11, color: "#5a5570", letterSpacing: 1, display: "block", marginBottom: 4 };

  if (!loaded) return (
    <div style={{ background: "#070710", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#84cc16", fontSize: 13, letterSpacing: 3 }}>CARREGANDO POWERCAST...</div>
    </div>
  );

  return (
    <div style={{ fontFamily: "Georgia, serif", background: "#070710", minHeight: "100vh", color: "#E8E4DC" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #070710 0%, #0d1a05 60%, #070710 100%)", borderBottom: "1px solid #84cc1620", padding: "20px 32px 14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 3 }}>
              <span style={{ fontSize: 20, fontWeight: 900, color: "#fff", letterSpacing: 4 }}>POWER</span>
              <span style={{ fontSize: 20, fontWeight: 900, color: "#84cc16", letterSpacing: 4 }}>CAST</span>
              <span style={{ fontSize: 10, color: "#84cc16", background: "#84cc1615", border: "1px solid #84cc1630", padding: "2px 10px", borderRadius: 20, letterSpacing: 2 }}>FINANCEIRO</span>
              {totalAlertas > 0 && (
                <span style={{ fontSize: 10, color: "#f87171", background: "#f8717120", border: "1px solid #f8717140", padding: "2px 10px", borderRadius: 20 }}>⚠ {totalAlertas} alerta{totalAlertas > 1 ? "s" : ""}</span>
              )}
            </div>
            <div style={{ fontSize: 11, color: "#3a3a50", letterSpacing: 1 }}>
              {hoje.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "#5a5570", letterSpacing: 1, marginBottom: 2 }}>MRR TOTAL</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#84cc16", lineHeight: 1 }}>{fmtMoeda(mrrTotal)}</div>
            <div style={{ fontSize: 10, color: "#3a3a50", marginTop: 2 }}>por mês</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div style={{ display: "flex", borderBottom: "1px solid #1a1a2a", padding: "0 32px", background: "#0a0a14" }}>
        {[
          { id: "visao", label: "Visão Geral" },
          { id: "patrocinadores", label: `Patrocinadores (${patrocinadores.length})` },
          { id: "club", label: `PowerClub (${membros.length})` },
          { id: "alertas", label: `Alertas${totalAlertas > 0 ? ` (${totalAlertas})` : ""}` },
        ].map(t => (
          <button key={t.id} onClick={() => setAba(t.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: "12px 18px", fontSize: 12, color: aba === t.id ? "#84cc16" : "#5a5570", borderBottom: aba === t.id ? "2px solid #84cc16" : "2px solid transparent", transition: "all 0.2s", fontFamily: "Georgia, serif", whiteSpace: "nowrap" }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: "24px 32px", maxWidth: 1100 }}>

        {/* VISÃO GERAL */}
        {aba === "visao" && (
          <div>
            {/* KPI Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
              {[
                { label: "Patrocinadores Ativos", value: patAtivos.length, sub: `${fmtMoeda(mrrPatroc)}/mês`, cor: "#fb923c" },
                { label: "Membros Club Ativos", value: membrosAtivos.length, sub: `${fmtMoeda(mrrClub)}/mês`, cor: "#84cc16" },
                { label: "MRR Total", value: fmtMoeda(mrrTotal), sub: metaMes ? `Meta: ${fmtMoeda(metaMes.meta)}` : "Sem meta cadastrada", cor: "#a78bfa" },
                { label: "% da Meta", value: pctMeta !== null ? `${pctMeta}%` : "—", sub: pctMeta !== null ? (pctMeta >= 100 ? "✓ Meta atingida!" : `Faltam ${fmtMoeda(Number(metaMes.meta) - mrrTotal)}`) : "Cadastre uma meta", cor: pctMeta >= 100 ? "#84cc16" : pctMeta >= 70 ? "#fbbf24" : "#f87171" },
              ].map(k => (
                <div key={k.label} style={{ background: "#0d0d18", border: `1px solid ${k.cor}25`, borderRadius: 12, padding: "16px 18px" }}>
                  <div style={{ fontSize: 11, color: "#5a5570", letterSpacing: 1, marginBottom: 8 }}>{k.label.toUpperCase()}</div>
                  <div style={{ fontSize: 26, fontWeight: 700, color: k.cor, lineHeight: 1 }}>{k.value}</div>
                  <div style={{ fontSize: 11, color: "#5a5570", marginTop: 5 }}>{k.sub}</div>
                </div>
              ))}
            </div>

            {/* Meta do mês */}
            <div style={{ background: "#0d0d18", border: "1px solid #1a1a2a", borderRadius: 14, padding: "20px 22px", marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 11, color: "#5a5570", letterSpacing: 2, marginBottom: 2 }}>META DO MÊS</div>
                  <div style={{ fontSize: 15, color: "#E8E4DC" }}>{metaMes ? `${new Date(mesAtual + "-01").toLocaleDateString("pt-BR", { month: "long", year: "numeric" })} · Meta: ${fmtMoeda(metaMes.meta)}` : "Nenhuma meta cadastrada para este mês"}</div>
                </div>
                <button onClick={() => { setFormMeta({ mes: mesAtual, meta: metaMes?.meta || "", obs: metaMes?.obs || "" }); setModalMeta(true); }} style={{ background: "#84cc1620", border: "1px solid #84cc1640", color: "#84cc16", borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontSize: 12, fontFamily: "Georgia, serif" }}>
                  {metaMes ? "Editar meta" : "+ Definir meta"}
                </button>
              </div>
              {pctMeta !== null && (
                <div>
                  <div style={{ background: "#1a1a2a", borderRadius: 6, height: 8, overflow: "hidden" }}>
                    <div style={{ width: `${Math.min(pctMeta, 100)}%`, height: "100%", background: pctMeta >= 100 ? "#84cc16" : pctMeta >= 70 ? "#fbbf24" : "#fb923c", borderRadius: 6, transition: "width 0.5s ease" }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                    <span style={{ fontSize: 11, color: "#5a5570" }}>Realizado: {fmtMoeda(mrrTotal)}</span>
                    <span style={{ fontSize: 11, color: "#5a5570" }}>Meta: {fmtMoeda(metaMes?.meta)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Breakdown por produto */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {/* Por plano */}
              <div style={{ background: "#0d0d18", border: "1px solid #1a1a2a", borderRadius: 14, padding: "18px 20px" }}>
                <div style={{ fontSize: 11, color: "#5a5570", letterSpacing: 2, marginBottom: 14 }}>RECEITA POR PLANO</div>
                {PLANOS.map(pl => {
                  const pts = patAtivos.filter(p => p.plano === pl);
                  const tot = pts.reduce((s, p) => s + Number(p.valor || PLANO_VALORES[pl] || 0), 0);
                  if (pts.length === 0) return null;
                  return (
                    <div key={pl} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: "1px solid #1a1a24" }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: PLANO_CORES[pl], flexShrink: 0, display: "inline-block" }} />
                        <span style={{ fontSize: 12, color: "#B8B4AC" }}>{pl}</span>
                        <span style={{ fontSize: 10, color: "#5a5570" }}>({pts.length}x)</span>
                      </div>
                      <span style={{ fontSize: 13, color: PLANO_CORES[pl], fontWeight: 600 }}>{fmtMoeda(tot)}</span>
                    </div>
                  );
                })}
                {membrosAtivos.length > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0" }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#84cc16", flexShrink: 0, display: "inline-block" }} />
                      <span style={{ fontSize: 12, color: "#B8B4AC" }}>PowerClub</span>
                      <span style={{ fontSize: 10, color: "#5a5570" }}>({membrosAtivos.length} membros)</span>
                    </div>
                    <span style={{ fontSize: 13, color: "#84cc16", fontWeight: 600 }}>{fmtMoeda(mrrClub)}</span>
                  </div>
                )}
                {patAtivos.length === 0 && membrosAtivos.length === 0 && (
                  <div style={{ fontSize: 12, color: "#3a3a50", textAlign: "center", padding: "20px 0" }}>Adicione patrocinadores e membros para ver o breakdown</div>
                )}
              </div>

              {/* Próximos vencimentos */}
              <div style={{ background: "#0d0d18", border: "1px solid #1a1a2a", borderRadius: 14, padding: "18px 20px" }}>
                <div style={{ fontSize: 11, color: "#5a5570", letterSpacing: 2, marginBottom: 14 }}>PRÓXIMOS 60 DIAS</div>
                {[...patrocinadores.map(p => ({ ...p, tipo: "Patrocinador" })), ...membros.map(m => ({ ...m, tipo: "Club" }))]
                  .filter(x => { const d = diasAte(x.vencimento); return d !== null && d >= 0 && d <= 60; })
                  .sort((a, b) => diasAte(a.vencimento) - diasAte(b.vencimento))
                  .slice(0, 6)
                  .map((x, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: "1px solid #1a1a24" }}>
                      <div>
                        <div style={{ fontSize: 12, color: "#B8B4AC" }}>{x.nome}</div>
                        <div style={{ fontSize: 10, color: "#5a5570" }}>{x.tipo} · {fmtData(x.vencimento)}</div>
                      </div>
                      <AlertaDias dias={diasAte(x.vencimento)} />
                    </div>
                  ))}
                {[...patrocinadores, ...membros].filter(x => { const d = diasAte(x.vencimento); return d !== null && d >= 0 && d <= 60; }).length === 0 && (
                  <div style={{ fontSize: 12, color: "#3a3a50", textAlign: "center", padding: "20px 0" }}>Nenhum vencimento nos próximos 60 dias</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PATROCINADORES */}
        {aba === "patrocinadores" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <h2 style={{ color: "#E8E4DC", fontSize: 18, fontWeight: 400, margin: 0 }}>Patrocinadores</h2>
                <div style={{ fontSize: 12, color: "#5a5570", marginTop: 3 }}>MRR de patrocínios: {fmtMoeda(mrrPatroc)}</div>
              </div>
              <button onClick={() => abrirModalP("new")} style={{ background: "#fb923c20", border: "1px solid #fb923c40", color: "#fb923c", borderRadius: 8, padding: "9px 18px", cursor: "pointer", fontSize: 13, fontFamily: "Georgia, serif" }}>+ Adicionar marca</button>
            </div>

            {patrocinadores.length === 0 ? (
              <div style={{ background: "#0d0d18", border: "1px dashed #2a2a3a", borderRadius: 14, padding: "48px", textAlign: "center" }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🏢</div>
                <div style={{ fontSize: 14, color: "#5a5570", marginBottom: 6 }}>Nenhum patrocinador cadastrado</div>
                <div style={{ fontSize: 12, color: "#3a3a50" }}>Clique em "+ Adicionar marca" para começar</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {patrocinadores.map((p, i) => (
                  <div key={i} style={{ background: "#0d0d18", border: `1px solid ${PLANO_CORES[p.plano] || "#2a2a3a"}25`, borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: PLANO_CORES[p.plano] || "#5a5570", flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 3, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 14, color: "#E8E4DC", fontWeight: 600 }}>{p.nome || "Sem nome"}</span>
                        <Badge status={p.status} />
                        <span style={{ fontSize: 10, color: PLANO_CORES[p.plano], background: `${PLANO_CORES[p.plano]}15`, padding: "1px 7px", borderRadius: 8 }}>{p.plano}</span>
                      </div>
                      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 11, color: "#5a5570" }}>Início: {fmtData(p.inicio)}</span>
                        <span style={{ fontSize: 11, color: "#5a5570" }}>Vence: {fmtData(p.vencimento)}</span>
                        {p.obs && <span style={{ fontSize: 11, color: "#5a5570", fontStyle: "italic" }}>{p.obs}</span>}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 16, color: PLANO_CORES[p.plano] || "#fb923c", fontWeight: 700 }}>{fmtMoeda(p.valor || PLANO_VALORES[p.plano])}</div>
                      <div style={{ fontSize: 10, color: "#3a3a50" }}>por mês</div>
                      <AlertaDias dias={diasAte(p.vencimento)} />
                    </div>
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      <button onClick={() => abrirModalP(i)} style={{ background: "#1a1a2a", border: "none", color: "#5a5570", borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 12 }}>✎</button>
                      <button onClick={() => deletarP(i)} style={{ background: "#1a0505", border: "none", color: "#f87171", borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 12 }}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* POWERCLUB */}
        {aba === "club" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <h2 style={{ color: "#E8E4DC", fontSize: 18, fontWeight: 400, margin: 0 }}>PowerClub — Membros</h2>
                <div style={{ fontSize: 12, color: "#5a5570", marginTop: 3 }}>{membrosAtivos.length} ativos · MRR: {fmtMoeda(mrrClub)} · Anual: {fmtMoeda(membrosAtivos.length * 20000)}</div>
              </div>
              <button onClick={() => abrirModalM("new")} style={{ background: "#84cc1620", border: "1px solid #84cc1640", color: "#84cc16", borderRadius: 8, padding: "9px 18px", cursor: "pointer", fontSize: 13, fontFamily: "Georgia, serif" }}>+ Adicionar membro</button>
            </div>

            {membros.length === 0 ? (
              <div style={{ background: "#0d0d18", border: "1px dashed #2a2a3a", borderRadius: 14, padding: "48px", textAlign: "center" }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🏆</div>
                <div style={{ fontSize: 14, color: "#5a5570", marginBottom: 6 }}>Nenhum membro cadastrado</div>
                <div style={{ fontSize: 12, color: "#3a3a50" }}>Clique em "+ Adicionar membro" para começar</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {membros.map((m, i) => (
                  <div key={i} style={{ background: "#0d0d18", border: "1px solid #84cc1620", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#84cc1620", border: "1px solid #84cc1640", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
                      {m.nome?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 3, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 14, color: "#E8E4DC", fontWeight: 600 }}>{m.nome || "Sem nome"}</span>
                        <Badge status={m.status} />
                        {m.empresa && <span style={{ fontSize: 11, color: "#5a5570" }}>{m.empresa}</span>}
                      </div>
                      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 11, color: "#5a5570" }}>Entrada: {fmtData(m.entrada)}</span>
                        <span style={{ fontSize: 11, color: "#5a5570" }}>Vence: {fmtData(m.vencimento)}</span>
                        {m.contato && <span style={{ fontSize: 11, color: "#5a5570" }}>📱 {m.contato}</span>}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 15, color: "#84cc16", fontWeight: 700 }}>R$1.667/mês</div>
                      <div style={{ fontSize: 10, color: "#3a3a50" }}>R$20.000/ano</div>
                      <AlertaDias dias={diasAte(m.vencimento)} />
                    </div>
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      <button onClick={() => abrirModalM(i)} style={{ background: "#1a1a2a", border: "none", color: "#5a5570", borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 12 }}>✎</button>
                      <button onClick={() => deletarM(i)} style={{ background: "#1a0505", border: "none", color: "#f87171", borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 12 }}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ALERTAS */}
        {aba === "alertas" && (
          <div>
            <h2 style={{ color: "#E8E4DC", fontSize: 18, fontWeight: 400, marginBottom: 6 }}>Alertas de Renovação</h2>
            <p style={{ color: "#5a5570", fontSize: 13, marginBottom: 24 }}>Tudo que precisa da sua atenção agora.</p>

            {totalAlertas === 0 ? (
              <div style={{ background: "#0d1a05", border: "1px solid #84cc1630", borderRadius: 14, padding: "40px", textAlign: "center" }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>✓</div>
                <div style={{ fontSize: 15, color: "#84cc16", marginBottom: 4 }}>Tudo em dia!</div>
                <div style={{ fontSize: 12, color: "#5a5570" }}>Nenhum vencimento crítico nos próximos 30 dias.</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[...vencidosP.map(p => ({ ...p, tipo: "Patrocinador" })), ...vencidosM.map(m => ({ ...m, tipo: "Club" }))].map((x, i) => (
                  <div key={`v${i}`} style={{ background: "#1a0505", border: "1px solid #f8717130", borderRadius: 12, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 3 }}>
                        <span style={{ fontSize: 13, color: "#f87171", fontWeight: 600 }}>⚠ {x.nome}</span>
                        <span style={{ fontSize: 10, color: "#f87171", background: "#f8717115", padding: "1px 7px", borderRadius: 8 }}>{x.tipo}</span>
                      </div>
                      <div style={{ fontSize: 11, color: "#7a4040" }}>Venceu em {fmtData(x.vencimento)} · {x.contato ? `Contato: ${x.contato}` : "Sem contato cadastrado"}</div>
                    </div>
                    <AlertaDias dias={diasAte(x.vencimento)} />
                  </div>
                ))}
                {[...alertas30P.map(p => ({ ...p, tipo: "Patrocinador" })), ...alertas30M.map(m => ({ ...m, tipo: "Club" }))].sort((a, b) => diasAte(a.vencimento) - diasAte(b.vencimento)).map((x, i) => (
                  <div key={`a${i}`} style={{ background: "#0d0d18", border: "1px solid #fbbf2430", borderRadius: 12, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 3 }}>
                        <span style={{ fontSize: 13, color: "#E8E4DC", fontWeight: 600 }}>{x.nome}</span>
                        <span style={{ fontSize: 10, color: "#fbbf24", background: "#fbbf2415", padding: "1px 7px", borderRadius: 8 }}>{x.tipo}</span>
                        {x.plano && <span style={{ fontSize: 10, color: "#5a5570" }}>{x.plano}</span>}
                      </div>
                      <div style={{ fontSize: 11, color: "#5a5570" }}>Vence em {fmtData(x.vencimento)} · {x.contato ? `Contato: ${x.contato}` : "Sem contato"}</div>
                    </div>
                    <AlertaDias dias={diasAte(x.vencimento)} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL PATROCINADOR */}
      {modalP !== null && (
        <div style={{ position: "fixed", inset: 0, background: "#000000cc", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}>
          <div style={{ background: "#0d0d18", border: "1px solid #2a2a3a", borderRadius: 16, padding: "28px", width: "100%", maxWidth: 500, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
              <h3 style={{ color: "#E8E4DC", fontSize: 16, margin: 0 }}>{modalP === "new" ? "Nova Marca Parceira" : "Editar Marca"}</h3>
              <button onClick={() => setModalP(null)} style={{ background: "none", border: "none", color: "#5a5570", cursor: "pointer", fontSize: 18 }}>✕</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div><label style={labelStyle}>NOME DA MARCA</label><input style={inputStyle} value={formP.nome} onChange={e => setFormP({ ...formP, nome: e.target.value })} placeholder="Ex: Kopenhagen" /></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={labelStyle}>PLANO</label>
                  <select style={inputStyle} value={formP.plano} onChange={e => setFormP({ ...formP, plano: e.target.value, valor: PLANO_VALORES[e.target.value] })}>
                    {PLANOS.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div><label style={labelStyle}>VALOR (R$)</label><input style={inputStyle} type="number" value={formP.valor} onChange={e => setFormP({ ...formP, valor: e.target.value })} placeholder={PLANO_VALORES[formP.plano]} /></div>
              </div>
              <div>
                <label style={labelStyle}>STATUS</label>
                <select style={inputStyle} value={formP.status} onChange={e => setFormP({ ...formP, status: e.target.value })}>
                  {STATUS_OPTS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div><label style={labelStyle}>DATA DE INÍCIO</label><input style={inputStyle} type="date" value={formP.inicio} onChange={e => setFormP({ ...formP, inicio: e.target.value })} /></div>
                <div><label style={labelStyle}>DATA DE VENCIMENTO</label><input style={inputStyle} type="date" value={formP.vencimento} onChange={e => setFormP({ ...formP, vencimento: e.target.value })} /></div>
              </div>
              <div><label style={labelStyle}>CONTATO (nome / WhatsApp)</label><input style={inputStyle} value={formP.contato} onChange={e => setFormP({ ...formP, contato: e.target.value })} placeholder="Ex: João · (11) 99999-9999" /></div>
              <div><label style={labelStyle}>OBSERVAÇÕES</label><input style={inputStyle} value={formP.obs} onChange={e => setFormP({ ...formP, obs: e.target.value })} placeholder="Qualquer info relevante" /></div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
              <button onClick={salvarP} style={{ flex: 1, background: "#fb923c", border: "none", color: "#fff", borderRadius: 8, padding: "11px", cursor: "pointer", fontSize: 14, fontFamily: "Georgia, serif", fontWeight: 600 }}>Salvar</button>
              <button onClick={() => setModalP(null)} style={{ background: "#1a1a2a", border: "none", color: "#5a5570", borderRadius: 8, padding: "11px 18px", cursor: "pointer", fontSize: 14, fontFamily: "Georgia, serif" }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL MEMBRO */}
      {modalM !== null && (
        <div style={{ position: "fixed", inset: 0, background: "#000000cc", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}>
          <div style={{ background: "#0d0d18", border: "1px solid #2a2a3a", borderRadius: 16, padding: "28px", width: "100%", maxWidth: 500, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
              <h3 style={{ color: "#E8E4DC", fontSize: 16, margin: 0 }}>{modalM === "new" ? "Novo Membro PowerClub" : "Editar Membro"}</h3>
              <button onClick={() => setModalM(null)} style={{ background: "none", border: "none", color: "#5a5570", cursor: "pointer", fontSize: 18 }}>✕</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div><label style={labelStyle}>NOME DO MEMBRO</label><input style={inputStyle} value={formM.nome} onChange={e => setFormM({ ...formM, nome: e.target.value })} placeholder="Nome completo" /></div>
              <div><label style={labelStyle}>EMPRESA / NEGÓCIO</label><input style={inputStyle} value={formM.empresa} onChange={e => setFormM({ ...formM, empresa: e.target.value })} placeholder="Ex: Cafeteria da Maria" /></div>
              <div>
                <label style={labelStyle}>STATUS</label>
                <select style={inputStyle} value={formM.status} onChange={e => setFormM({ ...formM, status: e.target.value })}>
                  {STATUS_OPTS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div><label style={labelStyle}>DATA DE ENTRADA</label><input style={inputStyle} type="date" value={formM.entrada} onChange={e => setFormM({ ...formM, entrada: e.target.value })} /></div>
                <div><label style={labelStyle}>DATA DE VENCIMENTO</label><input style={inputStyle} type="date" value={formM.vencimento} onChange={e => setFormM({ ...formM, vencimento: e.target.value })} /></div>
              </div>
              <div><label style={labelStyle}>CONTATO (WhatsApp)</label><input style={inputStyle} value={formM.contato} onChange={e => setFormM({ ...formM, contato: e.target.value })} placeholder="(11) 99999-9999" /></div>
              <div><label style={labelStyle}>OBSERVAÇÕES</label><input style={inputStyle} value={formM.obs} onChange={e => setFormM({ ...formM, obs: e.target.value })} placeholder="Ex: indicado pela Scheila, renovação negociada" /></div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
              <button onClick={salvarM} style={{ flex: 1, background: "#84cc16", border: "none", color: "#000", borderRadius: 8, padding: "11px", cursor: "pointer", fontSize: 14, fontFamily: "Georgia, serif", fontWeight: 700 }}>Salvar</button>
              <button onClick={() => setModalM(null)} style={{ background: "#1a1a2a", border: "none", color: "#5a5570", borderRadius: 8, padding: "11px 18px", cursor: "pointer", fontSize: 14, fontFamily: "Georgia, serif" }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL META */}
      {modalMeta && (
        <div style={{ position: "fixed", inset: 0, background: "#000000cc", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}>
          <div style={{ background: "#0d0d18", border: "1px solid #2a2a3a", borderRadius: 16, padding: "28px", width: "100%", maxWidth: 400 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
              <h3 style={{ color: "#E8E4DC", fontSize: 16, margin: 0 }}>Meta do Mês</h3>
              <button onClick={() => setModalMeta(null)} style={{ background: "none", border: "none", color: "#5a5570", cursor: "pointer", fontSize: 18 }}>✕</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div><label style={labelStyle}>MÊS</label><input style={inputStyle} type="month" value={formMeta.mes} onChange={e => setFormMeta({ ...formMeta, mes: e.target.value })} /></div>
              <div><label style={labelStyle}>META DE RECEITA (R$)</label><input style={inputStyle} type="number" value={formMeta.meta} onChange={e => setFormMeta({ ...formMeta, meta: e.target.value })} placeholder="Ex: 80000" /></div>
              <div><label style={labelStyle}>OBSERVAÇÕES</label><input style={inputStyle} value={formMeta.obs} onChange={e => setFormMeta({ ...formMeta, obs: e.target.value })} placeholder="Contexto da meta" /></div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
              <button onClick={salvarMeta} style={{ flex: 1, background: "#a78bfa", border: "none", color: "#fff", borderRadius: 8, padding: "11px", cursor: "pointer", fontSize: 14, fontFamily: "Georgia, serif", fontWeight: 600 }}>Salvar meta</button>
              <button onClick={() => setModalMeta(null)} style={{ background: "#1a1a2a", border: "none", color: "#5a5570", borderRadius: 8, padding: "11px 18px", cursor: "pointer", fontSize: 14, fontFamily: "Georgia, serif" }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
