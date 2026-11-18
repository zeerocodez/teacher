import React from 'react';
import { X, ShieldCheck, CheckCircle2, UserCheck, GraduationCap, Home, Video } from 'lucide-react';

export default function TrustShieldModal({ isOpen, onClose, tutor }) {
  if (!isOpen || !tutor) return null;

  const trustTiers = [
    {
      icon: UserCheck,
      title: "Government ID & NIN Verification",
      status: "Verified ✓",
      desc: "Identity verified against the Nigerian National Identity Management Commission (NIMC) or international passport with biometric face-match."
    },
    {
      icon: GraduationCap,
      title: "Academic Degrees & Certifications",
      status: "Audited ✓",
      desc: "University transcripts, B.Sc / B.Ed certificates, and teaching credentials have been independently checked by EduVista administrators."
    },
    {
      icon: Home,
      title: "Home Lesson Clearance & Guarantor",
      status: "Cleared ✓",
      desc: "Physical residential address confirmed along with 2 verified professional/community guarantors for child safety in in-person home tutoring."
    },
    {
      icon: Video,
      title: "Pedagogy & Teaching Audition",
      status: "Passed ✓",
      desc: "Assessed for clarity of communication, patience, curriculum mastery (WAEC, British, American), and engagement style."
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-brand-charcoal/60 backdrop-blur-xs" onClick={onClose} />

      <div className="relative bg-brand-cream border border-brand-moss/10 rounded-[2.5rem] w-full max-w-md p-6 sm:p-8 shadow-2xl z-10 font-sans text-xs animate-fade-up">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-brand-moss/10 text-brand-charcoal transition-colors z-20 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-emerald-200 shadow-xs">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <span className="font-mono text-2xs uppercase tracking-widest text-brand-clay font-bold block mb-1">
            EduVista Vetting Standard
          </span>
          <h3 className="font-heading font-extrabold text-xl text-brand-moss">
            {tutor.name}'s Trust Shield
          </h3>
          <p className="text-[11px] text-brand-charcoal/65 mt-1">
            Every tutor on EduVista undergoes our 4-tier security audit before tutoring students.
          </p>
        </div>

        <div className="space-y-3">
          {trustTiers.map((tier, idx) => {
            const Icon = tier.icon;
            return (
              <div key={idx} className="bg-white border border-brand-moss/10 rounded-2xl p-3.5 space-y-1 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="font-heading font-bold text-xs text-brand-moss">{tier.title}</span>
                  </div>
                  <span className="font-mono text-[9px] uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                    {tier.status}
                  </span>
                </div>
                <p className="text-[10px] text-brand-charcoal/70 leading-relaxed pl-8">
                  {tier.desc}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-6 pt-4 border-t border-brand-moss/10 text-center">
          <p className="text-[10px] font-mono text-brand-charcoal/60 mb-3">
            🔒 100% Escrow Protection: Tutors are only paid after verified classes.
          </p>
          <button
            onClick={onClose}
            className="w-full py-3 bg-brand-moss hover:bg-brand-moss/90 text-white rounded-full font-heading font-bold text-xs uppercase tracking-wider shadow-sm cursor-pointer transition-all"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}
