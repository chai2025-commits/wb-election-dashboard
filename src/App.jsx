import { useState, useEffect, useCallback, useRef } from "react";

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const DISTRICTS = [
  { id: "D1", name: "MURSHIDABAD",      zm: "Bittu",   ac: 22, sectors: 542, ps: 5895 },
  { id: "D2", name: "MALDA",            zm: "Hemanth", ac: 12, sectors: 261, ps: 3106 },
  { id: "D3", name: "DAKSHIN DINAJPUR", zm: "Hemanth", ac: 6,  sectors: 146, ps: 1343 },
  { id: "D4", name: "UTTAR DINAJPUR",   zm: "Hemanth", ac: 9,  sectors: 199, ps: 2249 },
  { id: "D5", name: "JALPAIGURI",       zm: "Moses",   ac: 7,  sectors: 228, ps: 1928 },
  { id: "D6", name: "DARJEELING",       zm: "Subodh",  ac: 5,  sectors: 174, ps: 1465 },
  { id: "D7", name: "KALIMPONG",        zm: "Subodh",  ac: 1,  sectors: 55,  ps: 293  },
  { id: "D8", name: "COOCHBEHAR",       zm: "Moses",   ac: 9,  sectors: 243, ps: 2537 },
  { id: "D9", name: "ALIPURDUAR",       zm: "Moses",   ac: 5,  sectors: 136, ps: 1350 },
];

const ZM_MAP = { Bittu: ["D1"], Hemanth: ["D2","D3","D4"], Moses: ["D5","D8","D9"], Subodh: ["D6","D7"] };

const WORKS = [
  { key: "cctv_check",   label: "CCTV Cameras",          sub: "SST Checkpost",            cat: "CCTV" },
  { key: "ptz_fs",       label: "PTZ Cameras",           sub: "Flying Squad Vehicle",      cat: "PTZ" },
  { key: "gps_fs",       label: "GPS Tracker",           sub: "Flying Squad Vehicle",      cat: "GPS" },
  { key: "gps_aware",    label: "GPS Tracker",           sub: "Awareness Vehicle",         cat: "GPS" },
  { key: "gps_evm_sec",  label: "GPS Tracker",           sub: "Sector Vehicles (EVM/VVPAT)",cat: "GPS" },
  { key: "gps_evm_ps",   label: "GPS Tracker",           sub: "Vehicle to PS (EVM/VVPAT)", cat: "GPS" },
  { key: "cctv_ps",      label: "Polling Station Cameras",sub: "All Polling Stations",     cat: "CCTV" },
  { key: "cctv_count",   label: "Counting Hall Cameras", sub: "Per AC",                    cat: "CCTV" },
  { key: "cr_gps",       label: "Control Room — GPS",    sub: "Setup",                     cat: "Control Room" },
  { key: "cr_ptz",       label: "Control Room — PTZ",    sub: "Setup",                     cat: "Control Room" },
  { key: "cr_check",     label: "Control Room — Checkpost",sub: "Setup",                   cat: "Control Room" },
  { key: "cr_ps",        label: "Control Room — Polling Day",sub: "Setup",                 cat: "Control Room" },
  { key: "cr_count",     label: "Control Room — Counting",sub: "Setup",                    cat: "Control Room" },
];

const DEFAULT_MATERIALS = [
  { id: "M1", name: "PTZ Cameras",              unit: "Units", cat: "PTZ" },
  { id: "M2", name: "GPS Trackers",             unit: "Units", cat: "GPS" },
  { id: "M3", name: "CCTV — Checkpost",         unit: "Units", cat: "CCTV" },
  { id: "M4", name: "CCTV — Polling Station",   unit: "Units", cat: "CCTV" },
  { id: "M5", name: "CCTV — Counting Hall",     unit: "Units", cat: "CCTV" },
  { id: "M6", name: "Control Room Equipment",   unit: "Sets",  cat: "CONTROL" },
];

const WAREHOUSES = {
  "WH-KOL": { name: "Warehouse — Kolkata", short: "KOL WH" },
  "WH-SIL": { name: "Warehouse — Siliguri", short: "SIL WH", address: "P.K Shah Complex, Hill Cart Road, Dagapur, Siliguri 734003" },
};

// Pre-seeded users: password stored plaintext here for demo — in prod you'd hash
const DEFAULT_USERS = [
  { id: "u1", username: "admin",   password: "WBElec@2024", role: "admin",   name: "System Admin",    zmKey: null },
  { id: "u2", username: "bittu",   password: "Bittu@2024",  role: "zm",      name: "Bittu",           zmKey: "Bittu" },
  { id: "u3", username: "hemanth", password: "Hemanth@2024",role: "zm",      name: "Hemanth",         zmKey: "Hemanth" },
  { id: "u4", username: "moses",   password: "Moses@2024",  role: "zm",      name: "Moses",           zmKey: "Moses" },
  { id: "u5", username: "subodh",  password: "Subodh@2024", role: "zm",      name: "Subodh",          zmKey: "Subodh" },
  { id: "u6", username: "viewer",  password: "View@2024",   role: "viewer",  name: "State Viewer",    zmKey: null },
];

const ZM_COLORS = {
  Bittu:   { bg: "#dbeafe", text: "#1e40af", border: "#93c5fd" },
  Hemanth: { bg: "#fef3c7", text: "#92400e", border: "#fcd34d" },
  Moses:   { bg: "#dcfce7", text: "#166534", border: "#86efac" },
  Subodh:  { bg: "#ede9fe", text: "#4c1d95", border: "#c4b5fd" },
};

function buildInitialDState() {
  const ds = {};
  DISTRICTS.forEach(d => {
    ds[d.id] = { coord: { name: "", contact: "", date: "" }, works: {}, customTasks: [] };
    WORKS.forEach(w => { ds[d.id].works[w.key] = { target: 0, installed: 0, status: "pending" }; });
    ds[d.id].works.cctv_ps.target    = d.ps;
    ds[d.id].works.cctv_check.target = d.sectors;
    ds[d.id].works.ptz_fs.target     = Math.ceil(d.sectors * 0.4);
    ds[d.id].works.gps_fs.target     = Math.ceil(d.sectors * 0.3);
    ds[d.id].works.gps_aware.target  = Math.ceil(d.sectors * 0.2);
    ds[d.id].works.gps_evm_sec.target= d.sectors;
    ds[d.id].works.gps_evm_ps.target = d.ps;
    ds[d.id].works.cctv_count.target = d.ac;
    ["cr_gps","cr_ptz","cr_check","cr_ps","cr_count"].forEach(k => ds[d.id].works[k].target = 1);
  });
  return ds;
}

// ─── UTILS ───────────────────────────────────────────────────────────────────
const pct = (a, b) => b > 0 ? Math.min(100, Math.round((a / b) * 100)) : 0;
const fmtDt = s => { if (!s) return "—"; const d = new Date(s); return d.toLocaleDateString("en-IN",{day:"2-digit",month:"short"}) + " " + d.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:false}); };
const nowISO = () => new Date().toISOString();
const isOverdue = mv => { if (mv.status === "DESTINATION" || mv.status === "SOURCE") return false; if (!mv.expectedDt) return false; return new Date() > new Date(mv.expectedDt); };
function locName(type, distId, custom) {
  if (type==="WH-KOL") return "WH — Kolkata";
  if (type==="WH-SIL") return "WH — Siliguri";
  if (type==="LOCAL")  return "Local Purchase";
  if (type==="CHECKPOST") return (custom||"")+" Checkpost";
  if (type==="FST")    return "FST Vehicle";
  if (type==="RO")     return "RO Office / Control Room";
  if (type==="PS")     return (custom||"")+" Polling Station";
  if (type==="COUNTING") return "Counting Hall";
  if (distId) { const d = DISTRICTS.find(x=>x.id===distId); if (d) return d.name+(custom?" / "+custom:""); }
  return custom||type||"—";
}

// ─── SUPABASE CLIENT ─────────────────────────────────────────────────────────
// ⚠️  Replace these two values with your own from Supabase → Settings → API
const SUPA_URL = import.meta.env.VITE_SUPA_URL;
const SUPA_KEY = import.meta.env.VITE_SUPA_KEY;
const supabase = window.supabase.createClient(SUPA_URL, SUPA_KEY);

// ─── STORAGE HELPERS ─────────────────────────────────────────────────────────
async function loadShared(key, fallback) {
  try {
    const { data, error } = await supabase
      .from("app_state")
      .select("value")
      .eq("key", key)
      .single();
    if (error || !data) return fallback;
    return data.value ?? fallback;
  } catch { return fallback; }
}
async function saveShared(key, val) {
  try {
    await supabase
      .from("app_state")
      .upsert({ key, value: val, updated_at: new Date().toISOString() });
  } catch {}
}

// ─── TOAST ───────────────────────────────────────────────────────────────────
function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div style={{position:"fixed",bottom:24,right:24,zIndex:9999,background:"#1a2332",color:"#fff",padding:"10px 18px",borderRadius:8,fontSize:13,fontWeight:500,boxShadow:"0 4px 20px rgba(0,0,0,0.25)",maxWidth:320,lineHeight:1.4}}>
      {msg}
    </div>
  );
}

// ─── PROGRESS BAR ────────────────────────────────────────────────────────────
function ProgBar({ value, color = "#1d6ef5", height = 6, width = "100%" }) {
  return (
    <div style={{background:"#e2e5ea",borderRadius:3,overflow:"hidden",height,width}}>
      <div style={{height:"100%",borderRadius:3,background:color,width:`${value}%`,transition:"width .4s"}} />
    </div>
  );
}

// ─── ROLE MAP — email → role/name/zmKey ──────────────────────────────────────
// ⚠️  These emails must exactly match what you create in Supabase → Authentication → Users
const ROLE_MAP = {
  "admin@wbelection.in":   { role: "admin",  name: "System Admin",  zmKey: null },
  "bittu@wbelection.in":   { role: "zm",     name: "Bittu",         zmKey: "Bittu" },
  "hemanth@wbelection.in": { role: "zm",     name: "Hemanth",       zmKey: "Hemanth" },
  "moses@wbelection.in":   { role: "zm",     name: "Moses",         zmKey: "Moses" },
  "subodh@wbelection.in":  { role: "zm",     name: "Subodh",        zmKey: "Subodh" },
  "viewer@wbelection.in":  { role: "viewer", name: "State Viewer",  zmKey: null },
};

// ─── LOGIN SCREEN ────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [pass, setPass]   = useState("");
  const [err, setErr]     = useState("");
  const [loading, setLoading] = useState(false);
  const [clock, setClock] = useState(new Date().toLocaleTimeString("en-IN",{hour12:false}));

  useEffect(() => {
    const t = setInterval(() => setClock(new Date().toLocaleTimeString("en-IN",{hour12:false})), 1000);
    return () => clearInterval(t);
  }, []);

  async function handleLogin() {
    if (!email.trim() || !pass) { setErr("Enter your email and password."); return; }
    setLoading(true); setErr("");
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pass });
      if (error) { setErr("Invalid email or password."); setLoading(false); return; }
      const profile = ROLE_MAP[data.user.email];
      if (!profile) { setErr("Account not configured. Contact admin."); setLoading(false); return; }
      onLogin({ ...profile, id: data.user.id, email: data.user.email });
    } catch { setErr("Connection error. Try again."); }
    setLoading(false);
  }

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#0f1c2e 0%,#1a2f47 60%,#0d2137 100%)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',system-ui,sans-serif"}}>
      <div style={{width:"100%",maxWidth:400,padding:"0 20px"}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{width:60,height:60,background:"#1d6ef5",borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,margin:"0 auto 16px"}}>🗳️</div>
          <div style={{fontSize:22,fontWeight:700,color:"#fff",letterSpacing:"-0.4px"}}>WB Election Surveillance</div>
          <div style={{fontSize:11,color:"#64748b",letterSpacing:"1.5px",textTransform:"uppercase",marginTop:4,fontFamily:"'DM Mono',monospace"}}>Command Dashboard</div>
          <div style={{fontSize:12,color:"#475569",marginTop:8,fontFamily:"'DM Mono',monospace"}}>{clock}</div>
        </div>
        <div style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:14,padding:28,backdropFilter:"blur(10px)"}}>
          <div style={{marginBottom:16}}>
            <div style={{fontSize:11,fontWeight:600,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.6px",marginBottom:6}}>Email</div>
            <input value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()}
              placeholder="your.name@wbelection.in" type="email"
              style={{width:"100%",background:"rgba(255,255,255,0.07)",border:"1.5px solid rgba(255,255,255,0.12)",borderRadius:8,padding:"10px 12px",fontSize:13,color:"#fff",outline:"none",boxSizing:"border-box",fontFamily:"inherit"}} />
          </div>
          <div style={{marginBottom:20}}>
            <div style={{fontSize:11,fontWeight:600,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.6px",marginBottom:6}}>Password</div>
            <input type="password" value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()}
              placeholder="Enter your password"
              style={{width:"100%",background:"rgba(255,255,255,0.07)",border:"1.5px solid rgba(255,255,255,0.12)",borderRadius:8,padding:"10px 12px",fontSize:13,color:"#fff",outline:"none",boxSizing:"border-box",fontFamily:"inherit"}} />
          </div>
          {err && <div style={{background:"rgba(217,48,37,0.15)",border:"1px solid rgba(217,48,37,0.3)",borderRadius:6,padding:"8px 12px",fontSize:12,color:"#fca5a5",marginBottom:14}}>{err}</div>}
          <button onClick={handleLogin} disabled={loading}
            style={{width:"100%",background:loading?"#1558d6":"#1d6ef5",border:"none",borderRadius:8,padding:"11px",fontSize:14,fontWeight:600,color:"#fff",cursor:loading?"default":"pointer",fontFamily:"inherit",opacity:loading?0.8:1}}>
            {loading ? "Signing in…" : "Sign In"}
          </button>
          <div style={{marginTop:20,borderTop:"1px solid rgba(255,255,255,0.08)",paddingTop:16}}>
            <div style={{fontSize:11,color:"#64748b",marginBottom:8}}>Team Accounts</div>
            {Object.entries(ROLE_MAP).map(([em, p])=>(
              <div key={em} style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"#94a3b8",padding:"3px 0",fontFamily:"'DM Mono',monospace"}}>
                <span style={{color:"#cbd5e1"}}>{em}</span>
                <span style={{background:"rgba(255,255,255,0.06)",padding:"1px 7px",borderRadius:4,color:"#64748b"}}>{p.role}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState("state");
  const [dstate, setDstate] = useState(buildInitialDState);
  const [materials, setMaterials] = useState(DEFAULT_MATERIALS);
  const [movements, setMovements] = useState([]);
  const [audit, setAudit] = useState([]);
  const [whStock, setWhStock] = useState({"WH-KOL":{},"WH-SIL":{}});
  // zmCustomTasks: { [districtId]: [...tasks] } — private per ZM, never shared with others
  const [zmCustomTasks, setZmCustomTasks] = useState({});
  const [toast, setToast] = useState("");
  const [loaded, setLoaded] = useState(false);
  const toastTimer = useRef(null);
  const [clock, setClock] = useState(new Date().toLocaleTimeString("en-IN",{hour12:false}));
  const mvIdRef = useRef(1);
  const auditIdRef = useRef(1);
  const matIdRef = useRef(10);

  // Key used to store this user's private custom tasks in Supabase (unique per ZM)
  const zmTaskKey = currentUser?.zmKey
    ? `customtasks-${currentUser.zmKey}`
    : currentUser?.role === "admin" ? "customtasks-admin" : null;

  // Load shared data on mount
  useEffect(() => {
    async function load() {
      const ds  = await loadShared("dstate",    buildInitialDState());
      const mts = await loadShared("materials", DEFAULT_MATERIALS);
      const mvs = await loadShared("movements", []);
      const aud = await loadShared("audit",     []);
      const whs = await loadShared("whstock",   {"WH-KOL":{},"WH-SIL":{}});
      setDstate(ds); setMaterials(mts); setMovements(mvs); setAudit(aud); setWhStock(whs);
      if (mvs.length) mvIdRef.current = Math.max(...mvs.map(m=>parseInt(m.id.replace("MV",""))||0)) + 1;
      if (aud.length) auditIdRef.current = Math.max(...aud.map(a=>parseInt(a.id.replace("A",""))||0)) + 1;
      if (mts.length) matIdRef.current = Math.max(...mts.map(m=>parseInt(m.id.replace("M",""))||0)) + 1;
      setLoaded(true);
    }
    load();
    const t = setInterval(() => setClock(new Date().toLocaleTimeString("en-IN",{hour12:false})), 1000);
    return () => clearInterval(t);
  }, []);

  // Load this ZM's private custom tasks when they log in
  useEffect(() => {
    if (!zmTaskKey) return;
    loadShared(zmTaskKey, {}).then(ct => setZmCustomTasks(ct));
  }, [zmTaskKey]);

  // Live sync — poll Supabase every 10 s so all users see each other's changes
  useEffect(() => {
    if (!currentUser) return;
    const interval = setInterval(async () => {
      const ds  = await loadShared("dstate",    buildInitialDState());
      const mvs = await loadShared("movements", []);
      const aud = await loadShared("audit",     []);
      const mts = await loadShared("materials", DEFAULT_MATERIALS);
      const whs = await loadShared("whstock",   {"WH-KOL":{},"WH-SIL":{}});
      setDstate(ds); setMovements(mvs); setAudit(aud); setMaterials(mts); setWhStock(whs);
      // Also refresh own private custom tasks
      if (zmTaskKey) {
        const ct = await loadShared(zmTaskKey, {});
        setZmCustomTasks(ct);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [currentUser, zmTaskKey]);

  const showToast = useCallback((msg) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 3200);
  }, []);

  // Save helpers — keys match the app_state table rows created in Supabase
  const saveDstate    = d => { setDstate(d);    saveShared("dstate",    d); };
  const saveMaterials = m => { setMaterials(m); saveShared("materials", m); };
  const saveMovements = m => { setMovements(m); saveShared("movements", m); };
  const saveAudit     = a => { setAudit(a);     saveShared("audit",     a); };
  const saveWhStock       = w => { setWhStock(w);   saveShared("whstock",   w); };
  const saveZmCustomTasks = ct => {
    setZmCustomTasks(ct);
    if (zmTaskKey) saveShared(zmTaskKey, ct);
  };

  function addAuditEntry(action, mv, extra = "") {
    const entry = {
      id: "A"+(auditIdRef.current++), ts: nowISO(), action,
      matId: mv.matId, qty: mv.qty,
      src: locName(mv.src.type, mv.src.distId, mv.src.custom),
      dest: locName(mv.dest.type, mv.dest.distId, mv.dest.custom),
      status: mv.status, custodian: mv.sentBy||mv.receivedBy||"—",
      challan: mv.challan||"—", vehicle: mv.vehicle||"—",
      condition: mv.condition||"good", notes: extra||mv.notes||"—", locked: true,
      user: currentUser?.name||"system"
    };
    return entry;
  }

  if (!loaded) return (
    <div style={{minHeight:"100vh",background:"#f0f2f5",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',system-ui,sans-serif",color:"#4a5568"}}>
      Loading data…
    </div>
  );

  if (!currentUser) return <LoginScreen onLogin={setCurrentUser} />;

  const canEdit = currentUser.role === "admin" || currentUser.role === "zm";
  const isAdmin = currentUser.role === "admin";

  return (
    <div style={{minHeight:"100vh",background:"#f0f2f5",fontFamily:"'DM Sans',system-ui,sans-serif",fontSize:14,color:"#1a2332"}}>
      {/* TOP BAR */}
      <div style={{background:"#fff",borderBottom:"1px solid #e2e5ea",padding:"0 24px",display:"flex",alignItems:"center",justifyContent:"space-between",height:60,position:"sticky",top:0,zIndex:100,boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:36,height:36,background:"#1d6ef5",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🗳️</div>
          <div>
            <div style={{fontSize:15,fontWeight:700,color:"#1a2332",letterSpacing:"-0.3px"}}>WB Election Surveillance</div>
            <div style={{fontSize:10,color:"#8a97a8",fontFamily:"'DM Mono',monospace",letterSpacing:"0.5px"}}>INTEGRATED OPERATIONS & MATERIAL TRACKING</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{display:"flex",alignItems:"center",gap:5,background:"#fce8e6",color:"#d93025",borderRadius:20,padding:"4px 10px",fontSize:11,fontWeight:600,fontFamily:"'DM Mono',monospace"}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:"#d93025",animation:"blink 1s infinite"}} />
            LIVE
          </div>
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:12,color:"#4a5568"}}>{clock}</div>
          <div style={{display:"flex",alignItems:"center",gap:8,paddingLeft:12,borderLeft:"1px solid #e2e5ea"}}>
            <div style={{width:32,height:32,borderRadius:"50%",background:currentUser.role==="admin"?"#fee2e2":currentUser.role==="zm"?"#fef3c7":"#e8f0fe",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>
              {currentUser.role==="admin"?"👑":currentUser.role==="zm"?"👤":"👁"}
            </div>
            <div>
              <div style={{fontSize:12,fontWeight:600,color:"#1a2332"}}>{currentUser.name}</div>
              <div style={{fontSize:10,color:"#8a97a8",textTransform:"uppercase",letterSpacing:"0.4px"}}>{currentUser.role}</div>
            </div>
            <button onClick={async()=>{await supabase.auth.signOut();setCurrentUser(null);}} style={{marginLeft:4,background:"none",border:"1px solid #e2e5ea",borderRadius:6,padding:"4px 10px",fontSize:11,cursor:"pointer",color:"#4a5568",fontFamily:"inherit"}}>Sign out</button>
          </div>
        </div>
      </div>

      {/* NAV */}
      <div style={{background:"#fff",borderBottom:"1px solid #e2e5ea",padding:"0 24px",display:"flex",gap:2,overflowX:"auto"}}>
        {[
          {id:"state", label:"🗺 State Overview"},
          {id:"zm",    label:"👤 Zonal Manager Portal"},
          {id:"mat",   label:"📦 Material Movement"},
          {id:"audit", label:"📋 Audit Trail"},
          {id:"ai",    label:"🤖 AI Assistant"},
        ].map(tab => (
          <button key={tab.id} onClick={()=>setActiveTab(tab.id)}
            style={{padding:"13px 18px",fontSize:13,fontWeight:activeTab===tab.id?600:500,color:activeTab===tab.id?"#1d6ef5":"#8a97a8",background:"none",border:"none",borderBottom:activeTab===tab.id?"2px solid #1d6ef5":"2px solid transparent",cursor:"pointer",whiteSpace:"nowrap",fontFamily:"inherit",transition:"all .15s"}}>
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{padding:24,maxWidth:1700,margin:"0 auto"}}>
        {activeTab==="state" && (
          <StateOverview dstate={dstate} movements={movements} materials={materials} />
        )}
        {activeTab==="zm" && (
          <ZMPortal
            currentUser={currentUser} dstate={dstate} saveDstate={saveDstate}
            movements={movements} canEdit={canEdit}
            showToast={showToast} addAuditEntry={addAuditEntry}
            audit={audit} saveAudit={saveAudit}
            zmCustomTasks={zmCustomTasks} saveZmCustomTasks={saveZmCustomTasks}
          />
        )}
        {activeTab==="mat" && (
          <MaterialMovement
            movements={movements} saveMovements={saveMovements}
            materials={materials} saveMaterials={saveMaterials}
            whStock={whStock} saveWhStock={saveWhStock}
            audit={audit} saveAudit={saveAudit}
            addAuditEntry={addAuditEntry}
            mvIdRef={mvIdRef} matIdRef={matIdRef} auditIdRef={auditIdRef}
            showToast={showToast} canEdit={canEdit} currentUser={currentUser}
          />
        )}
        {activeTab==="audit" && (
          <AuditTrail
            audit={audit} saveAudit={saveAudit} materials={materials}
            isAdmin={isAdmin} showToast={showToast} auditIdRef={auditIdRef}
            currentUser={currentUser}
          />
        )}
        {activeTab==="ai" && (
          <AIAssistant
            dstate={dstate} movements={movements} materials={materials}
            audit={audit} whStock={whStock}
          />
        )}
      </div>

      <Toast msg={toast} />
      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:.2}}*{box-sizing:border-box}input,select,textarea{font-family:inherit}`}</style>
    </div>
  );
}

// ─── STATE OVERVIEW ───────────────────────────────────────────────────────────
function StateOverview({ dstate, movements, materials }) {
  const distOverall = did => {
    let t=0, i=0;
    WORKS.forEach(w => { t += dstate[did].works[w.key].target; i += dstate[did].works[w.key].installed; });
    return pct(i, t);
  };
  const done = DISTRICTS.reduce((acc, d) => acc + WORKS.filter(w=>dstate[d.id].works[w.key].status==="done").length, 0);
  const transit = movements.filter(m => m.status==="TRANSIT").length;
  const delayed = movements.filter(m => isOverdue(m)).length;

  const RING_GROUPS = [
    {name:"PS Cameras",   keys:["cctv_ps"],   color:"#1d6ef5"},
    {name:"Checkpost",    keys:["cctv_check"],color:"#f29900"},
    {name:"PTZ Cams",     keys:["ptz_fs"],    color:"#0f9d58"},
    {name:"GPS",          keys:["gps_fs","gps_aware","gps_evm_sec","gps_evm_ps"], color:"#d93025"},
  ];

  return (
    <div>
      {/* KPIs */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:20}}>
        {[
          {label:"Total Districts",   value:"9",        sub:"4 Zonal Managers",        color:"#1d6ef5"},
          {label:"Polling Stations",  value:"20,166",   sub:"1,984 Sectors · 76 ACs",  color:"#f29900"},
          {label:"Tasks Completed",   value:done,       sub:"of 117 total",            color:"#0f9d58"},
          {label:"In Transit",        value:transit,    sub:delayed>0?`⚠ ${delayed} delayed`:"All on time", color:"#d93025"},
        ].map((k,i) => (
          <div key={i} style={{background:"#fff",borderRadius:10,padding:"18px 20px",boxShadow:"0 1px 3px rgba(0,0,0,0.06)",border:"1px solid #e2e5ea",borderTop:`3px solid ${k.color}`}}>
            <div style={{fontSize:11,fontWeight:600,color:"#8a97a8",textTransform:"uppercase",letterSpacing:"0.6px",marginBottom:8}}>{k.label}</div>
            <div style={{fontSize:26,fontWeight:700,letterSpacing:"-0.5px"}}>{k.value}</div>
            <div style={{fontSize:12,color:k.label==="In Transit"&&delayed>0?"#d93025":"#8a97a8",marginTop:4}}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 300px",gap:16}}>
        <div>
          <div style={{background:"#fff",borderRadius:10,border:"1px solid #e2e5ea",marginBottom:16,overflow:"hidden"}}>
            <div style={{padding:"14px 18px",borderBottom:"1px solid #e2e5ea",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{fontWeight:600,fontSize:14}}>District Status Overview</div>
              <div style={{fontSize:12,color:"#8a97a8"}}>Update via Zonal Manager Portal →</div>
            </div>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead>
                  <tr style={{background:"#f7f8fa"}}>
                    {["#","District","Zone","Coordinator","AC/Sec/PS","WH Recv","PS Cams","Checkpost","PTZ","GPS","Overall"].map(h=>(
                      <th key={h} style={{padding:"10px 14px",fontSize:11,fontWeight:600,color:"#8a97a8",textAlign:"left",textTransform:"uppercase",letterSpacing:"0.5px",borderBottom:"1px solid #e2e5ea",whiteSpace:"nowrap"}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DISTRICTS.map(d => {
                    const s = dstate[d.id];
                    const op = distOverall(d.id);
                    const recv = movements.filter(m=>m.dest.distId===d.id&&m.status==="DESTINATION").reduce((a,m)=>a+(m.ackedQty??m.qty),0);
                    const bars = ["cctv_ps","cctv_check","ptz_fs","gps_evm_ps"].map(k=>pct(s.works[k].installed, s.works[k].target));
                    const zmC = ZM_COLORS[d.zm]||{bg:"#f1f5f9",text:"#475569",border:"#cbd5e1"};
                    const opColor = op<30?"#d93025":op<70?"#f29900":"#0f9d58";
                    return (
                      <tr key={d.id} style={{borderBottom:"1px solid #f0f2f5"}}>
                        <td style={{padding:"11px 14px",fontSize:11,color:"#8a97a8",fontFamily:"'DM Mono',monospace"}}>{d.id}</td>
                        <td style={{padding:"11px 14px",fontWeight:600,fontSize:13}}>{d.name}</td>
                        <td style={{padding:"11px 14px"}}>
                          <span style={{background:zmC.bg,color:zmC.text,border:`1px solid ${zmC.border}`,borderRadius:20,padding:"3px 8px",fontSize:11,fontWeight:600}}>{d.zm}</span>
                        </td>
                        <td style={{padding:"11px 14px",fontSize:12,color:s.coord.name?"#1a2332":"#8a97a8"}}>{s.coord.name||"—"}</td>
                        <td style={{padding:"11px 14px",fontSize:11,fontFamily:"'DM Mono',monospace",color:"#4a5568"}}>{d.ac}·{d.sectors}·{d.ps.toLocaleString()}</td>
                        <td style={{padding:"11px 14px"}}><span style={{background:"#ede9fe",color:"#4c1d95",borderRadius:20,padding:"3px 8px",fontSize:11,fontWeight:600}}>{recv.toLocaleString()}</span></td>
                        {bars.map((p,i)=>(
                          <td key={i} style={{padding:"11px 14px",minWidth:80}}>
                            <div style={{fontSize:11,fontWeight:600,color:p>=100?"#0f9d58":p>0?"#f29900":"#d93025",marginBottom:3}}>{p}%</div>
                            <ProgBar value={p} color={p>=100?"#0f9d58":p>0?"#f29900":"#d93025"} height={5} width={70} />
                          </td>
                        ))}
                        <td style={{padding:"11px 14px"}}>
                          <div style={{fontSize:15,fontWeight:700,color:opColor}}>{op}%</div>
                          <ProgBar value={op} color={opColor} height={5} width={60} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right panel: Rings + Zonal */}
        <div>
          <div style={{background:"#fff",borderRadius:10,border:"1px solid #e2e5ea",marginBottom:16}}>
            <div style={{padding:"14px 18px",borderBottom:"1px solid #e2e5ea",fontWeight:600,fontSize:14}}>Overall Progress</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,padding:18}}>
              {RING_GROUPS.map(g => {
                let t=0, iv=0;
                DISTRICTS.forEach(d => g.keys.forEach(k => { t+=dstate[d.id].works[k].target; iv+=dstate[d.id].works[k].installed; }));
                const p = pct(iv,t);
                const R=32, C=2*Math.PI*R, dash=C*p/100;
                return (
                  <div key={g.name} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
                    <div style={{position:"relative",width:80,height:80}}>
                      <svg width="80" height="80" viewBox="0 0 80 80" style={{transform:"rotate(-90deg)"}}>
                        <circle cx="40" cy="40" r={R} fill="none" stroke="#e8eaed" strokeWidth="7"/>
                        <circle cx="40" cy="40" r={R} fill="none" stroke={g.color} strokeWidth="7" strokeDasharray={`${dash} ${C}`} strokeLinecap="round"/>
                      </svg>
                      <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700}}>{p}%</div>
                    </div>
                    <div style={{fontSize:11,fontWeight:500,color:"#4a5568",textAlign:"center"}}>{g.name}</div>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{background:"#fff",borderRadius:10,border:"1px solid #e2e5ea"}}>
            <div style={{padding:"14px 18px",borderBottom:"1px solid #e2e5ea",fontWeight:600,fontSize:14}}>Zonal Summary</div>
            <div style={{padding:16}}>
              {Object.keys(ZM_MAP).map(zm => {
                const dids = ZM_MAP[zm];
                let t=0, iv=0;
                dids.forEach(did => WORKS.forEach(w => { t+=dstate[did].works[w.key].target; iv+=dstate[did].works[w.key].installed; }));
                const p = pct(iv,t);
                const zmC = ZM_COLORS[zm];
                return (
                  <div key={zm} style={{paddingBottom:12,marginBottom:12,borderBottom:"1px solid #f0f2f5"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                      <div style={{fontWeight:600,fontSize:13,color:zmC.text}}>{zm}</div>
                      <div style={{fontSize:11,color:"#8a97a8"}}>{dids.length} districts</div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <div style={{flex:1}}><ProgBar value={p} color={zmC.text} height={6}/></div>
                      <div style={{fontSize:12,fontWeight:600,color:zmC.text,width:32,textAlign:"right"}}>{p}%</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ZM PORTAL ────────────────────────────────────────────────────────────────
function ZMPortal({ currentUser, dstate, saveDstate, movements, canEdit, showToast, addAuditEntry, audit, saveAudit, zmCustomTasks, saveZmCustomTasks }) {
  const isAdmin = currentUser.role === "admin";
  const zmOptions = isAdmin ? Object.keys(ZM_MAP) : (currentUser.zmKey ? [currentUser.zmKey] : []);
  const [selectedZM, setSelectedZM] = useState(currentUser.zmKey || "");
  const [activeDist, setActiveDist] = useState(null);

  useEffect(() => {
    if (selectedZM && ZM_MAP[selectedZM]) setActiveDist(ZM_MAP[selectedZM][0]);
  }, [selectedZM]);

  function saveCoord(did) {
    const name    = document.getElementById(`fn-${did}`)?.value.trim()||"";
    const contact = document.getElementById(`fc-${did}`)?.value.trim()||"";
    const date    = document.getElementById(`fd-${did}`)?.value||"";
    const nd = { ...dstate, [did]: { ...dstate[did], coord: { name, contact, date } } };
    saveDstate(nd);
    showToast(`✔ Coordinator saved for ${DISTRICTS.find(x=>x.id===did)?.name}`);
  }

  function saveWorks(did) {
    // Save system works into shared dstate (visible to all)
    const newWorks = {};
    WORKS.forEach(w => {
      const t = Math.max(0, parseInt(document.getElementById(`t-${did}-${w.key}`)?.value)||0);
      const iv= Math.min(Math.max(0, parseInt(document.getElementById(`i-${did}-${w.key}`)?.value)||0), t);
      const st= document.getElementById(`s-${did}-${w.key}`)?.value||"pending";
      newWorks[w.key] = { target:t, installed:iv, status:st };
    });
    const nd = { ...dstate, [did]: { ...dstate[did], works: newWorks } };
    saveDstate(nd);

    // Save custom task progress into private ZM store (invisible to others)
    const currentCustom = zmCustomTasks[did] || [];
    const updatedCustom = currentCustom.map(ct => {
      const t = Math.max(0, parseInt(document.getElementById(`t-${did}-${ct.key}`)?.value)||0);
      const iv= Math.min(Math.max(0, parseInt(document.getElementById(`i-${did}-${ct.key}`)?.value)||0), t);
      const st= document.getElementById(`s-${did}-${ct.key}`)?.value||"pending";
      return { ...ct, target:t, installed:iv, status:st };
    });
    saveZmCustomTasks({ ...zmCustomTasks, [did]: updatedCustom });

    showToast(`✔ Work data saved for ${DISTRICTS.find(x=>x.id===did)?.name}`);
  }

  const dids = selectedZM ? ZM_MAP[selectedZM] : [];
  const zmC = ZM_COLORS[selectedZM] || {bg:"#f1f5f9",text:"#475569"};

  return (
    <div>
      <div style={{background:`linear-gradient(135deg,${zmC.bg},#fff)`,border:`1px solid ${zmC.border||"#e2e5ea"}`,borderRadius:10,padding:"18px 22px",marginBottom:18,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
        <div>
          <div style={{fontSize:18,fontWeight:700,color:zmC.text}}>👤 Zonal Manager Portal</div>
          <div style={{fontSize:12,color:"#4a5568",marginTop:3}}>Select zone to update coordinator details and installation progress</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:12,fontWeight:600,color:"#4a5568"}}>Zone</span>
          <select value={selectedZM} onChange={e=>setSelectedZM(e.target.value)}
            style={{padding:"7px 12px",fontSize:13,border:"1.5px solid #e2e5ea",borderRadius:8,background:"#fff",cursor:"pointer",fontFamily:"inherit"}}>
            {!selectedZM && <option value="">-- Choose Zone --</option>}
            {zmOptions.map(z => <option key={z} value={z}>{z} — {ZM_MAP[z].map(d=>DISTRICTS.find(x=>x.id===d)?.name).join(", ")}</option>)}
          </select>
        </div>
      </div>

      {!selectedZM && (
        <div style={{textAlign:"center",padding:"48px 24px",color:"#8a97a8"}}>
          <div style={{fontSize:36,marginBottom:12}}>👆</div>
          <div style={{fontSize:15,fontWeight:600,color:"#4a5568"}}>Select your zone above</div>
          <div style={{fontSize:13}}>District tabs will appear here</div>
        </div>
      )}

      {selectedZM && (
        <div>
          {/* District tabs */}
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:16}}>
            {dids.map(did => {
              const d = DISTRICTS.find(x=>x.id===did);
              return (
                <button key={did} onClick={()=>setActiveDist(did)}
                  style={{padding:"8px 18px",fontSize:12,fontWeight:500,border:`1.5px solid ${activeDist===did?zmC.text:"#e2e5ea"}`,borderRadius:20,background:activeDist===did?zmC.text:"#fff",color:activeDist===did?"#fff":"#4a5568",cursor:"pointer",fontFamily:"inherit",transition:"all .15s"}}>
                  {d.name}
                </button>
              );
            })}
          </div>

          {dids.filter(did=>did===activeDist).map(did => (
            <DistrictForm key={did} did={did} dstate={dstate} saveDstate={saveDstate} movements={movements}
              canEdit={canEdit} saveCoord={saveCoord} saveWorks={saveWorks}
              zmCustomTasks={zmCustomTasks} saveZmCustomTasks={saveZmCustomTasks} />
          ))}
        </div>
      )}
    </div>
  );
}

function DistrictForm({ did, dstate, saveDstate, movements, canEdit, saveCoord, saveWorks, zmCustomTasks, saveZmCustomTasks }) {
  const d = DISTRICTS.find(x=>x.id===did);
  const s = dstate[did];
  const recv = movements.filter(m=>m.dest.distId===did&&m.status==="DESTINATION").reduce((a,m)=>a+(m.ackedQty??m.qty),0);
  const sent = movements.filter(m=>m.src.distId===did).reduce((a,m)=>a+m.qty,0);
  const [, forceUpdate] = useState(0);

  // Custom tasks are private to this ZM — read from zmCustomTasks, never from shared dstate
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTask, setNewTask] = useState({ label:"", sub:"", cat:"Other" });
  const customTasks = zmCustomTasks[did] || [];

  const CAT_OPTIONS = ["CCTV","PTZ","GPS","Control Room","Logistics","Training","Other"];

  function addCustomTask() {
    if (!newTask.label.trim()) return;
    const key = "custom_" + Date.now();
    const task = { key, label: newTask.label.trim(), sub: newTask.sub.trim(), cat: newTask.cat, target: 0, installed: 0, status: "pending", isCustom: true };
    const updated = [...customTasks, task];
    // Save into private ZM store only — does not touch shared dstate
    saveZmCustomTasks({ ...zmCustomTasks, [did]: updated });
    setNewTask({ label:"", sub:"", cat:"Other" });
    setShowAddTask(false);
  }

  function removeCustomTask(key) {
    const updated = customTasks.filter(t => t.key !== key);
    saveZmCustomTasks({ ...zmCustomTasks, [did]: updated });
  }

  const allTasks = [...WORKS.map(w=>({...w, ...s.works[w.key], isCustom:false})), ...customTasks];
  const totalTasks = allTasks.length;

  return (
    <div>
      {/* Coordinator card */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
        <div style={{background:"#fff",border:"1px solid #e2e5ea",borderRadius:10,padding:18}}>
          <div style={{fontWeight:600,fontSize:13,marginBottom:14,paddingBottom:10,borderBottom:"1px solid #e2e5ea",display:"flex",gap:7,alignItems:"center"}}>
            🎓 District Coordinator
          </div>
          <div style={{marginBottom:12}}>
            <div style={{fontSize:11,fontWeight:600,color:"#4a5568",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:5}}>Full Name</div>
            <input id={`fn-${did}`} defaultValue={s.coord.name} placeholder="IIM Intern Name" disabled={!canEdit}
              style={{width:"100%",border:"1.5px solid #e2e5ea",borderRadius:6,padding:"8px 12px",fontSize:13,background:canEdit?"#fff":"#f7f8fa"}} />
          </div>
          <div style={{marginBottom:12}}>
            <div style={{fontSize:11,fontWeight:600,color:"#4a5568",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:5}}>Contact</div>
            <input id={`fc-${did}`} defaultValue={s.coord.contact} placeholder="+91 XXXXX XXXXX" disabled={!canEdit}
              style={{width:"100%",border:"1.5px solid #e2e5ea",borderRadius:6,padding:"8px 12px",fontSize:13,background:canEdit?"#fff":"#f7f8fa"}} />
          </div>
          <div style={{marginBottom:12}}>
            <div style={{fontSize:11,fontWeight:600,color:"#4a5568",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:5}}>Reporting Date</div>
            <input type="date" id={`fd-${did}`} defaultValue={s.coord.date} disabled={!canEdit}
              style={{width:"100%",border:"1.5px solid #e2e5ea",borderRadius:6,padding:"8px 12px",fontSize:13,background:canEdit?"#fff":"#f7f8fa"}} />
          </div>
          {canEdit && (
            <button onClick={()=>saveCoord(did)} style={{background:"#f29900",color:"#fff",border:"none",borderRadius:6,padding:"7px 16px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
              💾 Save Coordinator
            </button>
          )}
        </div>
        <div style={{background:"#fff",border:"1px solid #e2e5ea",borderRadius:10,padding:18}}>
          <div style={{fontWeight:600,fontSize:13,marginBottom:14,paddingBottom:10,borderBottom:"1px solid #e2e5ea"}}>📍 {d.name}</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
            {[["Assembly",d.ac],["Sectors",d.sectors],["PS",d.ps.toLocaleString()]].map(([l,v])=>(
              <div key={l} style={{background:"#f7f8fa",border:"1px solid #e2e5ea",borderRadius:8,padding:10,textAlign:"center"}}>
                <div style={{fontSize:10,fontWeight:600,color:"#8a97a8",textTransform:"uppercase",letterSpacing:"0.5px"}}>{l}</div>
                <div style={{fontSize:20,fontWeight:700,marginTop:4}}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{display:"flex",gap:20,background:"#f5f3ff",border:"1px solid #ddd6fe",borderRadius:8,padding:"12px 16px"}}>
            <div><div style={{fontSize:10,fontWeight:600,color:"#8a97a8",textTransform:"uppercase"}}>WH Received</div><div style={{fontSize:20,fontWeight:700,color:"#7c3aed",marginTop:2}}>{recv.toLocaleString()}</div></div>
            <div><div style={{fontSize:10,fontWeight:600,color:"#8a97a8",textTransform:"uppercase"}}>Dispatched Fwd</div><div style={{fontSize:20,fontWeight:700,color:"#f29900",marginTop:2}}>{sent.toLocaleString()}</div></div>
          </div>
        </div>
      </div>

      {/* Works table */}
      <div style={{background:"#fff",border:"1px solid #e2e5ea",borderRadius:10,overflow:"hidden"}}>
        {/* Header */}
        <div style={{padding:"14px 18px",borderBottom:"1px solid #e2e5ea",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{fontWeight:600,fontSize:14}}>Work Assignment — {d.name}</div>
            <span style={{fontSize:11,background:"#f1f3f5",color:"#4a5568",borderRadius:20,padding:"3px 10px",fontWeight:600}}>{totalTasks} tasks</span>
            {customTasks.length > 0 && (
              <span style={{fontSize:11,background:"#e8f0fe",color:"#1d6ef5",borderRadius:20,padding:"3px 10px",fontWeight:600}}>{customTasks.length} custom</span>
            )}
          </div>
          {canEdit && (
            <button onClick={()=>setShowAddTask(true)}
              style={{background:"#1d6ef5",color:"#fff",border:"none",borderRadius:6,padding:"7px 14px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:5}}>
              + Add Task
            </button>
          )}
        </div>

        {/* Add task inline form */}
        {showAddTask && canEdit && (
          <div style={{padding:"16px 18px",borderBottom:"1px solid #e2e5ea",background:"#f0f7ff",display:"flex",flexWrap:"wrap",gap:10,alignItems:"flex-end"}}>
            <div style={{flex:"2 1 180px"}}>
              <div style={{fontSize:11,fontWeight:600,color:"#4a5568",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:5}}>Task Name *</div>
              <input value={newTask.label} onChange={e=>setNewTask({...newTask,label:e.target.value})}
                placeholder="e.g. Voter Awareness Drive"
                style={{width:"100%",border:"1.5px solid #93c5fd",borderRadius:6,padding:"8px 10px",fontSize:13,background:"#fff",outline:"none"}} />
            </div>
            <div style={{flex:"2 1 160px"}}>
              <div style={{fontSize:11,fontWeight:600,color:"#4a5568",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:5}}>Sub-task / Location</div>
              <input value={newTask.sub} onChange={e=>setNewTask({...newTask,sub:e.target.value})}
                placeholder="e.g. All Sectors"
                style={{width:"100%",border:"1.5px solid #93c5fd",borderRadius:6,padding:"8px 10px",fontSize:13,background:"#fff",outline:"none"}} />
            </div>
            <div style={{flex:"1 1 130px"}}>
              <div style={{fontSize:11,fontWeight:600,color:"#4a5568",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:5}}>Category</div>
              <select value={newTask.cat} onChange={e=>setNewTask({...newTask,cat:e.target.value})}
                style={{width:"100%",border:"1.5px solid #93c5fd",borderRadius:6,padding:"8px 10px",fontSize:13,background:"#fff",cursor:"pointer",fontFamily:"inherit"}}>
                {CAT_OPTIONS.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div style={{display:"flex",gap:8,flexShrink:0}}>
              <button onClick={addCustomTask}
                style={{background:"#1d6ef5",color:"#fff",border:"none",borderRadius:6,padding:"8px 16px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>
                ✔ Add Task
              </button>
              <button onClick={()=>{setShowAddTask(false);setNewTask({label:"",sub:"",cat:"Other"});}}
                style={{background:"#fff",color:"#4a5568",border:"1px solid #d0d5dd",borderRadius:6,padding:"8px 12px",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>
                Cancel
              </button>
            </div>
          </div>
        )}

        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead>
              <tr style={{background:"#f7f8fa"}}>
                {["Task","Category","Target","Installed","Status","Progress",...(canEdit?[""]:[])].map(h=>(
                  <th key={h} style={{padding:"10px 14px",fontSize:11,fontWeight:600,color:"#8a97a8",textAlign:"left",textTransform:"uppercase",letterSpacing:"0.5px",borderBottom:"1px solid #e2e5ea",whiteSpace:"nowrap"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* System tasks */}
              {WORKS.map(w => {
                const wk = s.works[w.key];
                const p = pct(wk.installed, wk.target);
                const fc = p>=100?"#0f9d58":p>0?"#f29900":"#d93025";
                const stColors = {pending:{bg:"#fff3e0",color:"#e65100"},progress:{bg:"#e3f2fd",color:"#1565c0"},done:{bg:"#e6f4ea",color:"#0f9d58"}};
                const stC = stColors[wk.status]||stColors.pending;
                return (
                  <tr key={w.key} style={{borderBottom:"1px solid #f0f2f5"}}>
                    <td style={{padding:"11px 14px"}}>
                      <div style={{fontWeight:600,fontSize:13}}>{w.label}</div>
                      <div style={{fontSize:11,color:"#8a97a8"}}>{w.sub}</div>
                    </td>
                    <td style={{padding:"11px 14px"}}>
                      <span style={{background:"#f1f3f5",color:"#4a5568",borderRadius:20,padding:"3px 8px",fontSize:11,fontWeight:600}}>{w.cat}</span>
                    </td>
                    <td style={{padding:"11px 14px"}}>
                      <input id={`t-${did}-${w.key}`} type="number" min="0" defaultValue={wk.target} disabled={!canEdit}
                        onChange={()=>forceUpdate(n=>n+1)}
                        style={{width:70,background:canEdit?"#f5f3ff":"#f7f8fa",border:"1.5px solid #c4b5fd",color:"#7c3aed",padding:"5px 7px",fontSize:12,textAlign:"center",borderRadius:6,fontFamily:"'DM Mono',monospace"}} />
                    </td>
                    <td style={{padding:"11px 14px"}}>
                      <input id={`i-${did}-${w.key}`} type="number" min="0" defaultValue={wk.installed} disabled={!canEdit}
                        onChange={()=>forceUpdate(n=>n+1)}
                        style={{width:70,background:canEdit?"#f5f3ff":"#f7f8fa",border:"1.5px solid #c4b5fd",color:"#7c3aed",padding:"5px 7px",fontSize:12,textAlign:"center",borderRadius:6,fontFamily:"'DM Mono',monospace"}} />
                    </td>
                    <td style={{padding:"11px 14px"}}>
                      <select id={`s-${did}-${w.key}`} defaultValue={wk.status} disabled={!canEdit}
                        style={{background:stC.bg,border:`1.5px solid ${stC.color}`,color:stC.color,padding:"5px 7px",fontSize:11,fontWeight:500,borderRadius:6,cursor:"pointer",width:110,fontFamily:"inherit"}}>
                        <option value="pending">Pending</option>
                        <option value="progress">In Progress</option>
                        <option value="done">Done</option>
                      </select>
                    </td>
                    <td style={{padding:"11px 14px",width:100}}>
                      <div style={{fontSize:11,fontWeight:600,color:fc,marginBottom:3}}>{p}%</div>
                      <ProgBar value={p} color={fc} height={5} width={80}/>
                    </td>
                    {canEdit && <td style={{padding:"11px 14px"}} />}
                  </tr>
                );
              })}

              {/* Custom tasks — separator row if any exist */}
              {customTasks.length > 0 && (
                <tr>
                  <td colSpan={canEdit?7:6} style={{padding:"8px 14px",background:"#f0f7ff",fontSize:11,fontWeight:600,color:"#1d6ef5",letterSpacing:"0.5px",textTransform:"uppercase",borderBottom:"1px solid #bfdbfe",borderTop:"2px solid #bfdbfe"}}>
                    Custom Tasks ({customTasks.length})
                  </td>
                </tr>
              )}

              {/* Custom task rows */}
              {customTasks.map(ct => {
                const p = pct(ct.installed, ct.target);
                const fc = p>=100?"#0f9d58":p>0?"#f29900":"#d93025";
                const stColors = {pending:{bg:"#fff3e0",color:"#e65100"},progress:{bg:"#e3f2fd",color:"#1565c0"},done:{bg:"#e6f4ea",color:"#0f9d58"}};
                const stC = stColors[ct.status]||stColors.pending;
                return (
                  <tr key={ct.key} style={{borderBottom:"1px solid #f0f2f5",background:"#fafcff"}}>
                    <td style={{padding:"11px 14px"}}>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <div style={{width:5,height:5,borderRadius:"50%",background:"#1d6ef5",flexShrink:0}}/>
                        <div>
                          <div style={{fontWeight:600,fontSize:13}}>{ct.label}</div>
                          {ct.sub && <div style={{fontSize:11,color:"#8a97a8"}}>{ct.sub}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{padding:"11px 14px"}}>
                      <span style={{background:"#e8f0fe",color:"#1d6ef5",borderRadius:20,padding:"3px 8px",fontSize:11,fontWeight:600}}>{ct.cat}</span>
                    </td>
                    <td style={{padding:"11px 14px"}}>
                      <input id={`t-${did}-${ct.key}`} type="number" min="0" defaultValue={ct.target} disabled={!canEdit}
                        onChange={()=>forceUpdate(n=>n+1)}
                        style={{width:70,background:canEdit?"#f5f3ff":"#f7f8fa",border:"1.5px solid #c4b5fd",color:"#7c3aed",padding:"5px 7px",fontSize:12,textAlign:"center",borderRadius:6,fontFamily:"'DM Mono',monospace"}} />
                    </td>
                    <td style={{padding:"11px 14px"}}>
                      <input id={`i-${did}-${ct.key}`} type="number" min="0" defaultValue={ct.installed} disabled={!canEdit}
                        onChange={()=>forceUpdate(n=>n+1)}
                        style={{width:70,background:canEdit?"#f5f3ff":"#f7f8fa",border:"1.5px solid #c4b5fd",color:"#7c3aed",padding:"5px 7px",fontSize:12,textAlign:"center",borderRadius:6,fontFamily:"'DM Mono',monospace"}} />
                    </td>
                    <td style={{padding:"11px 14px"}}>
                      <select id={`s-${did}-${ct.key}`} defaultValue={ct.status} disabled={!canEdit}
                        style={{background:stC.bg,border:`1.5px solid ${stC.color}`,color:stC.color,padding:"5px 7px",fontSize:11,fontWeight:500,borderRadius:6,cursor:"pointer",width:110,fontFamily:"inherit"}}>
                        <option value="pending">Pending</option>
                        <option value="progress">In Progress</option>
                        <option value="done">Done</option>
                      </select>
                    </td>
                    <td style={{padding:"11px 14px",width:100}}>
                      <div style={{fontSize:11,fontWeight:600,color:fc,marginBottom:3}}>{p}%</div>
                      <ProgBar value={p} color={fc} height={5} width={80}/>
                    </td>
                    {canEdit && (
                      <td style={{padding:"11px 14px",textAlign:"center"}}>
                        <button onClick={()=>removeCustomTask(ct.key)}
                          title="Remove this custom task"
                          style={{background:"none",border:"1px solid #fca5a5",color:"#d93025",borderRadius:5,width:26,height:26,cursor:"pointer",fontSize:13,display:"inline-flex",alignItems:"center",justifyContent:"center",lineHeight:1}}>
                          ×
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {canEdit && (
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 18px",borderTop:"1px solid #e2e5ea",background:"#f7f8fa"}}>
            <button onClick={()=>setShowAddTask(v=>!v)}
              style={{background:"none",color:"#1d6ef5",border:"1.5px dashed #93c5fd",borderRadius:6,padding:"7px 14px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
              + Add Custom Task
            </button>
            <button onClick={()=>saveWorks(did)}
              style={{background:"#1d6ef5",color:"#fff",border:"none",borderRadius:6,padding:"9px 20px",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
              Save Work Data
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MATERIAL MOVEMENT ────────────────────────────────────────────────────────
function MaterialMovement({ movements, saveMovements, materials, saveMaterials, whStock, saveWhStock, audit, saveAudit, addAuditEntry, mvIdRef, matIdRef, auditIdRef, showToast, canEdit, currentUser }) {
  const [innerTab, setInnerTab] = useState("all");
  const [showNewMv, setShowNewMv] = useState(false);
  const [showNewMat, setShowNewMat] = useState(false);
  const [ackId, setAckId] = useState(null);

  // New Movement form state
  const [mvForm, setMvForm] = useState({ matId:"",qty:"",srcType:"",srcCustom:"",destType:"",destDist:"",destCustom:"",journeyType:"WH_TO_DIST",dispatchDt:"",expectedDt:"",challan:"",vehicle:"",driver:"",sentBy:"",serials:"",condition:"good",notes:"" });
  const [newMatForm, setNewMatForm] = useState({ name:"",unit:"",cat:"CCTV" });
  const [ackForm, setAckForm] = useState({ qty:"",recvBy:"",cond:"good",notes:"",dt:"" });

  function submitMovement() {
    const { matId,qty,srcType,srcCustom,destType,destDist,destCustom,journeyType,dispatchDt,expectedDt,challan,vehicle,driver,sentBy,serials,condition,notes } = mvForm;
    if (!matId) { showToast("⚠ Select a material"); return; }
    if (!qty || parseInt(qty)<=0) { showToast("⚠ Enter valid quantity"); return; }
    if (!srcType) { showToast("⚠ Select source location"); return; }
    if (!destType) { showToast("⚠ Select destination"); return; }
    const srcIsWH = srcType==="WH-KOL"||srcType==="WH-SIL";
    const destIsWH= destType==="WH-KOL"||destType==="WH-SIL";
    if (srcIsWH&&destIsWH&&srcType===destType) { showToast("⚠ Same source and destination warehouse"); return; }
    let srcDistId = DISTRICTS.find(x=>x.id===srcType)?.id||null;
    const resolvedJourney = srcIsWH&&destIsWH?"WH_TO_WH":journeyType;
    const mv = {
      id:"MV"+(mvIdRef.current++), matId, qty:parseInt(qty),
      journeyType:resolvedJourney,
      src:{type:srcType,distId:srcDistId,custom:srcCustom},
      dest:{type:destType,distId:destDist||null,custom:destCustom},
      dispatchDt,expectedDt,actualArrivalDt:null,
      challan,vehicle,driver,sentBy,receivedBy:"",
      serials,condition,notes,
      status:journeyType==="LOCAL_PURCHASE"?"SOURCE":"TRANSIT",
      acked:false,ackedAt:null,ackedBy:"",ackedQty:null,ackedCondition:"",
      discrepancy:false,discrepancyNotes:"",createdAt:nowISO(),
      createdBy:currentUser?.name||"",
    };
    const newMvs = [mv, ...movements];
    const ae = addAuditEntry("MOVEMENT_CREATED", mv);
    saveMovements(newMvs);
    saveAudit([ae, ...audit]);
    const mat = materials.find(m=>m.id===matId);
    showToast(`✔ Movement: ${parseInt(qty)} × ${mat?.name}`);
    setShowNewMv(false);
    setMvForm({ matId:"",qty:"",srcType:"",srcCustom:"",destType:"",destDist:"",destCustom:"",journeyType:"WH_TO_DIST",dispatchDt:"",expectedDt:"",challan:"",vehicle:"",driver:"",sentBy:"",serials:"",condition:"good",notes:"" });
  }

  function submitMaterial() {
    const { name, unit, cat } = newMatForm;
    if (!name.trim()) { showToast("⚠ Enter material name"); return; }
    const mat = { id:"M"+(matIdRef.current++), name:name.trim(), unit:unit||"Units", cat };
    saveMaterials([...materials, mat]);
    showToast(`✔ Added: ${name}`);
    setShowNewMat(false);
    setNewMatForm({ name:"",unit:"",cat:"CCTV" });
  }

  function submitAck() {
    if (!ackForm.recvBy.trim()) { showToast("⚠ Enter receiver name"); return; }
    const mv = movements.find(m=>m.id===ackId);
    if (!mv) return;
    const ackedQty = parseInt(ackForm.qty)||0;
    const updated = {
      ...mv, acked:true, ackedAt:nowISO(), ackedBy:ackForm.recvBy, ackedQty,
      ackedCondition:ackForm.cond, condition:ackForm.cond,
      status:"DESTINATION", actualArrivalDt:ackForm.dt||nowISO(), receivedBy:ackForm.recvBy,
      discrepancy:ackedQty<mv.qty,
      discrepancyNotes:ackedQty<mv.qty?`Dispatched: ${mv.qty}, Received: ${ackedQty}. ${ackForm.notes}`:ackForm.notes,
    };
    const newMvs = movements.map(m=>m.id===ackId?updated:m);
    const ae = addAuditEntry("ACKNOWLEDGED", updated, `Recv'd ${ackedQty}/${mv.qty} by ${ackForm.recvBy}. ${ackForm.notes}`);
    saveMovements(newMvs);
    saveAudit([ae, ...audit]);
    showToast(`✔ Receipt acknowledged${updated.discrepancy?" — DISCREPANCY FLAGGED":""}`);
    setAckId(null);
  }

  function deleteMv(id) {
    if (!window.confirm("Remove this movement entry?")) return;
    saveMovements(movements.filter(m=>m.id!==id));
    showToast("Entry removed");
  }

  function saveWhStockFn(whId) {
    const newWhs = { ...whStock, [whId]: { ...(whStock[whId]||{}) } };
    materials.forEach(mat => {
      const el = document.getElementById(`whs-${whId}-${mat.id}`);
      if (el) newWhs[whId][mat.id] = Math.max(0, parseInt(el.value)||0);
    });
    saveWhStock(newWhs);
    showToast(`✔ Stock saved — ${WAREHOUSES[whId].name}`);
  }

  const transit = movements.filter(m=>m.status==="TRANSIT").length;
  const delayed = movements.filter(m=>isOverdue(m)).length;
  const disc = movements.filter(m=>m.discrepancy).length;
  const totalUnits = movements.reduce((a,m)=>a+m.qty,0);

  let filteredMvs = movements;
  if (innerTab==="transit") filteredMvs = movements.filter(m=>m.status==="TRANSIT");
  else if (innerTab==="delayed") filteredMvs = movements.filter(m=>isOverdue(m));
  else if (innerTab==="discrepancy") filteredMvs = movements.filter(m=>m.discrepancy);

  return (
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18,flexWrap:"wrap",gap:10}}>
        <div>
          <div style={{fontSize:18,fontWeight:700}}>📦 Material Movement Engine</div>
          <div style={{fontSize:12,color:"#8a97a8",marginTop:3}}>Track every unit — Warehouse to Polling Station</div>
        </div>
        {canEdit && (
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>setShowNewMv(true)} style={{background:"#0f9d58",color:"#fff",border:"none",borderRadius:6,padding:"9px 16px",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>+ New Movement</button>
            <button onClick={()=>setShowNewMat(true)} style={{background:"#fff",color:"#4a5568",border:"1.5px solid #d0d5dd",borderRadius:6,padding:"9px 16px",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>+ Material Type</button>
          </div>
        )}
      </div>

      {/* KPIs */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:20}}>
        {[
          {label:"Total Movements",value:movements.length,sub:`${totalUnits.toLocaleString()} units tracked`,color:"#1d6ef5"},
          {label:"In Transit",value:transit,sub:"Awaiting acknowledgement",color:"#f29900"},
          {label:"Delayed",value:delayed,sub:delayed>0?"Overdue arrivals":"All on time",color:"#d93025"},
          {label:"Discrepancies",value:disc,sub:"Qty mismatch on receipt",color:"#7c3aed"},
        ].map((k,i)=>(
          <div key={i} style={{background:"#fff",borderRadius:10,padding:"18px 20px",boxShadow:"0 1px 3px rgba(0,0,0,0.06)",border:"1px solid #e2e5ea",borderTop:`3px solid ${k.color}`}}>
            <div style={{fontSize:11,fontWeight:600,color:"#8a97a8",textTransform:"uppercase",letterSpacing:"0.6px",marginBottom:8}}>{k.label}</div>
            <div style={{fontSize:26,fontWeight:700,letterSpacing:"-0.5px"}}>{k.value}</div>
            <div style={{fontSize:12,color:"#8a97a8",marginTop:4}}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Inner tabs */}
      <div style={{background:"#fff",borderRadius:10,border:"1px solid #e2e5ea",overflow:"hidden"}}>
        <div style={{display:"flex",gap:0,borderBottom:"1px solid #e2e5ea",overflowX:"auto"}}>
          {[
            {id:"all",label:"All Movements"},
            {id:"transit",label:"⚡ In Transit"},
            {id:"delayed",label:"⚠ Delayed"},
            {id:"discrepancy",label:"⛔ Discrepancies"},
            {id:"warehouse",label:"🏭 Warehouse Stock"},
            {id:"diststock",label:"📍 District Stock"},
          ].map(t=>(
            <button key={t.id} onClick={()=>setInnerTab(t.id)}
              style={{padding:"12px 16px",fontSize:12,fontWeight:innerTab===t.id?600:500,color:innerTab===t.id?"#0f9d58":"#8a97a8",background:innerTab===t.id?"#fff":"#f7f8fa",border:"none",borderBottom:innerTab===t.id?"2px solid #0f9d58":"2px solid transparent",cursor:"pointer",whiteSpace:"nowrap",fontFamily:"inherit"}}>
              {t.label}
            </button>
          ))}
        </div>

        <div style={{padding:18}}>
          {(innerTab==="all"||innerTab==="transit"||innerTab==="delayed"||innerTab==="discrepancy") && (
            filteredMvs.length===0 ? (
              <div style={{textAlign:"center",padding:"48px 24px",color:"#8a97a8"}}>
                <div style={{fontSize:36,marginBottom:12}}>📦</div>
                <div style={{fontSize:15,fontWeight:600,color:"#4a5568"}}>{innerTab==="all"?"No movements yet":"No entries in this category"}</div>
              </div>
            ) : filteredMvs.map(mv=>(
              <MvCard key={mv.id} mv={mv} materials={materials} canEdit={canEdit}
                onAck={id=>{const m=movements.find(x=>x.id===id);setAckForm({qty:m?.qty||"",recvBy:"",cond:"good",notes:"",dt:""});setAckId(id);}}
                onDelete={deleteMv} />
            ))
          )}

          {innerTab==="warehouse" && (
            <div>
              <div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:8,padding:"14px 16px",marginBottom:16,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
                <div>
                  <div style={{fontSize:14,fontWeight:600,color:"#0f9d58"}}>🏭 Warehouse Stock Management</div>
                  <div style={{fontSize:12,color:"#4a5568",marginTop:3}}>Enter opening stock. Balance = Opening + Received − Dispatched.</div>
                </div>
                {canEdit && <button onClick={()=>{saveWhStockFn("WH-KOL");saveWhStockFn("WH-SIL");showToast("✔ All warehouse stocks saved");}} style={{background:"#0f9d58",color:"#fff",border:"none",borderRadius:6,padding:"7px 14px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>💾 Save All</button>}
              </div>
              {["WH-KOL","WH-SIL"].map(whId=><WhStockCard key={whId} whId={whId} materials={materials} movements={movements} whStock={whStock} canEdit={canEdit} onSave={saveWhStockFn} />)}
            </div>
          )}

          {innerTab==="diststock" && (
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:14}}>
              {DISTRICTS.map(d=>{
                const rows = materials.filter(mat=>{
                  const recv=movements.filter(m=>m.matId===mat.id&&m.dest.distId===d.id&&m.status==="DESTINATION").reduce((a,m)=>a+(m.ackedQty??m.qty),0);
                  const sent=movements.filter(m=>m.matId===mat.id&&m.src.distId===d.id).reduce((a,m)=>a+m.qty,0);
                  return recv||sent;
                });
                const zmC = ZM_COLORS[d.zm]||{bg:"#f1f5f9",text:"#475569"};
                return (
                  <div key={d.id} style={{background:"#fff",border:"1px solid #e2e5ea",borderRadius:10,overflow:"hidden"}}>
                    <div style={{padding:"12px 16px",borderBottom:"1px solid #e2e5ea",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                      <div style={{fontWeight:600,fontSize:13}}>{d.name}</div>
                      <span style={{background:zmC.bg,color:zmC.text,borderRadius:20,padding:"3px 8px",fontSize:11,fontWeight:600}}>{d.zm}</span>
                    </div>
                    {rows.length===0 ? (
                      <div style={{padding:16,fontSize:12,color:"#8a97a8"}}>No movements recorded</div>
                    ) : (
                      <table style={{width:"100%",borderCollapse:"collapse"}}>
                        <thead><tr style={{background:"#f7f8fa"}}>
                          {["Material","Received","Sent","Balance"].map(h=><th key={h} style={{padding:"8px 12px",fontSize:11,fontWeight:600,color:"#8a97a8",textAlign:"left",textTransform:"uppercase",letterSpacing:"0.5px",borderBottom:"1px solid #e2e5ea"}}>{h}</th>)}
                        </tr></thead>
                        <tbody>
                          {rows.map(mat=>{
                            const recv=movements.filter(m=>m.matId===mat.id&&m.dest.distId===d.id&&m.status==="DESTINATION").reduce((a,m)=>a+(m.ackedQty??m.qty),0);
                            const sent=movements.filter(m=>m.matId===mat.id&&m.src.distId===d.id).reduce((a,m)=>a+m.qty,0);
                            const bal=recv-sent;
                            return (
                              <tr key={mat.id} style={{borderBottom:"1px solid #f0f2f5"}}>
                                <td style={{padding:"9px 12px",fontWeight:600,fontSize:12}}>{mat.name}</td>
                                <td style={{padding:"9px 12px",fontFamily:"'DM Mono',monospace",fontSize:12,color:"#7c3aed"}}>{recv}</td>
                                <td style={{padding:"9px 12px",fontFamily:"'DM Mono',monospace",fontSize:12,color:"#f29900"}}>{sent}</td>
                                <td style={{padding:"9px 12px",fontSize:13,fontWeight:700,color:bal<0?"#d93025":"#0f9d58"}}>{bal}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* New Movement Modal */}
      {showNewMv && (
        <Modal title="📦 New Movement Entry" onClose={()=>setShowNewMv(false)} width={740}>
          <div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:8,padding:"10px 14px",marginBottom:18,fontSize:12,color:"#4a5568"}}>
            Enter material at any level — Warehouse, District, Assembly, Sector, PS etc.
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
            <FormField label="Material Type *">
              <select value={mvForm.matId} onChange={e=>setMvForm({...mvForm,matId:e.target.value})} style={fldStyle}>
                <option value="">Select Material</option>
                {materials.map(m=><option key={m.id} value={m.id}>{m.name} ({m.unit})</option>)}
              </select>
            </FormField>
            <FormField label="Quantity *">
              <input type="number" min="1" value={mvForm.qty} onChange={e=>setMvForm({...mvForm,qty:e.target.value})} placeholder="Number of units" style={fldStyle} />
            </FormField>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,marginBottom:14}}>
            <FormField label="Source Location *">
              <select value={mvForm.srcType} onChange={e=>setMvForm({...mvForm,srcType:e.target.value})} style={fldStyle}>
                <option value="">-- Select Source --</option>
                <optgroup label="Warehouses"><option value="WH-KOL">WH — Kolkata</option><option value="WH-SIL">WH — Siliguri</option></optgroup>
                <optgroup label="Districts">{DISTRICTS.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</optgroup>
                <optgroup label="Other"><option value="LOCAL">Local Purchase</option><option value="OTHER">Other / Custom</option></optgroup>
              </select>
            </FormField>
            <FormField label="Custom Source">
              <input value={mvForm.srcCustom} onChange={e=>setMvForm({...mvForm,srcCustom:e.target.value})} placeholder="Assembly, RO Office..." style={fldStyle} />
            </FormField>
            <FormField label="Destination *">
              <select value={mvForm.destType} onChange={e=>setMvForm({...mvForm,destType:e.target.value})} style={fldStyle}>
                <option value="">-- Select Destination --</option>
                <optgroup label="Warehouses"><option value="WH-KOL">WH — Kolkata</option><option value="WH-SIL">WH — Siliguri</option></optgroup>
                <optgroup label="Districts">{DISTRICTS.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</optgroup>
                <optgroup label="Field"><option value="CHECKPOST">Assembly Checkpost</option><option value="FST">FST Vehicle</option><option value="RO">RO / Control Room</option><option value="PS">Polling Station</option><option value="COUNTING">Counting Hall</option></optgroup>
                <optgroup label="Other"><option value="OTHER">Other / Custom</option></optgroup>
              </select>
            </FormField>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,marginBottom:14}}>
            <FormField label="Destination District">
              <select value={mvForm.destDist} onChange={e=>setMvForm({...mvForm,destDist:e.target.value})} style={fldStyle}>
                <option value="">-- Any District --</option>
                {DISTRICTS.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </FormField>
            <FormField label="Custom Destination">
              <input value={mvForm.destCustom} onChange={e=>setMvForm({...mvForm,destCustom:e.target.value})} placeholder="Assembly / Sector..." style={fldStyle} />
            </FormField>
            <FormField label="Journey Type">
              <select value={mvForm.journeyType} onChange={e=>setMvForm({...mvForm,journeyType:e.target.value})} style={fldStyle}>
                {[["WH_TO_WH","WH → WH Transfer"],["WH_TO_DIST","WH → District"],["DIST_TO_DIST","District → District"],["DIST_TO_ASSEMBLY","District → Assembly"],["DIST_TO_PS","District → Sector → PS"],["DIST_TO_CR","District → Control Room"],["LOCAL_PURCHASE","Local Purchase"],["RETURN","Return / Reversal"],["CUSTOM","Custom"]].map(([v,l])=><option key={v} value={v}>{l}</option>)}
              </select>
            </FormField>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,marginBottom:14}}>
            <FormField label="Dispatch Date & Time *"><input type="datetime-local" value={mvForm.dispatchDt} onChange={e=>setMvForm({...mvForm,dispatchDt:e.target.value})} style={fldStyle}/></FormField>
            <FormField label="Expected Arrival *"><input type="datetime-local" value={mvForm.expectedDt} onChange={e=>setMvForm({...mvForm,expectedDt:e.target.value})} style={fldStyle}/></FormField>
            <FormField label="Challan / GRN No."><input value={mvForm.challan} onChange={e=>setMvForm({...mvForm,challan:e.target.value})} placeholder="Challan / Invoice No." style={fldStyle}/></FormField>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,marginBottom:14}}>
            <FormField label="Vehicle No."><input value={mvForm.vehicle} onChange={e=>setMvForm({...mvForm,vehicle:e.target.value})} placeholder="WB-XX-XXXX" style={fldStyle}/></FormField>
            <FormField label="Driver Name"><input value={mvForm.driver} onChange={e=>setMvForm({...mvForm,driver:e.target.value})} placeholder="Driver Name" style={fldStyle}/></FormField>
            <FormField label="Dispatched By"><input value={mvForm.sentBy} onChange={e=>setMvForm({...mvForm,sentBy:e.target.value})} placeholder="Name / Designation" style={fldStyle}/></FormField>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,marginBottom:18}}>
            <FormField label="Serial Numbers"><input value={mvForm.serials} onChange={e=>setMvForm({...mvForm,serials:e.target.value})} placeholder="PTZ-001 to PTZ-010..." style={fldStyle}/></FormField>
            <FormField label="Condition">
              <select value={mvForm.condition} onChange={e=>setMvForm({...mvForm,condition:e.target.value})} style={fldStyle}>
                <option value="good">Good</option><option value="damaged">Damaged</option><option value="repair">Under Repair</option><option value="condemned">Condemned</option>
              </select>
            </FormField>
            <FormField label="Notes / Remarks"><input value={mvForm.notes} onChange={e=>setMvForm({...mvForm,notes:e.target.value})} placeholder="Any remarks..." style={fldStyle}/></FormField>
          </div>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end",borderTop:"1px solid #e2e5ea",paddingTop:16}}>
            <button onClick={()=>setShowNewMv(false)} style={ghostBtn}>Cancel</button>
            <button onClick={submitMovement} style={successBtn}>✔ Create Movement</button>
          </div>
        </Modal>
      )}

      {/* New Material Modal */}
      {showNewMat && (
        <Modal title="🏷 Add New Material Type" onClose={()=>setShowNewMat(false)} width={440}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
            <FormField label="Material Name *"><input value={newMatForm.name} onChange={e=>setNewMatForm({...newMatForm,name:e.target.value})} placeholder="e.g. PTZ Cameras..." style={fldStyle}/></FormField>
            <FormField label="Unit"><input value={newMatForm.unit} onChange={e=>setNewMatForm({...newMatForm,unit:e.target.value})} placeholder="Units / Nos / Sets" style={fldStyle}/></FormField>
          </div>
          <FormField label="Category">
            <select value={newMatForm.cat} onChange={e=>setNewMatForm({...newMatForm,cat:e.target.value})} style={fldStyle}>
              {["CCTV","PTZ","GPS","CONTROL","VEHICLE","OTHER"].map(c=><option key={c} value={c}>{c}</option>)}
            </select>
          </FormField>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end",borderTop:"1px solid #e2e5ea",paddingTop:16,marginTop:18}}>
            <button onClick={()=>setShowNewMat(false)} style={ghostBtn}>Cancel</button>
            <button onClick={submitMaterial} style={successBtn}>✔ Add Material</button>
          </div>
        </Modal>
      )}

      {/* Acknowledge Modal */}
      {ackId && (() => {
        const mv = movements.find(m=>m.id===ackId);
        const mat = materials.find(m=>m.id===mv?.matId);
        return (
          <Modal title="✅ Acknowledge Receipt" onClose={()=>setAckId(null)} width={560}>
            <div style={{background:"#f7f8fa",border:"1px solid #e2e5ea",borderRadius:8,padding:14,marginBottom:16}}>
              <div style={{fontSize:15,fontWeight:700,marginBottom:4}}>{mat?.name} — {mv?.qty} {mat?.unit}</div>
              <div style={{fontSize:12,color:"#8a97a8"}}>{locName(mv?.src.type,mv?.src.distId,mv?.src.custom)} → {locName(mv?.dest.type,mv?.dest.distId,mv?.dest.custom)}</div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,marginBottom:14}}>
              <FormField label="Quantity Received *"><input type="number" min="0" max={mv?.qty} value={ackForm.qty} onChange={e=>setAckForm({...ackForm,qty:e.target.value})} style={fldStyle}/></FormField>
              <FormField label="Received By *"><input value={ackForm.recvBy} onChange={e=>setAckForm({...ackForm,recvBy:e.target.value})} placeholder="Name / Designation" style={fldStyle}/></FormField>
              <FormField label="Condition on Arrival">
                <select value={ackForm.cond} onChange={e=>setAckForm({...ackForm,cond:e.target.value})} style={fldStyle}>
                  <option value="good">Good</option><option value="damaged">Damaged</option><option value="repair">Under Repair</option><option value="condemned">Condemned</option>
                </select>
              </FormField>
            </div>
            <FormField label="Remarks / Discrepancy Notes"><input value={ackForm.notes} onChange={e=>setAckForm({...ackForm,notes:e.target.value})} placeholder="Issues, missing items, damage..." style={fldStyle}/></FormField>
            <div style={{marginTop:14}}>
              <FormField label="Actual Arrival Date & Time"><input type="datetime-local" value={ackForm.dt} onChange={e=>setAckForm({...ackForm,dt:e.target.value})} style={fldStyle}/></FormField>
            </div>
            <div style={{display:"flex",gap:10,justifyContent:"flex-end",borderTop:"1px solid #e2e5ea",paddingTop:16,marginTop:18}}>
              <button onClick={()=>setAckId(null)} style={ghostBtn}>Cancel</button>
              <button onClick={submitAck} style={successBtn}>✔ Confirm Receipt</button>
            </div>
          </Modal>
        );
      })()}
    </div>
  );
}

function MvCard({ mv, materials, canEdit, onAck, onDelete }) {
  const [open, setOpen] = useState(false);
  const mat = materials.find(m=>m.id===mv.matId);
  const srcN = locName(mv.src.type, mv.src.distId, mv.src.custom);
  const dstN = locName(mv.dest.type, mv.dest.distId, mv.dest.custom);
  const delayed = isOverdue(mv);
  const statusColor = mv.status==="DESTINATION"?"#0f9d58":delayed?"#d93025":"#f29900";
  const statusLabel = mv.status==="SOURCE"?"Source":mv.status==="TRANSIT"?(delayed?"⚠ Delayed":"In Transit"):"✔ Delivered";
  const condColors = {good:"#0f9d58",damaged:"#d93025",repair:"#f29900",condemned:"#d93025"};

  return (
    <div style={{background:"#fff",border:"1px solid #e2e5ea",borderRadius:10,marginBottom:10,overflow:"hidden"}}>
      <div onClick={()=>setOpen(!open)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"13px 16px",cursor:"pointer",flexWrap:"wrap",gap:8,background:open?"#f7f8fa":"#fff",transition:"background .15s"}}>
        <div>
          <div style={{fontSize:14,fontWeight:600}}>{mat?.name||"Unknown"} <span style={{fontSize:13,color:"#8a97a8",fontWeight:400}}>× {mv.qty.toLocaleString()} {mat?.unit||""}</span></div>
          <div style={{fontSize:11,color:"#8a97a8",marginTop:3,fontFamily:"'DM Mono',monospace"}}>{mv.id} · {fmtDt(mv.createdAt)} · {srcN} → {dstN}</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
          <span style={{background:mv.status==="DESTINATION"?"#e6f4ea":delayed?"#fce8e6":"#fef7e0",color:statusColor,borderRadius:20,padding:"3px 8px",fontSize:11,fontWeight:600}}>{statusLabel}</span>
          <span style={{background:condColors[mv.condition||"good"]==="#0f9d58"?"#e6f4ea":"#fce8e6",color:condColors[mv.condition||"good"],borderRadius:20,padding:"3px 8px",fontSize:11,fontWeight:600}}>{(mv.condition||"good").charAt(0).toUpperCase()+(mv.condition||"good").slice(1)}</span>
          {mv.discrepancy && <span style={{background:"#fce8e6",color:"#d93025",borderRadius:20,padding:"3px 8px",fontSize:11,fontWeight:600}}>⛔ Discrepancy</span>}
          {canEdit && mv.status==="TRANSIT"&&!mv.acked && (
            <button onClick={e=>{e.stopPropagation();onAck(mv.id);}}
              style={{padding:"4px 11px",borderRadius:20,fontSize:11,fontWeight:600,cursor:"pointer",border:"1.5px solid #0f9d58",color:"#0f9d58",background:"#e6f4ea",fontFamily:"inherit"}}>
              ✔ Acknowledge
            </button>
          )}
          <span style={{color:"#8a97a8",fontSize:14}}>{open?"▲":"▼"}</span>
        </div>
      </div>
      {open && (
        <div style={{padding:16,background:"#f7f8fa",borderTop:"1px solid #e2e5ea"}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(170px,1fr))",gap:10,marginBottom:14}}>
            {[["Material",mat?.name||"—"],["Quantity",`${mv.qty.toLocaleString()} ${mat?.unit||""}`],["Journey",(mv.journeyType||"—").replace(/_/g," ")],["Dispatched",fmtDt(mv.dispatchDt)],["Expected Arrival",fmtDt(mv.expectedDt)],["Actual Arrival",mv.actualArrivalDt?fmtDt(mv.actualArrivalDt):"—"],["Challan",mv.challan||"—"],["Vehicle",mv.vehicle||"—"],["Driver",mv.driver||"—"],["Dispatched By",mv.sentBy||"—"],["Received By",mv.receivedBy||"—"],["Acked Qty",mv.ackedQty!=null?mv.ackedQty:"—"],["Condition",mv.condition||"—"],["Notes",mv.notes||"—"]].map(([l,v])=>(
              <div key={l} style={{background:"#fff",border:"1px solid #e2e5ea",borderRadius:6,padding:"10px 12px"}}>
                <div style={{fontSize:10,fontWeight:600,color:"#8a97a8",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:4}}>{l}</div>
                <div style={{fontSize:12,color:"#1a2332",fontWeight:500,wordBreak:"break-all"}}>{v}</div>
              </div>
            ))}
          </div>
          {canEdit && <button onClick={()=>onDelete(mv.id)} style={{background:"none",border:"1px solid #e2e5ea",borderRadius:6,padding:"5px 12px",fontSize:11,cursor:"pointer",color:"#4a5568",fontFamily:"inherit"}}>🗑 Remove</button>}
        </div>
      )}
    </div>
  );
}

function WhStockCard({ whId, materials, movements, whStock, canEdit, onSave }) {
  const wh = WAREHOUSES[whId];
  let totalBal=0, totalOpen=0, totalRecv=0, totalDisp=0;
  const rows = materials.map(mat => {
    const opening = parseInt(whStock[whId]?.[mat.id]||0);
    const recv = movements.filter(m=>m.matId===mat.id&&m.dest.type===whId&&m.status==="DESTINATION").reduce((a,m)=>a+(m.ackedQty??m.qty),0);
    const disp = movements.filter(m=>m.matId===mat.id&&m.src.type===whId).reduce((a,m)=>a+m.qty,0);
    const bal = opening+recv-disp;
    totalBal+=bal; totalOpen+=opening; totalRecv+=recv; totalDisp+=disp;
    const dispRate = Math.min(100,Math.round(disp/((opening+recv)||1)*100));
    return { mat, opening, recv, disp, bal, dispRate };
  });

  return (
    <div style={{background:"#fff",border:"1px solid #e2e5ea",borderRadius:10,overflow:"hidden",marginBottom:14,borderTop:"3px solid #0f9d58"}}>
      <div style={{padding:"14px 18px",borderBottom:"1px solid #e2e5ea",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
        <div style={{fontWeight:600,fontSize:14,color:"#0f9d58"}}>{wh.name} {wh.address&&<span style={{fontWeight:400,fontSize:11,color:"#8a97a8"}}>📍 {wh.address}</span>}</div>
        <div style={{display:"flex",gap:16,alignItems:"center",flexWrap:"wrap"}}>
          {[["Opening",totalOpen,"#7c3aed"],["+ Received",totalRecv,"#7c3aed"],["− Dispatched",totalDisp,"#f29900"],["= Balance",totalBal,totalBal<0?"#d93025":"#0f9d58"]].map(([l,v,c])=>(
            <div key={l} style={{textAlign:"center",borderLeft:l==="= Balance"?"2px solid #e2e5ea":undefined,paddingLeft:l==="= Balance"?16:0}}>
              <div style={{fontSize:10,fontWeight:600,color:"#8a97a8",textTransform:"uppercase"}}>{l}</div>
              <div style={{fontSize:18,fontWeight:700,color:c}}>{v.toLocaleString()}</div>
            </div>
          ))}
          {canEdit && <button onClick={()=>onSave(whId)} style={{background:"#0f9d58",color:"#fff",border:"none",borderRadius:6,padding:"6px 14px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>💾 Save</button>}
        </div>
      </div>
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead><tr style={{background:"#f7f8fa"}}>
            {["Material","Opening Stock ✏","External Recv","Dispatched","Balance","Dispatch Rate"].map(h=><th key={h} style={{padding:"10px 14px",fontSize:11,fontWeight:600,color:"#8a97a8",textAlign:"left",textTransform:"uppercase",letterSpacing:"0.5px",borderBottom:"1px solid #e2e5ea",whiteSpace:"nowrap"}}>{h}</th>)}
          </tr></thead>
          <tbody>
            {rows.map(({mat,opening,recv,disp,bal,dispRate},idx)=>(
              <tr key={mat.id} style={{borderBottom:"1px solid #f0f2f5",background:idx%2?"#fafafa":"#fff"}}>
                <td style={{padding:"11px 14px"}}>
                  <div style={{fontWeight:600,fontSize:13}}>{mat.name}</div>
                  <div style={{fontSize:11,color:"#8a97a8"}}>{mat.cat} · {mat.unit}</div>
                </td>
                <td style={{padding:"11px 14px"}}>
                  <input id={`whs-${whId}-${mat.id}`} type="number" min="0" defaultValue={opening} disabled={!canEdit}
                    style={{width:90,background:canEdit?"#f5f3ff":"#f7f8fa",border:"1.5px solid #c4b5fd",color:"#7c3aed",padding:"6px 8px",fontSize:13,textAlign:"center",borderRadius:6,fontFamily:"'DM Mono',monospace"}} />
                </td>
                <td style={{padding:"11px 14px",fontFamily:"'DM Mono',monospace",fontSize:13,color:"#7c3aed"}}>{recv.toLocaleString()}</td>
                <td style={{padding:"11px 14px",fontFamily:"'DM Mono',monospace",fontSize:13,color:"#f29900"}}>{disp.toLocaleString()}</td>
                <td style={{padding:"11px 14px"}}>
                  <div style={{fontSize:20,fontWeight:700,color:bal<0?"#d93025":bal===0?"#8a97a8":"#0f9d58"}}>{bal.toLocaleString()}</div>
                </td>
                <td style={{padding:"11px 14px",width:130}}>
                  <ProgBar value={dispRate} color={dispRate>=90?"#d93025":dispRate>=50?"#f29900":"#0f9d58"} height={6}/>
                  <div style={{fontSize:11,color:"#8a97a8",marginTop:4}}>{dispRate}% dispatched</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── AUDIT TRAIL ──────────────────────────────────────────────────────────────
function AuditTrail({ audit, saveAudit, materials, isAdmin, showToast, auditIdRef, currentUser }) {
  const [search, setSearch] = useState("");
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminUser, setAdminUser] = useState("");
  const [adminPass, setAdminPass] = useState("");
  const [adminErr, setAdminErr] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [pendingDeleteAll, setPendingDeleteAll] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const q = search.toLowerCase();
  const filtered = audit.filter(a => !q || JSON.stringify(a).toLowerCase().includes(q));
  const matName = id => materials.find(m=>m.id===id)?.name||id;

  function submitAdminAuth() {
    if (adminUser==="admin"&&adminPass==="WBElec@2024") {
      setAdminUnlocked(true); setShowAdminModal(false); setAdminErr("");
      const ae = {id:"A"+(auditIdRef.current++),ts:nowISO(),action:"ADMIN_LOGIN",matId:"SYSTEM",qty:0,src:"System",dest:"Audit Trail",status:"SOURCE",custodian:adminUser,challan:"",vehicle:"",condition:"good",notes:"Admin mode activated",locked:true,user:currentUser?.name||""};
      saveAudit([ae,...audit]);
      showToast("✔ Admin authenticated");
      setTimeout(()=>{ setAdminUnlocked(false); showToast("Admin session expired (15 min)"); }, 15*60*1000);
    } else { setAdminErr("Invalid credentials"); }
  }

  function executeDelete() {
    if (deleteConfirm.trim()!=="DELETE") { showToast("Type DELETE exactly"); return; }
    if (pendingDeleteId) {
      const entry = audit.find(a=>a.id===pendingDeleteId);
      const newAudit = audit.filter(a=>a.id!==pendingDeleteId);
      const ae = {id:"A"+(auditIdRef.current++),ts:nowISO(),action:"ADMIN_DELETED_ENTRY",matId:"SYSTEM",qty:0,src:entry?.src||"",dest:entry?.dest||"",status:"SOURCE",custodian:"admin",challan:"",vehicle:"",condition:"good",notes:`Deleted: ${entry?.action} | ${matName(entry?.matId)}`,locked:true,user:currentUser?.name||""};
      saveAudit([ae,...newAudit]);
      showToast("Entry deleted");
    } else if (pendingDeleteAll) {
      const count = audit.length;
      const ae = {id:"A"+(auditIdRef.current++),ts:nowISO(),action:"ADMIN_CLEARED_LOG",matId:"SYSTEM",qty:count,src:"System",dest:"Audit Trail",status:"SOURCE",custodian:"admin",challan:"",vehicle:"",condition:"good",notes:`Admin wiped entire log (${count} entries)`,locked:true,user:currentUser?.name||""};
      saveAudit([ae]);
      showToast(`Audit log cleared — ${count} entries removed`);
    }
    setPendingDeleteId(null); setPendingDeleteAll(false); setDeleteConfirm("");
  }

  return (
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18,flexWrap:"wrap",gap:10}}>
        <div>
          <div style={{fontSize:18,fontWeight:700,color:"#7c3aed"}}>📋 Audit Trail</div>
          <div style={{fontSize:12,color:"#8a97a8",marginTop:3}}>All entries timestamped & locked · EC Compliant</div>
        </div>
        <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
          {isAdmin && !adminUnlocked && (
            <button onClick={()=>setShowAdminModal(true)} style={{background:"#7c3aed",color:"#fff",border:"none",borderRadius:6,padding:"7px 14px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>🔐 Admin Login</button>
          )}
          {adminUnlocked && (
            <>
              <span style={{fontSize:11,fontWeight:600,color:"#d93025",background:"#fce8e6",padding:"4px 12px",borderRadius:20}}>⚠ Admin Mode Active</span>
              <button onClick={()=>saveAudit(a=>{const ae={id:"A"+(auditIdRef.current++),ts:nowISO(),action:"ADMIN_LOGOUT",matId:"SYSTEM",qty:0,src:"System",dest:"Audit Trail",status:"SOURCE",custodian:"admin",challan:"",vehicle:"",condition:"good",notes:"Admin mode deactivated",locked:true,user:currentUser?.name||""};return [ae,...a];})&&setAdminUnlocked(false)} style={{background:"#d93025",color:"#fff",border:"none",borderRadius:6,padding:"7px 14px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>🔒 Lock & Exit</button>
              <button onClick={()=>setPendingDeleteAll(true)} style={{background:"none",border:"1px solid #d93025",color:"#d93025",borderRadius:6,padding:"7px 14px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>🗑 Clear Log</button>
            </>
          )}
        </div>
      </div>

      {adminUnlocked && (
        <div style={{background:"#fff5f5",border:"1px solid #fca5a5",borderRadius:8,padding:"12px 16px",marginBottom:16,display:"flex",alignItems:"center",gap:10}}>
          <div style={{fontSize:20}}>⚠️</div>
          <div><div style={{fontSize:13,fontWeight:600,color:"#d93025"}}>System Admin Override Active</div>
          <div style={{fontSize:12,color:"#4a5568",marginTop:2}}>Deletion is irreversible. Use with extreme caution.</div></div>
        </div>
      )}

      <div style={{background:"#fff",borderRadius:10,border:"1px solid #e2e5ea",overflow:"hidden"}}>
        <div style={{padding:"14px 18px",borderBottom:"1px solid #e2e5ea",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
          <div style={{fontWeight:600,fontSize:14,display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:"#7c3aed"}}/>Complete System Log
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:12,color:"#8a97a8"}}>{filtered.length} entries</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search entries..." style={{...fldStyle,width:200,padding:"6px 10px"}}/>
          </div>
        </div>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr style={{background:"#f7f8fa"}}>
              {["Timestamp","Action","Material","From","To","Qty","Status","Custodian","User","Challan","Vehicle","Condition","Notes","Lock",...(adminUnlocked?["Delete"]:[])].map(h=>(
                <th key={h} style={{padding:"10px 14px",fontSize:11,fontWeight:600,color:"#8a97a8",textAlign:"left",textTransform:"uppercase",letterSpacing:"0.5px",borderBottom:"1px solid #e2e5ea",whiteSpace:"nowrap"}}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.length===0 ? (
                <tr><td colSpan={adminUnlocked?15:14} style={{textAlign:"center",padding:"40px",color:"#8a97a8"}}>No audit entries yet</td></tr>
              ) : filtered.map(a=>{
                const isAdminAct = a.action.includes("ADMIN");
                const isAck = a.action==="ACKNOWLEDGED";
                const condColors = {good:"#0f9d58",damaged:"#d93025",repair:"#f29900",condemned:"#d93025"};
                return (
                  <tr key={a.id} style={{borderBottom:"1px solid #f0f2f5"}}>
                    <td style={{padding:"10px 14px",fontFamily:"'DM Mono',monospace",fontSize:11,color:"#8a97a8",whiteSpace:"nowrap"}}>{fmtDt(a.ts)}</td>
                    <td style={{padding:"10px 14px"}}>
                      <span style={{display:"inline-block",padding:"2px 8px",borderRadius:4,fontFamily:"'DM Mono',monospace",fontSize:10,fontWeight:500,background:isAdminAct?"#fce8e6":isAck?"#e6f4ea":"#e8f0fe",color:isAdminAct?"#d93025":isAck?"#0f9d58":"#1d6ef5"}}>{a.action}</span>
                    </td>
                    <td style={{padding:"10px 14px",fontWeight:600,fontSize:12}}>{matName(a.matId)}</td>
                    <td style={{padding:"10px 14px",fontSize:12,color:"#4a5568"}}>{a.src}</td>
                    <td style={{padding:"10px 14px",fontSize:12,color:"#4a5568"}}>{a.dest}</td>
                    <td style={{padding:"10px 14px",fontFamily:"'DM Mono',monospace",fontSize:13,fontWeight:600}}>{a.qty}</td>
                    <td style={{padding:"10px 14px"}}>
                      <span style={{background:a.status==="SOURCE"?"#e8f0fe":a.status==="TRANSIT"?"#fef7e0":"#e6f4ea",color:a.status==="SOURCE"?"#1d6ef5":a.status==="TRANSIT"?"#f29900":"#0f9d58",borderRadius:20,padding:"3px 8px",fontSize:11,fontWeight:600}}>{a.status==="SOURCE"?"Source":a.status==="TRANSIT"?"Transit":"Dest"}</span>
                    </td>
                    <td style={{padding:"10px 14px",fontSize:12}}>{a.custodian}</td>
                    <td style={{padding:"10px 14px",fontSize:11,color:"#7c3aed"}}>{a.user||"—"}</td>
                    <td style={{padding:"10px 14px",fontFamily:"'DM Mono',monospace",fontSize:11,color:"#8a97a8"}}>{a.challan}</td>
                    <td style={{padding:"10px 14px",fontFamily:"'DM Mono',monospace",fontSize:11,color:"#8a97a8"}}>{a.vehicle}</td>
                    <td style={{padding:"10px 14px"}}>
                      <span style={{background:condColors[a.condition||"good"]==="#0f9d58"?"#e6f4ea":"#fce8e6",color:condColors[a.condition||"good"],borderRadius:20,padding:"3px 8px",fontSize:11,fontWeight:600}}>{(a.condition||"good").charAt(0).toUpperCase()+(a.condition||"good").slice(1)}</span>
                    </td>
                    <td style={{padding:"10px 14px",fontSize:11,color:"#8a97a8",maxWidth:140,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} title={a.notes}>{a.notes}</td>
                    <td style={{padding:"10px 14px",fontSize:13,color:"#0f9d58",textAlign:"center"}}>🔒</td>
                    {adminUnlocked && (
                      <td style={{padding:"10px 14px"}}>
                        <button onClick={()=>{setPendingDeleteId(a.id);setDeleteConfirm("");}} style={{background:"#fce8e6",color:"#d93025",border:"1px solid #fca5a5",borderRadius:4,padding:"3px 9px",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>Del</button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Auth Modal */}
      {showAdminModal && (
        <Modal title="🔐 System Admin Login" onClose={()=>setShowAdminModal(false)} width={400}>
          <div style={{textAlign:"center",marginBottom:16,fontSize:12,color:"#8a97a8",lineHeight:1.6}}>Grants audit trail deletion privileges.<br/>All admin actions are permanently recorded.</div>
          {adminErr && <div style={{background:"#fce8e6",border:"1px solid #fca5a5",padding:"8px 12px",marginBottom:12,fontSize:12,color:"#d93025",textAlign:"center",borderRadius:6}}>{adminErr}</div>}
          <FormField label="Username"><input value={adminUser} onChange={e=>setAdminUser(e.target.value)} placeholder="Enter username" style={fldStyle} autoComplete="off"/></FormField>
          <div style={{marginTop:12}}>
            <FormField label="Password"><input type="password" value={adminPass} onChange={e=>setAdminPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submitAdminAuth()} placeholder="Enter password" style={fldStyle} autoComplete="off"/></FormField>
          </div>
          <div style={{background:"#f7f8fa",border:"1px solid #e2e5ea",borderRadius:6,padding:"10px 12px",marginTop:12,fontSize:12,color:"#4a5568"}}>Default — Username: <strong>admin</strong> · Password: <strong>WBElec@2024</strong></div>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end",borderTop:"1px solid #e2e5ea",paddingTop:16,marginTop:18}}>
            <button onClick={()=>setShowAdminModal(false)} style={ghostBtn}>Cancel</button>
            <button onClick={submitAdminAuth} style={{...successBtn,background:"#d93025"}}>🔓 Authenticate</button>
          </div>
        </Modal>
      )}

      {/* Delete confirm modal */}
      {(pendingDeleteId||pendingDeleteAll) && (
        <Modal title="⚠️ Confirm Deletion" onClose={()=>{setPendingDeleteId(null);setPendingDeleteAll(false);}} width={460}>
          <div style={{background:"#fce8e6",border:"1px solid #fca5a5",borderRadius:8,padding:"12px 14px",marginBottom:16,fontSize:13,color:"#4a5568",lineHeight:1.7}}>
            {pendingDeleteAll ? `You are about to permanently delete ALL ${audit.length} audit entries. This is irreversible.` : (() => { const e=audit.find(a=>a.id===pendingDeleteId); return `Deleting: ${e?.action} · ${matName(e?.matId||"")} · ${fmtDt(e?.ts)}`; })()}
          </div>
          <FormField label={<>Type <span style={{color:"#d93025",fontFamily:"'DM Mono',monospace"}}>DELETE</span> to confirm</>}>
            <input value={deleteConfirm} onChange={e=>setDeleteConfirm(e.target.value)} placeholder="Type DELETE here" style={fldStyle} />
          </FormField>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end",borderTop:"1px solid #e2e5ea",paddingTop:16,marginTop:18}}>
            <button onClick={()=>{setPendingDeleteId(null);setPendingDeleteAll(false);}} style={ghostBtn}>Cancel</button>
            <button onClick={executeDelete} style={{...successBtn,background:"#d93025"}}>🗑 Permanently Delete</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── AI ASSISTANT ─────────────────────────────────────────────────────────────
function AIAssistant({ dstate, movements, materials, audit, whStock }) {
  const [messages, setMessages] = useState([
    { role:"assistant", content:"Hello! I'm your WB Election Dashboard AI Assistant. I have full access to your live data — district progress, material movements, warehouse stock, audit logs, and more.\n\nAsk me anything, for example:\n• \"Which districts are behind on PS camera installation?\"\n• \"Show me all delayed shipments\"\n• \"How many GPS trackers are in transit?\"\n• \"What's the warehouse balance for PTZ cameras?\"" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages]);

  function buildContext() {
    const distSummary = DISTRICTS.map(d => {
      const s = dstate[d.id];
      let t=0,iv=0;
      WORKS.forEach(w=>{t+=s.works[w.key].target;iv+=s.works[w.key].installed;});
      const overall = pct(iv,t);
      const delayed = movements.filter(m=>m.dest.distId===d.id&&isOverdue(m)).length;
      const recv = movements.filter(m=>m.dest.distId===d.id&&m.status==="DESTINATION").reduce((a,m)=>a+(m.ackedQty??m.qty),0);
      return `${d.name}(ZM:${d.zm},Progress:${overall}%,Coordinator:${s.coord.name||"None"},WH_Received:${recv},Delayed_Shipments:${delayed})`;
    }).join("; ");

    const mvSummary = movements.slice(0,30).map(m=>{
      const mat=materials.find(x=>x.id===m.matId);
      return `${m.id}:${mat?.name||"?"} x${m.qty} ${locName(m.src.type,m.src.distId,m.src.custom)}->${locName(m.dest.type,m.dest.distId,m.dest.custom)} status:${m.status}${isOverdue(m)?" DELAYED":""} challan:${m.challan||"-"}`;
    }).join("; ");

    const whSummary = ["WH-KOL","WH-SIL"].map(whId=>{
      const stocks = materials.map(mat=>{
        const opening=parseInt(whStock[whId]?.[mat.id]||0);
        const recv=movements.filter(m=>m.matId===mat.id&&m.dest.type===whId&&m.status==="DESTINATION").reduce((a,m)=>a+(m.ackedQty??m.qty),0);
        const disp=movements.filter(m=>m.matId===mat.id&&m.src.type===whId).reduce((a,m)=>a+m.qty,0);
        return `${mat.name}:bal=${opening+recv-disp}`;
      }).join(",");
      return `${WAREHOUSES[whId].name}(${stocks})`;
    }).join("; ");

    return `You are an AI assistant for the WB Election Surveillance Command Dashboard. You have access to live operational data.

DISTRICTS: ${distSummary}

MATERIAL MOVEMENTS (last 30): ${mvSummary}

WAREHOUSE STOCK: ${whSummary}

TOTAL MOVEMENTS: ${movements.length}, IN_TRANSIT: ${movements.filter(m=>m.status==="TRANSIT").length}, DELAYED: ${movements.filter(m=>isOverdue(m)).length}, DISCREPANCIES: ${movements.filter(m=>m.discrepancy).length}

AUDIT_ENTRIES: ${audit.length}

Answer concisely with specific data from above. If asked to compute or compare, use the numbers provided.`;
  }

  async function send() {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(m => [...m, { role:"user", content:userMsg }]);
    setLoading(true);

    try {
      const history = messages.filter(m=>m.role!=="system").map(m=>({ role:m.role, content:m.content }));
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: buildContext(),
          messages: [...history, { role:"user", content:userMsg }],
        })
      });
      const data = await resp.json();
      const reply = data.content?.[0]?.text || "Sorry, I couldn't process that request.";
      setMessages(m => [...m, { role:"assistant", content:reply }]);
    } catch (e) {
      setMessages(m => [...m, { role:"assistant", content:"Error connecting to AI. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:18}}>
        <div style={{width:44,height:44,background:"linear-gradient(135deg,#1d6ef5,#7c3aed)",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>🤖</div>
        <div>
          <div style={{fontSize:18,fontWeight:700}}>AI Assistant</div>
          <div style={{fontSize:12,color:"#8a97a8",marginTop:2}}>Natural language queries over your live dashboard data · Powered by Claude</div>
        </div>
        <div style={{marginLeft:"auto",fontSize:11,background:"#e8f0fe",color:"#1d6ef5",borderRadius:20,padding:"4px 12px",fontWeight:600}}>Uses Emergent AI Coins</div>
      </div>

      <div style={{background:"#fff",border:"1px solid #e2e5ea",borderRadius:10,overflow:"hidden",display:"flex",flexDirection:"column",height:600}}>
        {/* Messages */}
        <div style={{flex:1,overflowY:"auto",padding:20,display:"flex",flexDirection:"column",gap:14}}>
          {messages.map((m,i) => (
            <div key={i} style={{display:"flex",gap:12,flexDirection:m.role==="user"?"row-reverse":"row"}}>
              <div style={{width:32,height:32,borderRadius:"50%",background:m.role==="user"?"#e8f0fe":"linear-gradient(135deg,#1d6ef5,#7c3aed)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>
                {m.role==="user"?"👤":"🤖"}
              </div>
              <div style={{maxWidth:"75%",background:m.role==="user"?"#1d6ef5":"#f7f8fa",color:m.role==="user"?"#fff":"#1a2332",borderRadius:m.role==="user"?"12px 12px 4px 12px":"12px 12px 12px 4px",padding:"12px 16px",fontSize:13,lineHeight:1.6,whiteSpace:"pre-wrap"}}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
              <div style={{width:32,height:32,borderRadius:"50%",background:"linear-gradient(135deg,#1d6ef5,#7c3aed)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>🤖</div>
              <div style={{background:"#f7f8fa",borderRadius:"12px 12px 12px 4px",padding:"12px 16px"}}>
                <div style={{display:"flex",gap:5,alignItems:"center"}}>
                  {[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:"50%",background:"#8a97a8",animation:`blink ${0.8+i*0.2}s infinite`}}/>)}
                </div>
              </div>
            </div>
          )}
          <div ref={endRef}/>
        </div>

        {/* Suggested prompts */}
        <div style={{padding:"10px 16px",borderTop:"1px solid #f0f2f5",display:"flex",gap:8,flexWrap:"wrap"}}>
          {["Which districts are behind?","Delayed shipments?","Warehouse PTZ balance?","Districts with no coordinator?"].map(p=>(
            <button key={p} onClick={()=>{setInput(p);}} style={{background:"#f0f2f5",border:"1px solid #e2e5ea",borderRadius:20,padding:"5px 12px",fontSize:11,cursor:"pointer",color:"#4a5568",fontFamily:"inherit"}}>
              {p}
            </button>
          ))}
        </div>

        {/* Input */}
        <div style={{padding:16,borderTop:"1px solid #e2e5ea",display:"flex",gap:10}}>
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()}
            placeholder="Ask anything about your dashboard data..."
            style={{flex:1,border:"1.5px solid #e2e5ea",borderRadius:8,padding:"10px 14px",fontSize:13,outline:"none",fontFamily:"inherit"}} />
          <button onClick={send} disabled={loading||!input.trim()}
            style={{background:loading||!input.trim()?"#f0f2f5":"#1d6ef5",color:loading||!input.trim()?"#8a97a8":"#fff",border:"none",borderRadius:8,padding:"10px 20px",fontSize:13,fontWeight:600,cursor:loading||!input.trim()?"default":"pointer",fontFamily:"inherit",transition:"all .15s"}}>
            {loading?"…":"Send"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── SHARED UI HELPERS ────────────────────────────────────────────────────────
function Modal({ title, children, onClose, width=640 }) {
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,0.5)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(3px)"}}>
      <div style={{background:"#fff",borderRadius:14,padding:28,maxWidth:width,width:"95%",maxHeight:"88vh",overflowY:"auto",boxShadow:"0 10px 40px rgba(0,0,0,0.2)"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
          <h3 style={{fontSize:18,fontWeight:700,color:"#1a2332",letterSpacing:"-0.3px"}}>{title}</h3>
          <button onClick={onClose} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#8a97a8",lineHeight:1}}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <div>
      <div style={{fontSize:11,fontWeight:600,color:"#4a5568",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:5}}>{label}</div>
      {children}
    </div>
  );
}

const fldStyle = { width:"100%",border:"1.5px solid #d0d5dd",borderRadius:6,padding:"8px 12px",fontSize:13,background:"#fff",fontFamily:"inherit",outline:"none",boxSizing:"border-box",color:"#1a2332" };
const ghostBtn = { background:"#fff",color:"#4a5568",border:"1.5px solid #d0d5dd",borderRadius:6,padding:"9px 18px",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit" };
const successBtn = { background:"#0f9d58",color:"#fff",border:"none",borderRadius:6,padding:"9px 18px",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit" };
