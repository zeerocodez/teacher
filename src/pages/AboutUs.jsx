import React, { useEffect } from 'react';
import { Target, Users, BookOpen, ShieldCheck } from 'lucide-react';

export default function AboutUs() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="bg-brand-cream min-h-screen pt-24 pb-16 px-6 font-sans">
      <div className="max-w-5xl mx-auto space-y-16">
        
        {/* Header Section */}
        <div className="text-center space-y-6 mt-8">
          <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl text-brand-moss font-bold leading-tight">
            Empowering the Next Generation <br className="hidden md:block"/> of African Learners
          </h1>
          <p className="text-brand-charcoal/70 max-w-2xl mx-auto text-lg leading-relaxed">
            EduVista Africa bridges the gap between ambitious students and world-class educators. 
            We are building a robust ecosystem where learning is accessible, personalized, and deeply impactful.
          </p>
        </div>

        {/* Vision & Mission Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-[2rem] border border-brand-moss/10 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-brand-clay/10 rounded-2xl flex items-center justify-center mb-6">
              <Target className="w-6 h-6 text-brand-clay" />
            </div>
            <h3 className="font-heading text-2xl font-bold text-brand-moss mb-4">Our Mission</h3>
            <p className="text-brand-charcoal/70 leading-relaxed">
              To democratize access to premium education across Africa by connecting passionate, certified educators with students who are eager to excel in local and global curricula.
            </p>
          </div>
          <div className="bg-white p-8 rounded-[2rem] border border-brand-moss/10 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-brand-moss/10 rounded-2xl flex items-center justify-center mb-6">
              <BookOpen className="w-6 h-6 text-brand-moss" />
            </div>
            <h3 className="font-heading text-2xl font-bold text-brand-moss mb-4">Our Vision</h3>
            <p className="text-brand-charcoal/70 leading-relaxed">
              A continent where every child, regardless of location, has the tools, mentorship, and guidance to achieve global academic excellence and build a brighter future.
            </p>
          </div>
        </div>

        {/* Why Choose Us */}
        <div className="bg-brand-charcoal text-brand-cream p-10 md:p-16 rounded-[3rem] relative overflow-hidden">
          <div className="absolute inset-0 bg-noise opacity-5 pointer-events-none" />
          <div className="relative z-10 space-y-12">
            <div className="text-center">
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-4">Why Choose EduVista?</h2>
              <p className="text-brand-cream/70 max-w-xl mx-auto">We don't just find tutors; we cultivate educational experiences.</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-full bg-brand-clay flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-heading font-bold text-lg text-white mb-2">Vetted Professionals</h4>
                  <p className="text-brand-cream/60 text-sm leading-relaxed">
                    Every tutor goes through our rigorous Elite Teachers Academy to ensure they meet global pedagogical standards.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-full bg-brand-clay flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-heading font-bold text-lg text-white mb-2">Personalized Matchmaking</h4>
                  <p className="text-brand-cream/60 text-sm leading-relaxed">
                    We pair students with educators whose teaching style and expertise perfectly align with the student's unique needs.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
