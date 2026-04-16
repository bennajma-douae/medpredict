import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Stethoscope, BrainCircuit, Calendar, ShieldCheck, 
  MessageCircle, Phone, Mail, ArrowRight, Globe, 
  Users, Cpu, CheckCircle, HeartPulse, Microscope, 
  ChevronRight, Database, Activity, Lock, Shield, 
  Zap, ClipboardList, Info
} from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen selection:bg-blue-500/30">
      {/* EFFETS DE LUMIÈRE D'ARRIÈRE-PLAN */}
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full z-0 pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full z-0 pointer-events-none"></div>

      {/* NAVBAR */}
      <nav className="fixed top-0 w-full bg-med-dark/80 backdrop-blur-md border-b border-white/5 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg text-white shadow-lg shadow-blue-500/30">
              <Stethoscope size={20} />
            </div>
            <span className="text-lg font-black tracking-tighter text-white uppercase italic">MedPredict</span>
          </div>

          <div className="hidden lg:flex items-center gap-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            <a href="#services" className="hover:text-white transition">Services</a>
            <a href="#ia" className="hover:text-white transition">Intelligence</a>
            <a href="#securite" className="hover:text-white transition">Sécurité</a>
            <a href="#etapes" className="hover:text-white transition">Parcours</a>
          </div>

          <div className="flex items-center gap-4">
            {/* Bouton Espace Patient dans la navbar */}
            <button 
              onClick={() => navigate('/patient')} 
              className="px-5 py-2 text-teal-400 hover:text-teal-300 font-bold text-xs uppercase tracking-widest border border-teal-500/30 hover:border-teal-500 rounded-xl transition-all hidden lg:block"
            >
              Espace Patient
            </button>

            <button 
              onClick={() => navigate('/connexion')} 
              className="bg-blue-600 text-white px-5 py-2 rounded-xl font-bold text-xs hover:bg-blue-500 transition-all"
            >
              Connexion Staff
            </button>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative pt-40 pb-20 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-md text-blue-400 text-[10px] font-bold uppercase mb-6">
              <Zap size={14} /> Logiciel Médical de Nouvelle Génération
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-white leading-tight mb-6">
              L'intelligence au coeur <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 italic">de votre pratique.</span>
            </h1>
            <p className="text-slate-400 text-lg max-w-lg mb-10 leading-relaxed font-medium">
              MedPredict n'est pas qu'un outil de gestion. C'est un assistant intelligent qui centralise vos dossiers et sécurise vos diagnostics.
            </p>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/connexion')} 
                className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] transition-all"
              >
                Démarrer l'expérience (Staff)
              </button>
            </div>
          </div>

          {/* Image + widgets flottants (inchangé) */}
          <div className="relative flex justify-center items-center h-[450px]">
            <div className="relative z-10 w-full max-w-md animate-float">
              <div className="absolute -inset-4 bg-blue-600/20 blur-3xl rounded-full"></div>
              <img 
                src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=1000" 
                className="rounded-[32px] border border-white/10 shadow-2xl relative" 
                alt="Medical Tech" 
              />
            </div>
            <div className="absolute top-0 right-0 glass p-4 rounded-2xl animate-float shadow-2xl border-blue-500/30" style={{ animationDelay: '1s' }}>
               <Activity className="text-blue-500 mb-2" size={24} />
               <p className="text-[10px] font-bold text-slate-400 uppercase">IA Précision</p>
               <p className="text-lg font-black text-white">94.2%</p>
            </div>
            <div className="absolute bottom-10 -left-10 glass p-4 rounded-2xl animate-float shadow-2xl border-indigo-500/30" style={{ animationDelay: '2s' }}>
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600/20 rounded-lg flex items-center justify-center text-indigo-400"><Users size={20}/></div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Patient</p>
                    <p className="text-xs font-bold text-white">Dossier #0842</p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* BANDEAU PATIENT - Très visible */}
      <section className="py-8 px-6 border-y border-teal-500/20 bg-gradient-to-r from-teal-950 to-transparent">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 bg-teal-500/10 rounded-2xl flex items-center justify-center text-teal-400 flex-shrink-0">
              <HeartPulse size={28} />
            </div>
            <div>
              <p className="text-white font-bold text-lg">Vous êtes un patient ?</p>
              <p className="text-slate-400 text-sm">Accédez à votre espace personnel pour prendre rendez-vous et suivre votre dossier médical.</p>
            </div>
          </div>

          <button
            onClick={() => navigate('/patient')}
            className="flex items-center gap-3 bg-teal-600 hover:bg-teal-500 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-lg shadow-teal-900/30 whitespace-nowrap"
          >
            Accéder à mon espace patient 
            <ChevronRight size={18} />
          </button>
        </div>
      </section>
      {/* ═══════════════════════════════════════════════════════ */}

      {/* SÉCURITÉ & CONFIANCE (Pillier Réel) */}
      <section id="securite" className="py-20 bg-slate-900/40 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-12">
          <div className="flex flex-col items-center text-center group">
            <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500 mb-6 group-hover:bg-blue-600 group-hover:text-white transition-all">
              <Lock size={32} />
            </div>
            <h3 className="text-white font-bold mb-2">Données Chiffrées</h3>
            <p className="text-slate-500 text-sm">Chiffrement AES-256 de bout en bout pour chaque dossier médical.</p>
          </div>
          <div className="flex flex-col items-center text-center group">
            <div className="w-16 h-16 bg-indigo-600/10 rounded-2xl flex items-center justify-center text-indigo-500 mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-all">
              <Shield size={32} />
            </div>
            <h3 className="text-white font-bold mb-2">Conformité CNDP</h3>
            <p className="text-slate-500 text-sm">Hébergement local au Maroc respectant les normes de confidentialité.</p>
          </div>
          <div className="flex flex-col items-center text-center group">
            <div className="w-16 h-16 bg-cyan-600/10 rounded-2xl flex items-center justify-center text-cyan-500 mb-6 group-hover:bg-cyan-600 group-hover:text-white transition-all">
              <Database size={32} />
            </div>
            <h3 className="text-white font-bold mb-2">Zéro Papier</h3>
            <p className="text-slate-500 text-sm">Archivage numérique sécurisé avec sauvegardes automatiques quotidiennes.</p>
          </div>
        </div>
      </section>

      {/* SERVICES DÉTAILLÉS */}
      <section id="services" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-4xl font-black text-white mb-4 italic">Services Intégrés.</h2>
          <p className="text-slate-500 text-sm uppercase tracking-widest font-bold">Le futur de la gestion médicale</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            { i: Users, t: "Gestion de Dossiers", d: "Historique médical complet, allergies et antécédents." },
            { i: Calendar, t: "Agenda & RDV", d: "Calendrier interactif avec notifications WhatsApp automatiques." },
            { i: BrainCircuit, t: "Moteur IA", d: "Analyse des symptômes pour suggérer des pathologies probables." },
            { i: HeartPulse, t: "Examens Cliniques", d: "Saisie rapide des observations et constantes du patient." },
            { i: ClipboardList, t: "Ordonnances", d: "Génération de PDF professionnels en moins de 10 secondes." },
            { i: Activity, t: "Analytique", d: "Visualisez les performances de votre cabinet en temps réel." }
          ].map((s, idx) => (
            <div key={idx} className="glass p-8 rounded-3xl hover:border-blue-500 transition-colors group">
              <s.i className="text-blue-500 mb-6 group-hover:scale-110 transition-transform" size={28} />
              <h3 className="text-white font-bold text-lg mb-3">{s.t}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PARCOURS / ÉTAPES (Comment ça marche) */}
      <section id="etapes" className="py-24 bg-slate-900/20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-center text-3xl font-black text-white mb-16 uppercase tracking-widest italic">Le Parcours MedPredict</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { n: "01", t: "Accueil", d: "Enregistrement rapide du patient à l'accueil." },
              { n: "02", t: "Consultation", d: "Saisie des symptômes via tags intelligents." },
              { n: "03", t: "Assistance IA", d: "L'IA propose les diagnostics possibles." },
              { n: "04", t: "Finalisation", d: "Édition de l'ordonnance et suivi patient." }
            ].map((step, i) => (
              <div key={i} className="relative group">
                <span className="text-7xl font-black text-white/5 absolute -top-12 left-0 transition-colors group-hover:text-blue-600/10">{step.n}</span>
                <div className="relative pt-4">
                  <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                    <CheckCircle className="text-blue-500" size={16} /> {step.t}
                  </h4>
                  <p className="text-slate-500 text-xs leading-relaxed">{step.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION CONTACT & WHATSAPP */}
      <section id="contact" className="py-32 px-6 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <div>
            <h2 className="text-5xl font-black text-white mb-8 tracking-tighter italic leading-tight">Prêt à transformer <br/>votre cabinet ?</h2>
            <div className="space-y-6">
              <div className="flex items-center gap-6 group">
                <div className="w-14 h-14 glass rounded-2xl flex items-center justify-center text-green-500 shadow-xl group-hover:bg-green-500 group-hover:text-white transition-all">
                   <MessageCircle size={28}/>
                </div>
                <div><p className="text-slate-500 text-[10px] font-black uppercase">WhatsApp Direct</p><p className="text-white font-bold text-lg">+212 6 61 00 00 00</p></div>
              </div>
              <div className="flex items-center gap-6 group">
                <div className="w-14 h-14 glass rounded-2xl flex items-center justify-center text-blue-500 shadow-xl group-hover:bg-blue-600 group-hover:text-white transition-all">
                   <Mail size={28}/>
                </div>
                <div><p className="text-slate-500 text-[10px] font-black uppercase">Support Email</p><p className="text-white font-bold text-lg">contact@medpredict.ma</p></div>
              </div>
            </div>
          </div>

          <form className="glass p-10 rounded-[40px] space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <input type="text" placeholder="Prénom" className="w-full bg-white/5 border border-white/5 p-4 rounded-xl focus:border-blue-500 outline-none text-white transition text-sm" />
              <input type="text" placeholder="Spécialité" className="w-full bg-white/5 border border-white/5 p-4 rounded-xl focus:border-blue-500 outline-none text-white transition text-sm" />
            </div>
            <input type="email" placeholder="Email professionnel" className="w-full bg-white/5 border border-white/5 p-4 rounded-xl focus:border-blue-500 outline-none text-white transition text-sm" />
            <textarea placeholder="Comment pouvons-nous vous aider ?" rows="4" className="w-full bg-white/5 border border-white/5 p-4 rounded-xl focus:border-blue-500 outline-none text-white transition text-sm"></textarea>
            <button className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-all">
              Envoyer la demande
            </button>
          </form>
        </div>
      </section>

      {/* FOOTER RAFFINÉ */}
      <footer className="py-16 border-t border-white/5 text-center">
        <div className="flex items-center justify-center gap-2 mb-6 opacity-60">
          <Stethoscope className="text-blue-600" size={20} />
          <span className="text-xl font-black text-white tracking-tighter uppercase italic">MedPredict</span>
        </div>
        <p className="text-slate-600 text-[10px] font-bold uppercase tracking-[0.4em] mb-4">Innovation Médicale Digitale • 2025</p>
        <div className="flex justify-center gap-8 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
           <a href="#" className="hover:text-blue-500 transition">Confidentialité</a>
           <a href="#" className="hover:text-blue-500 transition">Sécurité</a>
           <a href="#" className="hover:text-blue-500 transition">Maroc</a>
        </div>
      </footer>
    </div>
  );
};

export default Home;
