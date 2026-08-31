import express from 'express';
import { db } from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Public: Get all blog posts
router.get('/', async (req, res) => {
  try {
    const posts = await db.find('blogs');
    // Sort posts by date descending
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json(posts);
  } catch (error) {
    console.error("Error fetching blog posts:", error);
    res.status(500).json({ error: "Failed to fetch blog posts" });
  }
});

// Public: Get a single blog post by slug
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const post = await db.findOne('blogs', p => p.slug === slug);
    if (!post) {
      return res.status(404).json({ error: "Blog post not found" });
    }
    res.json(post);
  } catch (error) {
    console.error("Error fetching blog post:", error);
    res.status(500).json({ error: "Failed to fetch blog post" });
  }
});

// Admin: Create a new blog post
router.post('/', authenticateToken, requireRole('Admin'), async (req, res) => {
  try {
    const { title, slug, excerpt, content, category, author, image, readTime } = req.body;
    
    if (!title || !slug || !content) {
      return res.status(400).json({ error: "Title, slug, and content are required." });
    }

    // Check if slug already exists
    const existing = await db.findOne('blogs', p => p.slug === slug);
    if (existing) {
      return res.status(400).json({ error: "A post with this slug already exists. Please choose a different title or manually adjust the slug." });
    }

    const newPost = {
      title,
      slug,
      excerpt: excerpt || '',
      content,
      category: category || 'General',
      author: author || 'EduVistar Team',
      image: image || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop',
      readTime: readTime || '5 min read',
      date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      createdAt: new Date().toISOString()
    };

    const createdPost = await db.insert('blogs', newPost);
    res.status(201).json(createdPost);
  } catch (error) {
    console.error("Error creating blog post:", error);
    res.status(500).json({ error: "Failed to create blog post" });
  }
});

// Admin: Update a blog post
router.put('/:id', authenticateToken, requireRole('Admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    if (updates.slug) {
      const existing = await db.findOne('blogs', p => p.slug === updates.slug && p.id !== id);
      if (existing) {
        return res.status(400).json({ error: "A post with this slug already exists." });
      }
    }

    updates.updatedAt = new Date().toISOString();

    const success = await db.update('blogs', id, updates);
    if (!success) {
      return res.status(404).json({ error: "Blog post not found or update failed." });
    }
    
    const updatedPost = await db.findOne('blogs', p => p.id === id);
    res.json(updatedPost);
  } catch (error) {
    console.error("Error updating blog post:", error);
    res.status(500).json({ error: "Failed to update blog post" });
  }
});

// Admin: Delete a blog post
router.delete('/:id', authenticateToken, requireRole('Admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const success = await db.delete('blogs', id);
    if (!success) {
      return res.status(404).json({ error: "Blog post not found or deletion failed." });
    }
    res.json({ message: "Blog post deleted successfully." });
  } catch (error) {
    console.error("Error deleting blog post:", error);
    res.status(500).json({ error: "Failed to delete blog post" });
  }
});

export default router;
