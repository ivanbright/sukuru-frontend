"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AnimatedLabel from "../../design-system/AnimatedLabel";
import Icon from "../../design-system/Icon";
import { readStoredSession, refreshSession, writeStoredSession } from "../../lib/session";
import "./onboarding.css";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
const steps = ["Shop details", "First product", "Opening stock"];
const emptyBusiness = { name: "", businessType: "", phone: "", email: "", address: "", country: "Rwanda", currency: "RWF" };
const emptyProduct = { name: "", unit: "item", sku: "", purchasePrice: "", sellingPrice: "" };
const fieldText = (value, fallback = "") => typeof value === "string" ? value : value == null ? fallback : String(value);
const normalizeBusiness = (value) => ({
  name: fieldText(value?.name), businessType: fieldText(value?.businessType), phone: fieldText(value?.phone),
  email: fieldText(value?.email), address: fieldText(value?.address), country: fieldText(value?.country, "Rwanda"),
  currency: fieldText(value?.currency, "RWF"),
});
const normalizeProduct = (value) => ({
  name: fieldText(value?.name), unit: fieldText(value?.unit, "item"), sku: fieldText(value?.sku),
  purchasePrice: fieldText(value?.purchasePrice), sellingPrice: fieldText(value?.sellingPrice),
});

function idempotencyKey(storageKey, body) {
  const fingerprint = JSON.stringify(body);
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
    if (saved?.fingerprint === fingerprint && saved?.key) return saved.key;
    const key = crypto.randomUUID();
    localStorage.setItem(storageKey, JSON.stringify({ key, fingerprint }));
    return key;
  } catch { return crypto.randomUUID(); }
}

function clearIdempotencyKey(storageKey) {
  try { localStorage.removeItem(storageKey); } catch { /* request completed even when storage is unavailable */ }
}

function readSession() {
  return readStoredSession();
}

async function api(path, { session, method = "GET", body, idempotencyKey } = {}) {
  let current = readSession() || session;
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${current.accessToken}` };
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;
  let response;
  try {
    response = await fetch(`${API}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined, cache: "no-store" });
  } catch {
    throw new Error("Sukuru could not reach the server. Your account is safe; try this step again when the connection is back.");
  }
  if (response.status === 401 && current.refreshToken) {
    const rotated = await refreshSession(current);
    if (rotated?.accessToken) {
      current = rotated;
      headers.Authorization = `Bearer ${rotated.accessToken}`;
      response = await fetch(`${API}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined, cache: "no-store" });
    }
  }
  if (!response.ok) {
    let detail;
    try { detail = await response.json(); } catch { detail = null; }
    if (response.status === 401) throw Object.assign(new Error("Your session has expired. Sign in again to continue setup."), { unauthorized: true });
    throw new Error(detail?.message || detail?.detail || `This step could not be saved (${response.status}). Please try again.`);
  }
  return response.status === 204 ? null : response.json();
}

export default function OnboardingPage() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [business, setBusiness] = useState(emptyBusiness);
  const [product, setProduct] = useState(emptyProduct);
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    document.title = `Shop setup · Step ${step + 1} of ${steps.length} · Sukuru`;
  }, [step]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const active = readSession();
      if (!active?.accessToken) { router.replace("/"); return; }
      const savedKey = `sukuru-onboarding:${active.businessId || active.user?.id || active.email}`;
      const saved = (() => { try { return JSON.parse(localStorage.getItem(savedKey) || "null"); } catch { return null; } })();
      if (saved?.complete) { router.replace("/"); return; }
      setSession(active);
      if (saved?.productId) {
        setProductId(saved.productId); setStep(saved.step ?? 2);
        api(`/api/v1/products/${saved.productId}`, { session: active }).then((value) => setProduct(normalizeProduct(value))).catch(() => {});
      } else if (Number.isInteger(saved?.step)) setStep(saved.step);
      api("/api/v1/business", { session: active }).then((value) => setBusiness(normalizeBusiness(value)))
        .catch((err) => { if (err.unauthorized) router.replace("/"); else setError(err.message); });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [router]);

  function saveProgress(next) {
    if (!session) return;
    const key = `sukuru-onboarding:${session.businessId || session.user?.id || session.email}`;
    const emailKey = `sukuru-onboarding-pending:${session.email?.trim().toLowerCase()}`;
    try {
      localStorage.setItem(key, JSON.stringify(next));
      if (session.email) localStorage.setItem(emailKey, JSON.stringify({ ...next, businessId: session.businessId }));
    } catch { /* progress can be retried in this session */ }
  }

  function goToStep(next) {
    saveProgress({ step: next, productId: productId || undefined });
    setError(""); setNotice("");
    setStep(next);
  }

  function leaveSetup() {
    saveProgress({ step, productId: productId || undefined, deferred: true });
    router.push("/");
  }

  async function run(action) {
    setBusy(true); setError(""); setNotice("");
    try { await action(); }
    catch (err) {
      if (err.unauthorized) router.replace("/");
      else setError(err.message);
    } finally { setBusy(false); }
  }

  async function saveBusiness(event) {
    event.preventDefault();
    await run(async () => {
      const saved = await api("/api/v1/business", { session, method: "PUT", body: {
        ...business,
         name: fieldText(business.name).trim(), businessType: fieldText(business.businessType).trim() || null,
         phone: fieldText(business.phone).trim() || null, email: fieldText(business.email).trim() || null,
         address: fieldText(business.address).trim() || null, country: fieldText(business.country).trim() || null,
         currency: fieldText(business.currency).trim().toUpperCase() || "RWF",
      } });
       setBusiness(normalizeBusiness(saved)); goToStep(1); setNotice("Shop details saved.");
    });
  }

  async function saveProduct(event) {
    event.preventDefault();
    await run(async () => {
      const keyName = `sukuru-onboarding-product-key:${session.businessId || session.email}`;
      const body = {
        name: fieldText(product.name).trim(), unit: fieldText(product.unit, "item").trim(), sku: fieldText(product.sku).trim() || null,
        purchasePrice: product.purchasePrice || null, sellingPrice: product.sellingPrice || null,
      };
      const created = await api("/api/v1/products", { session, method: "POST", idempotencyKey: idempotencyKey(keyName, body), body });
      setProductId(created.id); goToStep(2); setNotice(`${created.name} is in your product list.`);
      saveProgress({ productId: created.id, step: 2 });
      clearIdempotencyKey(keyName);
    });
  }

  async function saveOpeningStock(event) {
    event.preventDefault();
    await run(async () => {
      const keyName = `sukuru-onboarding-stock-key:${session.businessId || session.email}:${productId}`;
      const body = {
        productId, quantityDelta: quantity, reason: "Opening stock",
      };
      await api("/api/v1/inventory/adjustments", { session, method: "POST", idempotencyKey: idempotencyKey(keyName, body), body });
      clearIdempotencyKey(keyName);
      finish();
    });
  }

  function finish() {
    saveProgress({ complete: true, productId: productId || undefined });
    try { localStorage.removeItem(`sukuru-onboarding-pending:${session.email?.trim().toLowerCase()}`); } catch { /* setup is complete for this session */ }
    router.push("/");
  }

  const name = business.name || "your shop";
  return <main className="onboarding-page">
    <header className="onboarding-top"><Link className="brand" href="/onboarding" aria-label="Sukuru setup"><span className="brand-mark">S</span>sukuru</Link><span className="onboarding-context">SUKURU:// FIRST-RUN SETUP</span><button className="onboarding-skip" type="button" onClick={leaveSetup}>Go to dashboard <Icon name="arrowUpRight" /></button></header>
    <div className="onboarding-frame">
      <aside className="onboarding-rail">
        <p className="section-kicker">A GOOD START, AT YOUR PACE</p>
        <h1>Let&apos;s get<br />your shop<br />ready</h1>
        <p className="onboarding-rail-copy">A few details now make the first day easier. Skip for now and pick up setup later from your dashboard.</p>
        <nav className="onboarding-steps" aria-label="Setup steps">{steps.map((label, index) => <button key={label} className={`onboarding-step ${index === step ? "current" : ""} ${index < step ? "done" : ""}`} onClick={() => index < step && goToStep(index)} disabled={busy || index > step} aria-current={index === step ? "step" : undefined}><span className="step-number">0{index + 1}</span><span>{label}</span><i>{index < step && <Icon name="check" size={14} />}</i></button>)}</nav>
        <div className="onboarding-note"><span className="onboarding-note-mark"><Icon name="spark" size={18} /></span><span><strong>Nothing gets in your way.</strong><small>Skip setup and keep moving. Your account is already ready.</small></span></div>
      </aside>
      <section className="onboarding-work">
        <div className="onboarding-section-label"><span><i /> SETUP  /  0{step + 1}</span><div /></div>
        <div className="onboarding-content" key={step}>
          {step === 0 && <><p className="section-kicker">THE BASICS</p><h2>Make this space<br />feel like <em>{name}</em>.</h2><p className="onboarding-intro">We brought over what you entered at sign-up. Check it once, then you can get straight to work.</p><form className="form-stack onboarding-form" onSubmit={saveBusiness}><label>Shop name<input required maxLength={150} value={business.name} onChange={(e) => setBusiness({ ...business, name: e.target.value })} /></label><div className="form-split"><label>Business type<input maxLength={100} placeholder="e.g. Grocery shop" value={business.businessType} onChange={(e) => setBusiness({ ...business, businessType: e.target.value })} /></label><label>Phone<input maxLength={30} autoComplete="tel" value={business.phone} onChange={(e) => setBusiness({ ...business, phone: e.target.value })} /></label></div><div className="form-split"><label>Country<input maxLength={100} value={business.country} onChange={(e) => setBusiness({ ...business, country: e.target.value })} /></label><label>Currency<input maxLength={10} value={business.currency} onChange={(e) => setBusiness({ ...business, currency: e.target.value.toUpperCase() })} /></label></div>{error && <p className="error-message" role="alert">{error}</p>}{notice && <p className="onboarding-success" role="status">{notice}</p>}<div className="onboarding-actions"><button className="primary-button" disabled={busy}>{busy ? "Saving details" : <><AnimatedLabel>Save and continue</AnimatedLabel><Icon name="arrowRight" size={14} /></>}</button><button type="button" className="onboarding-later" onClick={() => { setError(""); goToStep(1); }}>Do this later</button></div></form></>}
          {step === 1 && <><p className="section-kicker">A PLACE TO BEGIN</p><h2>Add the first<br />thing you sell.</h2><p className="onboarding-intro">Keep it simple. You can add categories, prices and the rest of your catalog from Products anytime.</p><form className="form-stack onboarding-form" onSubmit={saveProduct}><label>Product name<input required maxLength={150} autoFocus placeholder="e.g. Fresh bananas" value={product.name} onChange={(e) => setProduct({ ...product, name: e.target.value })} /></label><div className="form-split"><label>Unit<input required maxLength={30} placeholder="item, kg, litre" value={product.unit} onChange={(e) => setProduct({ ...product, unit: e.target.value })} /></label><label>SKU <span className="optional">OPTIONAL</span><input maxLength={100} value={product.sku} onChange={(e) => setProduct({ ...product, sku: e.target.value })} /></label></div><div className="form-split"><label>Buying price <span className="optional">OPTIONAL</span><input type="number" min="0" step="0.01" inputMode="decimal" value={product.purchasePrice} onChange={(e) => setProduct({ ...product, purchasePrice: e.target.value })} /></label><label>Selling price<input required type="number" min="0" step="0.01" inputMode="decimal" value={product.sellingPrice} onChange={(e) => setProduct({ ...product, sellingPrice: e.target.value })} /><small className="field-hint">Used when recording a sale.</small></label></div>{error && <p className="error-message" role="alert">{error}</p>}{notice && <p className="onboarding-success" role="status">{notice}</p>}<div className="onboarding-actions"><button className="primary-button" disabled={busy}>{busy ? "Adding product" : <><AnimatedLabel>Add product</AnimatedLabel><Icon name="arrowRight" size={14} /></>}</button><button type="button" className="onboarding-later" disabled={busy} onClick={() => { setError(""); goToStep(2); }}>I&apos;ll add products later</button></div><button type="button" className="onboarding-back" disabled={busy} onClick={() => { setError(""); goToStep(0); }}><Icon name="arrowLeft" size={13} /> Shop details</button></form></>}
          {step === 2 && <><p className="section-kicker">START WITH WHAT&apos;S THERE</p><h2>Count what&apos;s<br />on the shelf.</h2><p className="onboarding-intro">Opening stock gives you a useful starting point. This records a stock adjustment; it does not create a purchase or payment.</p>{productId ? <form className="form-stack onboarding-form" onSubmit={saveOpeningStock}><div className="selected-product"><span className="selected-product-index">01</span><span><small>FIRST PRODUCT</small><strong>{product.name || "Your new product"}</strong></span><span className="selected-unit">{product.unit}</span></div><label>Quantity on hand<input required type="number" min="0.001" step="0.001" inputMode="decimal" autoFocus placeholder="e.g. 24" value={quantity} onChange={(e) => setQuantity(e.target.value)} /></label>{error && <p className="error-message" role="alert">{error}</p>}{notice && <p className="onboarding-success" role="status">{notice}</p>}<div className="onboarding-actions"><button className="primary-button" disabled={busy}>{busy ? "Saving stock" : <><AnimatedLabel>Save opening stock</AnimatedLabel><Icon name="arrowRight" size={14} /></>}</button><button type="button" className="onboarding-later" disabled={busy} onClick={finish}>I&apos;ll count it later</button></div><button type="button" className="onboarding-back" disabled={busy} onClick={() => { setError(""); goToStep(1); }}><Icon name="arrowLeft" size={13} /> First product</button></form> : <div className="onboarding-finish"><div className="setup-ready-mark"><Icon name="check" size={21} /></div><h3>You&apos;re ready to open.</h3><p>Your dashboard is waiting. Add products or count stock whenever it suits you.</p><button className="primary-button" onClick={finish}><AnimatedLabel>Go to dashboard</AnimatedLabel><Icon name="arrowRight" size={14} /></button><button type="button" className="onboarding-back" onClick={() => goToStep(1)}><Icon name="arrowLeft" size={13} /> Add a first product</button></div>}</>}
        </div>
        <div className="onboarding-bottom"><span><i /> {notice || "YOUR PROGRESS SAVES AS YOU GO"}</span><span>{String(step + 1).padStart(2, "0")} / 03</span></div>
      </section>
      <aside className="onboarding-visual" aria-hidden="true"><div className="setup-diagram-head"><span>THE DAILY RHYTHM</span><i /></div><div className="setup-diagram"><div className="setup-orbit orbit-one"/><div className="setup-orbit orbit-two"/><div className="setup-axis"/><div className="setup-node node-shop"><span>01</span><i><Icon name="shop" size={18} /></i><b>YOUR SHOP</b></div><div className="setup-node node-stock"><span>02</span><i><Icon name="inventory" size={18} /></i><b>YOUR STOCK</b></div><div className="setup-node node-day"><span>03</span><i><Icon name="arrowUpRight" size={18} /></i><b>YOUR DAY</b></div><div className="setup-connector connector-one"/><div className="setup-connector connector-two"/></div><div className="setup-diagram-foot"><span>BUILT AROUND THE WAY SHOPS WORK</span><span>SU / 01</span></div></aside>
    </div>
  </main>;
}
