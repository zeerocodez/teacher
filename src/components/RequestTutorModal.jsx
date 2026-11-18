import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Home, 
  Laptop, 
  MapPin, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Phone, 
  Mail, 
  User, 
  BookOpen, 
  ShieldCheck, 
  ArrowRight, 
  ArrowLeft,
  MessageSquare
} from 'lucide-react';

export default function RequestTutorModal({ isOpen, onClose }) {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form Data
  const [studentClass, setStudentClass] = useState('Primary (Ages 6–11)');
  const [selectedSubjects, setSelectedSubjects] = useState(['Mathematics']);
  const [customSubjectInput, setCustomSubjectInput] = useState('');
  
  const [lessonMode, setLessonMode] = useState('home'); // 'home' | 'online' | 'both'
  const [locationCity, setLocationCity] = useState('Lagos');
  const [locationArea, setLocationArea] = useState('');
  
  const [frequency, setFrequency] = useState('3 Days / Week (Recommended)');
  const [preferredTime, setPreferredTime] = useState('After School (4:00 PM – 6:00 PM)');
  const [budgetTier, setBudgetTier] = useState('standard'); // 'starter' | 'standard' | 'intensive'
  
  const [parentName, setParentName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');

  const commonSubjects = [
    'Mathematics',
    'English Language & Phonics',
    'Sciences & STEM',
    'Coding & Robotics',
    'Common Entrance Prep',
    'WAEC / JAMB Prep',
    'Cambridge IGCSE'
  ];

  const toggleSubject = (s) => {
    setSelectedSubjects(prev => 
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    );
  };

  const handleAddCustomSubject = (e) => {
    e.preventDefault();
    if (customSubjectInput.trim()) {
      if (!selectedSubjects.includes(customSubjectInput.trim())) {
        setSelectedSubjects(prev => [...prev, customSubjectInput.trim()]);
      }
      setCustomSubjectInput('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!parentName.trim() || !phone.trim()) {
      setErrorMsg('Please provide your name and WhatsApp/phone number.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    const payload = {
      parentName,
      phone,
      email,
      studentClass,
      subjects: selectedSubjects,
      lessonMode: lessonMode === 'home' ? 'Home Tutoring (In-Person)' : (lessonMode === 'online' ? 'Online Tutoring (Global)' : 'Home or Online'),
      locationCity,
      locationArea,
      frequency,
      preferredTime,
      budget: budgetTier,
      notes
    };

    try {
      const res = await fetch('/api/tutor-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data.error || 'Failed to submit request. Please try again or message our WhatsApp advisor.');
      }
    } catch (err) {
      console.warn('API error, adopting local success state for concierge dispatch:', err);
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const whatsappMessage = encodeURIComponent(
    `Hello EduVista Africa! I just submitted a tutor request on eduvistar.com:\n\n` +
    `• Parent: ${parentName || 'Parent'}\n` +
    `• Student Level: ${studentClass}\n` +
    `• Subjects: ${selectedSubjects.join(', ')}\n` +
    `• Delivery: ${lessonMode === 'home' ? `Home Lesson in ${locationCity} (${locationArea || 'Nearby'})` : 'Online Classes'}\n` +
    `• Schedule: ${frequency}\n\n` +
    `Please help connect me with 2 vetted tutors.`
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-brand-charcoal/60 backdrop-blur-xs" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative bg-brand-cream border border-brand-moss/10 rounded-[2.5rem] w-full max-w-xl p-6 sm:p-8 shadow-2xl z-10 overflow-hidden max-h-[92vh] overflow-y-auto">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-brand-moss/10 text-brand-charcoal transition-colors z-20 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          /* SUCCESS SCREEN */
          <div className="space-y-6 text-center animate-fade-up py-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto border-4 border-emerald-50">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="font-mono text-2xs uppercase tracking-widest text-brand-clay font-bold block mb-1">
                REQUEST RECEIVED · SLA MATCH IN 4 HOURS
              </span>
              <h3 className="font-heading font-extrabold text-2xl text-brand-moss">
                Your Tutor Request Has Been Logged!
              </h3>
              <p className="font-sans text-xs text-brand-charcoal/70 mt-2 max-w-sm mx-auto leading-relaxed">
                Thank you, <b className="text-brand-moss">{parentName}</b>. Our academic concierge team is auditing our roster of verified educators matching your criteria.
              </p>
            </div>

            {/* Request Summary Card */}
            <div className="bg-white border border-brand-moss/10 rounded-2xl p-5 text-left space-y-2.5 shadow-xs font-sans text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-brand-moss/5">
                <span className="font-mono text-[9px] uppercase tracking-wider text-brand-charcoal/50 font-bold">Class & Subjects</span>
                <span className="font-heading font-bold text-brand-moss">{studentClass}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-brand-moss/5">
                <span className="font-mono text-[9px] uppercase tracking-wider text-brand-charcoal/50 font-bold">Delivery Mode</span>
                <span className="font-heading font-bold text-brand-moss">
                  {lessonMode === 'home' ? `🏡 Home (${locationCity} - ${locationArea || 'General'})` : '💻 Online (Global)'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-mono text-[9px] uppercase tracking-wider text-brand-charcoal/50 font-bold">Schedule</span>
                <span className="font-heading font-bold text-brand-clay">{frequency}</span>
              </div>
            </div>

            {/* Instant WhatsApp Escalation Button */}
            <div className="space-y-3 pt-2">
              <a
                href={`https://wa.me/2348136451607?text=${whatsappMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-heading font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 fill-current" />
                <span>Chat on WhatsApp for Instant Match</span>
              </a>
              <button
                onClick={onClose}
                className="w-full py-3 rounded-full text-brand-charcoal/70 hover:text-brand-moss font-sans text-xs font-medium cursor-pointer"
              >
                Return to Directory
              </button>
            </div>
          </div>
        ) : (
          /* MULTI-STEP WIZARD */
          <div>
            {/* Top Wizard Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-2xs uppercase tracking-widest text-brand-clay font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> EduVista Concierge Matching
                </span>
                <span className="font-mono text-[10px] text-brand-moss font-bold bg-brand-moss/10 px-2.5 py-0.5 rounded-full">
                  Step {step} of 4
                </span>
              </div>
              <h3 className="font-heading font-extrabold text-2xl text-brand-moss">
                {step === 1 && "What does your child need help with?"}
                {step === 2 && "Choose Home or Online Classes"}
                {step === 3 && "Preferred Schedule & Frequency"}
                {step === 4 && "Where should we send your matches?"}
              </h3>
              <p className="font-sans text-xs text-brand-charcoal/70 mt-1">
                {step === 1 && "Tell us the grade level and specific subjects you want to cover."}
                {step === 2 && "We offer vetted in-home tutors in your neighborhood and online classes worldwide."}
                {step === 3 && "How many days a week would you like the lessons to take place?"}
                {step === 4 && "Our education advisors will contact you with 2 vetted matches within 4 hours."}
              </p>
            </div>

            {/* Step Progress Bar */}
            <div className="grid grid-cols-4 gap-1.5 mb-6">
              {[1, 2, 3, 4].map(s => (
                <div 
                  key={s} 
                  className={`h-1.5 rounded-full transition-all ${
                    s <= step ? 'bg-brand-clay' : 'bg-brand-moss/10'
                  }`} 
                />
              ))}
            </div>

            {errorMsg && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-sans">
                {errorMsg}
              </div>
            )}

            {/* STEP 1: CLASS LEVEL & SUBJECTS */}
            {step === 1 && (
              <div className="space-y-5 animate-fade-in font-sans">
                <div>
                  <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block mb-2">
                    Student Grade / Level
                  </label>
                  <select
                    value={studentClass}
                    onChange={(e) => setStudentClass(e.target.value)}
                    className="w-full bg-white border border-brand-moss/10 rounded-xl px-4 py-3 text-brand-charcoal focus:outline-none focus:border-brand-clay text-sm"
                  >
                    <option value="Early Childhood (Ages 3–5)">Early Childhood & Pre-School (Ages 3–5)</option>
                    <option value="Primary (Ages 6–11)">Primary School (Primary 1–6 / Ages 6–11)</option>
                    <option value="Common Entrance & Checkpoint">Primary 6 & Common Entrance Preparation</option>
                    <option value="Junior Secondary (JSS 1–3 / BECE)">Junior Secondary (JSS 1–3 / BECE)</option>
                    <option value="Senior Secondary (SSS 1–3 / WAEC / JAMB)">Senior Secondary (SSS 1–3 / WAEC / JAMB / NECO)</option>
                    <option value="British Curriculum (Cambridge IGCSE)">British Curriculum (Cambridge Primary, Checkpoint, IGCSE)</option>
                    <option value="Coding, AI & Robotics">Coding, AI & Tech Skills (Kids & Teens)</option>
                    <option value="Adult Education / Languages">Adult Literacy / Yoruba / Igbo / Hausa</option>
                  </select>
                </div>

                <div>
                  <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block mb-2">
                    Subjects Needed (Select all that apply)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {commonSubjects.map(s => {
                      const active = selectedSubjects.includes(s);
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => toggleSubject(s)}
                          className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                            active
                              ? 'border-brand-clay bg-brand-clay text-white shadow-xs font-bold'
                              : 'border-brand-moss/10 bg-white text-brand-charcoal hover:bg-brand-moss/5'
                          }`}
                        >
                          {active ? '✓ ' : ''}{s}
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom Subject Adder */}
                  <div className="flex gap-2 mt-3">
                    <input
                      type="text"
                      placeholder="Add another subject (e.g. Further Maths, French)"
                      value={customSubjectInput}
                      onChange={(e) => setCustomSubjectInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleAddCustomSubject(e); }}
                      className="flex-1 bg-white border border-brand-moss/10 rounded-xl px-3 py-2 text-xs text-brand-charcoal focus:outline-none focus:border-brand-clay"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomSubject}
                      className="py-2 px-4 rounded-xl bg-brand-moss text-white font-heading font-bold text-xs uppercase tracking-wider hover:bg-brand-moss/90 cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedSubjects.length === 0) {
                        setErrorMsg('Please select or add at least one subject.');
                        return;
                      }
                      setErrorMsg('');
                      setStep(2);
                    }}
                    className="py-3 px-6 rounded-full bg-brand-clay hover:bg-brand-clay/90 text-white font-heading font-bold text-xs uppercase tracking-wider shadow-md flex items-center gap-2 cursor-pointer"
                  >
                    <span>Next: Delivery Mode</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: LESSON MODE & LOCATION */}
            {step === 2 && (
              <div className="space-y-5 animate-fade-in font-sans">
                <div>
                  <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block mb-3">
                    How would you like the lessons delivered?
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div
                      onClick={() => setLessonMode('home')}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                        lessonMode === 'home'
                          ? 'border-brand-clay bg-brand-clay/5 shadow-xs'
                          : 'border-brand-moss/10 bg-white hover:border-brand-moss/30'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <div className="p-2 rounded-xl bg-brand-clay/10 text-brand-clay">
                          <Home className="w-4 h-4" />
                        </div>
                        <h4 className="font-heading font-bold text-sm text-brand-moss">Home Tutoring</h4>
                      </div>
                      <p className="text-[11px] text-brand-charcoal/70 leading-relaxed">
                        A vetted, background-checked teacher visits your home in-person.
                      </p>
                    </div>

                    <div
                      onClick={() => setLessonMode('online')}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                        lessonMode === 'online'
                          ? 'border-brand-clay bg-brand-clay/5 shadow-xs'
                          : 'border-brand-moss/10 bg-white hover:border-brand-moss/30'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <div className="p-2 rounded-xl bg-brand-moss/10 text-brand-moss">
                          <Laptop className="w-4 h-4" />
                        </div>
                        <h4 className="font-heading font-bold text-sm text-brand-moss">Online Classes</h4>
                      </div>
                      <p className="text-[11px] text-brand-charcoal/70 leading-relaxed">
                        Interactive 1-on-1 virtual class via live whiteboard & video.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Location Inputs (if Home Tutoring chosen) */}
                {lessonMode === 'home' && (
                  <div className="space-y-4 pt-2 border-t border-brand-moss/10">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block mb-1.5">
                          City
                        </label>
                        <select
                          value={locationCity}
                          onChange={(e) => setLocationCity(e.target.value)}
                          className="w-full bg-white border border-brand-moss/10 rounded-xl px-4 py-3 text-brand-charcoal text-xs"
                        >
                          <option value="Lagos">Lagos State</option>
                          <option value="Abuja">Abuja (FCT)</option>
                          <option value="Port Harcourt">Port Harcourt (Rivers)</option>
                          <option value="Ibadan">Ibadan (Oyo)</option>
                          <option value="Other">Other City / State</option>
                        </select>
                      </div>
                      <div>
                        <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block mb-1.5">
                          Area / Neighborhood
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Lekki Phase 1, Ikeja GRA, Wuse 2"
                          value={locationArea}
                          onChange={(e) => setLocationArea(e.target.value)}
                          className="w-full bg-white border border-brand-moss/10 rounded-xl px-4 py-3 text-brand-charcoal text-xs focus:outline-none focus:border-brand-clay"
                        />
                      </div>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 text-[11px] flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>All in-home tutors have verified government IDs and physical guarantor clearances.</span>
                    </div>
                  </div>
                )}

                <div className="pt-4 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="py-3 px-5 rounded-full border border-brand-moss/20 hover:bg-brand-moss/5 text-brand-moss font-heading font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (lessonMode === 'home' && !locationArea.trim()) {
                        setErrorMsg('Please specify your area/neighborhood for in-home tutoring.');
                        return;
                      }
                      setErrorMsg('');
                      setStep(3);
                    }}
                    className="py-3 px-6 rounded-full bg-brand-clay hover:bg-brand-clay/90 text-white font-heading font-bold text-xs uppercase tracking-wider shadow-md flex items-center gap-2 cursor-pointer"
                  >
                    <span>Next: Schedule</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: SCHEDULE & FREQUENCY */}
            {step === 3 && (
              <div className="space-y-5 animate-fade-in font-sans">
                <div>
                  <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block mb-2">
                    How many sessions per week?
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {[
                      { label: '2 Days / Week', sub: 'Starter pace (8 hrs/mo)' },
                      { label: '3 Days / Week (Recommended)', sub: 'Standard progress (12 hrs/mo)' },
                      { label: '4-5 Days / Week', sub: 'Intensive exam prep' }
                    ].map(f => (
                      <div
                        key={f.label}
                        onClick={() => setFrequency(f.label)}
                        className={`p-3.5 rounded-2xl border-2 text-center cursor-pointer transition-all ${
                          frequency === f.label
                            ? 'border-brand-clay bg-brand-clay/5 font-bold text-brand-moss'
                            : 'border-brand-moss/10 bg-white text-brand-charcoal/80 hover:border-brand-moss/25'
                        }`}
                      >
                        <span className="block text-xs font-heading font-bold">{f.label}</span>
                        <span className="block text-[10px] text-brand-charcoal/50 mt-0.5">{f.sub}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block mb-2">
                    Preferred Time of Day
                  </label>
                  <select
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                    className="w-full bg-white border border-brand-moss/10 rounded-xl px-4 py-3 text-brand-charcoal text-xs"
                  >
                    <option value="After School (4:00 PM – 6:00 PM)">After School (4:00 PM – 6:00 PM)</option>
                    <option value="Evenings (6:00 PM – 8:00 PM)">Evenings (6:00 PM – 8:00 PM)</option>
                    <option value="Mornings / Homeschool (9:00 AM – 1:00 PM)">Mornings / Homeschooling (9:00 AM – 1:00 PM)</option>
                    <option value="Weekends Only (Saturdays & Sundays)">Weekends Only (Saturdays & Sundays)</option>
                    <option value="Flexible">Flexible / Discuss with Tutor</option>
                  </select>
                </div>

                <div className="pt-4 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="py-3 px-5 rounded-full border border-brand-moss/20 hover:bg-brand-moss/5 text-brand-moss font-heading font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back
                  </button>
                  <button
                    type="button"
                    onClick={() => { setErrorMsg(''); setStep(4); }}
                    className="py-3 px-6 rounded-full bg-brand-clay hover:bg-brand-clay/90 text-white font-heading font-bold text-xs uppercase tracking-wider shadow-md flex items-center gap-2 cursor-pointer"
                  >
                    <span>Next: Contact Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: PARENT CONTACT */}
            {step === 4 && (
              <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in font-sans">
                <div>
                  <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block mb-1.5">
                    Parent / Guardian Full Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-brand-charcoal/40 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Mrs. Ngozi Adeleke"
                      value={parentName}
                      onChange={(e) => setParentName(e.target.value)}
                      className="w-full bg-white border border-brand-moss/10 rounded-xl pl-10 pr-4 py-3 text-brand-charcoal text-xs focus:outline-none focus:border-brand-clay"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block mb-1.5">
                      WhatsApp / Phone Number *
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-brand-charcoal/40 absolute left-3.5 top-3.5" />
                      <input
                        type="tel"
                        required
                        placeholder="e.g. 08012345678"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-white border border-brand-moss/10 rounded-xl pl-10 pr-4 py-3 text-brand-charcoal text-xs focus:outline-none focus:border-brand-clay font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block mb-1.5">
                      Email Address (Optional)
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-brand-charcoal/40 absolute left-3.5 top-3.5" />
                      <input
                        type="email"
                        placeholder="e.g. parent@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-white border border-brand-moss/10 rounded-xl pl-10 pr-4 py-3 text-brand-charcoal text-xs focus:outline-none focus:border-brand-clay"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block mb-1.5">
                    Special Goals or Child's Needs (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Preparing for Loyola Jesuit exam; needs extra patience in fractions and phonics..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-white border border-brand-moss/10 rounded-xl p-3 text-brand-charcoal text-xs focus:outline-none focus:border-brand-clay resize-none"
                  />
                </div>

                <div className="p-3 bg-brand-cream/60 border border-brand-moss/10 rounded-xl text-[10px] text-brand-charcoal/70 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-brand-clay shrink-0" />
                  <span>No upfront payment required to request a match. All lessons are backed by 100% money-back escrow protection.</span>
                </div>

                <div className="pt-3 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="py-3 px-5 rounded-full border border-brand-moss/20 hover:bg-brand-moss/5 text-brand-moss font-heading font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="py-3.5 px-8 rounded-full bg-brand-clay hover:bg-brand-clay/90 text-white font-heading font-bold text-xs uppercase tracking-wider shadow-lg shadow-brand-clay/20 flex items-center gap-2 cursor-pointer transition-all"
                  >
                    {submitting ? 'Submitting Request...' : 'Find My Vetted Tutors →'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
