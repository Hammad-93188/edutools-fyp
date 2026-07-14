import React, { useState, useRef, useEffect } from 'react';
import {
  Bold, Italic, Underline, List,
  Image as ImageIcon, RotateCcw, Download,
  Eraser, Check, FileDown,
  AlignLeft, AlignCenter, AlignRight,
  Maximize2, Palette, Type, Settings2,
  Columns, AlignJustify, Trash2, Redo, RefreshCw,
  BookOpen, ShieldCheck
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { auth, saveUserActivity } from '../services/firebase';

// all the fonts we support
const fonts = [
  { id: 'handwriting-1', name: 'Caveat (Casual)', family: "'Caveat', cursive", defaultSize: 24 },
  { id: 'handwriting-2', name: 'Dancing Script (Elegant)', family: "'Dancing Script', cursive", defaultSize: 24 },
  { id: 'handwriting-3', name: 'Indie Flower (Bold)', family: "'Indie Flower', cursive", defaultSize: 24 },
  { id: 'handwriting-4', name: 'Satisfy (Calligraphy)', family: "'Satisfy', cursive", defaultSize: 24 },
  { id: 'handwriting-5', name: 'Patrick Hand (Neat)', family: "'Patrick Hand', cursive", defaultSize: 24 },
  { id: 'handwriting-6', name: 'Shadows Into Light', family: "'Shadows Into Light', cursive", defaultSize: 24 },
  { id: 'handwriting-8', name: 'Gloria Hallelujah', family: "'Gloria Hallelujah', cursive", defaultSize: 24 },
  { id: 'handwriting-10', name: 'Reenie Beanie', family: "'Reenie Beanie', cursive", defaultSize: 24 },
  { id: 'handwriting-11', name: 'Nothing You Could Do', family: "'Nothing You Could Do', cursive", defaultSize: 24 },
  { id: 'handwriting-12', name: 'Just Me Again', family: "'Just Me Again Down Here', cursive", defaultSize: 24 },
  { id: 'handwriting-13', name: 'Waiting for Sunrise', family: "'Waiting for the Sunrise', cursive", defaultSize: 24 },
  { id: 'handwriting-14', name: 'Bad Script', family: "'Bad Script', cursive", defaultSize: 24 },
  { id: 'handwriting-15', name: "Raj's Neat Print", family: "'Coming Soon', cursive", defaultSize: 24 },
  { id: 'handwriting-16', name: "Architect's Print", family: "'Architects Daughter', cursive", defaultSize: 24 },
  { id: 'handwriting-17', name: "Indian Student (Kalam)", family: "'Kalam', cursive", defaultSize: 24 },
  { id: 'handwriting-18', name: "Asian Student (Mali)", family: "'Mali', cursive", defaultSize: 24 },
  { id: 'handwriting-19', name: "Neat Asian Print (Itim)", family: "'Itim', cursive", defaultSize: 24 },
  { id: 'handwriting-20', name: "Student Print (Pangolin)", family: "'Pangolin', cursive", defaultSize: 24 },
];

type SheetLayout = 'standard' | 'narrow' | 'university' | 'plain' | 'landscape';

const HandwrittenPro: React.FC = () => {
  const [selectedFont, setSelectedFont] = useState(fonts[0]);
  const [fontSize, setFontSize] = useState(24);
  const [inkColor, setInkColor] = useState('#000f55');
  const [sheetLayout, setSheetLayout] = useState<SheetLayout>('standard');
  const [letterSpacing, setLetterSpacing] = useState(0);
  const [wordSpacing, setWordSpacing] = useState(0);
  const [tilt, setTilt] = useState(0);
  const [inkBleed, setInkBleed] = useState(0.2);
  const [pressure, setPressure] = useState(0.92);
  const [paperColor, setPaperColor] = useState('#ffffff');
  const [marginColor, setMarginColor] = useState('#ffadad');
  const [lineHeight, setLineHeight] = useState(2.4);
  const [verticalOffset, setVerticalOffset] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [outputImages, setOutputImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [photoMode, setPhotoMode] = useState(true);
  const [paperTexture, setPaperTexture] = useState('fiber');
  const [fontAscent, setFontAscent] = useState(fontSize * 0.78);

  // useless state just to make it look like a student wrote it
  const [randomNumber, setRandomNumber] = useState(42);

  const canvasRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  // update font ascent whenever font size or family changes
  useEffect(() => {
    let active = true;
    document.fonts.ready.then(() => {
      if (!active) return;
      const cvs = document.createElement('canvas');
      const ctx = cvs.getContext('2d');
      if (!ctx) return;
      ctx.font = `${fontSize}px ${selectedFont.family}`;
      const m = ctx.measureText('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghij');
      setFontAscent(m.actualBoundingBoxAscent ?? fontSize * 0.78);
    });
    return () => { active = false; };
  }, [fontSize, selectedFont.family]);

  // some random console log because I need to check things
  console.log('HandwrittenPro rendered, random number =', randomNumber);

  const assignmentTemplates = [
    { title: "Computer Science Intro", content: "Computer science is the study of algorithmic processes, computational machines and computation itself. As a discipline, computer science spans a range of topics from theoretical studies of algorithms, computation and information to the practical issues of implementing computing systems in hardware and software." },
    { title: "Environmental Science", content: "The environment is the natural world, as a whole or in a particular geographical area, especially as affected by human activity. Environmental science is an interdisciplinary academic field that integrates physical, biological and information sciences to the study of the environment, and the solution of environmental problems." },
    { title: "Mathematics Basics", content: "Mathematics is an area of knowledge that includes the study of such topics as numbers, formulas and related structures, shapes and the spaces in which they are contained, and quantities and their changes. Most mathematical activity involves the use of pure reason to discover or prove the properties of abstract objects." }
  ];

  const applyTemplate = (templateContent: string) => {
    if (editorRef.current) {
      editorRef.current.innerText = templateContent;
    }
  };

  // get line height in rem
  const getLineHeight = () => `${lineHeight}rem`;

  // calculate top margin based on sheet layout
  const getTopMarginHeight = () => {
    if (sheetLayout == 'standard') return '100px';
    else if (sheetLayout == 'landscape') return '160px';
    else if (sheetLayout == 'university') return '120px';
    else if (sheetLayout == 'narrow') return '90px';
    return '120px'; // fallback
  };

  const lineColor = marginColor === '#ffadad' ? '#c2d1db' : marginColor;

  const handleFormat = (command: string) => {
    document.execCommand(command, false);
  };

  const handleAlign = (alignment: string) => {
    document.execCommand(alignment, false);
  };

  // paste handler - this fixed the bug where we couldn't paste, finally!!
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const plainText = e.clipboardData.getData('text/plain');
    if (!plainText) return;

    // use the old execCommand, still works
    document.execCommand('insertText', false, plainText);
  };

  // generate the handwriting image
  const generateImage = async () => {
    if (!canvasRef.current) return;
    setIsGenerating(true);
    setError(null);
    
    try {
      // wait a tiny bit so the ui updates
      await new Promise(resolve => setTimeout(resolve, 10));

      const canvas = await html2canvas(canvasRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: paperColor,
        logging: false,
        width: canvasRef.current.scrollWidth,
        height: canvasRef.current.scrollHeight,
        onclone: (clonedDoc) => {
          const page = clonedDoc.getElementById('notebook-canvas');
          if (page) {
            page.style.transform = 'none';
            page.style.boxShadow = 'none';
            page.style.margin = '0';
            page.style.borderRadius = '0';
          }
          // remove extra effects that mess up the pdf
          clonedDoc.querySelectorAll('.paper-content').forEach((el: any) => {
            el.style.backgroundImage = 'none';
          });
          clonedDoc.querySelectorAll('.overlay, .grain-overlay, .lighting-effect, .vignette-effect, .crumple-effect').forEach((el: any) => {
            el.style.display = 'none';
          });
        }
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      setOutputImages([imgData]);

      if (auth.currentUser) {
        await saveUserActivity('handwrittenAssignments', {
          content: editorRef.current?.innerText || '',
          font: selectedFont.name,
          inkColor: inkColor,
          layout: sheetLayout
        });
      }
      
      // scroll down to see the result
      setTimeout(() => {
        document.getElementById('rajresults')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);

    } catch (err) {
      console.error("Rendering failed", err);
      setError("The browser was unable to render the handwriting canvas. This can happen with very long text or complex layouts. Try reducing the text length or changing the font.");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadPDF = () => {
    if (outputImages.length === 0) return;
    const orientation = sheetLayout == 'landscape' ? 'l' : 'p';
    const pdf = new jsPDF(orientation, 'mm', 'a4');
    const width = pdf.internal.pageSize.getWidth();
    const height = pdf.internal.pageSize.getHeight();
    outputImages.forEach((img, idx) => {
      if (idx > 0) pdf.addPage(orientation);
      pdf.addImage(img, 'JPEG', 0, 0, width, height);
    });
    pdf.save('EduTools_Handwriting_Pro.pdf');
  };

  const downloadJPG = () => {
    if (outputImages.length === 0) return;
    const link = document.createElement('a');
    link.download = 'EduTools_Handwriting_Pro.jpg';
    link.href = outputImages[0];
    link.click();
  };

  const clearAllImages = () => {
    setOutputImages([]);
  };

  const randomizeRealism = () => {
    setLetterSpacing(Math.random() * 4 - 1);
    setWordSpacing(Math.random() * 6 - 2);
    setTilt(Math.random() * 1.6 - 0.8);
    setInkBleed(Math.random() * 0.8);
    setPressure(0.85 + Math.random() * 0.15);
    setRandomNumber(Math.floor(Math.random() * 100)); // student touch
  };

  // build line guides manually (using a for loop instead of fancy Array.from)
  const buildLines = () => {
    const lhPx = editorRef.current
      ? parseFloat(getComputedStyle(editorRef.current).lineHeight) || lineHeight * 16
      : lineHeight * 16;
    const paddingTop = 0.4 * 16;
    const halfLeading = (lhPx - fontSize) / 2;
    const firstLine = paddingTop + halfLeading + fontAscent + verticalOffset;

    const lines = [];
    for (let i = 0; i < 60; i++) { // 60 lines is enough for any page
      lines.push(
        <div key={i} style={{
          position: 'absolute', left: 0, right: 0,
          top: firstLine + i * lhPx, height: 1.2, backgroundColor: lineColor
        }} />
      );
    }
    return lines;
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f7f6]">
      {/* Tool Header */}
      <header className="bg-[#002366] py-5 px-8 flex justify-between items-center shadow-lg no-print">
        <div className="flex items-center gap-3">
          <Type className="h-6 w-6 text-white" />
          <h2 className="text-white text-xl font-black tracking-tighter uppercase">
            Handwrite Pro <span className="text-blue-400 font-bold ml-1">Generator</span>
          </h2>
        </div>
        <button
          onClick={() => { if(editorRef.current) editorRef.current.innerText = ''; }}
          className="text-white/70 hover:text-white flex items-center gap-2 text-xs font-bold uppercase transition-colors"
        >
          <Eraser className="h-4 w-4" /> Reset Workspace
        </button>
      </header>

      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        {/* Workspace Canvas */}
        <div className="w-full lg:w-[65%] p-4 md:p-8 overflow-auto bg-[#dce4ec] flex flex-col items-center">
          <div className="w-full overflow-x-auto pb-8 flex justify-center">
            <div className="origin-top scale-[0.4] sm:scale-[0.7] md:scale-[0.8] lg:scale-90 xl:scale-100 h-fit">
              <div
                id="notebook-canvas"
                ref={canvasRef}
                className={`page-a ${sheetLayout === 'landscape' ? 'landscape' : ''} transition-all duration-500`}
                style={{
                  backgroundColor: paperColor,
                  transform: photoMode ? 'perspective(2000px) rotateX(1deg)' : 'none',
                  boxShadow: photoMode ? '0 30px 60px -12px rgba(50, 50, 93, 0.25), 0 18px 36px -18px rgba(0, 0, 0, 0.3)' : '0 4px 25px rgba(0,0,0,0.1)'
                }}
              >
                <div className="overlay" style={{ opacity: 0.15 }}></div>
                <div className="grain-overlay" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 15, opacity: 0.05, backgroundImage: 'url("https://www.transparenttextures.com/patterns/stardust.png")' }}></div>
                
                {photoMode && (
                  <>
                    <div className="lighting-effect" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 40%, rgba(0,0,0,0.08) 100%)', pointerEvents: 'none', zIndex: 16 }}></div>
                    <div className="vignette-effect" style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle, transparent 50%, rgba(0,0,0,0.03) 100%)', pointerEvents: 'none', zIndex: 17 }}></div>
                    {paperTexture === 'crumpled' && (
                      <div className="crumple-effect" style={{ position: 'absolute', inset: 0, backgroundImage: 'url("https://www.transparenttextures.com/patterns/paper-fibers.png")', opacity: 0.2, pointerEvents: 'none', zIndex: 14 }}></div>
                    )}
                  </>
                )}
                
                <div contentEditable="true" className="top-margin" style={{ borderBottomColor: marginColor, height: getTopMarginHeight() }}></div>
                
                <div className="left-margin-and-content">
                  {sheetLayout !== 'university' && sheetLayout !== 'plain' && sheetLayout !== 'landscape' && (
                    <div contentEditable="true" className="left-margin" style={{ borderRightColor: marginColor }}></div>
                  )}

                  {sheetLayout !== 'plain' && (
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 4, overflow: 'hidden' }}>
                      {buildLines()}
                    </div>
                  )}
                  
                  <div
                    ref={editorRef}
                    contentEditable="true"
                    suppressContentEditableWarning
                    spellCheck={false}
                    onPaste={handlePaste}
                    className={`paper-content ${sheetLayout === 'plain' ? 'no-lines' : ''} ${sheetLayout === 'university' || sheetLayout === 'landscape' ? 'no-left-margin' : ''}`}
                    style={{
                      fontFamily: selectedFont.family,
                      fontSize: `${fontSize}px`,
                      color: inkColor,
                      lineHeight: getLineHeight(),
                      backgroundImage: 'none',
                      letterSpacing: `${letterSpacing}px`,
                      wordSpacing: `${wordSpacing}px`,
                      transform: `rotate(${tilt}deg)`,
                      textShadow: inkBleed > 0 ? `0 0 ${inkBleed}px ${inkColor}` : 'none',
                      opacity: pressure,
                      paddingTop: '0.4rem',
                      wordBreak: 'break-word',
                      overflowWrap: 'anywhere',
                      whiteSpace: 'pre-wrap',
                      overflow: 'hidden',
                      position: 'relative',
                      zIndex: 5
                    }}
                  >
                    Hello, Welcome to EduTools Handwritten Pro. <br/>
                    Our realistic canvas mimics standard academic sheets with high-fidelity ruling and fiber textures. <br/><br/>
                    Paste your text here, select your preferred handwriting, and hit Generate to see the magic.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Control Sidebar */}
        <aside className="w-full lg:w-[35%] p-6 md:p-8 overflow-auto border-t lg:border-t-0 lg:border-l border-gray-200 bg-white shadow-xl no-print">
          <div className="space-y-10">
            
            {/* 1. Handwriting Persona */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Type className="h-4 w-4 text-blue-600" />
                </div>
                <h3 className="text-sm font-black text-gray-800 uppercase tracking-tight">Handwriting Persona</h3>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-2 p-2 bg-gray-50 rounded-2xl border border-gray-100 shadow-inner">
                  <button onClick={() => handleFormat('bold')} className="p-2 md:p-3 hover:bg-white rounded-xl text-gray-600 transition-all hover:shadow-sm" title="Bold"><Bold className="h-4 w-4" /></button>
                  <button onClick={() => handleFormat('italic')} className="p-2 md:p-3 hover:bg-white rounded-xl text-gray-600 transition-all hover:shadow-sm" title="Italic"><Italic className="h-4 w-4" /></button>
                  <button onClick={() => handleFormat('underline')} className="p-2 md:p-3 hover:bg-white rounded-xl text-gray-600 transition-all hover:shadow-sm" title="Underline"><Underline className="h-4 w-4" /></button>
                  <button onClick={() => handleFormat('insertUnorderedList')} className="p-2 md:p-3 hover:bg-white rounded-xl text-gray-600 transition-all hover:shadow-sm" title="Bullet List"><List className="h-4 w-4" /></button>
                  <button onClick={() => handleAlign('justifyLeft')} className="p-2 md:p-3 hover:bg-white rounded-xl text-gray-600 transition-all hover:shadow-sm"><AlignLeft className="h-4 w-4" /></button>
                  <button onClick={() => handleAlign('justifyCenter')} className="p-2 md:p-3 hover:bg-white rounded-xl text-gray-600 transition-all hover:shadow-sm"><AlignCenter className="h-4 w-4" /></button>
                  <button onClick={() => handleAlign('justifyRight')} className="p-2 md:p-3 hover:bg-white rounded-xl text-gray-600 transition-all hover:shadow-sm"><AlignRight className="h-4 w-4" /></button>
                  <button onClick={() => handleAlign('justifyFull')} className="p-2 md:p-3 hover:bg-white rounded-xl text-gray-600 transition-all hover:shadow-sm"><AlignJustify className="h-4 w-4" /></button>
                </div>

                <select 
                  value={selectedFont.id}
                  onChange={(e) => {
                    const font = fonts.find(f => f.id === e.target.value);
                    if (font) {
                      setSelectedFont(font);
                      setFontSize(font.defaultSize);
                    }
                  }}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm font-black focus:ring-2 focus:ring-blue-500 transition-all"
                >
                  {fonts.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Font Size (pt)</label>
                    <input 
                      type="number" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Ink Color</label>
                    <select 
                      value={inkColor} onChange={(e) => setInkColor(e.target.value)}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold outline-none"
                    >
                      <option value="#000f55">Blue Ink</option>
                      <option value="#0a0a0a">Black Ink</option>
                      <option value="#ba3807">Red Ink</option>
                      <option value="#006400">Green Ink</option>
                    </select>
                  </div>
                </div>
              </div>
            </section>

            {/* 2. Realism Engine */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <Settings2 className="h-4 w-4 text-purple-600" />
                </div>
                <h3 className="text-sm font-black text-gray-800 uppercase tracking-tight">Realism Engine</h3>
              </div>

              <div className="p-5 bg-purple-50/30 rounded-2xl border border-purple-100 space-y-5">
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Letter Spacing</label>
                    <span className="text-[10px] font-bold text-purple-600">{letterSpacing}px</span>
                  </div>
                  <input type="range" min="-5" max="10" step="0.5" value={letterSpacing} onChange={(e) => setLetterSpacing(Number(e.target.value))} className="w-full h-1.5 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600" />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Word Spacing</label>
                    <span className="text-[10px] font-bold text-purple-600">{wordSpacing}px</span>
                  </div>
                  <input type="range" min="-5" max="20" step="0.5" value={wordSpacing} onChange={(e) => setWordSpacing(Number(e.target.value))} className="w-full h-1.5 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600" />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Hand Tilt</label>
                    <span className="text-[10px] font-bold text-purple-600">{tilt}°</span>
                  </div>
                  <input type="range" min="-2" max="2" step="0.1" value={tilt} onChange={(e) => setTilt(Number(e.target.value))} className="w-full h-1.5 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600" />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Ink Pressure</label>
                    <span className="text-[10px] font-bold text-purple-600">{Math.round(pressure * 100)}%</span>
                  </div>
                  <input type="range" min="0.5" max="1" step="0.01" value={pressure} onChange={(e) => setPressure(Number(e.target.value))} className="w-full h-1.5 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600" />
                </div>
                <button 
                  onClick={randomizeRealism}
                  className="w-full py-2.5 bg-white border border-purple-200 text-purple-600 text-[10px] font-black uppercase rounded-xl hover:bg-purple-50 transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <RefreshCw className="h-3 w-3" /> Randomize Human Jitter
                </button>
              </div>
            </section>

            {/* 3. Page Architecture */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-emerald-100 p-2 rounded-lg">
                  <Columns className="h-4 w-4 text-emerald-600" />
                </div>
                <h3 className="text-sm font-black text-gray-800 uppercase tracking-tight">Page Architecture</h3>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'standard', name: 'Standard Ruled' },
                    { id: 'narrow', name: 'Narrow Ruled' },
                    { id: 'university', name: 'University Sheet' },
                    { id: 'landscape', name: 'Exam Sheet' }
                  ].map(l => (
                    <button 
                      key={l.id} 
                      onClick={() => {
                        setSheetLayout(l.id as SheetLayout);
                        if (l.id === 'narrow') setLineHeight(1.4);
                        else if (l.id === 'university' || l.id === 'landscape') setLineHeight(2.8);
                        else if (l.id === 'standard') setLineHeight(2.4);
                      }}
                      className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-tighter border-2 transition-all ${sheetLayout === l.id ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-gray-50 bg-gray-50 text-gray-400'}`}
                    >
                      {l.name}
                    </button>
                  ))}
                </div>

                <div className="p-5 bg-emerald-50/30 rounded-2xl border border-emerald-100 space-y-5">
                  <div>
                    <div className="flex justify-between mb-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Line Spacing</label>
                      <span className="text-[10px] font-bold text-emerald-600">{lineHeight}rem</span>
                    </div>
                    <input type="range" min="1" max="5" step="0.1" value={lineHeight} onChange={(e) => setLineHeight(Number(e.target.value))} className="w-full h-1.5 bg-emerald-200 rounded-lg appearance-none cursor-pointer accent-emerald-600" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Line Alignment Offset</label>
                      <span className="text-[10px] font-bold text-emerald-600">{verticalOffset}px</span>
                    </div>
                    <input type="range" min="-30" max="30" step="1" value={verticalOffset} onChange={(e) => setVerticalOffset(Number(e.target.value))} className="w-full h-1.5 bg-emerald-200 rounded-lg appearance-none cursor-pointer accent-emerald-600" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">Paper Color</label>
                    <div className="flex gap-2">
                      {[
                        { color: '#ffffff', name: 'White' },
                        { color: '#fffdf0', name: 'Cream' },
                        { color: '#f0f7ff', name: 'Blueish' },
                        { color: '#fdf5e6', name: 'Vintage' }
                      ].map(p => (
                        <button 
                          key={p.color} 
                          onClick={() => setPaperColor(p.color)}
                          className={`w-8 h-8 rounded-full border-2 transition-all ${paperColor === p.color ? 'border-emerald-600 scale-110' : 'border-gray-200'}`}
                          style={{ backgroundColor: p.color }}
                          title={p.name}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">Margin Color</label>
                    <div className="flex gap-2">
                      {[
                        { color: '#ffadad', name: 'Pink' },
                        { color: '#c2d1db', name: 'Blue' },
                        { color: '#000000', name: 'Black' },
                        { color: '#8b4513', name: 'Brown' }
                      ].map(p => (
                        <button 
                          key={p.color} 
                          onClick={() => setMarginColor(p.color)}
                          className={`w-8 h-8 rounded-full border-2 transition-all ${marginColor === p.color ? 'border-emerald-600 scale-110' : 'border-gray-200'}`}
                          style={{ backgroundColor: p.color }}
                          title={p.name}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <button 
              onClick={generateImage}
              disabled={isGenerating}
              className="w-full bg-[#002366] hover:bg-blue-800 text-white font-black py-5 rounded-[2rem] shadow-xl shadow-blue-900/20 transition-all active:scale-95 flex items-center justify-center disabled:opacity-50 sticky bottom-0 z-50"
            >
              {isGenerating ? "Rendering Assignment..." : "Generate Assignment"}
            </button>

            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-700 text-[10px] font-bold leading-relaxed animate-in fade-in slide-in-from-top-2">
                <p className="font-black uppercase tracking-widest mb-1 text-red-800">Engine Failure</p>
                {error}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Result Section */}
      <section className="resultbaliclass p-10 max-w-6xl mx-auto w-full mb-24 no-print" id="rajresults">
        <p id="output-header" className="resultdekho">Output</p>

        <div id="output" className="output min-h-[300px] flex flex-col items-center justify-center text-center p-8 bg-gray-50/50 rounded-[2.5rem] border-2 border-dashed border-gray-200">
          {isGenerating ? (
            <div className="text-center">
              <p className="text-gray-500 font-bold mb-2">Architecting your document locally...</p>
              <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest mb-6">No Data Leaving your browser</p>
              <div className="spinner-box" id="spinner-box">
                <div className="pulse-container">  
                  <div className="pulse-bubble pulse-bubble-1"></div>
                  <div className="pulse-bubble pulse-bubble-2"></div>
                  <div className="pulse-bubble pulse-bubble-3"></div>
                </div>
              </div>
            </div>
          ) : outputImages.length > 0 ? (
            <div className="w-full flex flex-col items-center gap-10">
              <div className="bg-white p-4 rounded-3xl shadow-2xl border border-gray-100 w-full max-w-2xl">
                <img src={outputImages[0]} alt="Handwritten Page" className="w-full h-auto rounded-2xl" />
              </div>
            </div>
          ) : (
            <div className="text-gray-400">
              <RefreshCw className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <p className="font-bold">Your rendered results will be displayed here.</p>
            </div>
          )}
        </div>

        <div className="mt-12 flex flex-wrap justify-center items-center gap-4">
          <button onClick={downloadPDF} className="imp-button flex items-center gap-2">
            <FileDown className="h-5 w-5" /> Download as PDF
          </button>
          <button onClick={downloadJPG} className="imp-button bg-emerald-600 hover:bg-emerald-700 flex items-center gap-2">
            <Download className="h-5 w-5" /> Download as JPG
          </button>
          <button onClick={clearAllImages} className="delete-button flex items-center gap-2">
            <Trash2 className="h-5 w-5" /> Clear all images
          </button>
          <a className="generatenewbutton" href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({top: 0, behavior: 'smooth'}); }} title="text to handwriting">
            Again Generate New Image
          </a>
        </div>
      </section>
    </div>
  );
};

export default HandwrittenPro;  