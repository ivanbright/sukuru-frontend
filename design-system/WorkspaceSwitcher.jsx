"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Icon from "./Icon";
import AnimatedLabel from "./AnimatedLabel";
import { refreshSession, writeStoredSession } from "../lib/session";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
const tokenBusinessId = (token) => { try { return JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))).businessId; } catch { return undefined; } };
const tokenRole = (token) => { try { return JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))).role; } catch { return ""; } };

async function authorized(path, active, options = {}) {
  let current = active;
  const headers = { ...options.headers };
  if (options.method?.toUpperCase() === "POST" && !headers["Idempotency-Key"]) {
    headers["Idempotency-Key"] = crypto.randomUUID();
  }
  const send = () => fetch(`${API}${path}`, {
    ...options,
    headers: { ...headers, Authorization: `Bearer ${current.accessToken}` },
    cache: "no-store",
  });
  let response = await send();
  if (response.status === 401 && current.refreshToken) {
    const refreshed = await refreshSession(current);
    if (refreshed?.accessToken) {
      current = refreshed;
      response = await send();
    }
  }
  const data = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.detail || data?.message || (response.status === 401 ? "Your session expired. Sign in again." : "Could not complete that request."));
  return { data, session: current };
}

export default function WorkspaceSwitcher({ session, business, onSession, onSwitched }) {
  const router = useRouter();
  const [businesses, setBusinesses] = useState([]);
  const [loadingBusinesses, setLoadingBusinesses] = useState(true);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [createDialog, setCreateDialog] = useState(false);
  const [createBusy, setCreateBusy] = useState(false);
  const [error, setError] = useState("");
  const switcherRef = useRef(null);
  const canCreate = ["owner", "OWNER"].includes(session?.role || tokenRole(session?.accessToken || ""));

  useEffect(() => {
    if (!session?.accessToken) return;
    let cancelled = false;
    const active = session.businessId ? session : { ...session, businessId: tokenBusinessId(session.accessToken) };
    if (active !== session) {
      writeStoredSession(active);
      onSession(active);
    }
    authorized("/api/v1/auth/businesses", active).then(({ data, session: current }) => {
      if (!cancelled) {
        setBusinesses(Array.isArray(data) ? data : []);
        if (current !== session) onSession(current);
      }
    }).catch((err) => { if (!cancelled) setError(err.message); }).finally(() => { if (!cancelled) setLoadingBusinesses(false); });
    return () => { cancelled = true; };
  }, [session, onSession]);

  useEffect(() => {
    if (!open) return undefined;
    const closeOnOutsideClick = (event) => {
      if (!switcherRef.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") { setOpen(false); setSearch(""); }
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  useEffect(() => {
    if (!createDialog) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape" && !createBusy) setCreateDialog(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [createDialog, createBusy]);

  async function switchTo(choice) {
    if (busy || choice.id === session?.businessId) { setOpen(false); return; }
    setBusy(true); setError("");
    try {
      const { data, session: current } = await authorized("/api/v1/auth/switch-business", session, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: choice.id }),
      });
      const next = { ...current, ...data, businessId: choice.id };
      writeStoredSession(next);
      onSession(next);
      setOpen(false);
      onSwitched?.(next);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  async function createBusiness(event) {
    event.preventDefault();
    setCreateBusy(true); setError("");
    const values = new FormData(event.currentTarget);
    const body = Object.fromEntries(["name", "businessType", "phone", "country", "currency"].map((key) => [key, String(values.get(key) || "").trim()]));
    try {
      const created = await authorized("/api/v1/business", session, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const switched = await authorized("/api/v1/auth/switch-business", created.session, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ businessId: created.data.id }),
      });
      const next = { ...switched.session, ...switched.data, businessId: created.data.id };
      writeStoredSession(next);
      if (next.email) localStorage.setItem(`sukuru-onboarding-pending:${next.email.trim().toLowerCase()}`, JSON.stringify({ businessId: created.data.id, step: 0 }));
      onSession(next);
      onSwitched?.(next);
      router.push("/");
    } catch (err) { setError(err.message || "Could not create this business."); }
    finally { setCreateBusy(false); }
  }

  const filteredBusinesses = businesses.filter((choice) => `${choice.name || ""} ${choice.businessType || ""}`.toLowerCase().includes(search.trim().toLowerCase()));

  return <div className="workspace-switcher" ref={switcherRef}>
    <button className="workspace" type="button" aria-haspopup="dialog" aria-controls="workspace-menu" aria-expanded={open} onClick={() => { setError(""); setSearch(""); setOpen(!open); }}>
      <span className="workspace-avatar">{(business?.name || "S").slice(0, 1).toUpperCase()}</span>
      <span><strong>{business?.name || "Your business"}</strong><small>{business?.businessType || "BUSINESS WORKSPACE"}</small></span>
      <span className={`chevron ${open ? "expanded" : ""}`}><Icon name="chevronDown" size={14} /></span>
    </button>
    {open && <div className="workspace-menu" id="workspace-menu" role="dialog" aria-label="Choose a workspace">
      <div className="workspace-menu-heading"><div><p className="section-kicker">WORKSPACE</p><strong>Switch business</strong></div><span>{businesses.length}</span></div>
      {businesses.length > 3 && <label className="workspace-search"><span aria-hidden="true">⌕</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find a business" aria-label="Find a business" /></label>}
      <div className="workspace-options" aria-label="Your businesses">
        {loadingBusinesses && <p className="workspace-empty">Loading your workspaces…</p>}
        {!loadingBusinesses && filteredBusinesses.map((choice) => <button key={choice.id} type="button" aria-pressed={choice.id === session?.businessId} disabled={busy} className={`workspace-option ${choice.id === session?.businessId ? "current" : ""}`} onClick={() => switchTo(choice)}>
          <span className="workspace-option-mark">{choice.name?.slice(0, 1).toUpperCase() || "W"}</span><span className="workspace-option-copy"><strong>{choice.name || "Unnamed business"}</strong><small>Business workspace</small></span>{choice.id === session?.businessId ? <span className="workspace-current">Current</span> : <Icon name="arrowRight" size={14} />}
        </button>)}
        {!loadingBusinesses && businesses.length <= 1 && !error && <p className="workspace-empty">No other businesses are linked to this account yet.</p>}
        {!loadingBusinesses && businesses.length > 0 && filteredBusinesses.length === 0 && <p className="workspace-empty">No businesses match “{search}”.</p>}
      </div>
      {busy && <p className="workspace-switching"><i /> Switching workspace…</p>}
      {error && <p className="workspace-error" role="alert">{error}</p>}
      {canCreate && <button type="button" className="workspace-add button button-outline" onClick={() => { setOpen(false); setCreateDialog(true); setError(""); }}><Icon name="plus" size={14} /><AnimatedLabel>Add a workspace</AnimatedLabel></button>}
    </div>}
    {createDialog && createPortal(<div className="modal-backdrop workspace-create-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !createBusy) setCreateDialog(false); }}>
      <section className="entry-modal workspace-create-dialog" role="dialog" aria-modal="true" aria-labelledby="workspace-create-heading">
        <button className="dialog-x" type="button" aria-label="Close dialog" disabled={createBusy} onClick={() => { setCreateDialog(false); setError(""); }}><Icon name="close" size={15} /></button>
        <p className="section-kicker">NEW WORKSPACE</p>
        <h2 id="workspace-create-heading">Create a workspace</h2>
        <p className="dialog-sub">Set up another business under this account. Its products, sales, and settings stay in their own workspace.</p>
        <form className="form-stack" onSubmit={createBusiness}>
          <label>Business name<input name="name" required maxLength={150} autoFocus /></label>
          <label>Business type<input name="businessType" maxLength={100} placeholder="Shop, salon, cafe" /></label>
          <label>Phone<input name="phone" maxLength={30} autoComplete="tel" /></label>
          <div className="form-split"><label>Country<input name="country" maxLength={100} defaultValue="Rwanda" /></label><label>Currency<input name="currency" maxLength={10} defaultValue="RWF" /></label></div>
          {error && <p className="error-message" role="alert">{error}</p>}
          <div className="workspace-create-actions"><button type="button" className="button button-outline" disabled={createBusy} onClick={() => { setCreateDialog(false); setError(""); }}>Cancel</button><button className="primary-button" disabled={createBusy}>{createBusy ? "Creating workspace" : <AnimatedLabel>Create workspace</AnimatedLabel>}</button></div>
        </form>
      </section>
    </div>, document.body)}
  </div>;
}
