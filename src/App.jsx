import { useState, useEffect } from "react";

const PLANOS_BASE = ["Plano I", "Plano II", "Plano III", "Plano Plataforma", "Plano Club", "Personalizado"];
const PLANO_VALORES = { "Plano I": 60000, "Plano II": 30000, "Plano III": 20000, "Plano Plataforma": 15000, "Plano Club": 1667, "Personalizado": "" };
const PLANO_CORES = { "Plano I": "#a78bfa", "Plano II": "#fb923c", "Plano III": "#fbbf24", "Plano Plataforma": "#38bdf8", "Plano Club": "#84cc16", "Personalizado": "#f472b6" };
const STATUS_OPTS = ["Ativo", "Em proposta", "Negociação", "Vencido", "Cancelado"];
const STATUS_CURSO = ["Ativo", "Em breve", "Encerrado"];
const STATUS_CORES = { "Ativo": "#84cc16", "Em proposta": "#fbbf24", "Negociação": "#38bdf8", "Vencido": "#f87171", "Cancelado": "#6b7280", "Em breve": "#a78bfa", "Encerrado": "#6b7280" };

const hoje = new Date();
const fmtData = (d) => { if (!d) return "—"; const dt = new Date(d + "T12:00:00"); return dt.toLocaleDateString("pt-BR"); };
const diasAte = (d) => { if (!d) return null; const dt = new Date(d + "T12:00:00"); return Math.ceil((dt - hoje) / 86400000); };
const fmtMoeda = (v) => `R$${Number(v || 0).toLocaleString("pt-BR")}`;
const corPlano = (p) => PLANO_CORES[p] || "#f472b6";

const EMPTY_PATROC = { nome: "", plano: "Plano I", planoCustom: "", valor: "", status: "Ativo", inicio: "", vencimento: "", contato: "", obs: "" };
const EMPTY_MEMBRO = { nome: "", empresa: "", entrada: "", vencimento: "", status: "Ativo", valor: "", contato: "", obs: "" };
const EMPTY_IMERSAO = { nome: "", data: "", empresa: "", vagas: "", vagasVendidas: "", valorUnitario: "", status: "Ativo", obs: "" };
const EMPTY_CURSO = { nome: "", alunos: "", valor: "", status: "Ativo", lancamento: "", obs: "" };
const EMPTY_AVULSO = { descricao: "", valor: "", data: "", categoria: "Outro", obs: "" };
const EMPTY_META = { mes: new Date().toISOString().slice(0, 7), meta: "", obs: "" };

const CATEGORIAS_AVULSO = ["Consultoria", "Evento", "Licença de conteúdo", "Parceria pontual", "Patrocínio avulso", "Outro"];

function useStorage(key, def) {
  const [val, setVal] = useState(def);
  useEffect(() => {
    (async () => {
      try { const r = await window.storage.get(key); if (r && r.value) setVal(JSON.parse(r.value)); } catch (_) {}
    })();
  }, [key]);
  const save = async (v) => { setVal(v); try { await window.storage.set(key, JSON.stringify(v)); } catch (_) {} };
  return [val, save];
}

function Badge({ status }) {
  return <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: `${STATUS_CORES[status] || "#6b7280"}18`, color: STATUS_CORES[status] || "#6b7280", border: `1px solid ${STATUS_CORES[status] || "#6b7280"}40`, letterSpacing: 0.5 }}>{status}</span>;
}

function AlertaDias({ dias }) {
  if (dias === null) return null;
  const cor = dias < 0 ? "#f87171" : dias <= 15 ? "#fb923c" : dias <= 30 ? "#fbbf24" : dias <= 60 ? "#38bdf8" : "#84cc16";
  const txt = dias < 0 ? `Vencido há ${Math.abs(dias)}d` : dias === 0 ? "Vence hoje!" : `${dias}d para vencer`;
  return <span style={{ fontSize: 10, color: cor, background: `${cor}15`, border: `1px solid ${cor}30`, borderRadius: 10, padding: "2px 7px" }}>{txt}</span>;
}

export default function App() {
  const [aba, setAba] = useState("visao");
  const [patrocinadores, setPatrocinadores] = useStorage("pwr_patrocinadores", []);
  const [membros, setMembros] = useStorage("pwr_membros", []);
  const [imersoes, setImersoes] = useStorage("pwr_imersoes", []);
  const [cursos, setCursos] = useStorage("pwr_cursos", []);
  const [avulsos, setAvulsos] = useStorage("pwr_avulsos", []);
  const [metas, setMetas] = useStorage("pwr_metas", []);

  const [modalP, setModalP] = useState(null);
  const [modalM, setModalM] = useState(null);
  const [modalI, setModalI] = useState(null);
  const [modalC, setModalC] = useState(null);
  const [modalA, setModalA] = useState(null);
  const [modalMeta, setModalMeta] = useState(null);
  const [formP, setFormP] = useState(EMPTY_PATROC);
  const [formM, setFormM] = useState(EMPTY_MEMBRO);
  const [formI, setFormI] = useState(EMPTY_IMERSAO);
  const [formC, setFormC] = useState(EMPTY_CURSO);
  const [formA, setFormA] = useState(EMPTY_AVULSO);
  const [formMeta, setFormMeta] = useState(EMPTY_META);

  const patAtivos = patrocinadores.filter(p => p.status === "Ativo");
  const mrrPatroc = patAtivos.reduce((s, p) => s + Number(p.valor || PLANO_VALORES[p.plano] || 0), 0);
  const membrosAtivos = membros.filter(m => m.status === "Ativo");
  const mrrClub = membrosAtivos.reduce((s, m) => s + Number(m.valor || 0), 0);
  const receitaImersoes = imersoes.reduce((s, i) => s + (Number(i.vagasVendidas || 0) * Number(i.valorUnitario || 0)), 0);
  const receitaCursos = cursos.filter(c => c.status === "Ativo").reduce((s, c) => s + (Number(c.alunos || 0) * Number(c.valor || 0)), 0);
  const receitaAvulsos = avulsos.reduce((s, a) => s + Number(a.valor || 0), 0);
  const mrrTotal = mrrPatroc + mrrClub + receitaImersoes + receitaCursos + receitaAvulsos;

  const mesAtual = new Date().toISOString().slice(0, 7);
  const metaMes = metas.find(m => m.mes === mesAtual);
  const pctMeta = metaMes ? Math.min(100, Math.round((mrrTotal / Number(metaMes.meta)) * 100)) : null;

  const alertas30P = patrocinadores.filter(p => { const d = diasAte(p.vencimento); return d !== null && d >= 0 && d <= 30 && p.status === "Ativo"; });
  const alertas30M = membros.filter(m => { const d = diasAte(m.vencimento); return d !== null && d >= 0 && d <= 30 && m.status === "Ativo"; });
  const vencidosP = patrocinadores.filter(p => { const d = diasAte(p.vencimento); return d !== null && d < 0 && p.status !== "Cancelado"; });
  const vencidosM = membros.filter(m => { const d = diasAte(m.vencimento); return d !== null && d < 0 && m.status !== "Cancelado"; });
  const totalAlertas = alertas30P.length + alertas30M.length + vencidosP.length + vencidosM.length;

  const inputStyle = { background: "#0d0d18", border: "1px solid #2a2a3a", borderRadius: 8, color: "#E8E4DC", padding: "8px 12px", fontSize: 13, width: "100%", boxSizing: "border-box", fontFamily: "Georgia, serif" };
  const labelStyle = { fontSize: 11, color: "#5a5570", letterSpacing: 1, display: "block", marginBottom: 4 };

  const salvarP = () => { const arr = [...patrocinadores]; if (modalP === "new") arr.push(formP); else arr[modalP] = formP; setPatrocinadores(arr); setModalP(null); };
  const salvarM = () => { const arr = [...membros]; if (modalM === "new") arr.push(formM); else arr[modalM] = formM; setMembros(arr); setModalM(null); };
  const salvarI = () => { const arr = [...imersoes]; if (modalI === "new") arr.push(formI); else arr[modalI] = formI; setImersoes(arr); setModalI(null); };
  const salvarC = () => { const arr = [...cursos]; if (modalC === "new") arr.push(formC); else arr[modalC] = formC; setCursos(arr); setModalC(null); };
  const salvarA = () => { const arr = [...avulsos]; if (modalA === "new") arr.push({ ...formA, data: formA.data || new Date().toISOString().slice(0, 10) }); else arr[modalA] = formA; setAvulsos(arr); setModalA(null); };
  const salvarMeta = () => { const arr = metas.filter(m => m.mes !== formMeta.mes); arr.push(formMeta); setMetas(arr); setModalMeta(null); };

  const nomePlano = (p) => p.plano === "Personalizado" && p.planoCustom ? p.planoCustom : p.plano;

  const ABAS = [
    { id: "visao", label: "Visão Geral" },
    { id: "patrocinadores", label: `Patrocinadores (${patrocinadores.length})` },
    { id: "club", label: `PowerClub (${membros.length})` },
    { id: "imersoes", label: `Imersões (${imersoes.length})` },
    { id: "cursos", label: `Cursos (${cursos.length})` },
    { id: "avulsos", label: `Vendas Avulsas (${avulsos.length})` },
    { id: "alertas", label: `Alertas${totalAlertas > 0 ? ` (${totalAlertas})` : ""}` },
  ];

  return (
    <div style={{ fontFamily: "Georgia, serif", background: "#070710", minHeight: "100vh", color: "#E8E4DC" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #070710 0%, #0d1a05 60%, #070710 100%)", borderBottom: "1px solid #84cc1620", padding: "20px 32px 14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 3, flexWrap: "wrap" }}>
              <span style={{ fontSize: 20, fontWeight: 900, color: "#fff", letterSpacing: 4 }}>POWER</span>
              <span style={{ fontSize: 20, fontWeight: 900, color: "#84cc16", letterSpacing: 4 }}>CAST</span>
              <span style={{ fontSize: 10, color: "#84cc16", background: "#84cc1615", border: "1px solid #84cc1630", padding: "2px 10px", borderRadius: 20, letterSpacing: 2 }}>FINANCEIRO</span>
              {totalAlertas > 0 && <span style={{ fontSize: 10, color: "#f87171", background: "#f8717120", border: "1px solid #f8717140", padding: "2px 10px", borderRadius: 20 }}>⚠ {totalAlertas} alerta{totalAlertas > 1 ? "s" : ""}</span>}
            </div>
            <div style={{ fontSize: 11, color: "#3a3a50" }}>{hoje.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "#5a5570", marginBottom: 2 }}>RECEITA TOTAL</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#84cc16", lineHeight: 1 }}>{fmtMoeda(mrrTotal)}</div>
            <div style={{ fontSize: 10, color: "#3a3a50", marginTop: 2 }}>todas as fontes</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div style={{ display: "flex", borderBottom: "1px solid #1a1a2a", padding: "0 32px", background: "#0a0a14", overflowX: "auto" }}>
        {ABAS.map(t => (
          <button key={t.id} onClick={() => setAba(t.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: "12px 14px", fontSize: 11, color: aba === t.id ? "#84cc16" : "#5a5570", borderBottom: aba === t.id ? "2px solid #84cc16" : "2px solid transparent", transition: "all 0.2s", fontFamily: "Georgia, serif", whiteSpace: "nowrap" }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: "24px 32px", maxWidth: 1100 }}>

        {/* VISÃO GERAL */}
        {aba === "visao" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginBottom: 16 }}>
              {[
                { label: "Patrocínios", value: fmtMoeda(mrrPatroc), sub: `${patAtivos.length} ativos`, cor: "#fb923c" },
                { label: "PowerClub", value: fmtMoeda(mrrClub), sub: `${membrosAtivos.length} membros`, cor: "#84cc16" },
                { label: "Imersões", value: fmtMoeda(receitaImersoes), sub: `${imersoes.length} imersão(ões)`, cor: "#a78bfa" },
                { label: "Cursos", value: fmtMoeda(receitaCursos), sub: `${cursos.filter(c => c.status === "Ativo").length} ativo(s)`, cor: "#38bdf8" },
                { label: "Vendas Avulsas", value: fmtMoeda(receitaAvulsos), sub: `${avulsos.length} venda(s)`, cor: "#f472b6" },
              ].map(k => (
                <div key={k.label} style={{ background: "#0d0d18", border: `1px solid ${k.cor}25`, borderRadius: 12, padding: "14px 16px" }}>
                  <div style={{ fontSize: 10, color: "#5a5570", letterSpacing: 1, marginBottom: 6 }}>{k.label.toUpperCase()}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: k.cor, lineHeight: 1 }}>{k.value}</div>
                  <div style={{ fontSize: 10, color: "#5a5570", marginTop: 4 }}>{k.sub}</div>
                </div>
              ))}
            </div>

            <div style={{ background: "#0d0d18", border: "1px solid #1a1a2a", borderRadius: 14, padding: "20px 22px", marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 11, color: "#5a5570", letterSpacing: 2, marginBottom: 2 }}>META DO MÊS</div>
                  <div style={{ fontSize: 15, color: "#E8E4DC" }}>{metaMes ? `Meta: ${fmtMoeda(metaMes.meta)}` : "Nenhuma meta cadastrada"}</div>
                </div>
                <button onClick={() => { setFormMeta({ mes: mesAtual, meta: metaMes?.meta || "", obs: metaMes?.obs || "" }); setModalMeta(true); }} style={{ background: "#84cc1620", border: "1px solid #84cc1640", color: "#84cc16", borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontSize: 12, fontFamily: "Georgia, serif" }}>
                  {metaMes ? "Editar meta" : "+ Definir meta"}
                </button>
              </div>
              {pctMeta !== null && (
                <div>
                  <div style={{ background: "#1a1a2a", borderRadius: 6, height: 10, overflow: "hidden" }}>
                    <div style={{ width: `${Math.min(pctMeta, 100)}%`, height: "100%", background: pctMeta >= 100 ? "#84cc16" : pctMeta >= 70 ? "#fbbf24" : "#fb923c", borderRadius: 6, transition: "width 0.5s" }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                    <span style={{ fontSize: 11, color: "#5a5570" }}>Realizado: {fmtMoeda(mrrTotal)} ({pctMeta}%)</span>
                    <span style={{ fontSize: 11, color: "#5a5570" }}>Meta: {fmtMoeda(metaMes?.meta)}</span>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div style={{ background: "#0d0d18", border: "1px solid #1a1a2a", borderRadius: 14, padding: "18px 20px" }}>
                <div style={{ fontSize: 11, color: "#5a5570", letterSpacing: 2, marginBottom: 14 }}>RECEITA POR FONTE</div>
                {[
                  ...patAtivos.map(p => ({ label: nomePlano(p) + ` — ${p.nome}`, valor: Number(p.valor || PLANO_VALORES[p.plano] || 0), cor: corPlano(p.plano) })),
                  ...membrosAtivos.map(m => ({ label: `Club — ${m.nome}`, valor: Number(m.valor || 0), cor: "#84cc16" })),
                  receitaImersoes > 0 ? { label: "Imersões Avulsas", valor: receitaImersoes, cor: "#a78bfa" } : null,
                  receitaCursos > 0 ? { label: "Cursos", valor: receitaCursos, cor: "#38bdf8" } : null,
                  receitaAvulsos > 0 ? { label: "Vendas Avulsas", valor: receitaAvulsos, cor: "#f472b6" } : null,
                ].filter(Boolean).slice(0, 10).map((item, i, arr) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: i < arr.length - 1 ? "1px solid #1a1a24" : "none" }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", minWidth: 0 }}>
                      <span style={{ width: 7, height: 7, borderRadius: "50%", background: item.cor, flexShrink: 0, display: "inline-block" }} />
                      <span style={{ fontSize: 11, color: "#B8B4AC", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.label}</span>
                    </div>
                    <span style={{ fontSize: 12, color: item.cor, fontWeight: 600, flexShrink: 0, marginLeft: 8 }}>{fmtMoeda(item.valor)}</span>
                  </div>
                ))}
                {mrrTotal === 0 && <div style={{ fontSize: 12, color: "#3a3a50", textAlign: "center", padding: "20px 0" }}>Adicione dados para ver o breakdown</div>}
              </div>

              <div style={{ background: "#0d0d18", border: "1px solid #1a1a2a", borderRadius: 14, padding: "18px 20px" }}>
                <div style={{ fontSize: 11, color: "#5a5570", letterSpacing: 2, marginBottom: 14 }}>PRÓXIMOS 60 DIAS</div>
                {[...patrocinadores.map(p => ({ ...p, tipo: "Patrocinador" })), ...membros.map(m => ({ ...m, tipo: "Club" }))]
                  .filter(x => { const d = diasAte(x.vencimento); return d !== null && d >= 0 && d <= 60; })
                  .sort((a, b) => diasAte(a.vencimento) - diasAte(b.vencimento))
                  .slice(0, 7)
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
                <div style={{ fontSize: 12, color: "#5a5570", marginTop: 3 }}>MRR: {fmtMoeda(mrrPatroc)}</div>
              </div>
              <button onClick={() => { setFormP({ ...EMPTY_PATROC }); setModalP("new"); }} style={{ background: "#fb923c20", border: "1px solid #fb923c40", color: "#fb923c", borderRadius: 8, padding: "9px 18px", cursor: "pointer", fontSize: 13, fontFamily: "Georgia, serif" }}>+ Adicionar marca</button>
            </div>
            {patrocinadores.length === 0 ? (
              <div style={{ background: "#0d0d18", border: "1px dashed #2a2a3a", borderRadius: 14, padding: "48px", textAlign: "center" }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🏢</div>
                <div style={{ fontSize: 14, color: "#5a5570" }}>Nenhum patrocinador cadastrado</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {patrocinadores.map((p, i) => (
                  <div key={i} style={{ background: "#0d0d18", border: `1px solid ${corPlano(p.plano)}25`, borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: corPlano(p.plano), flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 3, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 14, color: "#E8E4DC", fontWeight: 600 }}>{p.nome || "Sem nome"}</span>
                        <Badge status={p.status} />
                        <span style={{ fontSize: 10, color: corPlano(p.plano), background: `${corPlano(p.plano)}15`, padding: "1px 7px", borderRadius: 8 }}>{nomePlano(p)}</span>
                      </div>
                      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 11, color: "#5a5570" }}>Início: {fmtData(p.inicio)}</span>
                        <span style={{ fontSize: 11, color: "#5a5570" }}>Vence: {fmtData(p.vencimento)}</span>
                        {p.contato && <span style={{ fontSize: 11, color: "#5a5570" }}>📱 {p.contato}</span>}
                        {p.obs && <span style={{ fontSize: 11, color: "#5a5570", fontStyle: "italic" }}>{p.obs}</span>}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 16, color: corPlano(p.plano), fontWeight: 700 }}>{fmtMoeda(p.valor || PLANO_VALORES[p.plano])}</div>
                      <div style={{ fontSize: 10, color: "#3a3a50" }}>por mês</div>
                      <AlertaDias dias={diasAte(p.vencimento)} />
                    </div>
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      <button onClick={() => { setFormP({ ...p }); setModalP(i); }} style={{ background: "#1a1a2a", border: "none", color: "#5a5570", borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 12 }}>✎</button>
                      <button onClick={() => setPatrocinadores(patrocinadores.filter((_, j) => j !== i))} style={{ background: "#1a0505", border: "none", color: "#f87171", borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 12 }}>✕</button>
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
                <div style={{ fontSize: 12, color: "#5a5570", marginTop: 3 }}>{membrosAtivos.length} ativos · MRR: {fmtMoeda(mrrClub)}</div>
              </div>
              <button onClick={() => { setFormM({ ...EMPTY_MEMBRO }); setModalM("new"); }} style={{ background: "#84cc1620", border: "1px solid #84cc1640", color: "#84cc16", borderRadius: 8, padding: "9px 18px", cursor: "pointer", fontSize: 13, fontFamily: "Georgia, serif" }}>+ Adicionar membro</button>
            </div>
            {membros.length === 0 ? (
              <div style={{ background: "#0d0d18", border: "1px dashed #2a2a3a", borderRadius: 14, padding: "48px", textAlign: "center" }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🏆</div>
                <div style={{ fontSize: 14, color: "#5a5570" }}>Nenhum membro cadastrado</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {membros.map((m, i) => (
                  <div key={i} style={{ background: "#0d0d18", border: "1px solid #84cc1620", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#84cc1620", border: "1px solid #84cc1640", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{m.nome?.[0]?.toUpperCase() || "?"}</div>
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
                      <div style={{ fontSize: 15, color: "#84cc16", fontWeight: 700 }}>{m.valor ? fmtMoeda(m.valor) + "/mês" : "—"}</div>
                      {m.valor && <div style={{ fontSize: 10, color: "#3a3a50" }}>{fmtMoeda(Number(m.valor) * 12)}/ano</div>}
                      <AlertaDias dias={diasAte(m.vencimento)} />
                    </div>
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      <button onClick={() => { setFormM({ ...m }); setModalM(i); }} style={{ background: "#1a1a2a", border: "none", color: "#5a5570", borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 12 }}>✎</button>
                      <button onClick={() => setMembros(membros.filter((_, j) => j !== i))} style={{ background: "#1a0505", border: "none", color: "#f87171", borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 12 }}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* IMERSÕES */}
        {aba === "imersoes" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <h2 style={{ color: "#E8E4DC", fontSize: 18, fontWeight: 400, margin: 0 }}>Imersões Avulsas</h2>
                <div style={{ fontSize: 12, color: "#5a5570", marginTop: 3 }}>Receita total: {fmtMoeda(receitaImersoes)}</div>
              </div>
              <button onClick={() => { setFormI({ ...EMPTY_IMERSAO }); setModalI("new"); }} style={{ background: "#a78bfa20", border: "1px solid #a78bfa40", color: "#a78bfa", borderRadius: 8, padding: "9px 18px", cursor: "pointer", fontSize: 13, fontFamily: "Georgia, serif" }}>+ Adicionar imersão</button>
            </div>
            {imersoes.length === 0 ? (
              <div style={{ background: "#0d0d18", border: "1px dashed #2a2a3a", borderRadius: 14, padding: "48px", textAlign: "center" }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🏛</div>
                <div style={{ fontSize: 14, color: "#5a5570" }}>Nenhuma imersão cadastrada</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {imersoes.map((im, i) => {
                  const rec = Number(im.vagasVendidas || 0) * Number(im.valorUnitario || 0);
                  const pct = im.vagas ? Math.round((Number(im.vagasVendidas || 0) / Number(im.vagas)) * 100) : 0;
                  return (
                    <div key={i} style={{ background: "#0d0d18", border: "1px solid #a78bfa25", borderRadius: 12, padding: "16px 18px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                        <div>
                          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 4, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 14, color: "#E8E4DC", fontWeight: 600 }}>{im.nome || "Sem nome"}</span>
                            <Badge status={im.status} />
                            {im.empresa && <span style={{ fontSize: 11, color: "#5a5570" }}>@ {im.empresa}</span>}
                          </div>
                          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 11, color: "#5a5570" }}>Data: {fmtData(im.data)}</span>
                            <span style={{ fontSize: 11, color: "#5a5570" }}>Valor/vaga: {fmtMoeda(im.valorUnitario)}</span>
                          </div>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div style={{ fontSize: 16, color: "#a78bfa", fontWeight: 700 }}>{fmtMoeda(rec)}</div>
                          <div style={{ fontSize: 11, color: "#5a5570" }}>{im.vagasVendidas || 0}/{im.vagas || 0} vagas</div>
                        </div>
                      </div>
                      {im.vagas > 0 && <div style={{ background: "#1a1a2a", borderRadius: 4, height: 6, overflow: "hidden" }}><div style={{ width: `${Math.min(pct, 100)}%`, height: "100%", background: "#a78bfa", borderRadius: 4 }} /></div>}
                      <div style={{ display: "flex", gap: 6, marginTop: 10, justifyContent: "flex-end" }}>
                        <button onClick={() => { setFormI({ ...im }); setModalI(i); }} style={{ background: "#1a1a2a", border: "none", color: "#5a5570", borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 12 }}>✎</button>
                        <button onClick={() => setImersoes(imersoes.filter((_, j) => j !== i))} style={{ background: "#1a0505", border: "none", color: "#f87171", borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 12 }}>✕</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* CURSOS */}
        {aba === "cursos" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <h2 style={{ color: "#E8E4DC", fontSize: 18, fontWeight: 400, margin: 0 }}>Cursos</h2>
                <div style={{ fontSize: 12, color: "#5a5570", marginTop: 3 }}>Receita total: {fmtMoeda(receitaCursos)}</div>
              </div>
              <button onClick={() => { setFormC({ ...EMPTY_CURSO }); setModalC("new"); }} style={{ background: "#38bdf820", border: "1px solid #38bdf840", color: "#38bdf8", borderRadius: 8, padding: "9px 18px", cursor: "pointer", fontSize: 13, fontFamily: "Georgia, serif" }}>+ Adicionar curso</button>
            </div>
            {cursos.length === 0 ? (
              <div style={{ background: "#0d0d18", border: "1px dashed #2a2a3a", borderRadius: 14, padding: "48px", textAlign: "center" }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🎓</div>
                <div style={{ fontSize: 14, color: "#5a5570" }}>Nenhum curso cadastrado</div>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
                {cursos.map((c, i) => {
                  const rec = Number(c.alunos || 0) * Number(c.valor || 0);
                  return (
                    <div key={i} style={{ background: "#0d0d18", border: "1px solid #38bdf825", borderRadius: 12, padding: "16px 18px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                        <div>
                          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 14, color: "#E8E4DC", fontWeight: 600 }}>{c.nome || "Sem nome"}</span>
                            <Badge status={c.status} />
                          </div>
                          <div style={{ fontSize: 11, color: "#5a5570" }}>Lançamento: {fmtData(c.lancamento)}</div>
                        </div>
                        <div style={{ fontSize: 16, color: "#38bdf8", fontWeight: 700 }}>{fmtMoeda(rec)}</div>
                      </div>
                      <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                        <div style={{ background: "#1a1a2a", borderRadius: 8, padding: "8px 12px", flex: 1, textAlign: "center" }}>
                          <div style={{ fontSize: 18, color: "#38bdf8", fontWeight: 700 }}>{c.alunos || 0}</div>
                          <div style={{ fontSize: 10, color: "#5a5570" }}>alunos</div>
                        </div>
                        <div style={{ background: "#1a1a2a", borderRadius: 8, padding: "8px 12px", flex: 1, textAlign: "center" }}>
                          <div style={{ fontSize: 18, color: "#38bdf8", fontWeight: 700 }}>{fmtMoeda(c.valor)}</div>
                          <div style={{ fontSize: 10, color: "#5a5570" }}>por aluno</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                        <button onClick={() => { setFormC({ ...c }); setModalC(i); }} style={{ background: "#1a1a2a", border: "none", color: "#5a5570", borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 12 }}>✎</button>
                        <button onClick={() => setCursos(cursos.filter((_, j) => j !== i))} style={{ background: "#1a0505", border: "none", color: "#f87171", borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 12 }}>✕</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* VENDAS AVULSAS */}
        {aba === "avulsos" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <h2 style={{ color: "#E8E4DC", fontSize: 18, fontWeight: 400, margin: 0 }}>Vendas Avulsas</h2>
                <div style={{ fontSize: 12, color: "#5a5570", marginTop: 3 }}>Qualquer receita extra que não se encaixa nas outras categorias · Total: {fmtMoeda(receitaAvulsos)}</div>
              </div>
              <button onClick={() => { setFormA({ ...EMPTY_AVULSO }); setModalA("new"); }} style={{ background: "#f472b620", border: "1px solid #f472b640", color: "#f472b6", borderRadius: 8, padding: "9px 18px", cursor: "pointer", fontSize: 13, fontFamily: "Georgia, serif" }}>+ Adicionar venda</button>
            </div>
            {avulsos.length === 0 ? (
              <div style={{ background: "#0d0d18", border: "1px dashed #2a2a3a", borderRadius: 14, padding: "48px", textAlign: "center" }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>💸</div>
                <div style={{ fontSize: 14, color: "#5a5570", marginBottom: 6 }}>Nenhuma venda avulsa cadastrada</div>
                <div style={{ fontSize: 12, color: "#3a3a50" }}>Use para consultorias, licenças de conteúdo, parcerias pontuais, etc.</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {avulsos.sort((a, b) => new Date(b.data) - new Date(a.data)).map((a, i) => (
                  <div key={i} style={{ background: "#0d0d18", border: "1px solid #f472b625", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 3, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 14, color: "#E8E4DC", fontWeight: 600 }}>{a.descricao || "Sem descrição"}</span>
                        <span style={{ fontSize: 10, color: "#f472b6", background: "#f472b615", padding: "1px 7px", borderRadius: 8 }}>{a.categoria}</span>
                      </div>
                      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 11, color: "#5a5570" }}>Data: {fmtData(a.data)}</span>
                        {a.obs && <span style={{ fontSize: 11, color: "#5a5570", fontStyle: "italic" }}>{a.obs}</span>}
                      </div>
                    </div>
                    <div style={{ fontSize: 18, color: "#f472b6", fontWeight: 700, flexShrink: 0 }}>{fmtMoeda(a.valor)}</div>
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      <button onClick={() => { setFormA({ ...a }); setModalA(i); }} style={{ background: "#1a1a2a", border: "none", color: "#5a5570", borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 12 }}>✎</button>
                      <button onClick={() => setAvulsos(avulsos.filter((_, j) => j !== i))} style={{ background: "#1a0505", border: "none", color: "#f87171", borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 12 }}>✕</button>
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
            <h2 style={{ color: "#E8E4DC", fontSize: 18, fontWeight: 400, marginBottom: 20 }}>Alertas de Renovação</h2>
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
                      <div style={{ fontSize: 11, color: "#7a4040" }}>Venceu em {fmtData(x.vencimento)} · {x.contato || "Sem contato"}</div>
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
                      </div>
                      <div style={{ fontSize: 11, color: "#5a5570" }}>Vence em {fmtData(x.vencimento)} · {x.contato || "Sem contato"}</div>
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
                  <select style={inputStyle} value={formP.plano} onChange={e => setFormP({ ...formP, plano: e.target.value, valor: PLANO_VALORES[e.target.value] || formP.valor })}>
                    {PLANOS_BASE.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div><label style={labelStyle}>VALOR (R$)/MÊS</label><input style={inputStyle} type="number" value={formP.valor} onChange={e => setFormP({ ...formP, valor: e.target.value })} placeholder={PLANO_VALORES[formP.plano] || "Valor livre"} /></div>
              </div>
              {formP.plano === "Personalizado" && (
                <div><label style={labelStyle}>NOME DO PLANO PERSONALIZADO</label><input style={inputStyle} value={formP.planoCustom} onChange={e => setFormP({ ...formP, planoCustom: e.target.value })} placeholder="Ex: Plano Exclusivo VIP" /></div>
              )}
              <div><label style={labelStyle}>STATUS</label><select style={inputStyle} value={formP.status} onChange={e => setFormP({ ...formP, status: e.target.value })}>{STATUS_OPTS.map(s => <option key={s}>{s}</option>)}</select></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div><label style={labelStyle}>DATA DE INÍCIO</label><input style={inputStyle} type="date" value={formP.inicio} onChange={e => setFormP({ ...formP, inicio: e.target.value })} /></div>
                <div><label style={labelStyle}>DATA DE VENCIMENTO</label><input style={inputStyle} type="date" value={formP.vencimento} onChange={e => setFormP({ ...formP, vencimento: e.target.value })} /></div>
              </div>
              <div><label style={labelStyle}>CONTATO</label><input style={inputStyle} value={formP.contato} onChange={e => setFormP({ ...formP, contato: e.target.value })} placeholder="Nome · WhatsApp" /></div>
              <div><label style={labelStyle}>OBSERVAÇÕES</label><input style={inputStyle} value={formP.obs} onChange={e => setFormP({ ...formP, obs: e.target.value })} /></div>
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
              <div><label style={labelStyle}>EMPRESA / NEGÓCIO</label><input style={inputStyle} value={formM.empresa} onChange={e => setFormM({ ...formM, empresa: e.target.value })} /></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={labelStyle}>VALOR MENSAL (R$)</label>
                  <input style={inputStyle} type="number" value={formM.valor} onChange={e => setFormM({ ...formM, valor: e.target.value })} placeholder="Ex: 1667" />
                  <div style={{ fontSize: 10, color: "#3a3a50", marginTop: 3 }}>Padrão: R$1.667 · Personalize se necessário</div>
                </div>
                <div><label style={labelStyle}>STATUS</label><select style={inputStyle} value={formM.status} onChange={e => setFormM({ ...formM, status: e.target.value })}>{STATUS_OPTS.map(s => <option key={s}>{s}</option>)}</select></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div><label style={labelStyle}>DATA DE ENTRADA</label><input style={inputStyle} type="date" value={formM.entrada} onChange={e => setFormM({ ...formM, entrada: e.target.value })} /></div>
                <div><label style={labelStyle}>DATA DE VENCIMENTO</label><input style={inputStyle} type="date" value={formM.vencimento} onChange={e => setFormM({ ...formM, vencimento: e.target.value })} /></div>
              </div>
              <div><label style={labelStyle}>CONTATO (WhatsApp)</label><input style={inputStyle} value={formM.contato} onChange={e => setFormM({ ...formM, contato: e.target.value })} /></div>
              <div><label style={labelStyle}>OBSERVAÇÕES</label><input style={inputStyle} value={formM.obs} onChange={e => setFormM({ ...formM, obs: e.target.value })} /></div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
              <button onClick={salvarM} style={{ flex: 1, background: "#84cc16", border: "none", color: "#000", borderRadius: 8, padding: "11px", cursor: "pointer", fontSize: 14, fontFamily: "Georgia, serif", fontWeight: 700 }}>Salvar</button>
              <button onClick={() => setModalM(null)} style={{ background: "#1a1a2a", border: "none", color: "#5a5570", borderRadius: 8, padding: "11px 18px", cursor: "pointer", fontSize: 14, fontFamily: "Georgia, serif" }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL IMERSÃO */}
      {modalI !== null && (
        <div style={{ position: "fixed", inset: 0, background: "#000000cc", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}>
          <div style={{ background: "#0d0d18", border: "1px solid #2a2a3a", borderRadius: 16, padding: "28px", width: "100%", maxWidth: 500, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
              <h3 style={{ color: "#E8E4DC", fontSize: 16, margin: 0 }}>{modalI === "new" ? "Nova Imersão Avulsa" : "Editar Imersão"}</h3>
              <button onClick={() => setModalI(null)} style={{ background: "none", border: "none", color: "#5a5570", cursor: "pointer", fontSize: 18 }}>✕</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div><label style={labelStyle}>NOME DA IMERSÃO</label><input style={inputStyle} value={formI.nome} onChange={e => setFormI({ ...formI, nome: e.target.value })} placeholder="Ex: Imersão iFood" /></div>
              <div><label style={labelStyle}>EMPRESA ANFITRIÃ</label><input style={inputStyle} value={formI.empresa} onChange={e => setFormI({ ...formI, empresa: e.target.value })} placeholder="Ex: iFood" /></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div><label style={labelStyle}>DATA</label><input style={inputStyle} type="date" value={formI.data} onChange={e => setFormI({ ...formI, data: e.target.value })} /></div>
                <div><label style={labelStyle}>STATUS</label><select style={inputStyle} value={formI.status} onChange={e => setFormI({ ...formI, status: e.target.value })}>{STATUS_OPTS.slice(0, 3).map(s => <option key={s}>{s}</option>)}</select></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <div><label style={labelStyle}>VAGAS TOTAL</label><input style={inputStyle} type="number" value={formI.vagas} onChange={e => setFormI({ ...formI, vagas: e.target.value })} placeholder="20" /></div>
                <div><label style={labelStyle}>VAGAS VENDIDAS</label><input style={inputStyle} type="number" value={formI.vagasVendidas} onChange={e => setFormI({ ...formI, vagasVendidas: e.target.value })} placeholder="15" /></div>
                <div><label style={labelStyle}>VALOR/VAGA (R$)</label><input style={inputStyle} type="number" value={formI.valorUnitario} onChange={e => setFormI({ ...formI, valorUnitario: e.target.value })} placeholder="500" /></div>
              </div>
              <div><label style={labelStyle}>OBSERVAÇÕES</label><input style={inputStyle} value={formI.obs} onChange={e => setFormI({ ...formI, obs: e.target.value })} /></div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
              <button onClick={salvarI} style={{ flex: 1, background: "#a78bfa", border: "none", color: "#fff", borderRadius: 8, padding: "11px", cursor: "pointer", fontSize: 14, fontFamily: "Georgia, serif", fontWeight: 600 }}>Salvar</button>
              <button onClick={() => setModalI(null)} style={{ background: "#1a1a2a", border: "none", color: "#5a5570", borderRadius: 8, padding: "11px 18px", cursor: "pointer", fontSize: 14, fontFamily: "Georgia, serif" }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CURSO */}
      {modalC !== null && (
        <div style={{ position: "fixed", inset: 0, background: "#000000cc", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}>
          <div style={{ background: "#0d0d18", border: "1px solid #2a2a3a", borderRadius: 16, padding: "28px", width: "100%", maxWidth: 500, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
              <h3 style={{ color: "#E8E4DC", fontSize: 16, margin: 0 }}>{modalC === "new" ? "Novo Curso" : "Editar Curso"}</h3>
              <button onClick={() => setModalC(null)} style={{ background: "none", border: "none", color: "#5a5570", cursor: "pointer", fontSize: 18 }}>✕</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div><label style={labelStyle}>NOME DO CURSO</label><input style={inputStyle} value={formC.nome} onChange={e => setFormC({ ...formC, nome: e.target.value })} placeholder="Ex: Método Power de Vendas" /></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div><label style={labelStyle}>STATUS</label><select style={inputStyle} value={formC.status} onChange={e => setFormC({ ...formC, status: e.target.value })}>{STATUS_CURSO.map(s => <option key={s}>{s}</option>)}</select></div>
                <div><label style={labelStyle}>DATA DE LANÇAMENTO</label><input style={inputStyle} type="date" value={formC.lancamento} onChange={e => setFormC({ ...formC, lancamento: e.target.value })} /></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div><label style={labelStyle}>Nº DE ALUNOS</label><input style={inputStyle} type="number" value={formC.alunos} onChange={e => setFormC({ ...formC, alunos: e.target.value })} placeholder="150" /></div>
                <div><label style={labelStyle}>VALOR POR ALUNO (R$)</label><input style={inputStyle} type="number" value={formC.valor} onChange={e => setFormC({ ...formC, valor: e.target.value })} placeholder="297" /></div>
              </div>
              <div><label style={labelStyle}>OBSERVAÇÕES</label><input style={inputStyle} value={formC.obs} onChange={e => setFormC({ ...formC, obs: e.target.value })} /></div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
              <button onClick={salvarC} style={{ flex: 1, background: "#38bdf8", border: "none", color: "#000", borderRadius: 8, padding: "11px", cursor: "pointer", fontSize: 14, fontFamily: "Georgia, serif", fontWeight: 700 }}>Salvar</button>
              <button onClick={() => setModalC(null)} style={{ background: "#1a1a2a", border: "none", color: "#5a5570", borderRadius: 8, padding: "11px 18px", cursor: "pointer", fontSize: 14, fontFamily: "Georgia, serif" }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL VENDA AVULSA */}
      {modalA !== null && (
        <div style={{ position: "fixed", inset: 0, background: "#000000cc", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}>
          <div style={{ background: "#0d0d18", border: "1px solid #2a2a3a", borderRadius: 16, padding: "28px", width: "100%", maxWidth: 500, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
              <h3 style={{ color: "#E8E4DC", fontSize: 16, margin: 0 }}>{modalA === "new" ? "Nova Venda Avulsa" : "Editar Venda"}</h3>
              <button onClick={() => setModalA(null)} style={{ background: "none", border: "none", color: "#5a5570", cursor: "pointer", fontSize: 18 }}>✕</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div><label style={labelStyle}>DESCRIÇÃO</label><input style={inputStyle} value={formA.descricao} onChange={e => setFormA({ ...formA, descricao: e.target.value })} placeholder="Ex: Consultoria para marca X" /></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={labelStyle}>CATEGORIA</label>
                  <select style={inputStyle} value={formA.categoria} onChange={e => setFormA({ ...formA, categoria: e.target.value })}>
                    {CATEGORIAS_AVULSO.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div><label style={labelStyle}>VALOR (R$)</label><input style={inputStyle} type="number" value={formA.valor} onChange={e => setFormA({ ...formA, valor: e.target.value })} placeholder="Ex: 5000" /></div>
              </div>
              <div><label style={labelStyle}>DATA</label><input style={inputStyle} type="date" value={formA.data} onChange={e => setFormA({ ...formA, data: e.target.value })} /></div>
              <div><label style={labelStyle}>OBSERVAÇÕES</label><input style={inputStyle} value={formA.obs} onChange={e => setFormA({ ...formA, obs: e.target.value })} /></div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
              <button onClick={salvarA} style={{ flex: 1, background: "#f472b6", border: "none", color: "#fff", borderRadius: 8, padding: "11px", cursor: "pointer", fontSize: 14, fontFamily: "Georgia, serif", fontWeight: 600 }}>Salvar</button>
              <button onClick={() => setModalA(null)} style={{ background: "#1a1a2a", border: "none", color: "#5a5570", borderRadius: 8, padding: "11px 18px", cursor: "pointer", fontSize: 14, fontFamily: "Georgia, serif" }}>Cancelar</button>
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
              <div><label style={labelStyle}>OBSERVAÇÕES</label><input style={inputStyle} value={formMeta.obs} onChange={e => setFormMeta({ ...formMeta, obs: e.target.value })} /></div>
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
