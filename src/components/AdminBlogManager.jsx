import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { PlusCircle, Edit, Trash2, Calendar, User, Check } from 'lucide-react';

export default function AdminBlogManager({ getAuthHeaders }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list'); // 'list', 'create', 'edit'
  const [currentPost, setCurrentPost] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    category: '',
    author: '',
    image: '',
    readTime: ''
  });

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/blog');
      const data = await res.json();
      if (res.ok) {
        setPosts(data);
      } else {
        toast.error('Failed to load blog posts');
      }
    } catch (err) {
      toast.error('Network error loading blog posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleTitleChange = (e) => {
    const title = e.target.value;
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    setFormData(prev => ({ ...prev, title, slug }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      category: '',
      author: '',
      image: '',
      readTime: ''
    });
    setCurrentPost(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = view === 'edit' ? `/api/blog/${currentPost.id}` : '/api/blog';
    const method = view === 'edit' ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Post ${view === 'edit' ? 'updated' : 'created'} successfully!`);
        fetchPosts();
        setView('list');
        resetForm();
      } else {
        toast.error(data.error || 'Failed to save post');
      }
    } catch (err) {
      toast.error('Network error saving post');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      const res = await fetch(`/api/blog/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        toast.success('Post deleted successfully');
        fetchPosts();
      } else {
        toast.error('Failed to delete post');
      }
    } catch (err) {
      toast.error('Network error deleting post');
    }
  };

  const handleEdit = (post) => {
    setCurrentPost(post);
    setFormData({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      category: post.category,
      author: post.author,
      image: post.image,
      readTime: post.readTime
    });
    setView('edit');
  };

  return (
    <div className="animate-fade-up">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="font-heading font-bold text-2xl text-brand-moss">Blog Content Manager</h3>
          <p className="font-sans text-xs text-brand-charcoal/70">Create, edit, and manage public blog posts.</p>
        </div>
        {view === 'list' ? (
          <button 
            onClick={() => { resetForm(); setView('create'); }}
            className="flex items-center gap-2 bg-brand-clay text-white px-5 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider hover:bg-brand-clay/90 transition-colors shadow-sm"
          >
            <PlusCircle size={16} /> New Post
          </button>
        ) : (
          <button 
            onClick={() => { resetForm(); setView('list'); }}
            className="text-brand-moss hover:text-brand-clay font-bold text-xs uppercase tracking-wider transition-colors"
          >
            Cancel & Return
          </button>
        )}
      </div>

      {view === 'list' && (
        <div className="bg-white rounded-3xl border border-brand-moss/10 overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-8 text-center text-brand-charcoal/50 text-sm font-bold">Loading posts...</div>
          ) : posts.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center border-dashed border-2 border-brand-moss/10 m-6 rounded-2xl">
              <span className="bg-brand-moss/5 text-brand-moss px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4">No Posts Found</span>
              <h4 className="font-heading font-bold text-xl text-brand-moss mb-2">Start Your Blog</h4>
              <p className="text-sm text-brand-charcoal/60 mb-6 max-w-sm mx-auto">Create your first blog post to engage parents and students on the EduVistar platform.</p>
              <button 
                onClick={() => { resetForm(); setView('create'); }}
                className="btn-magnetic border-2 border-brand-clay text-brand-clay hover:bg-brand-clay hover:text-white px-6 py-2 rounded-full font-bold text-xs uppercase tracking-wider transition-colors"
              >
                Write First Post
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans text-sm">
                <thead>
                  <tr className="border-b border-brand-moss/5 text-[10px] uppercase tracking-wider text-brand-charcoal/50">
                    <th className="px-6 py-4 font-bold">Title</th>
                    <th className="px-6 py-4 font-bold">Author</th>
                    <th className="px-6 py-4 font-bold">Date</th>
                    <th className="px-6 py-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-moss/5">
                  {posts.map(post => (
                    <tr key={post.id} className="hover:bg-brand-moss/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-brand-moss mb-1">{post.title}</div>
                        <div className="text-[10px] text-brand-charcoal/50 font-mono">/{post.slug}</div>
                      </td>
                      <td className="px-6 py-4 text-brand-charcoal/80 flex items-center gap-2">
                        <User size={14} className="text-brand-clay" /> {post.author}
                      </td>
                      <td className="px-6 py-4 text-brand-charcoal/80">
                        <div className="flex items-center gap-2"><Calendar size={14} /> {post.date}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleEdit(post)}
                            className="p-2 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                            title="Edit"
                          >
                            <Edit size={14} />
                          </button>
                          <button 
                            onClick={() => handleDelete(post.id)}
                            className="p-2 rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {(view === 'create' || view === 'edit') && (
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl border border-brand-moss/10 shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-brand-moss uppercase tracking-wider mb-2">Post Title *</label>
              <input 
                type="text" 
                name="title"
                required
                value={formData.title}
                onChange={handleTitleChange}
                className="w-full bg-brand-cream/30 border border-brand-moss/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-clay focus:ring-1 focus:ring-brand-clay transition-all"
                placeholder="The Future of AI in Education"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-brand-moss uppercase tracking-wider mb-2">URL Slug *</label>
              <input 
                type="text" 
                name="slug"
                required
                value={formData.slug}
                onChange={handleInputChange}
                className="w-full bg-brand-cream border border-brand-moss/10 rounded-xl px-4 py-3 text-sm text-brand-charcoal/70 focus:outline-none cursor-not-allowed"
                placeholder="the-future-of-ai"
              />
              <p className="text-[10px] text-brand-charcoal/50 mt-1">Auto-generated from title. Must be unique.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold text-brand-moss uppercase tracking-wider mb-2">Category</label>
              <input 
                type="text" 
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full bg-brand-cream/30 border border-brand-moss/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-clay transition-all"
                placeholder="e.g. Technology"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-brand-moss uppercase tracking-wider mb-2">Author Name</label>
              <input 
                type="text" 
                name="author"
                value={formData.author}
                onChange={handleInputChange}
                className="w-full bg-brand-cream/30 border border-brand-moss/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-clay transition-all"
                placeholder="Dr. Amina Yusuf"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-brand-moss uppercase tracking-wider mb-2">Read Time</label>
              <input 
                type="text" 
                name="readTime"
                value={formData.readTime}
                onChange={handleInputChange}
                className="w-full bg-brand-cream/30 border border-brand-moss/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-clay transition-all"
                placeholder="e.g. 5 min read"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-moss uppercase tracking-wider mb-2">Cover Image URL</label>
            <input 
              type="url" 
              name="image"
              value={formData.image}
              onChange={handleInputChange}
              className="w-full bg-brand-cream/30 border border-brand-moss/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-clay transition-all"
              placeholder="https://images.unsplash.com/photo-1516321318423-f06f85e504b3"
            />
            {formData.image && (
              <div className="mt-3 rounded-xl overflow-hidden border border-brand-moss/10 h-32 w-48 relative">
                <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-moss uppercase tracking-wider mb-2">Short Excerpt</label>
            <textarea 
              name="excerpt"
              rows={2}
              value={formData.excerpt}
              onChange={handleInputChange}
              className="w-full bg-brand-cream/30 border border-brand-moss/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-clay transition-all resize-none"
              placeholder="A brief summary of the article..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-moss uppercase tracking-wider mb-2">Main Content (Rich Text) *</label>
            <div className="bg-white rounded-xl border border-brand-moss/10 overflow-hidden p-2">
              <textarea 
                name="content"
                rows={10}
                required
                value={formData.content}
                onChange={handleInputChange}
                className="w-full bg-brand-cream/30 border border-brand-moss/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-clay transition-all font-mono leading-relaxed"
                placeholder="Write full article content (Markdown / HTML formatting supported)..."
              />
            </div>
          </div>

          <div className="pt-6 border-t border-brand-moss/10 flex items-center justify-end gap-4">
            <button 
              type="button"
              onClick={() => { resetForm(); setView('list'); }}
              className="px-6 py-3 rounded-full font-bold text-xs uppercase tracking-wider text-brand-moss hover:bg-brand-moss/5 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="flex items-center gap-2 bg-brand-clay text-white px-8 py-3 rounded-full font-bold text-xs uppercase tracking-wider hover:bg-brand-clay/90 transition-colors shadow-md"
            >
              <Check size={16} /> {view === 'edit' ? 'Update Post' : 'Publish Post'}
            </button>
          </div>
        </form>
      )}

    </div>
  );
}
