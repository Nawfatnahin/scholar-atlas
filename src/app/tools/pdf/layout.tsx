import Link from "next/link";
import Footer from "@/components/Footer";
import { ActionHistorySidebar } from "@/components/pdf/ActionHistorySidebar";
import { ArrowLeft, Home, FileText } from "lucide-react";
import { InstructionButton } from "@/components/InstructionButton";

export const metadata = {
  title: "PDF Tools - Scholar Atlas",
  description: "Fast, secure, and client-side PDF manipulation tools for students.",
};

export default function PdfToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-bg-base font-body text-text-primary">
      <header className="bg-bg-base/95 backdrop-blur-md border-b border-border-subtle py-3 md:py-6 sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 md:px-8 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="p-3 rounded-2xl bg-bg-surface text-text-secondary hover:bg-bg-elevated transition-all border border-border-strong dark:bg-bg-elevated dark:hover:bg-bg-surface">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 dark:bg-amber-900/20 dark:text-amber-500">
                <FileText className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-black text-text-primary tracking-tight uppercase tracking-[0.1em]">PDF Toolkit</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <InstructionButton 
              title="PDF Toolkit"
              description="Transform, split, and merge your academic documents. All processing runs 100% securely inside your local browser sandbox—zero data ever uploads to any external server."
              options={[
                { title: "Seamless PDF Merger", description: "Upload multiple PDF materials, research papers, or syllabus documents. Reorder the uploaded files effortlessly using drag-and-drop actions, and merge them into a single continuous PDF in milliseconds." },
                { title: "Precision Page Splitter", description: "Extract individual chapters or specific page subsets from heavy textbooks. Define your custom target ranges, split them instantly into isolated PDF files, and download only the content you need." },
                { title: "High-Resolution PDF to Images", description: "Convert complete PDF documents or specific page selections into high-quality JPG or PNG images. Excellent for slide extraction, study graphics, or visual presentations." },
                { title: "Images to PDF Compiler", description: "Upload digital notes, sketches, or photos (JPG, PNG, WebP) and compile them into a single, beautifully-aligned PDF document. Adjust ordering and orientation effortlessly before exporting." },
                { title: "100% Client-Side Privacy", description: "All PDF and image manipulation processes execute natively inside your web browser. Your private academic materials, grades, and records are completely safe and stay on your device." }
              ]}
            />
            <Link href="/dashboard" className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-text-secondary hover:bg-bg-surface border border-transparent hover:border-border-strong shadow-sm transition-all dark:hover:bg-bg-elevated">
              <Home className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row max-w-[1600px] mx-auto w-full px-4 md:px-8 py-8 md:py-12 gap-8 md:gap-12">
        
        {/* Main Content Area */}
        <main className="flex-1 min-w-0">
          <div className="bg-bg-surface rounded-3xl md:rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-border-strong p-5 md:p-8 lg:p-12 relative overflow-hidden dark:bg-bg-elevated">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700"></div>
            {children}
          </div>
        </main>

        {/* Action History Sidebar */}
        <aside className="w-full lg:w-96 shrink-0">
          <ActionHistorySidebar />
        </aside>

      </div>
      
      <Footer />
    </div>
  );
}
