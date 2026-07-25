import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, User, Clock } from 'lucide-react';

export const mockBlogPosts = [
  {
    id: 1,
    slug: 'future-of-ai-in-african-education',
    title: 'The Future of AI in African Education',
    excerpt: 'How artificial intelligence is bridging the educational gap across the continent and providing personalized learning experiences.',
    content: `
      Artificial Intelligence is rapidly transforming how students learn globally, and Africa is not left behind. 
      With tools like EduVista, AI can analyze a student's learning pace, identify weak areas, and generate custom lesson plans. 
      This is particularly revolutionary in areas where classroom sizes are large, making one-on-one attention difficult.
      
      ### Breaking Down Barriers
      One of the biggest advantages of AI is its ability to break down geographical and economic barriers. 
      Students in remote areas can now access the same high-quality tutoring as those in urban centers, powered by intelligent algorithms that adapt to their specific needs.
      
      ### What to Expect Next
      In the coming years, we expect to see more integration of local languages and culturally relevant examples in AI educational models, making learning even more accessible and relatable for African students.
    `,
    author: 'Dr. Amina Yusuf',
    date: 'July 15, 2026',
    readTime: '4 min read',
    category: 'Technology',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: 2,
    slug: 'top-tips-for-waec-success',
    title: 'Top 5 Tips for WAEC Success in 2026',
    excerpt: 'Expert advice from top-rated tutors on how to prepare effectively and ace your upcoming WAEC examinations.',
    content: `
      Preparing for WAEC can be stressful, but with the right strategy, success is within your reach. 
      Here are the top 5 tips recommended by our elite EduVista tutors:
      
      ### 1. Start Early and Plan
      Don't wait until the last minute. Create a study schedule that covers all your subjects, dedicating more time to the ones you find challenging.
      
      ### 2. Practice Past Questions
      Familiarize yourself with the exam format. Past questions give you insight into how questions are framed and help you manage your time during the actual exam.
      
      ### 3. Join a Study Group or Get a Tutor
      Sometimes, explaining concepts to others or having an expert break them down for you is the best way to learn. 
      EduVista connects you with top tutors who specialize in WAEC preparation.
      
      ### 4. Take Care of Your Health
      Get enough sleep, eat well, and stay hydrated. A healthy brain retains information better.
      
      ### 5. Stay Positive
      Believe in yourself. Anxiety can negatively impact your performance, so practice relaxation techniques.
    `,
    author: 'Chinedu Okafor',
    date: 'July 10, 2026',
    readTime: '6 min read',
    category: 'Exam Prep',
    image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: 3,
    slug: 'benefits-of-remote-tutoring',
    title: 'Why Remote Tutoring is the New Gold Standard',
    excerpt: 'Discover why more parents are opting for online tutoring platforms over traditional physical lessons.',
    content: `
      The shift towards remote learning was accelerated by global events, but it has stayed because of its undeniable benefits. 
      Remote tutoring offers flexibility, safety, and access to a wider pool of talent.
      
      ### Unmatched Convenience
      Gone are the days of commuting through heavy traffic to get to a lesson. 
      With online platforms, learning happens in the comfort of your home. This saves time and energy for both the student and the parent.
      
      ### Access to Elite Tutors
      You are no longer limited to the tutors available in your immediate neighborhood. 
      A student in Lagos can be taught by a top-tier mathematics expert based in London or Nairobi.
      
      ### Personalized Pace
      Online environments often allow for recording sessions, which means students can review lessons at their own pace, ensuring they fully grasp complex concepts before moving on.
    `,
    author: 'Sarah Johnson',
    date: 'July 5, 2026',
    readTime: '5 min read',
    category: 'Parenting',
    image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=800&auto=format&fit=crop'
  }
];

const Blog = () => {
  return (
    <div className="min-h-screen bg-brand-cream/30 pt-32 pb-24 font-sans text-brand-charcoal">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-16 animate-fade-in-up">
          <span className="inline-block py-1 px-3 rounded-full bg-brand-clay/10 text-brand-clay font-bold text-xs uppercase tracking-wider mb-4 border border-brand-clay/20">
            EduVista Insights
          </span>
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-brand-moss mb-6 leading-tight">
            Our Latest <span className="text-brand-clay">Thoughts & News</span>
          </h1>
          <p className="text-lg text-brand-charcoal/70 leading-relaxed">
            Discover articles, expert advice, and the latest trends in African education, remote tutoring, and student success.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {mockBlogPosts.map((post, index) => (
            <div 
              key={post.id} 
              className="bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-brand-moss/5 flex flex-col group animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <Link to={`/blog/${post.slug}`} className="relative block overflow-hidden aspect-[4/3]">
                <div className="absolute inset-0 bg-brand-moss/20 group-hover:bg-transparent transition-colors duration-500 z-10" />
                <img 
                  src={post.image} 
                  alt={post.title} 
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute top-4 left-4 z-20">
                  <span className="bg-white/90 backdrop-blur-sm text-brand-moss px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">
                    {post.category}
                  </span>
                </div>
              </Link>
              
              <div className="p-6 flex flex-col flex-grow">
                <div className="flex items-center gap-4 text-[11px] font-mono uppercase tracking-widest text-brand-charcoal/50 mb-4">
                  <span className="flex items-center gap-1"><Calendar size={12} /> {post.date}</span>
                  <span className="flex items-center gap-1"><Clock size={12} /> {post.readTime}</span>
                </div>
                
                <h3 className="text-xl font-heading font-bold text-brand-moss mb-3 group-hover:text-brand-clay transition-colors line-clamp-2">
                  <Link to={`/blog/${post.slug}`}>{post.title}</Link>
                </h3>
                
                <p className="text-sm text-brand-charcoal/70 mb-6 line-clamp-3 leading-relaxed flex-grow">
                  {post.excerpt}
                </p>
                
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-brand-moss/5">
                  <div className="flex items-center gap-2 text-xs font-bold text-brand-moss">
                    <div className="w-6 h-6 rounded-full bg-brand-cream flex items-center justify-center text-brand-clay">
                      <User size={12} />
                    </div>
                    {post.author}
                  </div>
                  <Link 
                    to={`/blog/${post.slug}`}
                    className="flex items-center gap-1 text-xs font-bold text-brand-clay hover:text-brand-moss transition-colors uppercase tracking-wider"
                  >
                    Read <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default Blog;
