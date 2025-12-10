import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, FileText, ArrowLeft, Save, LayoutDashboard, FileSpreadsheet, Eye, Download } from 'lucide-react';
import UploadZone from './components/UploadZone';
import EvaluationReport from './components/EvaluationReport';
import NBInfoTemplate from './components/NBInfoTemplate';
import { Message, MessageRole, UploadedFile, EvaluationResult } from './types';
import { sendMessageToGemini, generateFinalEvaluation } from './services/geminiService';

const App: React.FC = () => {
  // State
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: MessageRole.MODEL,
      text: "Hello. I am your VAVE New Business Assistant. Please upload the RFP, meeting recording, or project documents, and I will help you evaluate the strategic fit.",
      timestamp: new Date(),
      isSystem: true
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Data State
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  
  // View State
  const [showReport, setShowReport] = useState(false); // Toggle between Dashboard and Report view
  const [activeTab, setActiveTab] = useState<'strategic' | 'nb-info'>('strategic'); // Tab within Report view
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handlers
  const handleFilesSelected = async (newFiles: UploadedFile[]) => {
    setFiles(prev => [...prev, ...newFiles]);
    
    const userMsg: Message = {
      role: MessageRole.USER,
      text: `I have uploaded ${newFiles.length} new file(s): ${newFiles.map(f => f.name).join(', ')}. Please analyze them against the VAVE framework.`,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    
    setIsLoading(true);
    const responseText = await sendMessageToGemini(messages, userMsg.text, newFiles);
    
    setMessages(prev => [...prev, {
      role: MessageRole.MODEL,
      text: responseText,
      timestamp: new Date()
    }]);
    setIsLoading(false);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMsg: Message = {
      role: MessageRole.USER,
      text: inputText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    const responseText = await sendMessageToGemini(messages, userMsg.text, files);

    setMessages(prev => [...prev, {
      role: MessageRole.MODEL,
      text: responseText,
      timestamp: new Date()
    }]);
    setIsLoading(false);
  };

  const handleGenerateReport = async () => {
    setIsLoading(true);
    try {
      const result = await generateFinalEvaluation(messages, files);
      setEvaluation(result);
      setShowReport(true); // Automatically switch to report view
      
      setMessages(prev => [...prev, {
        role: MessageRole.MODEL,
        text: "I have generated the strategic evaluation report and NB Info sheet based on the available data. You can view them now.",
        timestamp: new Date()
      }]);
    } catch (e) {
      setMessages(prev => [...prev, {
        role: MessageRole.MODEL,
        text: "Failed to generate the structured report. Please try clarifying more details in the chat first.",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Navigation Handlers
  const handleBackToDashboard = () => {
    setShowReport(false); // Just hide the report, keep the data
  };

  const handleOpenReport = () => {
    setShowReport(true);
  };

  const handleDownloadJson = () => {
    if (!evaluation) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(evaluation, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${evaluation.details.clientName || 'project'}_vave_data.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  // PowerPoint Export Logic
  const handleExportPPT = () => {
    if (!evaluation) return;

    // Access global PptxGenJS loaded via script tag
    const PptxGenJS = (window as any).PptxGenJS;
    if (!PptxGenJS) {
      alert("PowerPoint generator library is still loading. Please try again in a moment.");
      return;
    }

    const pres = new PptxGenJS();
    const primaryColor = "6C3AFF";
    
    // --- Slide 1: Strategic Evaluation ---
    const slide1 = pres.addSlide();
    
    // Header
    slide1.addText("Strategic Evaluation", { x: 0.5, y: 0.5, w: 4, h: 0.5, fontSize: 24, fontFace: "Arial", color: primaryColor, bold: true });
    slide1.addText(evaluation.details.projectName || "New Project", { x: 0.5, y: 1.0, w: 9, h: 0.5, fontSize: 18, fontFace: "Arial", color: "363636" });
    
    // Metrics
    const metrics = evaluation.metrics;
    slide1.addText(`Total Score: ${metrics.total.toFixed(2)}`, { x: 0.5, y: 1.8, fontSize: 14, bold: true });
    slide1.addText(`Recommendation: ${metrics.recommendation}`, { x: 0.5, y: 2.2, fontSize: 14, bold: true, color: metrics.recommendation === 'GO' ? '00AA00' : 'AA0000' });

    // Table Data for Metrics
    const rows = [
        ["Metric", "Score (1-5)"],
        ["Fame", metrics.fame.toFixed(1)],
        ["Fun", metrics.fun.toFixed(1)],
        ["Money", metrics.money.toFixed(1)],
        ["Strategy", metrics.strategy.toFixed(1)]
    ];
    slide1.addTable(rows, { x: 0.5, y: 3.0, w: 4.0, fill: "F7F7F7", border: { pt: 1, color: "CCCCCC" }, fontSize: 12 });

    // --- Slide 2: NB Information (6-Box Grid) ---
    const slide2 = pres.addSlide();
    slide2.addText("High Level Q&A - NB Info", { x: 0.5, y: 0.5, w: 9, h: 0.5, fontSize: 24, fontFace: "Arial", color: primaryColor, bold: true });

    const boxW = 3.0;
    const boxH = 2.2;
    const startY = 1.2;
    const gap = 0.2;
    
    // Helper to create box content
    const createBox = (title: string, items: string[], col: number, row: number) => {
        const x = 0.5 + (col * (boxW + gap));
        const y = startY + (row * (boxH + gap));
        
        // Header
        slide2.addShape(pres.shapes.RECTANGLE, { x, y, w: boxW, h: 0.4, fill: primaryColor });
        slide2.addText(title, { x, y, w: boxW, h: 0.4, align: "center", fontSize: 14, color: "FFFFFF", bold: true });
        
        // Body
        slide2.addShape(pres.shapes.RECTANGLE, { x, y: y + 0.4, w: boxW, h: boxH - 0.4, fill: "EEEEEE" });
        slide2.addText(items.join("\n"), { x: x + 0.1, y: y + 0.5, w: boxW - 0.2, h: boxH - 0.6, fontSize: 10, color: primaryColor, valign: "top" });
    };

    const info = evaluation.nbInfo;
    
    // Row 1
    createBox("Client & Type", [
        `Project: ${info.clientAndType.projectName}`,
        `Type: ${info.clientAndType.type}`,
        `Model: ${info.clientAndType.businessModel}`
    ], 0, 0);
    
    createBox("Project Basics", [
        `Topic: ${info.projectBasics.topic}`,
        `Size: ${info.projectBasics.size}`,
        `Loc: ${info.projectBasics.location}`,
        `Level: ${info.projectBasics.experienceLevel}`
    ], 1, 0);
    
    createBox("Scope", info.scope, 2, 0);

    // Row 2
    createBox("Pitch Deliverables", info.pitchDeliverables, 0, 1);
    
    createBox("Fees", [
        `Pitch: ${info.fees.pitchFee}`,
        `Prod: ${info.fees.productionFee}`,
        `Agency: ${info.fees.agencyFee || 'N/A'}`
    ], 1, 1);
    
    createBox("Time Frame", info.timeFrame, 2, 1);

    pres.writeFile({ fileName: `${evaluation.details.clientName || 'VAVE_Project'}_Evaluation.pptx` });
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      {/* Left Sidebar - Chat & Input - Hidden during report view on mobile, visible on desktop if report is hidden */}
      <div className={`
        no-print w-full md:w-1/2 flex flex-col border-r border-gray-200 bg-white h-full shadow-lg z-10 transition-all duration-300
        ${showReport ? 'hidden md:flex' : 'flex'} 
      `}>
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-vave-primary rounded-lg flex items-center justify-center text-white font-bold text-xl tracking-tighter shadow-lg shadow-vave-primary/20">
                VA
            </div>
            <div>
                <h1 className="font-bold text-gray-900 tracking-tight">VAVE Strategy</h1>
                <p className="text-xs text-gray-500">New Business AI Assistant</p>
            </div>
          </div>
          
          {/* "View Report" button appears if data exists but report is hidden */}
          {evaluation && !showReport && (
            <button 
                onClick={handleOpenReport}
                className="text-xs bg-vave-primary/10 text-vave-primary px-4 py-2 rounded-lg font-bold hover:bg-vave-primary/20 flex items-center gap-2 transition-colors border border-vave-primary/20"
            >
                <Eye className="w-4 h-4" /> RETURN TO REPORT
            </button>
          )}
        </div>

        {/* Upload Section */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <UploadZone onFilesSelected={handleFilesSelected} />
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide bg-gray-50">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex w-full ${msg.role === MessageRole.USER ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex max-w-[85%] gap-3 ${msg.role === MessageRole.USER ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-sm
                  ${msg.role === MessageRole.USER ? 'bg-gray-200 text-gray-600' : 'bg-vave-primary text-white'}
                `}>
                  {msg.role === MessageRole.USER ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                
                <div className={`
                  p-3 rounded-2xl text-sm leading-relaxed shadow-sm
                  ${msg.role === MessageRole.USER 
                    ? 'bg-gray-800 text-white rounded-tr-none' 
                    : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'}
                `}>
                  {msg.text.split('\n').map((line, i) => (
                    <p key={i} className={i > 0 ? 'mt-2' : ''}>{line}</p>
                  ))}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start w-full">
              <div className="flex gap-3 items-center">
                <div className="w-8 h-8 rounded-full bg-vave-primary text-white flex items-center justify-center">
                   <Bot className="w-4 h-4 animate-pulse" />
                </div>
                <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-vave-light rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
                    <div className="w-2 h-2 bg-vave-light rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    <div className="w-2 h-2 bg-vave-light rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-gray-200">
           {messages.length > 1 && (
             <button 
              onClick={handleGenerateReport}
              disabled={isLoading}
              className="w-full mb-3 py-3 bg-vave-light/10 text-vave-primary font-bold rounded-xl hover:bg-vave-light/20 transition-all duration-200 flex items-center justify-center gap-2 text-sm border border-vave-primary/20 disabled:opacity-50"
             >
               <FileText className="w-4 h-4" /> {evaluation ? 'Regenerate Evaluation' : 'Generate Evaluation Report'}
             </button>
           )}

          <div className="flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask questions or add details..."
              className="flex-1 border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-vave-primary focus:ring-2 focus:ring-vave-primary/20"
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !inputText.trim()}
              className="bg-vave-primary text-white p-2.5 rounded-xl hover:bg-vave-dark disabled:opacity-50 transition-colors shadow-lg shadow-vave-primary/30"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Right Side - Report Container */}
      <div className={`
        flex-1 bg-gray-50 h-full overflow-y-auto relative print-container
        ${showReport ? 'block' : 'hidden md:block'} 
      `} id="report-container">
        {evaluation && showReport ? (
          <div className="max-w-5xl mx-auto p-6 md:p-10 print:p-0 print:max-w-none print:m-0">
            
            {/* Toolbar - No Print */}
            <div className="no-print flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 sticky top-0 bg-gray-50/95 backdrop-blur py-4 z-20 border-b border-gray-200 w-full shadow-sm px-2 rounded-b-lg">
               <div className="flex items-center gap-3">
                 <button 
                   onClick={handleBackToDashboard}
                   className="p-2 rounded-full hover:bg-gray-200 text-gray-500 transition-colors group"
                   title="Back to Dashboard"
                 >
                   <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                 </button>
                 
                 {/* Tabs */}
                 <div className="flex bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
                    <button 
                        onClick={() => setActiveTab('strategic')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'strategic' ? 'bg-vave-primary text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        <LayoutDashboard className="w-4 h-4" /> Strategic Eval
                    </button>
                    <button 
                        onClick={() => setActiveTab('nb-info')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'nb-info' ? 'bg-vave-primary text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        <FileSpreadsheet className="w-4 h-4" /> NB Info
                    </button>
                 </div>
               </div>
               
               <div className="flex gap-2">
                   <button 
                     onClick={handleDownloadJson}
                     className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                     title="Download JSON Data"
                   >
                     <Save className="w-4 h-4" /> JSON
                   </button>
                   <button 
                     onClick={handleExportPPT}
                     className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-vave-primary rounded-lg hover:bg-vave-dark transition-colors shadow-md"
                     title="Export to PowerPoint"
                   >
                     <Download className="w-4 h-4" /> Export PPT
                   </button>
               </div>
            </div>

            {/* Printable Report Content */}
            <div className="print-break-inside-avoid w-full bg-white">
              {activeTab === 'strategic' ? (
                  <EvaluationReport data={evaluation} />
              ) : (
                  <NBInfoTemplate data={evaluation} />
              )}
            </div>
            
            <div className="mt-10 text-center text-xs text-gray-400 border-t border-gray-200 pt-4 no-print">
                Use the "Export PPT" button to save this document as a PowerPoint file.
            </div>
          </div>
        ) : (
          <div className={`h-full flex flex-col items-center justify-center text-gray-400 max-w-lg mx-auto text-center p-6 ${showReport ? 'hidden' : 'flex'}`}>
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
              <div className="w-16 h-16 border-4 border-gray-100 border-t-vave-primary rounded-full animate-spin opacity-20"></div>
            </div>
            <h3 className="text-2xl font-light text-gray-800 mb-2">Ready to Analyze</h3>
            <p className="text-sm text-gray-500 leading-relaxed max-w-xs mx-auto">
              Upload your project files or start chatting to build the VAVE Strategic Evaluation.
            </p>
            
            {/* Visual Process Steps - Reduced size to be less obtrusive */}
            <div className="mt-10 w-full grid grid-cols-1 gap-3 opacity-70">
               <div className="flex items-center gap-4 p-3 bg-white rounded-lg border border-gray-100">
                  <div className="w-8 h-8 rounded-full bg-vave-primary/10 text-vave-primary flex items-center justify-center font-bold text-sm">1</div>
                  <div className="text-left">
                    <div className="text-xs font-bold text-gray-800">Upload</div>
                    <div className="text-[10px]">RFP Docs, Audio</div>
                  </div>
               </div>
               <div className="w-[2px] h-4 bg-gray-200 mx-auto"></div>
               <div className="flex items-center gap-4 p-3 bg-white rounded-lg border border-gray-100">
                  <div className="w-8 h-8 rounded-full bg-vave-primary/10 text-vave-primary flex items-center justify-center font-bold text-sm">2</div>
                  <div className="text-left">
                    <div className="text-xs font-bold text-gray-800">AI Chat</div>
                    <div className="text-[10px]">Clarify scope</div>
                  </div>
               </div>
               <div className="w-[2px] h-4 bg-gray-200 mx-auto"></div>
               <div className="flex items-center gap-4 p-3 bg-white rounded-lg border border-gray-100">
                  <div className="w-8 h-8 rounded-full bg-vave-primary/10 text-vave-primary flex items-center justify-center font-bold text-sm">3</div>
                  <div className="text-left">
                    <div className="text-xs font-bold text-gray-800">Generate</div>
                    <div className="text-[10px]">Strategic Template</div>
                  </div>
               </div>
            </div>
          </div>
        )}
        
        <div className="absolute bottom-4 right-6 text-xs text-gray-300 no-print">
          VAVE Germany GmbH • Confidential
        </div>
      </div>
    </div>
  );
};

export default App;