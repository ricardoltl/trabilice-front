import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { diffLines } from "diff";
import { useTutorialAutoStart } from "../../components/AliceTutorial";
import api, { describeError } from "../../services/api";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

interface LessonPlan {
  id: string;
  classroom_id: string;
  classroom_name: string;
  title: string;
  topic: string;
  content: string;
  pending_content: string | null;
  lesson_date: string | null;
  notes: string | null;
  updated_at: string;
  messages: Message[];
}

function formatRelativeDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function DiffView({ oldText, newText }: { oldText: string; newText: string }) {
  const parts = useMemo(() => diffLines(oldText || "", newText || ""), [oldText, newText]);

  return (
    <div className="diff-container">
      {parts.map((part, idx) => {
        const cls = part.added ? "added" : part.removed ? "removed" : "context";
        const prefix = part.added ? "+ " : part.removed ? "- " : "  ";
        const lines = part.value.replace(/\n$/, "").split("\n");
        return lines.map((line, i) => (
          <div key={`${idx}-${i}`} className={`diff-line ${cls}`}>
            {prefix}
            {line || "\u00A0"}
          </div>
        ));
      })}
    </div>
  );
}

export default function LessonPlanCopilot() {
  useTutorialAutoStart("teacher-lesson-plan");
  const { id } = useParams();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<LessonPlan | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [editingContent, setEditingContent] = useState(false);
  const [draftContent, setDraftContent] = useState("");
  const [savingMeta, setSavingMeta] = useState(false);
  const [decidingPending, setDecidingPending] = useState(false);
  const [lessonDate, setLessonDate] = useState("");
  const [notes, setNotes] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    load();
  }, [id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [plan?.messages.length, sending]);

  async function load() {
    try {
      const { data } = await api.get(`/lesson-plans/${id}`);
      setPlan(data);
      setDraftContent(data.content || "");
      setLessonDate(data.lesson_date || "");
      setNotes(data.notes || "");
    } catch {
      navigate("/teacher");
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || sending || !plan) return;

    const msg = input.trim();
    setInput("");
    setSending(true);

    const optimisticUser: Message = {
      id: `tmp-${Date.now()}`,
      role: "user",
      content: msg,
      created_at: new Date().toISOString(),
    };
    setPlan({ ...plan, messages: [...plan.messages, optimisticUser] });

    try {
      const { data } = await api.post(`/lesson-plans/${id}/messages`, { message: msg });
      setPlan((prev) =>
        prev
          ? {
              ...prev,
              content: data.content,
              pending_content: data.pending_content,
              updated_at: data.updated_at,
              messages: [...prev.messages, data.assistantMessage],
            }
          : prev
      );
      inputRef.current?.focus();
    } catch (err: any) {
      setPlan((prev) =>
        prev
          ? { ...prev, messages: prev.messages.filter((m) => m.id !== optimisticUser.id) }
          : prev
      );
      setInput(msg);
      alert(describeError(err));
    } finally {
      setSending(false);
    }
  }

  async function acceptChanges() {
    if (!plan) return;
    setDecidingPending(true);
    try {
      const { data } = await api.post(`/lesson-plans/${id}/accept-changes`);
      setPlan(data);
      setDraftContent(data.content);
    } catch (err: any) {
      alert(describeError(err));
    } finally {
      setDecidingPending(false);
    }
  }

  async function rejectChanges() {
    if (!plan) return;
    setDecidingPending(true);
    try {
      const { data } = await api.post(`/lesson-plans/${id}/reject-changes`);
      setPlan(data);
    } catch (err: any) {
      alert(describeError(err));
    } finally {
      setDecidingPending(false);
    }
  }

  async function saveContent() {
    if (!plan) return;
    try {
      const { data } = await api.put(`/lesson-plans/${id}`, { content: draftContent });
      setPlan(data);
      setEditingContent(false);
    } catch (err: any) {
      alert(describeError(err));
    }
  }

  async function saveMeta() {
    if (!plan) return;
    setSavingMeta(true);
    try {
      const { data } = await api.put(`/lesson-plans/${id}`, {
        lesson_date: lessonDate || null,
        notes: notes || null,
      });
      setPlan(data);
    } catch (err: any) {
      alert(describeError(err));
    } finally {
      setSavingMeta(false);
    }
  }

  if (!plan) return <div className="loading">Carregando...</div>;

  const hasPending = !!plan.pending_content;

  return (
    <>
      <div className="nav-bar nav-bar-centered">
        <button className="back-btn" onClick={() => navigate(`/teacher/classroom/${plan.classroom_id}`)}>
          ← Voltar
        </button>
        <h2 style={{ textAlign: "center", maxWidth: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {plan.title}
        </h2>
        <span></span>
      </div>

      <div className="copilot-page">
        <div className="copilot-meta-bar" data-tutorial-id="copilot-meta">
          <span className="meta-chip">
            <span>📚</span>
            {plan.classroom_name}
          </span>
          <label style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: "0.8rem" }}>📅 Data da aula:</span>
            <input
              type="date"
              value={lessonDate}
              onChange={(e) => setLessonDate(e.target.value)}
              onBlur={saveMeta}
            />
          </label>
          <span style={{ marginLeft: "auto", fontSize: "0.8rem", opacity: 0.8 }}>
            Atualizado em {formatRelativeDate(plan.updated_at)}
          </span>
        </div>

        <div className="copilot-grid">
          {/* CHAT PANEL */}
          <div className="copilot-panel chat-panel" data-tutorial-id="copilot-chat">
            <div className="copilot-panel-header">
              <div className="copilot-panel-title">
                <span className="dot-live" />
                Copiloto
              </div>
              <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                {plan.messages.length} mensage{plan.messages.length === 1 ? "m" : "ns"}
              </span>
            </div>

            <div className="copilot-chat-messages">
              {plan.messages.length === 0 && !sending && (
                <div className="copilot-empty">
                  Converse com o copiloto para refinar o plano.
                  <br />
                  <span className="hint">
                    Ex: "adicione uma dinâmica em grupo" · "torne mais simples para 6º ano" · "sugira uma avaliação rápida"
                  </span>
                </div>
              )}
              {plan.messages.map((m) => (
                <div key={m.id} className={`copilot-msg ${m.role}`}>
                  {m.content}
                </div>
              ))}
              {sending && (
                <div className="copilot-msg assistant typing">
                  <span /><span /><span />
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form className="copilot-input-bar" onSubmit={handleSend}>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Peça um ajuste ou dê mais contexto..."
                disabled={sending}
              />
              <button className="btn btn-primary btn-small" type="submit" disabled={sending || !input.trim()}>
                Enviar
              </button>
            </form>
          </div>

          {/* PLAN PANEL */}
          <div className="copilot-panel" data-tutorial-id="copilot-plan">
            <div className="copilot-panel-header">
              <div className="copilot-panel-title">📄 Plano de aula</div>
              {editingContent ? (
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    className="btn btn-secondary btn-small"
                    onClick={() => {
                      setDraftContent(plan.content);
                      setEditingContent(false);
                    }}
                  >
                    Cancelar
                  </button>
                  <button className="btn btn-primary btn-small" onClick={saveContent}>
                    Salvar
                  </button>
                </div>
              ) : (
                <button
                  className="btn btn-secondary btn-small"
                  onClick={() => setEditingContent(true)}
                  disabled={!plan.content || hasPending}
                  title={hasPending ? "Decida as alterações pendentes primeiro" : ""}
                >
                  ✏️ Editar manualmente
                </button>
              )}
            </div>

            {hasPending && !editingContent && (
              <div className="copilot-pending-banner">
                <span className="banner-text">
                  ✨ O copiloto propôs alterações. Revise o diff e decida.
                </span>
                <div className="banner-actions">
                  <button
                    className="btn btn-secondary btn-small"
                    onClick={rejectChanges}
                    disabled={decidingPending}
                  >
                    Descartar
                  </button>
                  <button
                    className="btn btn-primary btn-small"
                    onClick={acceptChanges}
                    disabled={decidingPending}
                  >
                    {decidingPending ? "..." : "Aceitar"}
                  </button>
                </div>
              </div>
            )}

            <div className="copilot-plan-body">
              {editingContent ? (
                <textarea
                  value={draftContent}
                  onChange={(e) => setDraftContent(e.target.value)}
                  autoFocus
                />
              ) : hasPending ? (
                <DiffView oldText={plan.content} newText={plan.pending_content!} />
              ) : plan.content ? (
                <div className="markdown-body">
                  <ReactMarkdown>{plan.content}</ReactMarkdown>
                </div>
              ) : (
                <div className="copilot-plan-empty">
                  O plano ainda está vazio.
                  <br />
                  Converse com o copiloto à esquerda para começar.
                </div>
              )}
            </div>

            <div className="copilot-notes-bar">
              <label>📝 Notas:</label>
              <input
                placeholder="Anote lembretes, materiais, observações..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={saveMeta}
              />
              {savingMeta && <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>salvando...</span>}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
