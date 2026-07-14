
import React, { useState, useRef } from 'react';
import { 
  User, 
  Briefcase, 
  GraduationCap, 
  Code, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  Linkedin, 
  Plus, 
  Trash2, 
  Download, 
  Eye, 
  Layout, 
  ChevronLeft, 
  ChevronRight,
  Sparkles,
  FileText,
  ShieldCheck
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

import { auth, saveUserActivity } from '../services/firebase';

interface ResumeData {
  personalInfo: {
    fullName: string;
    title: string;
    email: string;
    phone: string;
    location: string;
    website: string;
    linkedin: string;
    summary: string;
  };
  experience: {
    id: string;
    company: string;
    position: string;
    location: string;
    startDate: string;
    endDate: string;
    description: string;
  }[];
  education: {
    id: string;
    school: string;
    degree: string;
    location: string;
    startDate: string;
    endDate: string;
    description: string;
  }[];
  skills: string[];
  projects: {
    id: string;
    name: string;
    link: string;
    description: string;
  }[];
}

const templates = [
  { id: 'classic', name: 'Classic Pro', preview: 'bg-white border-t-8 border-blue-600' },
  { id: 'modern', name: 'Modern Side', preview: 'bg-slate-100 border-l-8 border-blue-500' },
  { id: 'bold', name: 'Bold Minimal', preview: 'bg-slate-900 text-white' },
  { id: 'ats', name: 'Standard ATS', preview: 'bg-gray-50 border-2 border-gray-200' },
  { id: 'creative', name: 'Creative Blue', preview: 'bg-blue-50 border-r-8 border-blue-400' },
  { id: 'executive', name: 'Executive', preview: 'bg-stone-50 border-y-2 border-stone-300' },
  { id: 'tech', name: 'Developer', preview: 'bg-emerald-50 border-l-4 border-emerald-500' },
  { id: 'elegant', name: 'Elegant Serif', preview: 'bg-rose-50 border-double border-4 border-rose-200' },
  { id: 'compact', name: 'High Density', preview: 'bg-white p-1 grid grid-cols-2 gap-1' },
  { id: 'sleek', name: 'Sleek Dark', preview: 'bg-slate-800 border-b-8 border-cyan-400' },
];

const ResumeMaker: React.FC = () => {
  const [data, setData] = useState<ResumeData>({
    personalInfo: {
      fullName: '',
      title: '',
      email: '',
      phone: '',
      location: '',
      website: '',
      linkedin: '',
      summary: '',
    },
    experience: [{ id: '1', company: '', position: '', location: '', startDate: '', endDate: '', description: '' }],
    education: [{ id: '1', school: '', degree: '', location: '', startDate: '', endDate: '', description: '' }],
    skills: [''],
    projects: [{ id: '1', name: '', link: '', description: '' }],
  });

  const [activeTemplate, setActiveTemplate] = useState('classic');
  const [activeStep, setActiveStep] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const resumeRef = useRef<HTMLDivElement>(null);

  const steps = [
    { title: 'Personal', icon: User },
    { title: 'Experience', icon: Briefcase },
    { title: 'Education', icon: GraduationCap },
    { title: 'Skills', icon: Code },
    { title: 'Projects', icon: FileText },
  ];

  const handlePersonalInfoChange = (field: string, value: string) => {
    setData(prev => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [field]: value }
    }));
  };

  const addItem = (section: 'experience' | 'education' | 'projects') => {
    const newItem = section === 'experience' 
      ? { id: Date.now().toString(), company: '', position: '', location: '', startDate: '', endDate: '', description: '' }
      : section === 'education'
      ? { id: Date.now().toString(), school: '', degree: '', location: '', startDate: '', endDate: '', description: '' }
      : { id: Date.now().toString(), name: '', link: '', description: '' };
    
    setData(prev => ({
      ...prev,
      [section]: [...prev[section], newItem]
    }));
  };

  const removeItem = (section: 'experience' | 'education' | 'projects', id: string) => {
    setData(prev => ({
      ...prev,
      [section]: prev[section].filter((item: any) => item.id !== id)
    }));
  };

  const updateItem = (section: 'experience' | 'education' | 'projects', id: string, field: string, value: string) => {
    setData(prev => ({
      ...prev,
      [section]: prev[section].map((item: any) => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const addSkill = () => {
    setData(prev => ({ ...prev, skills: [...prev.skills, ''] }));
  };

  const updateSkill = (index: number, value: string) => {
    const newSkills = [...data.skills];
    newSkills[index] = value;
    setData(prev => ({ ...prev, skills: newSkills }));
  };

  const removeSkill = (index: number) => {
    setData(prev => ({ ...prev, skills: prev.skills.filter((_, i) => i !== index) }));
  };

  const exportPDF = async () => {
    if (!resumeRef.current) return;
    setIsExporting(true);
    
    try {
      const canvas = await html2canvas(resumeRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${data.personalInfo.fullName.replace(/\s+/g, '_') || 'Resume'}_ATS_EduTools.pdf`);
    } catch (err) {
      console.error('PDF Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // --------------------------------------------------------------------------------
  // TEMPLATE RENDERING COMPONENTS
  // --------------------------------------------------------------------------------

  const ResumePreview = () => {
    const { personalInfo, experience, education, skills, projects } = data;

    const renderSections = (layout: 'single' | 'sidebar-left' | 'sidebar-right' | 'grid') => {
      const MainContent = () => (
        <div className="space-y-4 md:space-y-6">
          {experience.length > 0 && experience[0].company && (
            <section>
              <h2 className="text-[10px] md:text-sm font-black uppercase tracking-widest text-[#002366] border-b-2 border-slate-100 pb-1 mb-3">Professional Experience</h2>
              <div className="space-y-4">
                {experience.map(exp => (
                  <div key={exp.id}>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                      <h3 className="font-bold text-slate-900 text-sm md:text-base">{exp.position}</h3>
                      <span className="text-[9px] md:text-[10px] text-slate-400 font-bold">{exp.startDate} — {exp.endDate}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-1">
                      <span className="text-xs font-semibold text-blue-600">{exp.company}</span>
                      <span className="text-[9px] md:text-[10px] text-slate-400 italic">{exp.location}</span>
                    </div>
                    <p className="text-[10px] md:text-[11px] text-slate-600 leading-relaxed whitespace-pre-wrap">{exp.description}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {education.length > 0 && education[0].school && (
            <section>
              <h2 className="text-[10px] md:text-sm font-black uppercase tracking-widest text-[#002366] border-b-2 border-slate-100 pb-1 mb-3">Education</h2>
              <div className="space-y-3">
                {education.map(edu => (
                  <div key={edu.id}>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                      <h3 className="font-bold text-slate-900 text-xs md:text-sm">{edu.degree}</h3>
                      <span className="text-[9px] md:text-[10px] text-slate-400 font-bold">{edu.startDate} — {edu.endDate}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                      <span className="text-xs font-semibold text-slate-700">{edu.school}</span>
                      <span className="text-[9px] md:text-[10px] text-slate-400 italic">{edu.location}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {projects.length > 0 && projects[0].name && (
            <section>
              <h2 className="text-sm font-black uppercase tracking-widest text-[#002366] border-b-2 border-slate-100 pb-1 mb-3">Projects</h2>
              <div className="space-y-3">
                {projects.map(proj => (
                  <div key={proj.id}>
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-slate-900 text-xs">{proj.name}</h3>
                      {proj.link && <span className="text-[9px] text-blue-500 font-bold">{proj.link}</span>}
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">{proj.description}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      );

      const Sidebar = () => (
        <div className="space-y-6">
          <section>
            <h2 className="text-sm font-black uppercase tracking-widest text-[#002366] border-b-2 border-slate-100 pb-1 mb-3">Contact</h2>
            <ul className="space-y-2 text-[10px] font-medium text-slate-600">
              {personalInfo.email && <li className="flex items-center gap-2"><Mail className="h-3 w-3" /> {personalInfo.email}</li>}
              {personalInfo.phone && <li className="flex items-center gap-2"><Phone className="h-3 w-3" /> {personalInfo.phone}</li>}
              {personalInfo.location && <li className="flex items-center gap-2"><MapPin className="h-3 w-3" /> {personalInfo.location}</li>}
              {personalInfo.website && <li className="flex items-center gap-2"><Globe className="h-3 w-3" /> {personalInfo.website}</li>}
              {personalInfo.linkedin && <li className="flex items-center gap-2"><Linkedin className="h-3 w-3" /> {personalInfo.linkedin}</li>}
            </ul>
          </section>

          {skills.length > 0 && skills[0] && (
            <section>
              <h2 className="text-sm font-black uppercase tracking-widest text-[#002366] border-b-2 border-slate-100 pb-1 mb-3">Skills</h2>
              <div className="flex flex-wrap gap-1.5">
                {skills.map((skill, i) => skill && (
                  <span key={i} className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full border border-slate-200">{skill}</span>
                ))}
              </div>
            </section>
          )}
        </div>
      );

      if (layout === 'sidebar-left') {
        return (
          <div className="flex flex-col sm:grid sm:grid-cols-[240px_1fr] gap-8">
            <aside className="bg-slate-50 p-6 rounded-3xl h-full border border-slate-100"><Sidebar /></aside>
            <main><MainContent /></main>
          </div>
        );
      }
      
      if (layout === 'sidebar-right') {
        return (
          <div className="flex flex-col-reverse sm:grid sm:grid-cols-[1fr_240px] gap-8">
            <main><MainContent /></main>
            <aside className="bg-slate-50 p-6 rounded-3xl h-full border border-slate-100"><Sidebar /></aside>
          </div>
        );
      }

      return (
        <div className="space-y-6">
          <Sidebar />
          <MainContent />
        </div>
      );
    };

    const getTemplateStyles = () => {
      switch (activeTemplate) {
        case 'modern': return { layout: 'sidebar-left' as const, font: 'font-sans' };
        case 'bold': return { layout: 'sidebar-right' as const, font: 'font-sans' };
        case 'ats': return { layout: 'single' as const, font: 'font-serif' };
        case 'tech': return { layout: 'sidebar-left' as const, font: 'font-mono' };
        default: return { layout: 'single' as const, font: 'font-sans' };
      }
    };

    const styles = getTemplateStyles();

    return (
      <div 
        ref={resumeRef}
        className={`bg-white w-[210mm] min-h-[297mm] p-6 sm:p-12 mx-auto shadow-2xl relative overflow-hidden ${styles.font}`}
        style={{ letterSpacing: '0.01em' }}
      >
        {/* Design Accents based on template */}
        {activeTemplate === 'classic' && <div className="absolute top-0 left-0 w-full h-2 bg-blue-600" />}
        {activeTemplate === 'creative' && <div className="absolute top-0 right-0 w-2 h-full bg-blue-400" />}
        
        {/* Header */}
        <header className="mb-6 md:mb-8 text-center border-b-4 border-[#002366]/10 pb-6 md:pb-8">
          <h1 className="text-3xl md:text-4xl font-black text-[#002366] uppercase tracking-tighter mb-2">
            {personalInfo.fullName || 'YOUR FULL NAME'}
          </h1>
          <p className="text-base md:text-lg font-bold text-blue-600 uppercase tracking-[0.2em] mb-4">
            {personalInfo.title || 'Professional Title'}
          </p>
          <p className="text-[10px] md:text-xs text-slate-500 max-w-2xl mx-auto leading-relaxed italic">
            " {personalInfo.summary || 'Write a compelling summary about your professional background and career goals.'} "
          </p>
        </header>

        {renderSections(styles.layout)}

        <footer className="mt-12 pt-4 border-t border-slate-100 text-center">
            <p className="text-[8px] text-slate-300 font-bold uppercase tracking-widest">Built with EduTools Resume Maker • ATS Optimized</p>
        </footer>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto py-12 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-4 rounded-[1.5rem] shadow-lg shadow-blue-500/20">
            <Layout className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Resume <span className="text-blue-600">Maker</span></h1>
            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest flex items-center gap-2">
               <ShieldCheck className="h-3 w-3 text-emerald-500" /> ATS Optimized • Zero API Dependence
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowPreview(!showPreview)}
            className="bg-white border border-slate-200 text-slate-700 font-black px-6 py-3 rounded-2xl hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            {showPreview ? <ChevronLeft className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            {showPreview ? 'Back to Editor' : 'Live Preview'}
          </button>
          <button 
            onClick={exportPDF}
            disabled={isExporting}
            className="bg-[#002366] text-white font-black px-8 py-3 rounded-2xl shadow-xl shadow-blue-500/10 hover:shadow-blue-500/30 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isExporting ? <Sparkles className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
            {isExporting ? 'Generating PDF...' : 'Download PDF'}
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_350px] gap-8">
        {/* Main Content Area */}
        <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden min-h-[600px]">
          {showPreview ? (
            <div className="p-4 md:p-8 bg-slate-100 overflow-x-auto min-h-[500px] flex justify-center">
              <div className="origin-top scale-[0.4] sm:scale-[0.6] md:scale-[0.8] lg:scale-100 h-fit">
                <ResumePreview />
              </div>
            </div>
          ) : (
            <div className="p-10">
              {/* Stepper */}
              <div className="flex justify-between items-center mb-12 relative">
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -translate-y-1/2 -z-10"></div>
                {steps.map((step, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setActiveStep(idx)}
                    className={`relative z-10 flex flex-col items-center gap-2 transition-all group ${idx <= activeStep ? 'text-blue-600' : 'text-slate-300'}`}
                  >
                    <div className={`p-3 rounded-2xl border-2 transition-all ${idx <= activeStep ? 'bg-white border-blue-600' : 'bg-slate-50 border-slate-100'}`}>
                      <step.icon className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest">{step.title}</span>
                  </button>
                ))}
              </div>

              {/* Step Forms */}
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {activeStep === 0 && (
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                       <input 
                         type="text" 
                         value={data.personalInfo.fullName}
                         onChange={(e) => handlePersonalInfoChange('fullName', e.target.value)}
                         placeholder="Hammad Butt"
                         className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 outline-none focus:border-blue-500 transition-all font-bold"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Professional Title</label>
                       <input 
                         type="text" 
                         value={data.personalInfo.title}
                         onChange={(e) => handlePersonalInfoChange('title', e.target.value)}
                         placeholder="Full Stack Software Engineer"
                         className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 outline-none focus:border-blue-500 transition-all font-bold"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                       <input 
                         type="email" 
                         value={data.personalInfo.email}
                         onChange={(e) => handlePersonalInfoChange('email', e.target.value)}
                         placeholder="hammad@example.com"
                         className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 outline-none focus:border-blue-500 transition-all font-bold"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone</label>
                       <input 
                         type="text" 
                         value={data.personalInfo.phone}
                         onChange={(e) => handlePersonalInfoChange('phone', e.target.value)}
                         placeholder="+92 300 1234567"
                         className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 outline-none focus:border-blue-500 transition-all font-bold"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Location</label>
                       <input 
                         type="text" 
                         value={data.personalInfo.location}
                         onChange={(e) => handlePersonalInfoChange('location', e.target.value)}
                         placeholder="Lahore, Pakistan"
                         className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 outline-none focus:border-blue-500 transition-all font-bold"
                       />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Professional Summary</label>
                       <textarea 
                         value={data.personalInfo.summary}
                         onChange={(e) => handlePersonalInfoChange('summary', e.target.value)}
                         rows={4}
                         placeholder="Experienced developer with a passion for building scalable web applications..."
                         className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-5 py-4 outline-none focus:border-blue-500 transition-all font-bold resize-none"
                       />
                    </div>
                  </div>
                )}

                {activeStep === 1 && (
                  <div className="space-y-8">
                    {data.experience.map((exp, idx) => (
                      <div key={exp.id} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 relative group/item">
                         <button 
                           onClick={() => removeItem('experience', exp.id)}
                           className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-all"
                         >
                           <Trash2 className="h-5 w-5" />
                         </button>
                         <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-4">Job Role #{idx + 1}</h4>
                         <div className="grid md:grid-cols-2 gap-4">
                            <input 
                              type="text" placeholder="Company Name" value={exp.company}
                              onChange={(e) => updateItem('experience', exp.id, 'company', e.target.value)}
                              className="bg-white border-none rounded-xl px-4 py-2 text-sm font-bold shadow-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                            <input 
                              type="text" placeholder="Position" value={exp.position}
                              onChange={(e) => updateItem('experience', exp.id, 'position', e.target.value)}
                              className="bg-white border-none rounded-xl px-4 py-2 text-sm font-bold shadow-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                            <input 
                              type="text" placeholder="Location" value={exp.location}
                              onChange={(e) => updateItem('experience', exp.id, 'location', e.target.value)}
                              className="bg-white border-none rounded-xl px-4 py-2 text-sm font-bold shadow-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                            <div className="grid grid-cols-2 gap-2">
                               <input type="text" placeholder="Start" value={exp.startDate} onChange={(e) => updateItem('experience', exp.id, 'startDate', e.target.value)} className="bg-white border-none rounded-xl px-4 py-2 text-xs font-bold shadow-sm outline-none" />
                               <input type="text" placeholder="End" value={exp.endDate} onChange={(e) => updateItem('experience', exp.id, 'endDate', e.target.value)} className="bg-white border-none rounded-xl px-4 py-2 text-xs font-bold shadow-sm outline-none" />
                            </div>
                            <textarea 
                              placeholder="Key achievements and responsibilities..." 
                              value={exp.description} 
                              rows={3}
                              onChange={(e) => updateItem('experience', exp.id, 'description', e.target.value)}
                              className="md:col-span-2 bg-white border-none rounded-2xl px-4 py-3 text-xs font-bold shadow-sm outline-none resize-none"
                            />
                         </div>
                      </div>
                    ))}
                    <button 
                      onClick={() => addItem('experience')}
                      className="w-full py-4 border-2 border-dashed border-slate-200 rounded-[2rem] text-slate-400 font-black text-sm hover:border-blue-300 hover:text-blue-500 transition-all flex items-center justify-center gap-2"
                    >
                      <Plus className="h-5 w-5" /> Add Experience
                    </button>
                  </div>
                )}

                {activeStep === 2 && (
                  <div className="space-y-8">
                    {data.education.map((edu, idx) => (
                      <div key={edu.id} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 relative group/item">
                         <button 
                           onClick={() => removeItem('education', edu.id)}
                           className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-all"
                         >
                           <Trash2 className="h-5 w-5" />
                         </button>
                         <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-4">Qualification #{idx + 1}</h4>
                         <div className="grid md:grid-cols-2 gap-4">
                            <input 
                              type="text" placeholder="Institution" value={edu.school}
                              onChange={(e) => updateItem('education', edu.id, 'school', e.target.value)}
                              className="bg-white border-none rounded-xl px-4 py-2 text-sm font-bold shadow-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                            <input 
                              type="text" placeholder="Degree / Certification" value={edu.degree}
                              onChange={(e) => updateItem('education', edu.id, 'degree', e.target.value)}
                              className="bg-white border-none rounded-xl px-4 py-2 text-sm font-bold shadow-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                            <input 
                              type="text" placeholder="Location" value={edu.location}
                              onChange={(e) => updateItem('education', edu.id, 'location', e.target.value)}
                              className="bg-white border-none rounded-xl px-4 py-2 text-sm font-bold shadow-sm outline-none"
                            />
                            <div className="grid grid-cols-2 gap-2">
                               <input type="text" placeholder="Start" value={edu.startDate} onChange={(e) => updateItem('education', edu.id, 'startDate', e.target.value)} className="bg-white border-none rounded-xl px-4 py-2 text-xs font-bold shadow-sm outline-none" />
                               <input type="text" placeholder="End" value={edu.endDate} onChange={(e) => updateItem('education', edu.id, 'endDate', e.target.value)} className="bg-white border-none rounded-xl px-4 py-2 text-xs font-bold shadow-sm outline-none" />
                            </div>
                         </div>
                      </div>
                    ))}
                    <button 
                      onClick={() => addItem('education')}
                      className="w-full py-4 border-2 border-dashed border-slate-200 rounded-[2rem] text-slate-400 font-black text-sm hover:border-blue-300 hover:text-blue-500 transition-all flex items-center justify-center gap-2"
                    >
                      <Plus className="h-5 w-5" /> Add Education
                    </button>
                  </div>
                )}

                {activeStep === 3 && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                       {data.skills.map((skill, idx) => (
                         <div key={idx} className="relative group/skill">
                            <input 
                              type="text" 
                              value={skill}
                              onChange={(e) => updateSkill(idx, e.target.value)}
                              placeholder="e.g. React.js"
                              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-black outline-none focus:bg-white focus:border-blue-500 transition-all"
                            />
                            {data.skills.length > 1 && (
                              <button 
                                onClick={() => removeSkill(idx)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover/skill:opacity-100 transition-all shadow-md"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
                         </div>
                       ))}
                       <button 
                         onClick={addSkill}
                         className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-100 rounded-xl px-4 py-3 text-slate-400 hover:text-blue-500 hover:border-blue-200 transition-all"
                       >
                         <Plus className="h-4 w-4" /> <span className="text-[10px] font-black uppercase">Add Skill</span>
                       </button>
                    </div>
                  </div>
                )}

                {activeStep === 4 && (
                  <div className="space-y-8">
                    {data.projects.map((proj, idx) => (
                      <div key={proj.id} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 relative group/item">
                         <button 
                           onClick={() => removeItem('projects', proj.id)}
                           className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-all"
                         >
                           <Trash2 className="h-5 w-5" />
                         </button>
                         <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-4">Project #{idx + 1}</h4>
                         <div className="grid md:grid-cols-2 gap-4">
                            <input 
                              type="text" placeholder="Project Name" value={proj.name}
                              onChange={(e) => updateItem('projects', proj.id, 'name', e.target.value)}
                              className="bg-white border-none rounded-xl px-4 py-2 text-sm font-bold shadow-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                            <input 
                              type="text" placeholder="Link (Optional)" value={proj.link}
                              onChange={(e) => updateItem('projects', proj.id, 'link', e.target.value)}
                              className="bg-white border-none rounded-xl px-4 py-2 text-sm font-bold shadow-sm outline-none"
                            />
                            <textarea 
                              placeholder="What did you build?" 
                              value={proj.description} 
                              rows={2}
                              onChange={(e) => updateItem('projects', proj.id, 'description', e.target.value)}
                              className="md:col-span-2 bg-white border-none rounded-2xl px-4 py-3 text-xs font-bold shadow-sm outline-none resize-none"
                            />
                         </div>
                      </div>
                    ))}
                    <button 
                      onClick={() => addItem('projects')}
                      className="w-full py-4 border-2 border-dashed border-slate-200 rounded-[2rem] text-slate-400 font-black text-sm hover:border-blue-300 hover:text-blue-500 transition-all flex items-center justify-center gap-2"
                    >
                      <Plus className="h-5 w-5" /> Add Project
                    </button>
                  </div>
                )}
              </div>

              {/* Navigation */}
              <div className="mt-12 pt-8 border-t border-slate-100 flex justify-between">
                <button 
                  disabled={activeStep === 0}
                  onClick={() => setActiveStep(prev => prev - 1)}
                  className="px-6 py-3 rounded-2xl font-black text-sm text-slate-500 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-slate-500 transition-all flex items-center gap-2"
                >
                  <ChevronLeft className="h-5 w-5" /> Previous Step
                </button>
                {activeStep < steps.length - 1 ? (
                  <button 
                    onClick={() => setActiveStep(prev => prev + 1)}
                    className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-sm flex items-center gap-2 active:scale-95 transition-all shadow-lg"
                  >
                    Next Step <ChevronRight className="h-5 w-5" />
                  </button>
                ) : (
                  <button 
                    onClick={async () => {
                      if (auth.currentUser) {
                        await saveUserActivity('resumes', {
                          fullName: data.personalInfo.fullName,
                          title: data.personalInfo.title,
                          data: data, // Save the full object for reconstruction
                          template: activeTemplate
                        });
                      }
                      setShowPreview(true);
                    }}
                    className="bg-emerald-600 text-white px-10 py-3 rounded-2xl font-black text-sm flex items-center gap-2 active:scale-95 transition-all shadow-lg"
                  >
                    Finish & Preview <Eye className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar / Template Selector */}
        <aside className="space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
            <div className="flex items-center gap-3 mb-6">
               <Layout className="h-6 w-6 text-blue-600" />
               <h3 className="text-xl font-black text-slate-900 tracking-tight">Choose <span className="text-blue-600">Template</span></h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
               {templates.map((tpl) => (
                 <button 
                   key={tpl.id}
                   onClick={() => setActiveTemplate(tpl.id)}
                   className={`flex flex-col gap-2 p-2 rounded-2xl transition-all border-4 ${activeTemplate === tpl.id ? 'border-blue-500 bg-blue-50' : 'border-slate-50 bg-white hover:border-slate-200'}`}
                 >
                   <div className={`h-24 w-full rounded-xl shadow-inner ${tpl.preview}`}></div>
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">{tpl.name}</span>
                 </button>
               ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#002366] to-blue-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10">
                <ShieldCheck className="h-24 w-24" />
             </div>
             <h3 className="text-xl font-black mb-4 relative z-10">The ATS Advantage</h3>
             <p className="text-blue-100/70 text-xs font-medium leading-relaxed relative z-10">
               These templates are engineered specifically to be read by Applicant Tracking Systems (ATS). Use keywords from your industry to ensure your CV reaches human eyes.
             </p>
             <div className="mt-6 flex items-center gap-3 bg-white/10 p-3 rounded-2xl backdrop-blur-sm relative z-10">
                <MapPin className="h-4 w-4 text-blue-300" />
                <span className="text-[10px] font-bold tracking-widest uppercase">Works Offline</span>
             </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default ResumeMaker;
