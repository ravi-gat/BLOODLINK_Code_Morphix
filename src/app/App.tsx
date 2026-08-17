import { useState } from "react";
import { useNavigate } from "react-router";
import { useThemeStore } from "../stores/useThemeStore";
import { useAuthStore } from "../stores/useAuthStore";
import { getRoleDashboardPath } from "../stores/useAuthStore";
import {
  Droplets,
  Search,
  Bell,
  Heart,
  MapPin,
  Clock,
  Users,
  Activity,
  ChevronRight,
  Star,
  Phone,
  MessageCircle,
  Shield,
  Zap,
  Award,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  BarChart2,
  Calendar,
  Settings,
  LogOut,
  Menu,
  X,
  Moon,
  Sun,
  ArrowRight,
  Plus,
  Filter,
  ChevronDown,
  Circle,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

type View = "landing" | "donor" | "patient" | "hospital" | "admin";

const MONTHLY_DATA = [
  { month: "Jan", donations: 420, requests: 380 },
  { month: "Feb", donations: 380, requests: 340 },
  { month: "Mar", donations: 510, requests: 460 },
  { month: "Apr", donations: 470, requests: 420 },
  { month: "May", donations: 590, requests: 530 },
  { month: "Jun", donations: 640, requests: 580 },
  { month: "Jul", donations: 720, requests: 650 },
  { month: "Aug", donations: 680, requests: 610 },
];

const BLOOD_TYPE_DATA = [
  { name: "O+", value: 38, color: "#E53935" },
  { name: "A+", value: 28, color: "#1565C0" },
  { name: "B+", value: 18, color: "#43A047" },
  { name: "AB+", value: 6, color: "#F9A825" },
  { name: "O-", value: 5, color: "#7C3AED" },
  { name: "A-", value: 3, color: "#0891B2" },
  { name: "B-", value: 1.5, color: "#DB2777" },
  { name: "AB-", value: 0.5, color: "#EA580C" },
];

const DONORS = [
  { name: "Arjun Mehta", blood: "O+", dist: "1.2 km", avail: true, rating: 4.9, donations: 12, lastDonated: "45 days ago" },
  { name: "Priya Sharma", blood: "A+", dist: "2.4 km", avail: true, rating: 4.8, donations: 8, lastDonated: "60 days ago" },
  { name: "Rahul Singh", blood: "B+", dist: "3.1 km", avail: false, rating: 4.7, donations: 15, lastDonated: "20 days ago" },
  { name: "Ananya Patel", blood: "AB+", dist: "3.8 km", avail: true, rating: 5.0, donations: 6, lastDonated: "70 days ago" },
  { name: "Vikram Nair", blood: "O-", dist: "4.5 km", avail: true, rating: 4.6, donations: 20, lastDonated: "90 days ago" },
  { name: "Deepa Reddy", blood: "A-", dist: "5.2 km", avail: false, rating: 4.9, donations: 11, lastDonated: "35 days ago" },
];

const TESTIMONIALS = [
  {
    name: "Dr. Meera Krishnan",
    role: "Cardiologist, Apollo Hospitals",
    text: "BloodLink has transformed how we handle emergency transfusions. Response time dropped from hours to under 20 minutes. It has genuinely saved lives in our ICU.",
    avatar: "MK",
    rating: 5,
  },
  {
    name: "Suresh Iyer",
    role: "Registered Blood Donor",
    text: "I've donated 14 times through BloodLink. The AI eligibility check reminds me when I'm ready and matches me with nearby emergencies instantly. Incredibly well designed.",
    avatar: "SI",
    rating: 5,
  },
  {
    name: "Kavitha Nambiar",
    role: "Patient's Family Member",
    text: "When my father needed O- blood urgently, BloodLink found three compatible donors within 2 km in under 5 minutes. I cannot express enough gratitude.",
    avatar: "KN",
    rating: 5,
  },
];

const FAQS = [
  { q: "How does AI donor matching work?", a: "Our AI analyzes blood type compatibility, donor proximity, health eligibility, availability, and historical donation patterns to rank and recommend the most suitable donors for each emergency request in real time." },
  { q: "Is my medical information secure?", a: "All data is encrypted at rest and in transit using AES-256 and TLS 1.3. We are HIPAA compliant and undergo quarterly third-party security audits. Donors control exactly what information is visible." },
  { q: "How soon can a donor respond to my request?", a: "Average response time across our network is 8 minutes. In metro areas with high donor density, compatible donors are typically matched within 3–5 minutes of an emergency request." },
  { q: "Can hospitals integrate BloodLink with their existing systems?", a: "Yes. We offer REST APIs, HL7 FHIR connectors, and dedicated integrations for most major hospital information systems including Epic, Cerner, and Meditech." },
  { q: "What happens after the 90-day donation cooldown?", a: "The platform automatically updates your eligibility status and sends you a notification. You can also run an AI health check at any time to verify readiness before the system reminder." },
];

function Badge({ text, color }: { text: string; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium"
      style={{ background: color + "18", color }}
    >
      {text}
    </span>
  );
}

function BloodTypePill({ type, size = "sm" }: { type: string; size?: "sm" | "lg" }) {
  return (
    <span
      className={`inline-flex items-center justify-center font-bold rounded-lg bg-red-600 text-white ${size === "lg" ? "w-12 h-12 text-base" : "w-8 h-8 text-xs"}`}
    >
      {type}
    </span>
  );
}

function Avatar({ initials, size = "md" }: { initials: string; size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-14 h-14 text-base" };
  return (
    <div className={`${sizes[size]} rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white font-semibold flex-shrink-0`}>
      {initials}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, delta, color }: { icon: any; label: string; value: string; delta?: string; color: string }) {
  return (
    <div className="bg-card rounded-2xl p-6 border border-border shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="p-2.5 rounded-xl" style={{ background: color + "18" }}>
          <Icon size={20} style={{ color }} />
        </div>
        {delta && (
          <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
            {delta}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-foreground font-mono">{value}</div>
      <div className="text-sm text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}

// ─── Nav Auth Button ──────────────────────────────────────────────────────────

function NavAuthButton() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();

  if (isAuthenticated && user) {
    return (
      <button
        onClick={() => navigate(getRoleDashboardPath(user.role as any))}
        className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
      >
        <Droplets size={14} />
        My Dashboard
      </button>
    );
  }

  return (
    <div className="hidden sm:flex items-center gap-2">
      <button onClick={() => navigate("/login")} className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">Sign In</button>
      <button onClick={() => navigate("/register")} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"><Droplets size={14} /> Register</button>
    </div>
  );
}

// ─── Nav ──────────────────────────────────────────────────────────────────────

function Nav({ view, setView, dark, setDark }: { view: View; setView: (v: View) => void; dark: boolean; setDark: (d: boolean) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuthStore();
  const roleLinks: Record<string, { label: string; path: string }[]> = {
    patient: [{ label: "Dashboard", path: "/patient/dashboard" }, { label: "Search Blood", path: "/patient/search" }, { label: "Requests", path: "/patient/history" }, { label: "Notifications", path: "/patient/notifications" }, { label: "Profile", path: "/patient/profile" }],
    donor: [{ label: "Dashboard", path: "/donor/dashboard" }, { label: "Requests", path: "/donor/requests" }, { label: "Donations", path: "/donor/history" }, { label: "Notifications", path: "/donor/notifications" }, { label: "Profile", path: "/donor/profile" }],
    hospital: [{ label: "Dashboard", path: "/hospital/dashboard" }, { label: "Blood Requests", path: "/hospital/inventory" }, { label: "Emergency Requests", path: "/hospital/emergency" }, { label: "Patients", path: "/hospital/patients" }, { label: "Notifications", path: "/hospital/notifications" }],
    bloodbank: [{ label: "Dashboard", path: "/bloodbank/dashboard" }, { label: "Inventory", path: "/bloodbank/inventory" }, { label: "Blood Requests", path: "/bloodbank/requests" }, { label: "Donations", path: "/bloodbank/collection" }, { label: "Notifications", path: "/bloodbank/notifications" }],
    admin: [{ label: "Dashboard", path: "/admin/dashboard" }, { label: "Users", path: "/admin/users" }, { label: "Donors", path: "/admin/donors" }, { label: "Hospitals", path: "/admin/hospitals" }, { label: "Blood Banks", path: "/admin/bloodbanks" }, { label: "Reports", path: "/admin/reports" }],
  };
  const navLinks = isAuthenticated && user ? roleLinks[user.role] : [{ label: "Home", path: "/" }];
  const goHome = () => { setView("landing"); navigate("/"); };

  return (
    <nav className="sticky top-0 z-50 bg-card/90 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <button onClick={goHome} className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center">
            <Droplets size={18} className="text-white" />
          </div>
          <span className="font-bold text-lg text-foreground tracking-tight">BloodLink</span>
        </button>

        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(({ label, path }) => (
            <button
              key={path}
              onClick={() => path === "/" ? goHome() : navigate(path)}
              className="px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setDark(!dark)}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <NavAuthButton />
          {isAuthenticated && user && <button onClick={() => { logout(); goHome(); }} className="hidden sm:flex px-3 py-2 text-sm font-medium text-muted-foreground hover:text-red-600">Logout</button>}
          <button className="md:hidden w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>
      {menuOpen && (
        <div className="md:hidden border-t border-border bg-card px-4 py-3 flex flex-col gap-1">
          {navLinks.map(({ label, path }) => (
            <button key={path} onClick={() => { path === "/" ? goHome() : navigate(path); setMenuOpen(false); }} className="px-3 py-2 rounded-lg text-sm font-medium text-left transition-colors text-muted-foreground hover:bg-muted">
              {label}
            </button>
          ))}
          {!isAuthenticated && <><button onClick={() => navigate("/login")} className="px-3 py-2 text-left text-sm font-medium text-muted-foreground">Sign In</button><button onClick={() => navigate("/register")} className="px-3 py-2 text-left text-sm font-medium text-muted-foreground">Register</button></>}
          {isAuthenticated && <button onClick={() => { logout(); goHome(); }} className="px-3 py-2 text-left text-sm font-medium text-red-600">Logout</button>}
        </div>
      )}
    </nav>
  );
}

// ─── Landing ─────────────────────────────────────────────────────────────────

function Landing({ setView }: { setView: (v: View) => void }) {
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [bloodGroup, setBloodGroup] = useState("");
  const [city, setCity] = useState("");
  const navigate = useNavigate();

  return (
    <div className="bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-600 via-red-700 to-red-900" />
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 20% 80%, #fff 0%, transparent 50%), radial-gradient(circle at 80% 20%, #1565C0 0%, transparent 50%)" }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-white">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm text-sm font-medium mb-6">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                847 donors available near you right now
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
                Every Second<br />
                <span className="text-red-200">Matters.</span><br />
                We Connect Them.
              </h1>
              <p className="text-lg text-red-100 mb-8 max-w-lg leading-relaxed">
                AI-powered emergency donor matching connects patients with compatible blood donors in minutes — not hours. Real-time. Verified. Life-saving.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => navigate("/login")}
                  className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white text-red-700 font-semibold hover:bg-red-50 transition-colors shadow-lg"
                >
                  <Search size={18} />
                  Find Blood Now
                </button>
                <button
                  onClick={() => navigate("/register", { state: { role: "donor" } })}
                  className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white/15 backdrop-blur-sm text-white font-semibold border border-white/30 hover:bg-white/25 transition-colors"
                >
                  <Heart size={18} />
                  Become a Donor
                </button>
              </div>
            </div>

            {/* Search card */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 shadow-2xl">
              <h3 className="text-white font-semibold text-lg mb-4">Find Blood Instantly</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-red-200 text-xs font-medium uppercase tracking-wide mb-1.5 block">Blood Group</label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/20 border border-white/30 text-white placeholder:text-red-200 focus:outline-none focus:ring-2 focus:ring-white/50 text-sm"
                  >
                    <option value="" className="text-gray-900">Select blood group</option>
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((g) => (
                      <option key={g} value={g} className="text-gray-900">{g}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-red-200 text-xs font-medium uppercase tracking-wide mb-1.5 block">City / Location</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Mumbai, Delhi, Bangalore"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/20 border border-white/30 text-white placeholder:text-red-200 focus:outline-none focus:ring-2 focus:ring-white/50 text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-red-200 text-xs font-medium uppercase tracking-wide mb-1.5 block">Hospital</label>
                    <input type="text" placeholder="Any hospital" className="w-full px-3.5 py-2.5 rounded-xl bg-white/20 border border-white/30 text-white placeholder:text-red-200 focus:outline-none text-sm" />
                  </div>
                  <div>
                    <label className="text-red-200 text-xs font-medium uppercase tracking-wide mb-1.5 block">Availability</label>
                    <select className="w-full px-3.5 py-2.5 rounded-xl bg-white/20 border border-white/30 text-white focus:outline-none text-sm">
                      <option className="text-gray-900">Available now</option>
                      <option className="text-gray-900">Within 24h</option>
                      <option className="text-gray-900">Any time</option>
                    </select>
                  </div>
                </div>
                <button
                  onClick={() => navigate("/login")}
                  className="w-full py-3 rounded-xl bg-white text-red-700 font-semibold flex items-center justify-center gap-2 hover:bg-red-50 transition-colors shadow-md mt-1"
                >
                  <Search size={16} />
                  Search Donors
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Stats */}
      <section className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Users, label: "Registered Donors", value: "1,24,850", delta: "+2.4%", color: "#E53935" },
              { icon: Heart, label: "Lives Saved", value: "48,310", delta: "+8.1%", color: "#43A047" },
              { icon: AlertTriangle, label: "Blood Requests Today", value: "284", delta: "Live", color: "#F9A825" },
              { icon: Activity, label: "Available Donors Now", value: "4,192", delta: "Online", color: "#1565C0" },
            ].map((s) => (
              <StatCard key={s.label} {...s} />
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-14">
          <Badge text="Platform Features" color="#1565C0" />
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mt-3 mb-4">Built for the Critical Moment</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">A comprehensive ecosystem connecting donors, patients, hospitals, and blood banks in a unified real-time platform.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: Zap, title: "AI Smart Matching", desc: "Real-time compatibility scoring across blood type, proximity, health status, and availability. Matches in under 30 seconds.", color: "#E53935" },
            { icon: MapPin, title: "Live Donor Map", desc: "Geolocation-powered map showing verified donors near any hospital or request location, updated every 30 seconds.", color: "#1565C0" },
            { icon: Bell, title: "Emergency Alerts", desc: "Multi-channel push notifications to matching donors within a configurable radius the moment an emergency is raised.", color: "#F9A825" },
            { icon: Shield, title: "Verified Donors", desc: "Every donor is ID-verified, medically screened, and given an AI health eligibility score before being listed.", color: "#43A047" },
            { icon: BarChart2, title: "Inventory Analytics", desc: "Blood banks get real-time inventory dashboards with expiry tracking, low-stock alerts, and demand forecasting.", color: "#7C3AED" },
            { icon: Award, title: "Rewards & Gamification", desc: "Donation milestones, achievement badges, leaderboards, and downloadable certificates keep donors engaged.", color: "#DB2777" },
          ].map(({ icon: Icon, title, desc, color }) => (
            <div key={title} className="bg-card rounded-2xl p-6 border border-border hover:shadow-md transition-all group cursor-default">
              <div className="w-11 h-11 rounded-xl mb-4 flex items-center justify-center" style={{ background: color + "18" }}>
                <Icon size={22} style={{ color }} />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* AI Matching Banner */}
      <section className="bg-gradient-to-r from-blue-900 to-blue-700 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div className="text-white">
              <Badge text="AI-Powered" color="#93C5FD" />
              <h2 className="text-3xl font-bold mt-3 mb-4">Intelligent Donor Matching Engine</h2>
              <p className="text-blue-200 mb-6 leading-relaxed">
                Our proprietary AI model processes over 40 compatibility signals — including rare antigen compatibility, travel distance, donor health history, and historical response rates — to surface the three most likely-to-respond, safest donors for every request.
              </p>
              <ul className="space-y-3">
                {["98.3% match accuracy on critical blood types", "Average donor response: 8 minutes", "Explainable AI — see why each donor was ranked", "Continuous learning from 48,000+ past matches"].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-blue-100 text-sm">
                    <CheckCircle size={16} className="text-green-400 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="text-white text-sm font-medium mb-4 flex items-center gap-2">
                <Activity size={16} className="text-green-400" />
                Live AI Match — Emergency O- Request · AIIMS Delhi
              </div>
              {[
                { name: "Rajiv Kapoor", score: 98, dist: "0.8 km", eta: "~6 min", status: "Contacted" },
                { name: "Sunita Rao", score: 95, dist: "1.4 km", eta: "~9 min", status: "Pending" },
                { name: "Manoj Kumar", score: 91, dist: "2.1 km", eta: "~13 min", status: "Pending" },
              ].map((d, i) => (
                <div key={d.name} className="flex items-center gap-3 py-3 border-b border-white/10 last:border-0">
                  <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold">#{i + 1}</div>
                  <Avatar initials={d.name.split(" ").map((n) => n[0]).join("")} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-medium">{d.name}</div>
                    <div className="text-blue-300 text-xs">{d.dist} · {d.eta}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-green-300 font-mono text-sm font-semibold">{d.score}%</div>
                    <div className={`text-xs ${d.status === "Contacted" ? "text-yellow-300" : "text-blue-300"}`}>{d.status}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-14">
          <Badge text="How It Works" color="#E53935" />
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mt-3">Three Steps to Save a Life</h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-8">
          {[
            { step: "01", title: "Submit Emergency Request", desc: "Patient or hospital submits blood group, location, and urgency. Takes under 60 seconds on any device.", icon: AlertTriangle, color: "#E53935" },
            { step: "02", title: "AI Matches & Alerts", desc: "Our model instantly scores all nearby eligible donors and sends priority notifications to the top matches.", icon: Zap, color: "#1565C0" },
            { step: "03", title: "Donor Arrives & Donates", desc: "Donor confirms, navigates to the hospital, and completes donation. Real-time tracking keeps the patient informed.", icon: Heart, color: "#43A047" },
          ].map(({ step, title, desc, icon: Icon, color }) => (
            <div key={step} className="text-center">
              <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center" style={{ background: color + "18" }}>
                <Icon size={28} style={{ color }} />
              </div>
              <div className="text-xs font-mono font-semibold text-muted-foreground mb-2">{step}</div>
              <h3 className="font-semibold text-foreground mb-3">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-card border-y border-border py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <Badge text="Testimonials" color="#43A047" />
            <h2 className="text-3xl font-bold text-foreground mt-3">Trusted by Donors, Patients & Hospitals</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-background rounded-2xl p-6 border border-border">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} size={14} fill="#F9A825" className="text-yellow-400" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <Avatar initials={t.avatar} size="sm" />
                  <div>
                    <div className="text-sm font-semibold text-foreground">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partner Hospitals */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <p className="text-center text-xs font-medium text-muted-foreground uppercase tracking-widest mb-8">Integrated with leading hospitals & blood banks across India</p>
        <div className="flex flex-wrap justify-center gap-6">
          {["AIIMS Delhi", "Apollo Hospitals", "Fortis Healthcare", "Max Super Speciality", "Narayana Health", "Manipal Hospitals", "Medanta", "Lilavati Hospital"].map((h) => (
            <div key={h} className="px-5 py-2.5 rounded-xl bg-card border border-border text-sm text-muted-foreground font-medium hover:border-red-200 hover:text-red-600 transition-colors cursor-default">
              {h}
            </div>
          ))}
        </div>
      </section>

      {/* Emergency CTA */}
      <section className="bg-red-600 py-14">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <AlertTriangle size={32} className="text-red-200 mx-auto mb-4" />
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Facing a Blood Emergency Right Now?</h2>
          <p className="text-red-200 mb-7">Submit an emergency request and get matched with a compatible donor in minutes — 24/7, 365 days a year.</p>
          <button
            onClick={() => navigate("/login")}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-red-700 font-semibold text-lg hover:bg-red-50 transition-colors shadow-xl"
          >
            <AlertTriangle size={20} />
            Request Emergency Blood
            <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* FAQs */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-12">
          <Badge text="FAQs" color="#1565C0" />
          <h2 className="text-3xl font-bold text-foreground mt-3">Frequently Asked Questions</h2>
        </div>
        <div className="space-y-3">
          {FAQS.map((f, i) => (
            <div key={i} className="bg-card rounded-xl border border-border overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-5 py-4 text-left"
                onClick={() => setFaqOpen(faqOpen === i ? null : i)}
              >
                <span className="font-medium text-foreground text-sm">{f.q}</span>
                <ChevronDown size={16} className={`text-muted-foreground transition-transform flex-shrink-0 ml-3 ${faqOpen === i ? "rotate-180" : ""}`} />
              </button>
              {faqOpen === i && (
                <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-border pt-3">
                  {f.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-red-600 flex items-center justify-center">
                  <Droplets size={14} className="text-white" />
                </div>
                <span className="font-bold text-foreground">BloodLink</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">AI-powered blood donation and emergency donor management for a healthier India.</p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground text-sm mb-4">Platform</h4>
              <ul className="space-y-2">
                {["Find Donors", "Emergency Request", "Blood Banks", "Hospital Portal", "Mobile App"].map((l) => (
                  <li key={l}><a href="#" className="text-sm text-muted-foreground hover:text-red-600 transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground text-sm mb-4">Company</h4>
              <ul className="space-y-2">
                {["About Us", "Careers", "Press", "Blog", "Contact"].map((l) => (
                  <li key={l}><a href="#" className="text-sm text-muted-foreground hover:text-red-600 transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground text-sm mb-4">Contact</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>1800-BLOOD-LINK</li>
                <li>hello@bloodlink.health</li>
                <li>Available 24/7</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>© 2024 BloodLink Health Technologies Pvt. Ltd. All rights reserved.</span>
            <div className="flex gap-4">
              <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-foreground transition-colors">HIPAA Compliance</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─── Donor Dashboard ──────────────────────────────────────────────────────────

function DonorDashboard() {
  const [available, setAvailable] = useState(true);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar Profile */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-card rounded-2xl border border-border p-6 text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white font-bold text-2xl mx-auto mb-3">AM</div>
            <div className="font-semibold text-foreground">Arjun Mehta</div>
            <div className="text-sm text-muted-foreground mb-3">arjun.mehta@gmail.com</div>
            <BloodTypePill type="O+" size="lg" />
            <div className="mt-4 flex items-center justify-between bg-muted rounded-xl p-3">
              <span className="text-sm font-medium text-foreground">Available to Donate</span>
              <button
                onClick={() => setAvailable(!available)}
                className={`relative w-11 h-6 rounded-full transition-colors ${available ? "bg-green-500" : "bg-muted-foreground"}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${available ? "translate-x-5" : ""}`} />
              </button>
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border p-5">
            <h4 className="font-semibold text-foreground text-sm mb-4">Donation Status</h4>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Donated</span>
                <span className="font-medium text-foreground">Mar 12, 2024</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Next Eligible</span>
                <span className="font-medium text-green-600">Jun 10, 2024</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">AI Health Score</span>
                <span className="font-mono font-semibold text-green-600">94 / 100</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: "94%" }} />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border p-5">
            <h4 className="font-semibold text-foreground text-sm mb-4">Achievement Badges</h4>
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: "🩸", label: "First Drop" },
                { icon: "🏆", label: "10 Lives" },
                { icon: "⚡", label: "Emergency" },
                { icon: "🌟", label: "Top Donor" },
                { icon: "💪", label: "Consistent" },
                { icon: "🔬", label: "Rare Type" },
              ].map((b) => (
                <div key={b.label} className="flex flex-col items-center gap-1 p-2 rounded-xl bg-muted">
                  <span className="text-xl">{b.icon}</span>
                  <span className="text-xs text-muted-foreground text-center leading-tight">{b.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Welcome */}
          <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold mb-1">Welcome back, Arjun 👋</h2>
                <p className="text-red-200 text-sm">You have saved <strong className="text-white">12 lives</strong> so far. Your O+ blood type is in high demand right now.</p>
              </div>
              <div className="hidden sm:block text-right">
                <div className="text-3xl font-extrabold font-mono">820</div>
                <div className="text-red-200 text-sm">Reward Points</div>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Lives Saved", value: "12", icon: Heart, color: "#E53935" },
              { label: "Requests Received", value: "34", icon: Bell, color: "#1565C0" },
              { label: "Requests Accepted", value: "12", icon: CheckCircle, color: "#43A047" },
              { label: "Reward Points", value: "820", icon: Award, color: "#F9A825" },
            ].map((s) => (
              <StatCard key={s.label} {...s} />
            ))}
          </div>

          {/* Nearby Emergency Requests */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Nearby Emergency Requests</h3>
              <Badge text="3 Active" color="#E53935" />
            </div>
            <div className="space-y-3">
              {[
                { hospital: "AIIMS New Delhi", blood: "O+", urgency: "Critical", dist: "1.2 km", time: "2 min ago", units: 3 },
                { hospital: "Safdarjung Hospital", blood: "O+", urgency: "High", dist: "3.4 km", time: "8 min ago", units: 2 },
                { hospital: "RML Hospital", blood: "O+", urgency: "Moderate", dist: "5.1 km", time: "15 min ago", units: 1 },
              ].map((r) => (
                <div key={r.hospital} className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                  <BloodTypePill type={r.blood} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground text-sm">{r.hospital}</div>
                    <div className="text-xs text-muted-foreground">{r.units} units needed · {r.dist} · {r.time}</div>
                  </div>
                  <Badge text={r.urgency} color={r.urgency === "Critical" ? "#D32F2F" : r.urgency === "High" ? "#F9A825" : "#43A047"} />
                  <button className="px-3.5 py-1.5 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-700 transition-colors flex-shrink-0">
                    Respond
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Donation History & Chart */}
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="bg-card rounded-2xl border border-border p-6">
              <h3 className="font-semibold text-foreground mb-4">Donation History</h3>
              <div className="space-y-3">
                {[
                  { date: "Mar 12, 2024", hospital: "AIIMS Delhi", type: "Whole Blood", status: "Completed" },
                  { date: "Nov 28, 2023", hospital: "Apollo Hospitals", type: "Platelet", status: "Completed" },
                  { date: "Aug 5, 2023", hospital: "Fortis Healthcare", type: "Whole Blood", status: "Completed" },
                  { date: "Apr 19, 2023", hospital: "Max Hospital", type: "Plasma", status: "Completed" },
                ].map((d) => (
                  <div key={d.date} className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground truncate">{d.hospital}</div>
                      <div className="text-xs text-muted-foreground">{d.date} · {d.type}</div>
                    </div>
                    <Badge text={d.status} color="#43A047" />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card rounded-2xl border border-border p-6">
              <h3 className="font-semibold text-foreground mb-4">Upcoming Schedule</h3>
              <div className="space-y-3">
                {[
                  { date: "Jun 10, 2024", time: "10:30 AM", hospital: "AIIMS Delhi", type: "Scheduled" },
                  { date: "Jun 18, 2024", time: "2:00 PM", hospital: "Apollo Hospitals", type: "Requested" },
                ].map((s) => (
                  <div key={s.date} className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar size={14} className="text-blue-600" />
                      <span className="text-sm font-medium text-blue-800 dark:text-blue-200">{s.date} · {s.time}</span>
                    </div>
                    <div className="text-xs text-blue-600 dark:text-blue-300">{s.hospital}</div>
                    <Badge text={s.type} color="#1565C0" />
                  </div>
                ))}
                <button className="w-full py-2 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:border-red-300 hover:text-red-600 transition-colors flex items-center justify-center gap-2">
                  <Plus size={14} />
                  Schedule Donation
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Patient Dashboard ────────────────────────────────────────────────────────

function PatientDashboard() {
  const [selectedBlood, setSelectedBlood] = useState("O+");
  const [distance, setDistance] = useState(10);
  const [onlyAvailable, setOnlyAvailable] = useState(true);

  const filtered = DONORS.filter((d) => !onlyAvailable || d.avail);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Emergency Banner */}
      <div className="bg-red-600 rounded-2xl p-5 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-white">
          <AlertTriangle size={24} />
          <div>
            <div className="font-semibold">Need blood urgently?</div>
            <div className="text-red-200 text-sm">Submit an emergency request — our AI will alert matching donors instantly.</div>
          </div>
        </div>
        <button className="flex-shrink-0 px-5 py-2.5 rounded-xl bg-white text-red-700 font-semibold text-sm hover:bg-red-50 transition-colors">
          Emergency Request
        </button>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Filters */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-card rounded-2xl border border-border p-5">
            <div className="flex items-center gap-2 mb-4">
              <Filter size={15} className="text-muted-foreground" />
              <h3 className="font-semibold text-foreground text-sm">Search Filters</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">Blood Group</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((g) => (
                    <button
                      key={g}
                      onClick={() => setSelectedBlood(g)}
                      className={`py-1.5 rounded-lg text-xs font-semibold transition-colors ${selectedBlood === g ? "bg-red-600 text-white" : "bg-muted text-muted-foreground hover:bg-red-50 hover:text-red-600"}`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">City</label>
                <input type="text" defaultValue="New Delhi" className="w-full px-3 py-2 rounded-lg bg-muted border-0 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/20" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">
                  Distance: {distance} km
                </label>
                <input
                  type="range"
                  min={1}
                  max={50}
                  value={distance}
                  onChange={(e) => setDistance(Number(e.target.value))}
                  className="w-full accent-red-600"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Available Now</span>
                <button
                  onClick={() => setOnlyAvailable(!onlyAvailable)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${onlyAvailable ? "bg-green-500" : "bg-muted-foreground"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${onlyAvailable ? "translate-x-5" : ""}`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Verified Only</span>
                <button className="relative w-10 h-5 rounded-full bg-green-500">
                  <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-white shadow" />
                </button>
              </div>
            </div>
          </div>

          {/* AI Recommendation */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-5 text-white">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={16} className="text-yellow-300" />
              <span className="font-semibold text-sm">AI Recommendation</span>
            </div>
            <p className="text-blue-200 text-xs leading-relaxed mb-3">
              Based on your O+ request, Arjun Mehta (0.8 km) has a 98% compatibility score and typically responds within 6 minutes.
            </p>
            <button className="w-full py-2 rounded-lg bg-white/20 text-white text-xs font-medium hover:bg-white/30 transition-colors">
              View AI Analysis
            </button>
          </div>
        </div>

        {/* Donor Cards */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">
              {filtered.length} donors found near New Delhi
            </h3>
            <div className="flex items-center gap-2">
              <Badge text="AI Sorted" color="#1565C0" />
              <select className="text-sm text-muted-foreground bg-card border border-border rounded-lg px-3 py-1.5">
                <option>Nearest first</option>
                <option>AI Score</option>
                <option>Rating</option>
              </select>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((d) => (
              <div key={d.name} className="bg-card rounded-2xl border border-border p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Avatar initials={d.name.split(" ").map((n) => n[0]).join("")} />
                    <div>
                      <div className="font-semibold text-foreground text-sm">{d.name}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin size={10} />
                        {d.dist}
                      </div>
                    </div>
                  </div>
                  <BloodTypePill type={d.blood} />
                </div>
                <div className="flex items-center gap-3 mb-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Star size={11} fill="#F9A825" className="text-yellow-400" />
                    {d.rating}
                  </span>
                  <span>·</span>
                  <span>{d.donations} donations</span>
                  <span>·</span>
                  <span>{d.lastDonated}</span>
                </div>
                <div className="flex items-center gap-1 mb-3">
                  <Circle size={8} fill={d.avail ? "#43A047" : "#9CA3AF"} className={d.avail ? "text-green-500" : "text-gray-400"} />
                  <span className={`text-xs font-medium ${d.avail ? "text-green-600" : "text-muted-foreground"}`}>
                    {d.avail ? "Available Now" : "Unavailable"}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button className="flex flex-col items-center gap-1 py-2 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors text-xs font-medium">
                    <Phone size={13} />
                    Call
                  </button>
                  <button className="flex flex-col items-center gap-1 py-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors text-xs font-medium">
                    <MessageCircle size={13} />
                    Chat
                  </button>
                  <button className={`flex flex-col items-center gap-1 py-2 rounded-lg text-xs font-medium transition-colors ${d.avail ? "bg-red-600 text-white hover:bg-red-700" : "bg-muted text-muted-foreground cursor-not-allowed"}`} disabled={!d.avail}>
                    <Droplets size={13} />
                    Request
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Hospital Dashboard ───────────────────────────────────────────────────────

function HospitalDashboard() {
  const INVENTORY = [
    { type: "O+", units: 24, cap: 40, status: "good" },
    { type: "A+", units: 12, cap: 30, status: "low" },
    { type: "B+", units: 18, cap: 25, status: "good" },
    { type: "AB+", units: 4, cap: 15, status: "critical" },
    { type: "O-", units: 6, cap: 20, status: "low" },
    { type: "A-", units: 9, cap: 15, status: "good" },
    { type: "B-", units: 2, cap: 10, status: "critical" },
    { type: "AB-", units: 1, cap: 8, status: "critical" },
  ];
  const statusColor = { good: "#43A047", low: "#F9A825", critical: "#D32F2F" };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">AIIMS New Delhi — Blood Bank Dashboard</h2>
          <p className="text-sm text-muted-foreground">Last updated 2 minutes ago</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors">
          <Plus size={16} />
          New Request
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { icon: Droplets, label: "Available Blood Units", value: "76", delta: "Total stock", color: "#E53935" },
          { icon: Users, label: "Patients Waiting", value: "18", delta: "3 critical", color: "#1565C0" },
          { icon: AlertTriangle, label: "Emergency Requests", value: "5", delta: "Active", color: "#D32F2F" },
          { icon: Calendar, label: "Today's Appointments", value: "23", delta: "Donation camp", color: "#43A047" },
        ].map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Blood Inventory */}
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-6">
          <h3 className="font-semibold text-foreground mb-4">Blood Inventory Status</h3>
          <div className="space-y-3">
            {INVENTORY.map((item) => (
              <div key={item.type} className="flex items-center gap-4">
                <BloodTypePill type={item.type} />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-foreground">{item.units} / {item.cap} units</span>
                    <Badge text={item.status} color={(statusColor as any)[item.status]} />
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{ width: `${(item.units / item.cap) * 100}%`, background: (statusColor as any)[item.status] }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Requests */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="font-semibold text-foreground mb-4">Emergency Requests</h3>
          <div className="space-y-3">
            {[
              { patient: "Patient #4421", blood: "AB+", units: 2, urgency: "Critical", time: "5 min ago" },
              { patient: "Patient #4419", blood: "O-", units: 4, urgency: "High", time: "12 min ago" },
              { patient: "Patient #4415", blood: "B-", units: 1, urgency: "Moderate", time: "28 min ago" },
              { patient: "Patient #4410", blood: "A+", units: 3, urgency: "High", time: "45 min ago" },
            ].map((r) => (
              <div key={r.patient} className="p-3 rounded-xl bg-muted/50 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-foreground text-sm">{r.patient}</span>
                  <Badge text={r.urgency} color={r.urgency === "Critical" ? "#D32F2F" : r.urgency === "High" ? "#F9A825" : "#43A047"} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BloodTypePill type={r.blood} />
                    <span className="text-xs text-muted-foreground">{r.units} units · {r.time}</span>
                  </div>
                  <button className="px-2.5 py-1 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-700 transition-colors">
                    Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-card rounded-2xl border border-border p-6 mt-6">
        <h3 className="font-semibold text-foreground mb-4">Blood Usage Analytics — Last 8 Months</h3>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={MONTHLY_DATA}>
            <defs>
              <linearGradient id="colDon" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#E53935" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#E53935" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colReq" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1565C0" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#1565C0" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
            <Legend />
            <Area type="monotone" dataKey="donations" stroke="#E53935" strokeWidth={2} fill="url(#colDon)" name="Donations" />
            <Area type="monotone" dataKey="requests" stroke="#1565C0" strokeWidth={2} fill="url(#colReq)" name="Requests" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Admin Dashboard ──────────────────────────────────────────────────────────

function AdminDashboard() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">Admin Control Center</h2>
          <p className="text-sm text-muted-foreground">BloodLink Platform · August 5, 2024</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted text-foreground text-sm font-medium hover:bg-muted/80 transition-colors">
            <TrendingUp size={16} />
            Reports
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors">
            <Settings size={16} />
            Settings
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {[
          { label: "Total Users", value: "2,84,310", color: "#E53935" },
          { label: "Active Donors", value: "1,24,850", color: "#1565C0" },
          { label: "Hospitals", value: "847", color: "#43A047" },
          { label: "Blood Banks", value: "312", color: "#F9A825" },
          { label: "Active Requests", value: "284", color: "#7C3AED" },
          { label: "Lives Saved", value: "48,310", color: "#DB2777" },
        ].map((k) => (
          <div key={k.label} className="bg-card rounded-2xl border border-border p-4 text-center">
            <div className="text-xl font-extrabold font-mono" style={{ color: k.color }}>{k.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Monthly Chart */}
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-6">
          <h3 className="font-semibold text-foreground mb-4">Monthly Donations & Requests</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={MONTHLY_DATA} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid rgba(0,0,0,0.08)" }} />
              <Legend />
              <Bar dataKey="donations" fill="#E53935" radius={[6, 6, 0, 0]} name="Donations" />
              <Bar dataKey="requests" fill="#1565C0" radius={[6, 6, 0, 0]} name="Requests" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Blood Type Distribution */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="font-semibold text-foreground mb-4">Blood Type Distribution</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={BLOOD_TYPE_DATA} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" paddingAngle={2}>
                {BLOOD_TYPE_DATA.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v: any) => `${v}%`} contentStyle={{ borderRadius: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-4 gap-1 mt-2">
            {BLOOD_TYPE_DATA.map((b) => (
              <div key={b.name} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: b.color }} />
                <span className="text-xs text-muted-foreground">{b.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* User Management Table */}
      <div className="bg-card rounded-2xl border border-border p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Recent User Registrations</h3>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search users..."
              className="px-3 py-1.5 rounded-lg bg-muted border-0 text-sm text-foreground focus:outline-none w-48"
            />
            <button className="px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-sm hover:bg-muted/80 transition-colors flex items-center gap-1.5">
              <Filter size={13} />
              Filter
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["User", "Role", "Blood Type", "Location", "Joined", "Status", "Action"].map((h) => (
                  <th key={h} className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { name: "Priya Sharma", role: "Donor", blood: "A+", city: "Mumbai", joined: "Aug 4, 2024", status: "Verified" },
                { name: "Amit Verma", role: "Patient", blood: "B+", city: "Pune", joined: "Aug 4, 2024", status: "Pending" },
                { name: "Dr. Neha Gupta", role: "Hospital", blood: "—", city: "Hyderabad", joined: "Aug 3, 2024", status: "Verified" },
                { name: "Ravi Shankar", role: "Donor", blood: "O-", city: "Chennai", joined: "Aug 3, 2024", status: "Verified" },
                { name: "Sneha Pillai", role: "Blood Bank", blood: "—", city: "Bengaluru", joined: "Aug 2, 2024", status: "Under Review" },
                { name: "Kunal Joshi", role: "Donor", blood: "AB+", city: "Delhi", joined: "Aug 2, 2024", status: "Verified" },
              ].map((u) => (
                <tr key={u.name} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar initials={u.name.split(" ").map((n) => n[0]).join("")} size="sm" />
                      <span className="font-medium text-foreground">{u.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <Badge text={u.role} color={u.role === "Donor" ? "#43A047" : u.role === "Patient" ? "#E53935" : u.role === "Hospital" ? "#1565C0" : "#F9A825"} />
                  </td>
                  <td className="py-3 px-3">
                    {u.blood !== "—" ? <BloodTypePill type={u.blood} /> : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="py-3 px-3 text-muted-foreground">{u.city}</td>
                  <td className="py-3 px-3 text-muted-foreground font-mono text-xs">{u.joined}</td>
                  <td className="py-3 px-3">
                    <Badge text={u.status} color={u.status === "Verified" ? "#43A047" : u.status === "Pending" ? "#F9A825" : "#1565C0"} />
                  </td>
                  <td className="py-3 px-3">
                    <button className="text-xs text-red-600 hover:underline font-medium">Manage</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending Approvals */}
      <div className="grid sm:grid-cols-2 gap-6">
        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="font-semibold text-foreground mb-4">Pending Hospital Approvals</h3>
          <div className="space-y-3">
            {["Sunshine Multispecialty Hospital, Jaipur", "MediCare General Hospital, Lucknow", "Sunrise Clinic, Indore"].map((h) => (
              <div key={h} className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                <div>
                  <div className="text-sm font-medium text-foreground">{h}</div>
                  <div className="text-xs text-muted-foreground">Applied Aug 1, 2024</div>
                </div>
                <div className="flex gap-2">
                  <button className="px-2.5 py-1 rounded-lg bg-green-500 text-white text-xs font-medium hover:bg-green-600 transition-colors">Approve</button>
                  <button className="px-2.5 py-1 rounded-lg bg-muted text-muted-foreground text-xs font-medium hover:bg-red-50 hover:text-red-600 transition-colors">Reject</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="font-semibold text-foreground mb-4">System Activity Log</h3>
          <div className="space-y-3">
            {[
              { text: "Emergency O- request fulfilled at AIIMS Delhi", time: "2 min ago", type: "success" },
              { text: "New hospital registered: Sunshine Multispecialty", time: "14 min ago", type: "info" },
              { text: "Low stock alert: AB- < 20% at Fortis Gurugram", time: "28 min ago", type: "warning" },
              { text: "AI model retrained with 1,200 new match outcomes", time: "1 hr ago", type: "info" },
              { text: "Suspicious login attempt blocked for admin account", time: "3 hr ago", type: "error" },
            ].map((log) => (
              <div key={log.text} className="flex items-start gap-3 text-sm">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${log.type === "success" ? "bg-green-500" : log.type === "warning" ? "bg-yellow-500" : log.type === "error" ? "bg-red-500" : "bg-blue-500"}`} />
                <div className="flex-1">
                  <div className="text-foreground">{log.text}</div>
                  <div className="text-xs text-muted-foreground font-mono">{log.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── App Root (Landing wrapper) ───────────────────────────────────────────────

export default function App() {
  const [view, setView] = useState<View>("landing");
  const { dark, setDark } = useThemeStore();

  return (
    <div className={dark ? "dark" : ""} style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="min-h-screen bg-background text-foreground">
        <Nav view={view} setView={setView} dark={dark} setDark={setDark} />
        {view === "landing" && <Landing setView={setView} />}
        {view === "donor" && <DonorDashboard />}
        {view === "patient" && <PatientDashboard />}
        {view === "hospital" && <HospitalDashboard />}
        {view === "admin" && <AdminDashboard />}
      </div>
    </div>
  );
}
