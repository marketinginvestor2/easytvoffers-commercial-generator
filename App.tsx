
import React, { useState, useEffect } from 'react';
import { 
  Tv, 
  Sparkles, 
  ArrowRight, 
  CheckCircle, 
  PlayCircle, 
  Download, 
  Mail, 
  Phone, 
  User,
  Loader2
} from 'lucide-react';

// --- Types ---
interface PreviewData {
  previewId: string;
  script: string;
  visualHeadline: string;
  audioUrl: string;
  imageUrl: string;
  qrUrl: string;
}

interface LeadData {
  name: string;
  email: string;
  phone: string;
}

const API_BASE = '/api'; // Assumes Firebase rewrites to Cloud Run

const App: React.FC = () => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Step 1 Form
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [offer, setOffer] = useState('');
  const [extraInfo, setExtraInfo] = useState('');
  const [qrType, setQrType] = useState('url');
  const [qrValue, setQrValue] = useState('');

  // Step 2 Preview
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [lead, setLead] = useState<LeadData>({ name: '', email: '', phone: '' });

  // Step 1: Generate Preview
  const handleGeneratePreview = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/generatePreview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessName, businessType, offer, extraInfo, qrType, qrValue }),
      });
      
      if (!res.ok) throw new Error('Failed to generate preview');
      const data = await res.json();
      setPreview(data);
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Request File
  const handleRequestFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!preview) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/requestFile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          previewId: preview.previewId, 
          leadName: lead.name, 
          leadEmail: lead.email, 
          leadPhone: lead.phone 
        }),
      });

      if (!res.ok) throw new Error('Failed to submit request');
      setStep(3);
    } catch (err: any) {
      setError(err.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center py-12 px-4 sm:px-6">
      {/* Header */}
      <header className="mb-12 text-center">
        <div className="inline-flex items-center justify-center p-3 bg-blue-600 rounded-2xl text-white mb-4 shadow-lg shadow-blue-200">
          <Tv size={32} />
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Easy TV Offers</h1>
        <p className="text-lg text-slate-600 mt-2">Free AI-Generated Commercials for Your Business</p>
      </header>

      <main className="w-full max-w-4xl bg-white rounded-3xl shadow-xl shadow-slate-200 overflow-hidden">
        {/* Progress Bar */}
        <div className="flex border-b">
          <div className={`flex-1 text-center py-4 font-semibold text-sm transition-colors ${step >= 1 ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400'}`}>
            1. Create Offer
          </div>
          <div className={`flex-1 text-center py-4 font-semibold text-sm transition-colors ${step >= 2 ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400'}`}>
            2. Preview & Review
          </div>
          <div className={`flex-1 text-center py-4 font-semibold text-sm transition-colors ${step === 3 ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400'}`}>
            3. Finish
          </div>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 flex items-center gap-3">
              <span className="font-bold">Error:</span> {error}
            </div>
          )}

          {/* Step 1: Input Form */}
          {step === 1 && (
            <form onSubmit={handleGeneratePreview} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Business Name</label>
                  <input required value={businessName} onChange={e => setBusinessName(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Tony's Pizza" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Business Type</label>
                  <input required value={businessType} onChange={e => setBusinessType(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Italian Restaurant" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Your Special Offer</label>
                <input required value={offer} onChange={e => setOffer(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Buy 1 Large Pizza, Get 1 Small Free!" />
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">QR Code Type</label>
                  <select value={qrType} onChange={e => setQrType(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="url">Website Link</option>
                    <option value="tel">Phone Call</option>
                    <option value="sms">SMS Message</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">QR Destination</label>
                  <input required value={qrValue} onChange={e => setQrValue(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="URL, Phone, or Text" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Extra Info (Optional)</label>
                <textarea value={extraInfo} onChange={e => setExtraInfo(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none h-24" placeholder="Mention specific colors, vibe, or target audience..." />
              </div>
              <button disabled={loading} type="submit" className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-100">
                {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
                {loading ? 'Generating Assets...' : 'Generate Commercial Preview'}
              </button>
            </form>
          )}

          {/* Step 2: Preview & Lead Capture */}
          {step === 2 && preview && (
            <div className="space-y-10 animate-in fade-in duration-500">
              {/* Preview Player Mockup */}
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-900 shadow-2xl group border-4 border-slate-100">
                <img src={preview.imageUrl} alt="Background" className="w-full h-full object-cover opacity-80" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-8">
                  <h2 className="text-4xl font-black text-white leading-tight uppercase tracking-widest drop-shadow-lg">
                    {preview.visualHeadline}
                  </h2>
                  <p className="text-white font-bold mt-2 text-xl">{businessName}</p>
                </div>
                <div className="absolute top-4 right-4 bg-white p-2 rounded-lg shadow-xl w-32 h-32 flex flex-col items-center justify-center">
                  <img src={preview.qrUrl} alt="QR Code" className="w-full h-full" />
                  <span className="text-[8px] font-bold text-slate-800 mt-1 uppercase">Scan Now</span>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <button onClick={() => {
                    const audio = new Audio(preview.audioUrl);
                    audio.play();
                  }} className="p-6 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full text-white transition-all transform hover:scale-110">
                    <PlayCircle size={64} />
                  </button>
                </div>
              </div>

              {/* Script & Voice Preview */}
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                    <CheckCircle className="text-green-500" size={18} />
                    Generated Script
                  </h3>
                  <p className="text-slate-600 leading-relaxed text-sm italic">"{preview.script}"</p>
                </div>
                
                {/* Lead Form */}
                <div className="space-y-4">
                  <h3 className="font-bold text-slate-900 text-xl">Get the High-Res MP4</h3>
                  <p className="text-sm text-slate-600">Enter your details and we'll render the final commercial and upload it to YouTube for you!</p>
                  <form onSubmit={handleRequestFile} className="space-y-3">
                    <div className="relative">
                      <User className="absolute left-3 top-3.5 text-slate-400" size={18} />
                      <input required value={lead.name} onChange={e => setLead({...lead, name: e.target.value})} className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Full Name" />
                    </div>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3.5 text-slate-400" size={18} />
                      <input required type="email" value={lead.email} onChange={e => setLead({...lead, email: e.target.value})} className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Email Address" />
                    </div>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3.5 text-slate-400" size={18} />
                      <input required type="tel" value={lead.phone} onChange={e => setLead({...lead, phone: e.target.value})} className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Phone Number" />
                    </div>
                    <button disabled={loading} type="submit" className="w-full py-4 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all">
                      {loading ? <Loader2 className="animate-spin" /> : <Download size={20} />}
                      {loading ? 'Queueing Render...' : 'Finalize & Upload to YouTube'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Success */}
          {step === 3 && (
            <div className="text-center py-12 animate-in zoom-in duration-500">
              <div className="inline-flex items-center justify-center p-6 bg-green-100 rounded-full text-green-600 mb-6">
                <CheckCircle size={64} />
              </div>
              <h2 className="text-3xl font-black text-slate-900 mb-4">Request Received!</h2>
              <p className="text-slate-600 text-lg max-w-md mx-auto mb-8">
                Your commercial is now being rendered by our AI engines. We'll upload it to YouTube as an unlisted video and send you the link via email.
              </p>
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 text-blue-800 font-semibold mb-8">
                Expect an update in roughly 2-5 minutes.
              </div>
              <button onClick={() => window.location.reload()} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors">
                Start Over
              </button>
            </div>
          )}
        </div>
      </main>

      <footer className="mt-12 text-slate-400 text-sm">
        © 2024 Easy TV Offers. Powered by Gemini & Google Cloud.
      </footer>
    </div>
  );
};

export default App;
