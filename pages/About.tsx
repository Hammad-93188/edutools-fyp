
import React from 'react';
import { 
  Github, 
  Linkedin, 
  Mail, 
  GraduationCap, 
  Code2, 
  Heart, 
  Flag, 
  CheckCircle2, 
  Target, 
  Zap, 
  ShieldCheck, 
  Clock, 
  Layers,
  Cpu,
  Trello,
  FileCheck,
  Ban,
  DollarSign,
  CalendarDays,
  ListTodo
} from 'lucide-react';

const About: React.FC = () => {
  const developers = [
    {
      name: "Hammad Butt",
      role: "Lead Full-Stack Engineer",
      bio: "A passionate coder and problem solver from Pakistan. Hammad specializes in building scalable web architectures and user-centric interfaces.",
    },
    {
      name: "Zaigham Ali Butt",
      role: "AI & UI/UX Specialist",
      bio: "With a keen eye for aesthetics and deep interest in Machine Learning, Zaigham ensures EduTools is as beautiful as it is smart.",
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 1. Project Title */}
      <section className="bg-[#002366] text-white py-24 px-4 overflow-hidden relative">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-blue-500 rounded-full opacity-10 blur-3xl"></div>
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-blue-800/50 px-4 py-2 rounded-full text-blue-300 text-sm font-bold mb-6 backdrop-blur-sm border border-blue-700">
            <GraduationCap className="h-4 w-4" /> Final Year Project (FYP)
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-4 tracking-tight">
            EduTools
          </h1>
          <p className="text-2xl text-blue-200 font-bold uppercase tracking-[0.3em]">Professional Student & Career Utility Suite</p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 mt-16 space-y-24">
        
        {/* Developer Profiles */}
        <section className="py-24">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-[#002366] mb-4">Meet the Visionaries</h2>
            <p className="text-gray-500 max-w-2xl mx-auto font-medium">The engineering team behind the EduTools ecosystem, dedicated to building smarter academic solutions for the future.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-12">
            {developers.map((dev, i) => (
              <div key={i} className="bg-white rounded-[3rem] p-10 shadow-xl border border-gray-100 hover:shadow-2xl transition-all group">
                <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-[#002366] rounded-[2rem] flex items-center justify-center text-white text-3xl font-black shadow-lg">
                    {dev.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">{dev.name}</h3>
                    <p className="text-blue-600 font-bold mb-4">{dev.role}</p>
                  </div>
                </div>
                <div className="mt-8 pt-8 border-t border-gray-50">
                  <p className="text-gray-600 leading-relaxed text-sm font-medium">{dev.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Core Values */}
        <section className="py-24 border-t border-gray-100">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-[#002366] mb-4">Our Core Values</h2>
            <p className="text-gray-500 max-w-2xl mx-auto font-medium">The principles that guide every feature we build and every line of code we write.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: <Zap className="h-6 w-6 text-amber-500" />, title: "Innovation", desc: "Pushing the boundaries of what's possible with Generative AI to solve real-world academic challenges." },
              { icon: <ShieldCheck className="h-6 w-6 text-emerald-500" />, title: "Reliable by Design", desc: "Built to stay helpful, fast, and dependable for students and professionals across real academic and career tasks." },
              { icon: <Target className="h-6 w-6 text-blue-500" />, title: "Accessibility", desc: "Making professional-grade tools available to every student, regardless of their technical background." }
            ].map((value, i) => (
              <div key={i} className="bg-white p-8 rounded-[2.5rem] shadow-lg border border-gray-50 text-center hover:scale-105 transition-transform">
                <div className="inline-flex p-4 bg-gray-50 rounded-2xl mb-6">{value.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{value.title}</h3>
                <p className="text-gray-500 text-sm font-medium leading-relaxed">{value.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Tech Stack */}
        <section className="py-24 bg-[#002366] rounded-[4rem] text-white overflow-hidden relative">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-0 left-0 w-64 h-64 bg-blue-400 rounded-full blur-3xl -ml-20 -mt-20"></div>
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-cyan-400 rounded-full blur-3xl -mr-20 -mb-20"></div>
          </div>
          <div className="max-w-4xl mx-auto px-8 relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-black mb-4">The Tech Stack</h2>
              <p className="text-blue-200 font-medium">Built with the most advanced modern web technologies for speed, reliability, and intelligence.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { icon: <Cpu className="h-8 w-8" />, name: "Gemini AI", desc: "LLM Power" },
                { icon: <Layers className="h-8 w-8" />, name: "React 19", desc: "Frontend" },
                { icon: <ShieldCheck className="h-8 w-8" />, name: "Firebase", desc: "Backend/Auth" },
                { icon: <Code2 className="h-8 w-8" />, name: "Tailwind", desc: "Styling" }
              ].map((tech, i) => (
                <div key={i} className="text-center group">
                  <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-white/20 transition-all border border-white/10">
                    {tech.icon}
                  </div>
                  <h4 className="font-bold text-lg">{tech.name}</h4>
                  <p className="text-blue-300 text-xs font-medium uppercase tracking-widest mt-1">{tech.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Roadmap */}
        <section className="py-24 border-t border-gray-100">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-[#002366] mb-4">Future Roadmap</h2>
            <p className="text-gray-500 max-w-2xl mx-auto font-medium">We're just getting started. Here's what we're working on for the next version of EduTools.</p>
          </div>
          <div className="max-w-3xl mx-auto space-y-6">
            {[
              { icon: <Trello className="h-5 w-5 text-blue-500" />, title: "Custom Handwriting Fonts", desc: "Allow users to upload their own handwriting sample images and train a custom font using fonttools for truly personalised output.", status: "Planned" },
              { icon: <FileCheck className="h-5 w-5 text-emerald-500" />, title: "Plagiarism & Grammar Pro", desc: "Deep context-aware writing assistant for academic papers.", status: "Planning" },
              { icon: <CalendarDays className="h-5 w-5 text-purple-500" />, title: "Collaborative Workspaces", desc: "Real-time group study rooms with shared AI tools.", status: "Q3 2026" }
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-6 p-6 bg-white rounded-3xl shadow-sm border border-gray-100 hover:border-blue-200 transition-all">
                <div className="p-4 bg-gray-50 rounded-2xl">{item.icon}</div>
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-gray-900">{item.title}</h4>
                  <p className="text-gray-500 text-sm font-medium">{item.desc}</p>
                </div>
                <div className="hidden sm:block px-4 py-1 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-blue-100">
                  {item.status}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Mission Statement */}
        <section className="text-center pb-24 border-t border-gray-100 pt-24">
          <div className="inline-block p-4 bg-red-50 rounded-3xl mb-4">
            <Flag className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-4xl font-black text-gray-900 leading-tight mb-4">
            Our Mission
          </h2>
          <p className="text-gray-600 text-lg max-w-4xl mx-auto leading-relaxed mb-12 font-medium">
            EduTools represents a vision of efficiency and empowerment for students and professionals. By centralizing high-performance AI utilities into a secure, professional platform, we enable our users to focus on what truly matters: learning, growth, and achieving their long-term career milestones without the burden of manual formatting and repetitive tasks.
          </p>
          <div className="flex items-center justify-center gap-4 p-6 bg-blue-50 rounded-3xl border border-blue-100 max-w-2xl mx-auto">
            <Heart className="h-6 w-6 text-blue-600 fill-blue-600/20" />
            <p className="text-[#002366] font-bold">
              Built with Passion for a Smarter Future.
            </p>
          </div>
        </section>

      </div>
    </div>
  );
};

export default About;
