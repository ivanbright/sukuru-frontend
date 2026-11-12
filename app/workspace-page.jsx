"use client";

import { useEffect, useRef, useState } from "react";
import AnimatedLabel from "../design-system/AnimatedLabel";
import Icon from "../design-system/Icon";
import Link from "next/link";
import { useRouter } from "next/navigation";
import WorkspaceSwitcher from "../design-system/WorkspaceSwitcher";
import { endSession, readStoredSession, refreshSession, writeStoredSession } from "../lib/session";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
const tokenRole = (token) => { try { return JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))).role; } catch { return ""; } };
const sections = [
  ["Overview", "/", "dashboard"], ["Transactions", "/sales", "receipt"], ["Inventory", "/inventory", "inventory"],
  ["Products", "/products", "box"], ["Reports", "/reports", "chart"], ["Plans & payment", "/payment", "payment"], ["Business settings", "/settings", "settings"],
];
const pages = {
  "/profile": { title: "Your profile", eyebrow: "ACCOUNT  /  PROFILE", description: "Your Sukuru account and active business workspace.", endpoint: "/api/v1/business", kind: "profile" },
  "/sales": { title: "Transactions", eyebrow: "MONEY IN  /  BUSINESS RECORDS", description: "Sales recorded by your business.", endpoint: "/api/v1/sales?page=0&size=100", kind: "sales" },
  "/inventory": { title: "Inventory", eyebrow: "STOCK  /  ON HAND", description: "Current quantities from your stock records.", endpoint: "/api/v1/inventory/stock?page=0&size=100", kind: "stock" },
  "/products": { title: "Products", eyebrow: "CATALOG  /  ACTIVE ITEMS", description: "Items available for sale in your business.", endpoint: "/api/v1/products?isActive=true&page=0&size=100", kind: "products" },
  "/reports": { title: "Reports", eyebrow: "THE PULSE  /  TODAY", description: "A daily summary from your Sukuru records.", endpoint: "/api/v1/reports/summary", kind: "report" },
  "/settings": { title: "Business settings", eyebrow: "WORKSPACE  /  DETAILS", description: "Business information connected to this account.", endpoint: "/api/v1/business", kind: "settings" },
  "/payment": { title: "Plans & payment", eyebrow: "ACCOUNT  /  PLAN", description: "Manage your workspace allowance and request a plan upgrade.", endpoint: "/api/v1/billing", kind: "billing" },
};

function money(value, currency = "RWF") {
  try { return new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 2 }).format(Number(value || 0)); }
  catch { return `${currency} ${Number(value || 0).toFixed(2)}`; }
}

async function getJson(path, active, options = {}) {
  const current = readStoredSession() || active;
  let token = current.accessToken;
  const headers = { ...options.headers };
  if (options.method?.toUpperCase() === "POST" && !headers["Idempotency-Key"]) {
    headers["Idempotency-Key"] = crypto.randomUUID();
  }
  const send = () => fetch(`${API}${path}`, { ...options, headers: { ...headers, Authorization: `Bearer ${token}` }, cache: "no-store" });
  let response = await send();
  if (response.status === 401 && current.refreshToken) {
    const rotated = await refreshSession(current);
    if (rotated?.accessToken) {
      token = rotated.accessToken;
      response = await send();
    }
  }
  if (!response.ok) {
    if (response.status === 401) throw new Error("Your session expired. Sign in again.");
    let details = null;
    try { details = await response.json(); } catch { /* keep the status-based fallback */ }
    const fieldErrors = Array.isArray(details?.details)
      ? details.details.map((item) => item.field ? `${item.field}: ${item.message}` : item.message).filter(Boolean).join("; ")
      : "";
    const message = fieldErrors || details?.message || details?.detail;
    throw new Error(message ? `${message} (HTTP ${response.status})` : `Could not load this page (HTTP ${response.status}).`);
  }
  return response.json();
}

export default function WorkspacePage({ path }) {
  const router = useRouter();
  const page = pages[path];
  const [session, setSession] = useState(null);
  const [business, setBusiness] = useState(null);
  const [data, setData] = useState(null);
  const [showInactive, setShowInactive] = useState(false);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [mobileNav, setMobileNav] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState(false);
  const [savingBusiness, setSavingBusiness] = useState(false);
  const [businessMessage, setBusinessMessage] = useState("");
  const [businessError, setBusinessError] = useState("");
  const [productDraft, setProductDraft] = useState(null);
  const [savingProduct, setSavingProduct] = useState(false);
  const [productError, setProductError] = useState("");
  const [productMessage, setProductMessage] = useState("");
  const [upgradeBusy, setUpgradeBusy] = useState(false);
  const [upgradeError, setUpgradeError] = useState("");
  const [upgradeMessage, setUpgradeMessage] = useState("");
  const loadSequence = useRef(0);
  const refreshRef = useRef(null);

  async function refresh(active = session, options = {}) {
    if (!active?.accessToken) return;
    const sequence = ++loadSequence.current;
    setBusy(true); setError("");
    try {
      const inactiveProducts = options.inactive ?? showInactive;
      const target = page.kind === "report" ? `${page.endpoint}?${new URLSearchParams({ from: new Date(new Date().setHours(0,0,0,0)).toISOString(), to: new Date(new Date().setHours(23,59,59,999)).toISOString() })}` : page.kind === "products" ? `/api/v1/products?isActive=${inactiveProducts ? "false" : "true"}&page=0&size=100` : page.kind === "profile" ? "/api/v1/auth/profile" : page.endpoint;
      const result = await getJson(target, active);
      if (sequence !== loadSequence.current) return;
      setData(page.kind === "settings" || page.kind === "report" || page.kind === "billing" || page.kind === "profile" ? result : result.items || []);
      const activeBusiness = await getJson("/api/v1/business", active);
      if (sequence === loadSequence.current) setBusiness(activeBusiness);
    } catch (err) { if (sequence === loadSequence.current) setError(err.message || "Could not reach Sukuru."); }
    finally { if (sequence === loadSequence.current) setBusy(false); }
  }
  useEffect(() => {
    refreshRef.current = refresh;
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const stored = readStoredSession();
      if (!stored?.accessToken) { router.replace("/"); return; }
      setSession(stored); refresh(stored);
    }, 0);
    return () => window.clearTimeout(timer);
  // Load the route's resource once; refresh is also available from the header.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, router]);

  useEffect(() => {
    const synchronizeSession = (event) => {
      if (event.key !== "sukuru-session") return;
      if (!event.newValue) {
        setSession(null); setBusiness(null); setData(null); router.replace("/");
        return;
      }
      try {
        const next = JSON.parse(event.newValue);
        if (!next?.accessToken) return;
        setSession(next);
        if (next.businessId !== session?.businessId) {
          setBusiness(null); setData(null); setShowInactive(false); refreshRef.current?.(next, { inactive: false });
        }
      } catch { /* ignore invalid data written by another tab */ }
    };
    window.addEventListener("storage", synchronizeSession);
    return () => window.removeEventListener("storage", synchronizeSession);
  }, [router, session?.businessId]);

  useEffect(() => {
    if (!productDraft || savingProduct) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setProductDraft(null);
        setProductError("");
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [productDraft, savingProduct]);

  function signOut() {
    endSession(session);
    router.push("/");
  }

  async function saveBusiness(event) {
    event.preventDefault();
    if (!session?.accessToken) return;
    setSavingBusiness(true); setBusinessMessage(""); setBusinessError("");
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(["name", "businessType", "phone", "email", "address", "country", "currency"].map((key) => [key, String(form.get(key) || "").trim()]));
    try {
      const updated = await getJson("/api/v1/business", session, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      setBusiness(updated); setData(updated); setEditingBusiness(false); setBusinessMessage("Business details saved.");
    } catch (err) { setBusinessError(err.message || "Could not save business details."); }
    finally { setSavingBusiness(false); }
  }

  async function requestUpgrade(event) {
    event.preventDefault();
    if (!session?.accessToken) return;
    const form = new FormData(event.currentTarget);
    setUpgradeBusy(true); setUpgradeError(""); setUpgradeMessage("");
    try {
      await getJson("/api/v1/billing/upgrade-requests", session, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMethod: form.get("paymentMethod"), paymentReference: String(form.get("paymentReference") || "").trim() || null }),
      });
      setUpgradeMessage("Your Premium request is saved as pending. We will activate it after payment is confirmed.");
      await refresh(session);
    } catch (err) { setUpgradeError(err.message || "Could not submit the upgrade request."); }
    finally { setUpgradeBusy(false); }
  }

  function handleWorkspaceSwitch(next) {
    setSession(next); setData(null); setBusiness(null); setShowInactive(false);
    setEditingBusiness(false); setBusinessMessage(""); setBusinessError("");
    setProductDraft(null); setProductMessage(""); setProductError("");
    refresh(next, { inactive: false });
  }

  function handleProfileUpdated(profile) {
    const next = { ...session, email: profile.email, user: { ...session?.user, id: profile.id, fullName: profile.fullName, phone: profile.phone } };
    setSession(next);
    writeStoredSession(next);
    setData(profile);
  }

  async function saveProduct(event) {
    event.preventDefault();
    if (!session?.accessToken || !productDraft) return;
    setSavingProduct(true); setProductError(""); setProductMessage("");
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(["name", "sku", "description", "unit", "purchasePrice", "sellingPrice"].map((key) => [key, String(form.get(key) || "").trim() || null]));
    payload.isActive = productDraft.id ? form.get("isActive") === "on" : true;
    try {
      await getJson(productDraft.id ? `/api/v1/products/${productDraft.id}` : "/api/v1/products", session, {
        method: productDraft.id ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      const nextInactive = productDraft.id && payload.isActive === productDraft.isActive ? showInactive : !payload.isActive;
      setShowInactive(nextInactive);
      setProductMessage(productDraft.id ? (payload.isActive ? "Product saved and available for sale." : "Product archived. You can restore it from archived products.") : "Product added to your catalogue.");
      setProductDraft(null);
      await refresh(session, { inactive: nextInactive });
    } catch (err) { setProductError(err.message || "Could not save the product."); }
    finally { setSavingProduct(false); }
  }

  const title = page.title;
  useEffect(() => {
    document.title = `${page.title}${business?.name ? ` · ${business.name}` : ""} · Sukuru`;
  }, [page.title, business?.name]);
  const role = session?.role || tokenRole(session?.accessToken || "");
  const canEditProducts = role === "owner" || role === "manager";
  const canEditBusiness = role === "owner";
  const name = business?.name || "Your business";
  const userName = session?.user?.fullName || session?.email || "Shop account";
  return <div className="app-shell">
    {mobileNav && <button className="workspace-nav-scrim" aria-label="Close navigation" onClick={() => setMobileNav(false)} />}
    <aside className={`sidebar ${mobileNav ? "open" : ""}`}>
      <Link className="brand" href="/"><span className="brand-mark">S</span>sukuru</Link>
      <WorkspaceSwitcher session={session} business={business} onSession={setSession} onSwitched={handleWorkspaceSwitch} />
      <p className="nav-label">YOUR BUSINESS</p><nav className="nav-list">{sections.map(([label, href, icon]) => <Link key={href} className={`nav-item ${href === path ? "active" : ""}`} href={href} onClick={() => setMobileNav(false)}><span className="nav-icon"><Icon name={icon} size={15} /></span>{label}</Link>)}</nav>
      <div className="sidebar-bottom"><a className="sidebar-support" href="mailto:support@cursorclick.dev?subject=Sukuru%20support">Contact support <span>support@cursorclick.dev</span></a><button className="nav-item signout" onClick={signOut}><span className="nav-icon"><Icon name="signOut" size={14} /></span>Sign out</button><Link className="profile" href="/profile" aria-label="View your Sukuru account profile" onClick={() => setMobileNav(false)}><span className="profile-avatar">{userName.slice(0,1).toUpperCase()}</span><span><strong>{userName}</strong><small>VIEW PROFILE</small></span><Icon name="arrowRight" size={13} /></Link></div>
    </aside>
    <div className="main-shell"><header className="topbar"><button className="mobile-menu" aria-label="Toggle navigation" aria-expanded={mobileNav} onClick={() => setMobileNav(!mobileNav)}><Icon name="menu" /></button><div className="breadcrumbs"><span>sukuru://</span><strong>{path.slice(1) || "overview"}</strong></div><div className="top-actions"><span className={`sync ${error ? "offline" : ""}`}><i />{busy ? "UPDATING" : error ? "CONNECTION ISSUE" : "LIVE FROM SUKURU"}</span><button className="icon-button" aria-label={`Refresh ${title}`} onClick={() => refresh()}><Icon name="refresh" size={15} /></button><Link className="top-avatar" href="/profile" aria-label="View your account profile">{userName.slice(0,1).toUpperCase()}</Link></div></header>
      <main className="main-content workspace-content"><section className="welcome"><div><p className="eyebrow"><i />{page.eyebrow}<span className="eyebrow-rule" /></p><h1>{title}<span>.</span></h1><p className="welcome-sub">{page.description}</p></div><div className="welcome-actions">{path === "/sales" && <Link className="primary-button" href="/?action=sale">+ <AnimatedLabel>Record a sale</AnimatedLabel></Link>}{path === "/inventory" && <Link className="primary-button" href="/?action=purchase">+ <AnimatedLabel>Restock inventory</AnimatedLabel></Link>}{path === "/products" && <><button className="button button-outline" onClick={() => { const next = !showInactive; setShowInactive(next); refresh(session, { inactive: next }); }}>{showInactive ? "Show active products" : "Show archived products"}</button>{canEditProducts && <button className="primary-button" onClick={() => { setProductError(""); setProductDraft({ isActive: true }); }}><Icon name="plus" size={14} /><AnimatedLabel>Add product</AnimatedLabel></button>}</>}</div></section>
      {productMessage && path === "/products" && <p className="success-message product-message" role="status">{productMessage}</p>}
      {error ? <section className="panel workspace-state"><p className="section-kicker">COULD NOT CONNECT</p><h2>Records are unavailable right now.</h2><p>{error}</p><button className="primary-button" onClick={() => refresh()}>Try again</button></section> : busy && data === null ? <section className="panel workspace-state">Loading your records</section> : <WorkspaceData page={page} data={data} currency={business?.currency || "RWF"} session={session} business={business} onProfileUpdated={handleProfileUpdated} showInactive={showInactive} editingBusiness={editingBusiness} setEditingBusiness={setEditingBusiness} savingBusiness={savingBusiness} saveBusiness={saveBusiness} businessMessage={businessMessage} businessError={businessError} canEditProducts={canEditProducts} canEditBusiness={canEditBusiness} onCreateProduct={() => { setProductError(""); setProductDraft({}); }} onEditProduct={(product) => { setProductError(""); setProductDraft(product); }} onRequestUpgrade={requestUpgrade} upgradeBusy={upgradeBusy} upgradeError={upgradeError} upgradeMessage={upgradeMessage} />}
      {productDraft && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !savingProduct) setProductDraft(null); }}><section className="entry-modal" role="dialog" aria-modal="true" aria-labelledby="product-heading"><button className="dialog-x" aria-label="Close" disabled={savingProduct} onClick={() => setProductDraft(null)}><Icon name="close" size={15} /></button><p className="section-kicker">PRODUCT CATALOGUE</p><h2 id="product-heading">{productDraft.id ? "Edit product" : "Add a product"}</h2><p className="dialog-sub">Keep names and prices ready for quick sales and restocking.</p><form className="form-stack" onSubmit={saveProduct}><label>Product name<input name="name" required maxLength={150} defaultValue={productDraft.name || ""} /></label><div className="form-split"><label>Unit<input name="unit" required maxLength={30} placeholder="each, kg, litre" defaultValue={productDraft.unit || "each"} /></label><label>SKU (optional)<input name="sku" maxLength={100} defaultValue={productDraft.sku || ""} /></label></div><div className="form-split"><label>Purchase cost ({business?.currency || "RWF"})<input name="purchasePrice" type="number" min="0" step="0.01" defaultValue={productDraft.purchasePrice || ""} /></label><label>Selling price ({business?.currency || "RWF"})<input name="sellingPrice" type="number" min="0" step="0.01" defaultValue={productDraft.sellingPrice || ""} /></label></div><label>Description (optional)<textarea name="description" rows="3" maxLength="1000" defaultValue={productDraft.description || ""} /></label>{productDraft.id && <label className="product-active-field"><input name="isActive" type="checkbox" defaultChecked={productDraft.isActive} /> Available for sale</label>}{productError && <p className="error-message" role="alert">{productError}</p>}<button className="primary-button full" disabled={savingProduct}>{savingProduct ? "Saving product" : <AnimatedLabel>Save product</AnimatedLabel>}</button></form></section></div>}
      <footer className="page-footer"><span>MADE FOR THE MOMENTS BETWEEN CUSTOMERS <i></i></span><a href="mailto:support@cursorclick.dev?subject=Sukuru%20support">CONTACT SUPPORT · support@cursorclick.dev</a></footer></main></div>
  </div>;
}

function ProfilePanel({ data, session, business, onUpdated }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function save(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true); setError(""); setMessage("");
    try {
      const updated = await getJson("/api/v1/auth/profile", session, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: String(form.get("fullName") || "").trim(), phone: String(form.get("phone") || "").trim() || null }),
      });
      onUpdated(updated); setEditing(false); setMessage("Your profile was updated.");
    } catch (err) { setError(err.message || "Could not update your profile."); }
    finally { setSaving(false); }
  }

  const fullName = data?.fullName || session?.user?.fullName || "Sukuru account";
  return <section className="panel workspace-details"><div className="panel-head"><div><p className="section-kicker">ACCOUNT PROFILE</p><h2>{fullName}</h2></div><span className="profile-avatar profile-page-avatar">{(fullName || data?.email || "S").slice(0,1).toUpperCase()}</span></div>{editing ? <form className="form-stack settings-form" onSubmit={save}><label>Your name<input name="fullName" required maxLength={150} defaultValue={data?.fullName || session?.user?.fullName || ""} /></label><label>Phone number (optional)<input name="phone" maxLength={30} autoComplete="tel" defaultValue={data?.phone || session?.user?.phone || ""} /></label><div className="detail-row"><span>Email address</span><strong>{data?.email || session?.email}</strong></div>{error && <p className="error-message" role="alert">{error}</p>}<div className="settings-actions"><button type="button" className="button button-outline" disabled={saving} onClick={() => { setEditing(false); setError(""); }}>Cancel</button><button className="primary-button" disabled={saving}>{saving ? "Saving profile" : <AnimatedLabel>Save profile</AnimatedLabel>}</button></div></form> : <>{[["Name",data?.fullName || session?.user?.fullName], ["Email",data?.email || session?.email], ["Phone",data?.phone || session?.user?.phone], ["Access role",String(session?.role || tokenRole(session?.accessToken || "")).replace(/^ROLE_/i, "")], ["Active workspace",business?.name]].filter(([,value]) => value).map(([label,value]) => <div className="detail-row" key={label}><span>{label}</span><strong>{value}</strong></div>)}{message && <p className="success-message" role="status">{message}</p>}<div className="settings-actions profile-actions"><button type="button" className="button button-outline" onClick={() => setEditing(true)}>Edit profile</button><Link className="button button-outline" href="/settings">Business settings</Link></div></>}</section>;
}

function WorkspaceData({ page, data, currency, session, business, onProfileUpdated, showInactive, editingBusiness, setEditingBusiness, savingBusiness, saveBusiness, businessMessage, businessError, onEditProduct, onCreateProduct, canEditProducts, canEditBusiness, onRequestUpgrade, upgradeBusy, upgradeError, upgradeMessage }) {
  if (page.kind === "profile") return <ProfilePanel key={data?.id} data={data} session={session} business={business} onUpdated={onProfileUpdated} />;
  if (page.kind === "billing") return <BillingPanel data={data} onRequestUpgrade={onRequestUpgrade} busy={upgradeBusy} error={upgradeError} message={upgradeMessage} canRequestUpgrade={canEditBusiness} />;
  if (page.kind === "report") return <section className="metrics workspace-metrics"><Metric label="SALES REVENUE" value={money(data?.salesRevenue, currency)} /><Metric label="TRANSACTIONS" value={data?.salesCount ?? 0} /><Metric label="GROSS PROFIT" value={money(data?.grossProfit, currency)} /><Metric label="CURRENCY" value={currency} /></section>;
  if (page.kind === "settings") return <section className="panel workspace-details"><div className="panel-head"><div><p className="section-kicker">SHOP PROFILE</p><h2>Business details</h2></div>{canEditBusiness && !editingBusiness && <button className="button button-outline" onClick={() => { setBusinessError(""); setEditingBusiness(true); }}>Edit details</button>}</div>{editingBusiness ? <form className="form-stack settings-form" onSubmit={saveBusiness}>{[["name","Business name",data?.name,true,150],["businessType","Business type",data?.businessType,false,100],["phone","Phone",data?.phone,false,30],["email","Email",data?.email,false,150],["address","Address",data?.address,false,250],["country","Country",data?.country,false,100],["currency","Currency",data?.currency || currency,false,10]].map(([name,label,value,required,maxLength]) => <label key={name}>{label}<input name={name} defaultValue={value || ""} required={required} maxLength={maxLength} /></label>)}{businessError && <p className="error-message" role="alert">{businessError}</p>}<div className="settings-actions"><button type="button" className="button button-outline" disabled={savingBusiness} onClick={() => { setEditingBusiness(false); setBusinessError(""); }}>Cancel</button><button className="primary-button" disabled={savingBusiness}>{savingBusiness ? "Saving details" : <AnimatedLabel>Save changes</AnimatedLabel>}</button></div></form> : <>{[["Business name",data?.name],["Business type",data?.businessType],["Phone",data?.phone],["Email",data?.email],["Address",data?.address],["Country",data?.country],["Currency",data?.currency]].filter(([,v]) => v).map(([label,value]) => <div className="detail-row" key={label}><span>{label}</span><strong>{value}</strong></div>)}{businessMessage && <p className="success-message" role="status">{businessMessage}</p>}<p className="field-hint">{canEditBusiness ? "Update the details customers and staff use to identify your shop." : "Only an owner can update business details."}</p></>}</section>;
  const rows = Array.isArray(data) ? data : [];
  if (!rows.length && page.kind === "products") return <section className="panel workspace-state"><p className="section-kicker">YOUR CATALOGUE</p><h2>{showInactive ? "No archived products." : "No products added yet."}</h2><p>{showInactive ? "Products you take out of circulation appear here. You can edit one to make it available again." : canEditProducts ? "Add the items your shop sells. Their names and prices will be ready when you record a sale." : "Ask a business owner or manager to add items to the catalogue."}</p>{canEditProducts && !showInactive && <button className="primary-button" onClick={onCreateProduct}><Icon name="plus" size={14} /> Add your first product</button>}</section>;
  if (!rows.length) return <section className="panel workspace-state">{page.kind === "sales" ? "No sales have been recorded yet." : "No stock records found."}</section>;
  if (page.kind === "sales") return <section className="panel workspace-table-wrap"><table className="workspace-table"><thead><tr><th>Reference</th><th>Date</th><th>Status</th><th className="num">Total</th></tr></thead><tbody>{rows.map((item) => <tr key={item.id}><td><strong>{item.referenceNumber || "Sale"}</strong>{item.customerName && <small>{item.customerName}</small>}</td><td>{item.soldAt ? new Date(item.soldAt).toLocaleString() : ""}</td><td><span className="status-pill">{item.paymentStatus || item.status || "Recorded"}</span></td><td className="num amount-positive">{money(item.totalAmount,currency)}</td></tr>)}</tbody></table></section>;
  if (page.kind === "stock") return <section className="panel workspace-table-wrap"><table className="workspace-table"><thead><tr><th>Product</th><th>Quantity on hand</th><th>Stock status</th></tr></thead><tbody>{rows.map((item) => <tr key={item.productId}><td><strong>{item.name}</strong></td><td>{item.quantity} {item.unit || ""}</td><td><span className={`status-pill ${Number(item.quantity) <= 5 ? "warning" : ""}`}>{Number(item.quantity) <= 5 ? "Running low" : "In stock"}</span></td></tr>)}</tbody></table></section>;
  if (page.kind === "products") return <section className="panel workspace-table-wrap"><table className="workspace-table"><thead><tr><th>Product</th><th>SKU</th><th>Unit</th><th>Purchase cost</th><th>Sale price</th><th>Status</th>{canEditProducts && <th></th>}</tr></thead><tbody>{rows.map((item) => <tr key={item.id}><td><strong>{item.name}</strong>{item.description && <small>{item.description}</small>}</td><td>{item.sku || "—"}</td><td>{item.unit}</td><td>{item.purchasePrice ? money(item.purchasePrice,currency) : "—"}</td><td>{money(item.sellingPrice,currency)}</td><td><span className={`status-pill ${item.isActive ? "" : "warning"}`}>{item.isActive ? "Active" : "Archived"}</span></td>{canEditProducts && <td><button className="row-action" onClick={() => onEditProduct(item)}>Edit</button></td>}</tr>)}</tbody></table></section>;
  return <section className="panel workspace-table-wrap"><table className="workspace-table"><thead><tr><th>Product</th><th>SKU</th><th>Sale price</th><th>Status</th></tr></thead><tbody>{rows.map((item) => <tr key={item.id}><td><strong>{item.name}</strong></td><td>{item.sku || ""}</td><td>{money(item.sellingPrice,currency)}</td><td><span className="status-pill">Active</span></td></tr>)}</tbody></table></section>;
}

function BillingPanel({ data, onRequestUpgrade, busy, error, message, canRequestUpgrade }) {
  const premium = data?.plan === "premium" && data?.planStatus === "active";
  const pending = data?.latestRequest?.status === "pending";
  const mobileNumber = data?.mobileMoneyNumber || "+250783453911";
  const supportEmail = data?.supportEmail || "mugishaivanbright250@gmail.com";
  return <div className="billing-layout">
    <section className="panel billing-current">
      <div><p className="section-kicker">CURRENT PLAN</p><h2>{premium ? "Premium" : "Free"}<span className={`billing-status ${premium ? "active" : ""}`}>{premium ? "ACTIVE" : pending ? "REQUEST PENDING" : "ACTIVE"}</span></h2><p>{premium ? "Premium workspace access is enabled for this account." : "Your account currently has the Free workspace allowance."}</p></div>
      <div className="billing-usage"><strong>{data?.workspaceCount ?? 0}<span> / </span>{data?.workspaceLimit ?? 1}</strong><small>OWNER WORKSPACES</small></div>
    </section>
    {pending && <section className="billing-pending" role="status"><span className="billing-pending-mark">PENDING</span><div><strong>Your upgrade request is awaiting payment confirmation.</strong><p>Request {data.latestRequest.id} / Account {data.latestRequest.userId} · {data.latestRequest.paymentMethod === "mobile_money" ? "Mobile Money" : "Email arrangement"}{data.latestRequest.paymentReference ? ` · Reference: ${data.latestRequest.paymentReference}` : ""}</p><small>We will activate Premium after we confirm the payment.</small></div></section>}
    <div className="billing-plans">
      <section className="panel billing-plan-card"><p className="section-kicker">START HERE</p><h2>Free</h2><p className="billing-price">RWF 0 <small>/ always</small></p><ul><li>1 business workspace</li><li>Sales, inventory, and product records</li><li>Core dashboard and reports</li></ul><span className="billing-plan-current">{premium ? "Previous plan" : "Your current plan"}</span></section>
      <section className={`panel billing-plan-card premium ${premium ? "selected" : ""}`}><div className="billing-plan-label"><p className="section-kicker">GROW WITH SUKURU</p><span>PREMIUM</span></div><h2>Premium</h2><p className="billing-price">Price by arrangement</p><ul><li>Up to 5 business workspaces</li><li>Keep each business records separate</li><li>Switch between businesses in one account</li></ul>
        {premium ? <span className="billing-plan-current">Premium is active</span> : pending ? <button className="primary-button full" disabled>Request pending</button> : !canRequestUpgrade ? <p className="billing-owner-note">Only the business owner can request a plan upgrade.</p> : <form className="billing-request-form" onSubmit={onRequestUpgrade}><label>Arrange payment by<select name="paymentMethod" defaultValue="mobile_money"><option value="mobile_money">Mobile Money</option><option value="email">Email arrangement</option></select></label><div className="billing-instructions"><strong>Payment instructions</strong><span>Send payment to <a href={`tel:${mobileNumber.replaceAll(" ", "")}`}>{mobileNumber}</a>. For email arrangement, contact <a href={`mailto:${supportEmail}?subject=Sukuru%20Premium%20upgrade`}>{supportEmail}</a>.</span></div><label>Payment reference (optional)<input name="paymentReference" maxLength={120} placeholder="Enter the transfer reference if paid" /></label>{error && <p className="error-message" role="alert">{error}</p>}{message && <p className="success-message" role="status">{message}</p>}<button className="primary-button full" disabled={busy}>{busy ? "Sending request…" : "Request Premium"}</button><small className="billing-note">Your plan stays Free until payment is confirmed and approved.</small></form>}
      </section>
    </div>
    <section className="panel billing-roadmap"><div><p className="section-kicker">POSSIBLE FUTURE ADD-ONS</p><h2>Ideas for paid features</h2><p>These are proposals only and are not included in Premium yet.</p></div><div className="billing-roadmap-items"><span><b>Planned</b> AI business insights</span><span><b>Proposed</b> Downloadable reports</span><span><b>Proposed</b> Larger team plans</span></div></section>
    <p className="billing-contact">Need help arranging a plan? <a href={`mailto:${supportEmail}?subject=Sukuru%20plan%20upgrade`}>{supportEmail}</a></p>
  </div>;
}

function Metric({ label, value }) { return <article className="metric"><div className="metric-top"><span>{label}</span></div><strong>{value}</strong><div className="metric-bottom">Today</div></article>; }
