import Link from "next/link";
import { format } from "date-fns";
import { APP_VERSION } from "@/lib/version";
import { RELEASES } from "@/lib/changelog";
import { 
  CalendarCheck, 
  LayoutList, 
  GraduationCap, 
  FileText, 
  LayoutDashboard, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle2,
  Calendar
} from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export default function AboutPage() {
  const currentRelease = RELEASES[0];

  const features = [
    {
      icon: CalendarCheck,
      name: "Attendance Tracker",
      description: "Log classes and predict if you'll fall below the threshold before it's too late.",
      color: "text-green-600",
      bg: "bg-green-100"
    },
    {
      icon: LayoutList,
      name: "Task Management",
      description: "Kanban board for assignments, quizzes, and project deadlines.",
      color: "text-blue-600",
      bg: "bg-blue-100"
    },
    {
      icon: GraduationCap,
      name: "CGPA Manager",
      description: "Track your grades per subject and simulate what you need to hit your target.",
      color: "text-violet-600",
      bg: "bg-violet-100"
    },
    {
      icon: FileText,
      name: "PDF Tools",
      description: "Merge, split, and convert PDFs directly in the browser. No uploads, no servers.",
      color: "text-amber-600",
      bg: "bg-amber-100"
    },
    {
      icon: Calendar,
      name: "Timetable Builder",
      description: "Build your weekly class schedule once; attendance placeholders are created automatically.",
      color: "text-rose-600",
      bg: "bg-rose-100"
    },
    {
      icon: LayoutDashboard,
      name: "Semester Dashboard",
      description: "One-screen morning briefing: attendance health, upcoming deadlines, CGPA at a glance.",
      color: "text-indigo-600",
      bg: "bg-indigo-100"
    }
  ];

  return (
    <div className="min-h-screen bg-bg font-body flex flex-col">
      <Navigation />
      
      <main className="flex-1 max-w-[860px] mx-auto px-6 py-16 sm:py-24">
        {/* Section 1: Hero */}
        <section className="mb-24 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6 justify-center sm:justify-start">
            <h1 className="text-4xl sm:text-6xl font-black text-ink tracking-tighter uppercase">
              BackLogger <span className="text-accent">Buddy</span>
            </h1>
            <div className="flex justify-center">
              <span className="px-3 py-1 rounded-full bg-accent/10 text-accent text-[11px] font-black uppercase tracking-widest border border-accent/20">
                v{APP_VERSION.current}
              </span>
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-ink-2 mb-8 leading-tight italic font-serif">
            Built by a student, for students who are barely keeping up.
          </p>
          <p className="text-lg text-ink-3 leading-relaxed max-w-2xl font-medium">
            BackLogger Buddy started as a personal tool to stop missing attendance 
            targets and losing track of assignment deadlines. It grew into a 
            full academic command center — free, private, and built to run 
            entirely in the browser.
          </p>
        </section>

        {/* Section 2: Motivation */}
        <section className="mb-24">
          <h2 className="text-[11px] font-bold text-ink-4 uppercase tracking-[0.2em] mb-10">Why this exists</h2>
          <div className="max-w-[680px] space-y-6 text-lg text-ink-2 leading-relaxed font-medium">
            <p>
              I built this because I was tired of being a "backlogger" myself. There's a specific kind of anxiety that comes with realizing you've missed too many classes or that a high-stakes project is due tomorrow and you haven't even seen the brief. I needed a way to visualize my academic health without the overhead of complex, bloated enterprise tools.
            </p>
            <p>
              Existing academic trackers either felt like they were designed for the university administration rather than the student, or they required uploading sensitive data to mysterious servers. I wanted something fast, local, and honest. I'm Nawfat, and I believe tools should empower you, not distract you with ads or sell your habits to the highest bidder.
            </p>
            <p>
              The decision to make BackLogger Buddy free and open was simple: every student deserves a command center that doesn't cost a meal's worth of subscription fees. Whether you're aiming for a perfect 4.0 or just trying to survive the semester, this is for you. I'm constantly refining the logic and adding features based on what actually helps me stay afloat.
            </p>
            <p>
              Success for this project isn't about user counts or metrics. It's about that moment when you check your dashboard, see you have a "skip budget" for a morning class, and get that extra hour of sleep without the guilt. It's about turning academic chaos into a manageable, even enjoyable, workflow.
            </p>
          </div>
        </section>

        {/* Section 3: Features */}
        <section className="mb-24">
          <h2 className="text-[11px] font-bold text-ink-4 uppercase tracking-[0.2em] mb-10">What it does</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((f, i) => (
              <div key={i} className="bg-white/60 backdrop-blur-xl p-8 rounded-[32px] border border-border-strong shadow-sm hover:shadow-md transition-all">
                <div className={`w-12 h-12 rounded-2xl ${f.bg} flex items-center justify-center mb-6 shadow-inner`}>
                  <f.icon className={`w-6 h-6 ${f.color}`} />
                </div>
                <h3 className="text-lg font-black text-ink mb-2 uppercase tracking-tight">{f.name}</h3>
                <p className="text-sm text-ink-3 leading-relaxed font-medium">{f.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 4: Changelog */}
        <section className="mb-24">
          <h2 className="text-[11px] font-bold text-ink-4 uppercase tracking-[0.2em] mb-10">What&apos;s new</h2>
          <div className="bg-white/60 backdrop-blur-xl p-8 sm:p-10 rounded-[40px] border border-border-strong shadow-sm">
            <div className="mb-8">
              <h3 className="text-2xl font-black text-ink">Version {currentRelease.version}</h3>
              <p className="text-sm text-ink-3 font-bold uppercase tracking-widest mt-1">
                Released on {format(new Date(currentRelease.date), "MMMM d, yyyy")}
              </p>
            </div>
            <ul className="space-y-4">
              {currentRelease.changes.map((change, i) => (
                <li key={i} className="flex items-start gap-4">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter mt-1 shrink-0 ${
                    change.type === 'NEW' ? 'bg-green-100 text-green-700' :
                    change.type === 'IMPROVED' ? 'bg-blue-100 text-blue-700' :
                    change.type === 'FIXED' ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {change.type}
                  </span>
                  <span className="text-sm text-ink-2 font-medium">{change.description}</span>
                </li>
              ))}
            </ul>
            {/* 
            <div className="mt-10 pt-8 border-t border-border-strong">
              <Link href="/about/changelog" className="text-[11px] font-black text-accent uppercase tracking-widest hover:underline flex items-center gap-2">
                Full version history <ArrowRight size={14} />
              </Link>
            </div>
            */}
          </div>
        </section>

        {/* Section 5: Stack */}
        <section className="mb-24">
          <h2 className="text-[11px] font-bold text-ink-4 uppercase tracking-[0.2em] mb-8 text-center sm:text-left">Stack</h2>
          <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
            {["Next.js 14", "Supabase", "TypeScript", "Tailwind CSS", "Vercel"].map((tech, i) => (
              <span key={i} className="px-4 py-2 rounded-xl bg-white border border-border-strong text-xs font-bold text-ink-3 uppercase tracking-widest shadow-sm">
                {tech}
              </span>
            ))}
          </div>
        </section>

        {/* Section 6: Footer CTA */}
        <section className="text-center py-16 border-t border-border-strong">
          <p className="text-lg font-bold text-ink-3 mb-8 italic font-serif">
            Free to use. No ads. No tracking.
          </p>
          <div className="flex flex-col items-center gap-6">
            <Link href="/signup" className="px-10 py-4 rounded-2xl bg-accent text-white font-black uppercase tracking-widest hover:bg-accent/90 hover:scale-105 transition-all shadow-lg shadow-accent/20 active:scale-95">
              Get Started
            </Link>
            <Link href="/" className="text-xs font-bold text-ink-3 uppercase tracking-widest hover:text-ink transition-colors flex items-center gap-2">
              <ArrowLeft size={14} /> Back to home
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
