"use client";

import AnimatedLabel from "../design-system/AnimatedLabel";
import Icon from "../design-system/Icon";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PasswordField from "../design-system/PasswordField";
import WorkspaceSwitcher from "../design-system/WorkspaceSwitcher";
import { endSession, readStoredSession, refreshSession } from "../lib/session";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
const getStoredSession = readStoredSession;
const tokenBusinessId = (token) => { try { return JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))).businessId; } catch { return undefined; } };
const tokenRole = (token) => { try { const claims = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))); return claims.role || claims.roles?.[0] || ""; } catch { return ""; } };
const money = (value, currency = "RWF") => {
  const amount = Number(value || 0);
  try { return new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount); }
  catch { return `${currency} ${amount.toFixed(2)}`; }
};
const methodMap = { cash: "cash", mobile_money: "mobile_money", bank_transfer: "bank_transfer", other: "other" };
const localDate = (date) => new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(new Date(date));

async function request(path, { token, method = "GET", body, idempotent = false, idempotencyKey } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (idempotent) headers["Idempotency-Key"] = idempotencyKey || crypto.randomUUID();
  const send = async (authorization) => fetch(`${API}${path}`, {
    method,
    headers: { ...headers, ...(authorization ? { Authorization: `Bearer ${authorization}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  let response;
  try { response = await send(token); }
  catch {
    throw new Error("Can't reach the Sukuru API. Check that the backend is running, then try again.");
  }
  if (response.status === 401 && token && path !== "/api/v1/auth/refresh") {
    const stored = getStoredSession();
    if (stored?.accessToken && stored.accessToken !== token) response = await send(stored.accessToken);
    else {
      const rotated = await rotateSessionToken();
      if (rotated?.accessToken) response = await send(rotated.accessToken);
    }
  }
  if (!response.ok) {
    let details;
    try { details = await response.json(); } catch { details = null; }
    if (response.status === 401) {
      if (path === "/api/v1/auth/login") throw Object.assign(new Error(details?.message || details?.detail || "Email or password is incorrect. Please try again."), { status: 401 });
      if (!token) throw Object.assign(new Error(details?.message || details?.detail || "This request could not be authorized."), { status: 401 });
      throw Object.assign(new Error("Your saved session has expired. Please sign in again."), { unauthorized: true });
    }
    throw Object.assign(new Error(details?.message || details?.detail || `Request failed (${response.status})`), { status: response.status });
  }
  if (response.status === 204) return null;
  return response.json();
}

function rotateSessionToken() {
  return refreshSession(readStoredSession());
}

export default function Home() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [business, setBusiness] = useState(null);
  const [summary, setSummary] = useState(null);
  const [products, setProducts] = useState([]);
  const [stock, setStock] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [backendConnected, setBackendConnected] = useState(false);
  const [aiBetaOpen, setAiBetaOpen] = useState(true);
  const [toast, setToast] = useState("");
  const [modal, setModal] = useState("");
  const [pendingOperation, setPendingOperation] = useState(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [onboardingPending, setOnboardingPending] = useState(false);
  const [login, setLogin] = useState({ email: "", password: "", businessId: "" });
  const [authMode, setAuthMode] = useState("login");
  const [authNotice, setAuthNotice] = useState("");
  const [registration, setRegistration] = useState({ businessName: "", businessType: "", phone: "", country: "Rwanda", fullName: "", email: "", password: "" });
  const [businessChoices, setBusinessChoices] = useState([]);
  const [entry, setEntry] = useState({ productId: "", quantity: "1", paymentMethod: "cash", notes: "" });
  const [purchase, setPurchase] = useState({ productId: "", quantity: "1", unitCost: "", paymentMethod: "cash", supplierId: "" });
  const [saleRequestKey, setSaleRequestKey] = useState("");
  const [purchaseRequestKey, setPurchaseRequestKey] = useState("");
  const dashboardLoadId = useRef(0);

  const notify = useCallback((message) => { setToast(message); window.setTimeout(() => setToast(""), 3200); }, []);

  const signOut = useCallback(() => {
    const current = readStoredSession();
    endSession(current);
    setSession(null); setBusiness(null); setSummary(null); setProducts([]); setStock([]); setSales([]); setBackendConnected(false);
  }, []);

  const loadDashboard = useCallback(async (activeSession) => {
    const loadId = ++dashboardLoadId.current;
    setLoading(true); setError("");
    const from = new Date(); from.setHours(0, 0, 0, 0);
    const to = new Date(); to.setHours(23, 59, 59, 999);
    const q = new URLSearchParams({ from: from.toISOString(), to: to.toISOString() });
    const role = String(activeSession.role || tokenRole(activeSession.accessToken)).replace(/^ROLE_/i, "").toLowerCase();
    const canViewReports = role === "owner" || role === "manager";
    try {
      const results = await Promise.allSettled([
        request("/api/v1/business", { token: activeSession.accessToken }),
        canViewReports ? request(`/api/v1/reports/summary?${q}`, { token: activeSession.accessToken }) : Promise.resolve(null),
        request("/api/v1/products?isActive=true&page=0&size=100", { token: activeSession.accessToken }),
        request("/api/v1/inventory/stock?page=0&size=100", { token: activeSession.accessToken }),
        request("/api/v1/sales?page=0&size=10", { token: activeSession.accessToken }),
      ]);
      if (loadId !== dashboardLoadId.current) return;
      const [businessResult, summaryResult, productsResult, stockResult, salesResult] = results;
      const unauthorized = results.find((result) => result.status === "rejected" && result.reason?.unauthorized);
      if (unauthorized) {
        signOut(); setError(""); setAuthNotice("Your previous session ended. Sign in to continue."); return;
      }
      setBusiness(businessResult.status === "fulfilled" ? businessResult.value : null);
      setBackendConnected(businessResult.status === "fulfilled");
      setSummary(summaryResult.status === "fulfilled" ? summaryResult.value : null);
      setProducts(productsResult.status === "fulfilled" ? productsResult.value.items || [] : []);
      setStock(stockResult.status === "fulfilled" ? stockResult.value.items || [] : []);
      setSales(salesResult.status === "fulfilled" ? salesResult.value.items || [] : []);
      const failures = results.filter((result) => result.status === "rejected");
      if (failures.length) {
        const messages = [...new Set(failures.map((result) => result.reason?.message || "Some dashboard data could not be loaded."))];
        setError(messages.join(" "));
      }
    } catch (err) {
      if (loadId !== dashboardLoadId.current) return;
      if (err.unauthorized) { signOut(); setError(""); setAuthNotice("Your previous session ended. Sign in to continue."); }
      else { setBackendConnected(false); setError(err.message); }
    } finally { if (loadId === dashboardLoadId.current) setLoading(false); }
  }, [signOut]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const stored = getStoredSession();
      if (stored?.accessToken) {
        setSession(stored); loadDashboard(stored);
        try {
          const setup = JSON.parse(localStorage.getItem(`sukuru-onboarding-pending:${stored.email?.trim().toLowerCase()}`) || "null");
          setOnboardingPending(Boolean(setup && !setup.complete && (!stored.businessId || setup.businessId === stored.businessId)));
        } catch { setOnboardingPending(false); }
        const action = new URLSearchParams(window.location.search).get("action");
        if (action === "sale" || action === "purchase") setModal(action);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadDashboard]);
  useEffect(() => {
    const synchronizeSession = (event) => {
      if (event.key !== "sukuru-session") return;
      if (!event.newValue) {
        setSession(null); setBusiness(null); setSummary(null); setProducts([]); setStock([]); setSales([]); setBackendConnected(false);
        return;
      }
      try {
        const next = JSON.parse(event.newValue);
        if (!next?.accessToken) return;
        setSession(next);
        if (next.businessId !== session?.businessId) loadDashboard(next);
      } catch { /* ignore invalid data written by another tab */ }
    };
    window.addEventListener("storage", synchronizeSession);
    return () => window.removeEventListener("storage", synchronizeSession);
  }, [loadDashboard, session?.businessId]);
  useEffect(() => {
    const onShortcut = (event) => {
      if (event.key === "Escape" && modal && !loading && !pendingOperation) {
        event.preventDefault();
        setModal("");
        return;
      }
      if (session && (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault(); setError(""); setModal("sale");
      }
    };
    window.addEventListener("keydown", onShortcut);
    return () => window.removeEventListener("keydown", onShortcut);
  }, [session, modal, loading, pendingOperation]);

  async function submitLogin(event) {
    event.preventDefault(); setLoading(true); setError(""); setAuthNotice("");
    try {
      const result = await request("/api/v1/auth/login", { method: "POST", body: { email: login.email, password: login.password, businessId: login.businessId || null } });
      if (result.requiresBusinessSelection) { setBusinessChoices(result.businesses || []); setLoading(false); return; }
      let pendingSetup = null;
      try { pendingSetup = JSON.parse(localStorage.getItem(`sukuru-onboarding-pending:${login.email.trim().toLowerCase()}`) || "null"); } catch { /* setup can be started from dashboard if needed */ }
      const setupMatchesBusiness = !login.businessId || !pendingSetup?.businessId || pendingSetup.businessId === login.businessId;
      const activeSession = { ...result, businessId: login.businessId || pendingSetup?.businessId || tokenBusinessId(result.accessToken), email: login.email };
      localStorage.setItem("sukuru-session", JSON.stringify(activeSession)); setSession(activeSession); setBusinessChoices([]);
      if (setupMatchesBusiness && pendingSetup && !pendingSetup.complete && !pendingSetup.deferred) { router.push("/onboarding"); return; }
      setOnboardingPending(Boolean(setupMatchesBusiness && pendingSetup && !pendingSetup.complete)); loadDashboard(activeSession);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  async function submitRegistration(event) {
    event.preventDefault(); setLoading(true); setError(""); setAuthNotice("");
    try {
      const created = await request("/api/v1/auth/register-business", { method: "POST", body: {
        businessName: registration.businessName,
        businessType: registration.businessType || null,
        phone: registration.phone || null,
        country: registration.country || null,
        fullName: registration.fullName,
        email: registration.email,
        password: registration.password,
      } });
      localStorage.setItem(`sukuru-onboarding-pending:${registration.email.trim().toLowerCase()}`, JSON.stringify({ businessId: created.businessId, step: 0 }));
      try {
        const signedIn = await request("/api/v1/auth/login", { method: "POST", body: {
          email: registration.email, password: registration.password, businessId: created.businessId,
        } });
        if (signedIn.requiresBusinessSelection) throw new Error("Your account was created. Sign in and choose your business to continue.");
        localStorage.setItem("sukuru-session", JSON.stringify({ ...signedIn, businessId: created.businessId, email: registration.email, user: { id: created.userId, fullName: registration.fullName } }));
        setRegistration((current) => ({ ...current, password: "" }));
        router.push("/onboarding");
      } catch (signInError) {
        setRegistration((current) => ({ ...current, password: "" }));
        setLogin({ email: registration.email, password: "", businessId: "" });
        setAuthMode("login");
        setAuthNotice(`Your business account is ready. Sign in to continue setup. ${signInError.message}`);
      }
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  async function saveSale(event) {
    event.preventDefault(); setError(""); setLoading(true);
    let createdSale = null;
    try {
      const product = products.find((item) => item.id === entry.productId);
      if (!product) throw new Error("Choose a product first.");
      const qty = Number(entry.quantity);
      if (!qty || qty <= 0) throw new Error("Enter a quantity greater than zero.");
      const saleKey = saleRequestKey || crypto.randomUUID();
      setSaleRequestKey(saleKey);
      createdSale = await request("/api/v1/sales", { token: session.accessToken, method: "POST", idempotent: true, idempotencyKey: saleKey,
        body: { notes: entry.notes || null, items: [{ productId: product.id, quantity: String(qty), unitPrice: product.sellingPrice }] } });
      setSaleRequestKey("");
      const paymentKey = crypto.randomUUID();
      setPendingOperation({ kind: "sale-payment", id: createdSale.id, amount: createdSale.totalAmount, paymentMethod: entry.paymentMethod, reference: createdSale.referenceNumber, idempotencyKey: paymentKey });
      await request(`/api/v1/sales/${createdSale.id}/payments`, { token: session.accessToken, method: "POST", idempotent: true, idempotencyKey: paymentKey,
        body: { amount: createdSale.totalAmount, paymentMethod: methodMap[entry.paymentMethod] || "cash" } });
      setPendingOperation(null);
      setModal(""); setEntry({ productId: "", quantity: "1", paymentMethod: "cash", notes: "" });
      notify(`Sale ${createdSale.referenceNumber} recorded.`); loadDashboard(session);
    } catch (err) {
      if (err.unauthorized) signOut();
      if (!createdSale && err.status && err.status < 500) setSaleRequestKey("");
      setError(createdSale ? `Sale ${createdSale.referenceNumber} was created, but its payment did not save. Retry the payment below; do not submit the sale again.` : err.message);
      if (createdSale) loadDashboard(session);
    } finally { setLoading(false); }
  }

  async function savePurchase(event) {
    event.preventDefault(); setError(""); setLoading(true);
    let draft = null;
    let received = null;
    let productName = "";
    try {
      const product = products.find((item) => item.id === purchase.productId);
      if (!product) throw new Error("Choose a product first.");
      productName = product.name;
      const qty = Number(purchase.quantity); const cost = Number(purchase.unitCost || product.purchasePrice);
      if (!qty || qty <= 0 || !cost || cost <= 0) throw new Error("Enter a valid quantity and unit cost.");
      const createKey = purchaseRequestKey || crypto.randomUUID();
      setPurchaseRequestKey(createKey);
      draft = await request("/api/v1/purchases", { token: session.accessToken, method: "POST", idempotent: true, idempotencyKey: createKey,
        body: { supplierId: purchase.supplierId || null, notes: "Quick restock", items: [{ productId: product.id, quantity: String(qty), unitCost: String(cost) }] } });
      setPurchaseRequestKey("");
      const receiveKey = crypto.randomUUID();
      setPendingOperation({ kind: "purchase-receive", id: draft.id, paymentMethod: purchase.paymentMethod, reference: draft.referenceNumber, productName, idempotencyKey: receiveKey });
      received = await request(`/api/v1/purchases/${draft.id}/receive`, { token: session.accessToken, method: "POST", idempotent: true, idempotencyKey: receiveKey });
      const amount = received.totalAmount || String(qty * cost);
      const paymentKey = crypto.randomUUID();
      setPendingOperation({ kind: "purchase-payment", id: draft.id, amount, paymentMethod: purchase.paymentMethod, reference: draft.referenceNumber, productName, idempotencyKey: paymentKey });
      await request(`/api/v1/purchases/${draft.id}/payments`, { token: session.accessToken, method: "POST", idempotent: true, idempotencyKey: paymentKey,
        body: { amount, paymentMethod: methodMap[purchase.paymentMethod] || "cash" } });
      setPendingOperation(null);
      setModal(""); setPurchase({ productId: "", quantity: "1", unitCost: "", paymentMethod: "cash", supplierId: "" });
      notify(`Restock for ${product.name} received and recorded.`); loadDashboard(session);
    } catch (err) {
      if (err.unauthorized) signOut();
      if (!draft && err.status && err.status < 500) setPurchaseRequestKey("");
      if (draft) {
        if (!received) setPendingOperation((current) => current || { kind: "purchase-receive", id: draft.id, paymentMethod: purchase.paymentMethod, reference: draft.referenceNumber, productName, idempotencyKey: crypto.randomUUID() });
        setError(received ? `Stock for ${productName} was received, but its payment did not save. Retry the payment below; do not create another restock.` : `Purchase ${draft.referenceNumber || ""} was created, but stock was not received. Retry receiving it below; do not create another restock.`);
        loadDashboard(session);
      } else setError(err.message);
    } finally { setLoading(false); }
  }

  async function resumePendingOperation() {
    if (!pendingOperation) return;
    const operation = pendingOperation;
    setLoading(true); setError("");
    try {
      if (operation.kind === "sale-payment") {
        await request(`/api/v1/sales/${operation.id}/payments`, { token: session.accessToken, method: "POST", idempotent: true, idempotencyKey: operation.idempotencyKey,
          body: { amount: operation.amount, paymentMethod: methodMap[operation.paymentMethod] || "cash" } });
        notify(`Payment for sale ${operation.reference} recorded.`);
      } else if (operation.kind === "purchase-receive") {
        const received = await request(`/api/v1/purchases/${operation.id}/receive`, { token: session.accessToken, method: "POST", idempotent: true, idempotencyKey: operation.idempotencyKey });
        const paymentKey = crypto.randomUUID();
        setPendingOperation({ ...operation, kind: "purchase-payment", amount: received.totalAmount, idempotencyKey: paymentKey });
        await request(`/api/v1/purchases/${operation.id}/payments`, { token: session.accessToken, method: "POST", idempotent: true, idempotencyKey: paymentKey,
          body: { amount: received.totalAmount, paymentMethod: methodMap[operation.paymentMethod] || "cash" } });
        notify(`Restock for ${operation.productName} received and paid.`);
      } else {
        await request(`/api/v1/purchases/${operation.id}/payments`, { token: session.accessToken, method: "POST", idempotent: true, idempotencyKey: operation.idempotencyKey,
          body: { amount: operation.amount, paymentMethod: methodMap[operation.paymentMethod] || "cash" } });
        notify(`Payment for restock ${operation.reference || ""} recorded.`);
      }
      setPendingOperation(null); setModal(""); loadDashboard(session);
    } catch (err) { if (err.unauthorized) signOut(); setError(err.message); }
    finally { setLoading(false); }
  }

  const currency = business?.currency || "RWF";
  const greeting = "Good to see you";
  const firstName = session?.user?.fullName?.trim().split(/\s+/)[0];
  const stockByProduct = useMemo(() => new Map(stock.map((item) => [item.productId, Number(item.quantity)])), [stock]);
  const lowStock = stock.filter((item) => Number(item.quantity) <= 5).slice(0, 3);

  useEffect(() => {
    const businessName = business?.name?.trim();
    document.title = session
      ? `${businessName ? `${businessName} · ` : ""}Overview · Sukuru`
      : `${authMode === "register" ? "Create account" : "Sign in"} · Sukuru`;
  }, [session, business?.name, authMode]);

  if (!session) return (
    <main className="auth-page">
      <div className="auth-aside">
        <Link className="brand" href="/"><span className="brand-mark">S</span>sukuru</Link>
        <div className="auth-message">
          <span className="eyebrow"><i /> MADE FOR THE MARKET RUSH</span>
          <h1>Stay with your customers.<br />We&apos;ll keep the books.</h1>
          <p>A quick business assistant for the moments between customers.</p>
          <div className="auth-proof"><Icon name="spark" size={17} /> Your business, in good hands.</div>
        </div>
        <small className="auth-foot">SALES / STOCK / SIMPLE RECORDS</small>
      </div>
      <section className="auth-card">
        <p className="section-kicker">{authMode === "login" ? "WELCOME BACK" : "GET STARTED"}</p>
        <h2>{authMode === "login" ? "Sign in to your shop" : "Create your business account"}</h2>
        <p className="auth-sub">{authMode === "login" ? "Use your Sukuru account to see your business activity." : "Set up your shop and start keeping clear records."}</p>
        {authMode === "login" ? (
          <form onSubmit={submitLogin} className="form-stack">
            <label>Email address<input required type="email" autoComplete="username" value={login.email} onChange={(e) => setLogin({ ...login, email: e.target.value })} /></label>
            <label htmlFor="login-password">Password<PasswordField id="login-password" required autoComplete="current-password" value={login.password} onChange={(e) => setLogin({ ...login, password: e.target.value })} /></label>
            {businessChoices.length > 0 && <><label>Choose your business<select required value={login.businessId} onChange={(e) => setLogin({ ...login, businessId: e.target.value })}><option value="">Select a business</option>{businessChoices.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></label><button type="button" className="text-button" onClick={() => { if (!login.businessId) { setError("Choose your business first."); return; } submitLogin({ preventDefault() {} }); }}>Continue with selected business <Icon name="arrowRight" size={13} /></button></>}
            {authNotice && <p className="success-message">{authNotice}</p>}
            {error && <p className="error-message">{error}</p>}
            <button className="primary-button full" disabled={loading}>{loading ? <AnimatedLabel>Connecting</AnimatedLabel> : <AnimatedLabel>Sign in</AnimatedLabel>}</button>
            <p className="auth-switch">New to Sukuru? <button type="button" onClick={() => { setAuthMode("register"); setError(""); setAuthNotice(""); }}>Create an account</button></p>
          </form>
        ) : (
          <form onSubmit={submitRegistration} className="form-stack register-form">
            <label>Your name<input required maxLength={150} autoComplete="name" value={registration.fullName} onChange={(e) => setRegistration({ ...registration, fullName: e.target.value })} /></label>
            <label>Business name<input required maxLength={150} autoComplete="organization" value={registration.businessName} onChange={(e) => setRegistration({ ...registration, businessName: e.target.value })} /></label>
            <div className="form-split"><label>Business type<input maxLength={100} placeholder="e.g. Market stall" value={registration.businessType} onChange={(e) => setRegistration({ ...registration, businessType: e.target.value })} /></label><label>Phone<input maxLength={30} autoComplete="tel" value={registration.phone} onChange={(e) => setRegistration({ ...registration, phone: e.target.value })} /></label></div>
            <div className="form-split"><label>Country<input maxLength={100} value={registration.country} onChange={(e) => setRegistration({ ...registration, country: e.target.value })} /></label><label>Email address<input required type="email" maxLength={150} autoComplete="email" value={registration.email} onChange={(e) => setRegistration({ ...registration, email: e.target.value })} /></label></div>
            <label htmlFor="register-password">Password<PasswordField id="register-password" required minLength={10} maxLength={200} autoComplete="new-password" value={registration.password} onChange={(e) => setRegistration({ ...registration, password: e.target.value })} showStrength /><small className="field-hint">Use at least 10 characters.</small></label>
            {error && <p className="error-message">{error}</p>}
            <button className="primary-button full" disabled={loading}>{loading ? "Creating account..." : <AnimatedLabel>Create business account</AnimatedLabel>}</button>
            <p className="auth-switch">Already have an account? <button type="button" onClick={() => { setAuthMode("login"); setError(""); }}>Sign in</button></p>
          </form>
        )}
        <p className="auth-support">Need a hand? <a href="mailto:support@cursorclick.dev?subject=Sukuru%20support">Contact support</a></p>
      </section>
    </main>
  );

  return <div className="app-shell">{mobileNav && <button className="workspace-nav-scrim" aria-label="Close navigation" onClick={() => setMobileNav(false)} />}<aside className={`sidebar ${mobileNav ? "open" : ""}`}><Link className="brand" href="/"><span className="brand-mark">S</span>sukuru</Link><WorkspaceSwitcher session={session} business={business} onSession={setSession} onSwitched={(next) => { setBusiness(null); setSummary(null); setProducts([]); setStock([]); setSales([]); loadDashboard(next); try { const setup = JSON.parse(localStorage.getItem(`sukuru-onboarding-pending:${next.email?.trim().toLowerCase()}`) || "null"); setOnboardingPending(Boolean(setup && !setup.complete && setup.businessId === next.businessId)); } catch { setOnboardingPending(false); } }} /><p className="nav-label">YOUR BUSINESS</p><nav className="nav-list"><Link className="nav-item active" href="/"><span className="nav-icon"><Icon name="dashboard" size={15} /></span>Overview</Link><Link className="nav-item" href="/sales"><span className="nav-icon"><Icon name="receipt" size={15} /></span>Transactions</Link><Link className="nav-item" href="/inventory"><span className="nav-icon"><Icon name="inventory" size={15} /></span>Inventory<i className="nav-badge">{lowStock.length || ""}</i></Link><Link className="nav-item" href="/products"><span className="nav-icon"><Icon name="box" size={15} /></span>Products</Link><Link className="nav-item" href="/reports"><span className="nav-icon"><Icon name="chart" size={15} /></span>Reports</Link><Link className="nav-item" href="/payment"><span className="nav-icon"><Icon name="payment" size={15} /></span>Plans &amp; payment</Link><Link className="nav-item" href="/settings"><span className="nav-icon"><Icon name="settings" size={15} /></span>Business settings</Link></nav><div className="sidebar-bottom"><button className="nav-item signout" onClick={signOut}><span className="nav-icon"><Icon name="signOut" size={14} /></span>Sign out</button><Link className="profile" href="/profile" aria-label="View your Sukuru account profile" onClick={() => setMobileNav(false)}><span className="profile-avatar">{session.user?.fullName?.slice(0, 1) || session.email?.slice(0, 1).toUpperCase() || "S"}</span><span><strong>{session.user?.fullName || session.email || "Shop account"}</strong><small>VIEW PROFILE</small></span><Icon name="arrowRight" size={13} /></Link></div></aside>
    <div className="main-shell"><header className="topbar"><button className="mobile-menu" aria-label="Toggle navigation" aria-expanded={mobileNav} onClick={() => setMobileNav(!mobileNav)}><Icon name="menu" /></button><div className="breadcrumbs"><span>sukuru://</span><strong>overview</strong></div><div className="top-actions"><span className={`sync ${error ? "offline" : ""} ${backendConnected && !error ? "connected" : ""}`}><i />{loading ? "UPDATING" : error ? "CONNECTION ISSUE" : "LIVE FROM SUKURU"}</span><button className="icon-button" aria-label="Refresh dashboard" onClick={() => loadDashboard(session)}><Icon name="refresh" size={15} /></button><Link className="top-avatar" href="/profile" aria-label="View your account profile">{session.user?.fullName?.slice(0, 1) || "S"}</Link></div></header>
    <main className="main-content" id="overview"><section className={`welcome ${backendConnected ? "backend-connected" : ""}`}><div><p className="eyebrow"><i /> YOUR BUSINESS AT A GLANCE <span className="eyebrow-rule" /></p><h1>{greeting}{firstName ? `, ${firstName}` : ""}</h1><p className="welcome-sub">The shop&apos;s open. Let&apos;s make today count.</p></div></section>
    {onboardingPending && <section className="onboarding-reminder"><span className="onboarding-reminder-index">SETUP / IN PROGRESS</span><span><strong>Pick up where you left off.</strong><small>Your shop setup is saved. Continue whenever you have a moment.</small></span><Link href="/onboarding"><AnimatedLabel>Continue setup</AnimatedLabel><Icon name="arrowRight" size={13} /></Link></section>}
    <section className={`ai-beta-teaser ${aiBetaOpen ? "" : "minimized"}`} aria-labelledby="ai-beta-title"><div className="ai-beta-icon"><Icon name="spark" size={17} /></div><div className="ai-beta-copy"><div className="ai-beta-heading"><p className="section-kicker">IN THE WORKS</p><span>COMING SOON</span></div><h2 id="ai-beta-title">Sukuru AI <span>BETA</span></h2><p id="ai-beta-details" hidden={!aiBetaOpen}>We are developing a business assistant to help make sense of your sales and stock records.</p></div><button type="button" className="ai-beta-toggle" aria-label={aiBetaOpen ? "Minimize Sukuru AI beta notice" : "Expand Sukuru AI beta notice"} aria-expanded={aiBetaOpen} aria-controls="ai-beta-details" onClick={() => setAiBetaOpen((open) => !open)}><Icon name="chevronDown" size={15} /></button></section>
    <section className="quick-entry"><div className="quick-copy"><span className="quick-icon"><Icon name="receipt" size={18} /></span><div><span className="quick-kicker">QUICK ENTRY  /  MADE FOR THE MARKET RUSH</span><h2>A customer at the counter?</h2><p>We&apos;ll keep the paperwork quick. Record a sale or restock in a few taps.</p></div></div><div className="quick-actions"><button className="button button-light" disabled={Boolean(pendingOperation)} onClick={() => { setError(""); setModal("sale"); }}><Icon name="plus" size={14} /><AnimatedLabel>Record a sale</AnimatedLabel></button><button className="button button-outline" disabled={Boolean(pendingOperation)} onClick={() => { setError(""); setModal("purchase"); }}><Icon name="inventory" size={15} /><AnimatedLabel>Restock inventory</AnimatedLabel></button></div><div className="quick-note"><span className="keycap">Ctrl</span><span className="keycap">K</span><span>Quick sale</span></div></section>
    <div className="section-head"><div><p className="section-kicker">THE PULSE</p><h2>Today&apos;s numbers</h2></div><span className="period-select">TODAY  /  {business?.currency || "RWF"}</span></div>
    <section className="metrics"><article className="metric metric-sales"><div className="metric-top"><span>SALES REVENUE</span><span className="metric-symbol"><Icon name="arrowUpRight" size={15} /></span></div><strong>{summary ? money(summary.salesRevenue, currency) : "—"}</strong><div className="metric-bottom"><span className="change">{summary ? `${summary.salesCount} sales` : "Owner / manager access"}</span><span>{summary ? "today" : ""}</span></div></article><article className="metric"><div className="metric-top"><span>TRANSACTIONS</span><span className="metric-symbol"><Icon name="receipt" size={15} /></span></div><strong>{summary ? summary.salesCount : "—"}</strong><div className="metric-bottom"><span>{summary ? "Completed sales today" : "Owner / manager access"}</span></div></article><article className="metric metric-dark"><div className="metric-top"><span>GROSS PROFIT</span><span className="metric-symbol"><Icon name="chart" size={15} /></span></div><strong>{summary ? money(summary.grossProfit, currency) : "—"}</strong><div className="metric-bottom"><span>{summary ? "Today so far" : "Owner / manager access"}</span></div><div className="expense-track"><i style={{ width: `${summary?.salesRevenue ? Math.min(100, Math.max(0, (Number(summary.grossProfit) / Number(summary.salesRevenue)) * 100)) : 0}%`, visibility: summary ? "visible" : "hidden" }} /></div></article><article className="metric metric-stock"><div className="metric-top"><span>STOCK TO WATCH</span><span className="stock-count">{String(lowStock.length).padStart(2, "0")}</span></div><strong>{lowStock.length ? "Running low" : loading ? "Checking stock" : error ? "Unavailable" : "Stock looks good"}</strong><div className="stock-items">{lowStock.length ? lowStock.map((item) => <span key={item.productId}><i />{item.name}<b>{item.quantity} left</b></span>) : <span>{loading ? "Loading stock levels" : error ? "Stock information unavailable" : "No low stock alerts"}</span>}</div></article></section>
    <div className="content-grid"><section className="panel transactions-panel" id="transactions"><div className="panel-head"><div><p className="section-kicker">JUST LOGGED</p><h2>Recent sales</h2></div><button className="text-link" onClick={() => loadDashboard(session)}>Refresh <Icon name="refresh" size={13} /></button></div><div className="transaction-list">{sales.length ? sales.map((sale) => <article className="transaction-row" key={sale.id}><span className="transaction-icon sale"><Icon name="arrowUpRight" size={15} /></span><span className="transaction-info"><strong>{sale.referenceNumber || "Sale"}{sale.customerName ? `  /  ${sale.customerName}` : ""}</strong><small>{sale.soldAt ? `Today, ${localDate(sale.soldAt)}` : "Sale recorded"}  /  {sale.paymentStatus || "Recorded"}</small></span><span className="transaction-tag">{sale.status || "SALE"}</span><strong className="transaction-amount">+ {money(sale.totalAmount, currency)}</strong></article>) : <div className="empty-state">{loading ? "Loading today's records" : error ? "Sales data is unavailable right now." : "No sales yet. Your first sale is a few taps away."}</div>}</div><div className="panel-foot"><span><i /> LIVE BUSINESS RECORDS  /  SUKURU API</span><button className="text-link" onClick={() => loadDashboard(session)}>Update records <Icon name="arrowRight" size={13} /></button></div></section>
    <aside className="right-column"><section className="panel assistant-panel"><div className="assistant-heading"><span className="assistant-star"><Icon name="spark" size={17} /></span><span className="assistant-status"><i /> BUSINESS SNAPSHOT</span></div><h2>At a glance.</h2><p className="assistant-message">{lowStock.length ? <><strong>{lowStock[0].name}</strong> has {lowStock[0].quantity} {lowStock[0].unit || "left"} in stock. Restock it when you next visit the supplier.</> : loading ? "Checking current stock levels." : error ? "Stock information is unavailable right now." : "No products are at the low-stock threshold. Your active inventory is ready for the next sale."}</p>{lowStock.slice(0, 2).map((item) => <div className="assistant-action" key={item.productId}><span className="tiny-product"><Icon name="box" size={14} /></span><span><strong>{item.name}</strong><small>{item.quantity} {item.unit || "units"} remaining</small></span><button aria-label={`Restock ${item.name}`} onClick={() => { setPurchase({ ...purchase, productId: item.productId, unitCost: products.find((p) => p.id === item.productId)?.purchasePrice || "" }); setModal("purchase"); }}><Icon name="arrowRight" size={14} /></button></div>)}<div className="assistant-foot"><span>From your current stock</span><span>LIVE</span></div></section><section className="panel cash-panel" id="stock"><div className="panel-head"><div><p className="section-kicker">INVENTORY</p><h2>Stock on hand</h2></div><span className="cash-period">{stock.length} PRODUCTS</span></div>{stock.slice(0, 4).map((item) => <div className="cash-line" key={item.productId}><span><i className={`cash-state-mark ${Number(item.quantity) <= 5 ? "out" : "in"}`} />{item.name}</span><strong>{item.quantity} {item.unit || ""}</strong></div>)}{!stock.length && <div className="empty-state small">{loading ? "Loading inventory" : error ? "Stock data is unavailable right now." : "No stock records found."}</div>}<div className="cash-divider" /><button className="text-link" onClick={() => setModal("purchase")}>Receive stock </button></section></aside></div>
    {error && <div className="inline-error" role="alert"><span>{error}</span>{pendingOperation ? <button disabled={loading} onClick={resumePendingOperation}>{loading ? "Working" : pendingOperation.kind === "purchase-receive" ? "Retry receiving stock" : "Retry payment"}</button> : <button onClick={() => loadDashboard(session)}>Retry</button>}</div>}<footer className="page-footer"><span>MADE FOR THE MOMENTS BETWEEN CUSTOMERS <i></i></span><a href="mailto:support@cursorclick.dev?subject=Sukuru%20support">CONTACT SUPPORT · support@cursorclick.dev</a></footer></main></div>
    {modal && <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setModal(""); }}><section className="entry-modal" role="dialog" aria-modal="true" aria-labelledby="entry-heading"><button className="dialog-x" aria-label="Close" onClick={() => setModal("")}><Icon name="close" size={15} /></button><p className="section-kicker">{modal === "sale" ? "MONEY IN  /  SUKURU SALE" : "STOCK IN  /  SUKURU PURCHASE"}</p><h2 id="entry-heading">{modal === "sale" ? "Record a sale" : "Restock inventory"}</h2><p className="dialog-sub">{modal === "sale" ? "Choose what sold. Sukuru checks stock and records the payment." : "Record the supplier purchase, receive the stock, and log its payment."}</p>{modal === "sale" ? <form className="form-stack" onSubmit={saveSale}><label>Product<select required value={entry.productId} onChange={(e) => setEntry({ ...entry, productId: e.target.value })}><option value="">Choose an item</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name}  /  {money(product.sellingPrice, currency)}  /  {stockByProduct.get(product.id) ?? 0} in stock</option>)}</select></label><label>Quantity<input type="number" min="0.001" step="0.001" required value={entry.quantity} onChange={(e) => setEntry({ ...entry, quantity: e.target.value })} /></label><label>Payment received<select value={entry.paymentMethod} onChange={(e) => setEntry({ ...entry, paymentMethod: e.target.value })}><option value="cash">Cash</option><option value="mobile_money">Mobile money</option><option value="bank_transfer">Bank transfer</option><option value="other">Other</option></select></label><label>Note (optional)<input maxLength="200" placeholder="e.g. 2 coffees, takeaway" value={entry.notes} onChange={(e) => setEntry({ ...entry, notes: e.target.value })} /></label><p className="modal-total">Sale total <strong>{money((Number(products.find((p) => p.id === entry.productId)?.sellingPrice) || 0) * (Number(entry.quantity) || 0), currency)}</strong></p>{error && <p className="error-message">{error}{pendingOperation && <button type="button" className="text-button" disabled={loading} onClick={resumePendingOperation}>Retry {pendingOperation.kind === "purchase-receive" ? "receiving stock" : "payment"} </button>}</p>}<button className="primary-button full" disabled={loading || Boolean(pendingOperation)}>{loading ? "Saving sale" : <AnimatedLabel>Save sale and payment</AnimatedLabel>}</button></form> : <form className="form-stack" onSubmit={savePurchase}><label>Product<select required value={purchase.productId} onChange={(e) => { const product = products.find((p) => p.id === e.target.value); setPurchase({ ...purchase, productId: e.target.value, unitCost: product?.purchasePrice || "" }); }}><option value="">Choose an item</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label><div className="form-split"><label>Quantity<input type="number" min="0.001" step="0.001" required value={purchase.quantity} onChange={(e) => setPurchase({ ...purchase, quantity: e.target.value })} /></label><label>Unit cost ({currency})<input type="number" min="0.01" step="0.01" required value={purchase.unitCost} onChange={(e) => setPurchase({ ...purchase, unitCost: e.target.value })} /></label></div><label>Payment method<select value={purchase.paymentMethod} onChange={(e) => setPurchase({ ...purchase, paymentMethod: e.target.value })}><option value="cash">Cash</option><option value="mobile_money">Mobile money</option><option value="bank_transfer">Bank transfer</option><option value="other">Other</option></select></label><p className="modal-total">Purchase total <strong>{money((Number(purchase.unitCost) || 0) * (Number(purchase.quantity) || 0), currency)}</strong></p><p className="field-hint">This creates a purchase, receives stock, then records the payment in Sukuru.</p>{error && <p className="error-message">{error}{pendingOperation && <button type="button" className="text-button" disabled={loading} onClick={resumePendingOperation}>Retry {pendingOperation.kind === "purchase-receive" ? "receiving stock" : "payment"} </button>}</p>}<button className="primary-button full" disabled={loading || Boolean(pendingOperation)}>{loading ? "Recording purchase" : <AnimatedLabel>Receive stock and record payment</AnimatedLabel>}</button></form>}</section></div>}
    {toast && <div className="toast" role="status">{toast}</div>}</div>;
}
