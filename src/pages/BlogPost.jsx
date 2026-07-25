import React from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { ArrowLeft, Calendar, User, Clock, Share2, Link as LinkIcon, MessageCircle } from 'lucide-react';
import { mockBlogPosts } from './Blog';

const BlogPost = () => {
  const { slug } = useParams();
  const post = mockBlogPosts.find(p => p.slug === slug);

  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  // Very simple markdown-to-html for paragraphs and headings
  const renderContent = (content) => {
    return content.split('\n\n').map((block, idx) => {
      const text = block.trim();
      if (!text) return null;
      if (text.startsWith('### ')) {
        return <h3 key={idx} className="text-2xl font-heading font-bold text-brand-moss mt-8 mb-4">{text.replace('### ', '')}</h3>;
      }
      return <p key={idx} className="mb-6 text-brand-charcoal/80 leading-relaxed text-lg">{text}</p>;
    });
  };

  return (
    <div className="min-h-screen bg-brand-cream/30 pt-28 pb-24 font-sans text-brand-charcoal">
      <article className="max-w-4xl mx-auto bg-white rounded-[2rem] shadow-sm border border-brand-moss/5 overflow-hidden animate-fade-in-up">
        {/* Header/Cover */}
        <div className="relative h-[400px] w-full">
          <div className="absolute inset-0 bg-gradient-to-t from-brand-moss/90 via-brand-moss/40 to-transparent z-10" />
          <img 
            src={post.image} 
            alt={post.title} 
            className="w-full h-full object-cover"
          />
          <div className="absolute top-6 left-6 z-20">
            <Link 
              to="/blog" 
              className="flex items-center gap-2 bg-white/20 hover:bg-white/40 backdrop-blur-md text-white px-4 py-2 rounded-full font-bold text-xs uppercase tracking-wider transition-colors"
            >
              <ArrowLeft size={14} /> Back to Blog
            </Link>
          </div>
          
          <div className="absolute bottom-0 left-0 w-full p-8 md:p-12 z-20">
            <span className="inline-block bg-brand-clay text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
              {post.category}
            </span>
            <h1 className="text-3xl md:text-5xl font-heading font-bold text-white mb-4 leading-tight max-w-3xl">
              {post.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-6 text-white/80 text-sm font-mono uppercase tracking-widest mt-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <User size={14} className="text-white" />
                </div>
                <span className="font-bold text-white">{post.author}</span>
              </div>
              <span className="flex items-center gap-2"><Calendar size={14} /> {post.date}</span>
              <span className="flex items-center gap-2"><Clock size={14} /> {post.readTime}</span>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-8 md:p-12 lg:px-16 flex flex-col md:flex-row gap-12 relative">
          
          {/* Social Share Sidebar */}
          <div className="hidden md:flex flex-col gap-4 sticky top-32 h-fit">
            <span className="font-mono text-[10px] uppercase tracking-widest text-brand-charcoal/40 font-bold rotate-180" style={{ writingMode: 'vertical-rl' }}>
              Share Article
            </span>
            <div className="w-[1px] h-12 bg-brand-moss/10 mx-auto" />
            <button className="w-10 h-10 rounded-full border border-brand-moss/10 flex items-center justify-center text-brand-moss hover:bg-brand-moss hover:text-white transition-colors">
              <LinkIcon size={16} />
            </button>
            <button className="w-10 h-10 rounded-full border border-brand-moss/10 flex items-center justify-center text-brand-moss hover:bg-brand-moss hover:text-white transition-colors">
              <MessageCircle size={16} />
            </button>
            <button className="w-10 h-10 rounded-full border border-brand-moss/10 flex items-center justify-center text-brand-moss hover:bg-brand-moss hover:text-white transition-colors mt-4">
              <Share2 size={16} />
            </button>
          </div>

          <div className="flex-1 max-w-2xl">
            <div className="prose prose-lg prose-brand">
              <p className="text-xl text-brand-moss font-medium leading-relaxed mb-8 border-l-4 border-brand-clay pl-6 italic">
                {post.excerpt}
              </p>
              
              <div className="mt-8">
                {renderContent(post.content)}
              </div>
            </div>
            
            <div className="mt-16 pt-8 border-t border-brand-moss/10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-brand-cream flex items-center justify-center text-brand-clay">
                  <User size={20} />
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-brand-charcoal/50 font-bold mb-1">Written by</p>
                  <p className="font-heading font-bold text-brand-moss">{post.author}</p>
                </div>
              </div>
              
              <Link to="/blog" className="btn-magnetic px-6 py-3 rounded-full border border-brand-moss/20 text-brand-moss hover:bg-brand-moss hover:text-white font-bold text-xs uppercase tracking-wider transition-all">
                More Articles
              </Link>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
};

export default BlogPost;
