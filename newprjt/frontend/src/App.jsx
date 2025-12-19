// App.jsx - React Frontend connected to Backend API
import React, { useState, useEffect } from 'react';
import { Search, MessageSquare, AlertTriangle } from 'lucide-react';

const API_BASE_URL = '/api'; // Use relative path for proxy

export default function VulnerableBlogApp() {
  const [currentView, setCurrentView] = useState('home');
  const [selectedPost, setSelectedPost] = useState(null);
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [newComment, setNewComment] = useState({ author: '', content: '' });
  const [loading, setLoading] = useState(false);

  // Fetch all posts on component mount
  useEffect(() => {
    fetchPosts();
  }, []);

  // Fetch posts from backend
  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/posts`);
      const data = await response.json();
      setPosts(data);
    } catch (error) {
      console.error('Error fetching posts:', error);
      alert('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  // Fetch comments for a specific post
  const fetchComments = async (postId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/comments/${postId}`);
      const data = await response.json();
      setComments(prev => ({ ...prev, [postId]: data }));
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  // Vulnerable search function - sends query to backend with SQL injection vulnerability
  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(searchQuery)}`);

      if (response.status === 403) {
        alert('WAF Blocked: Your search request was blocked by the firewall for security reasons.');
        setSearchQuery('');
        return;
      }
      
      const data = await response.json();
      
      if (response.ok) {
        setSearchResults(data);
        setCurrentView('search');
      } else {
        alert(`Search error: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Search error:', error);
      alert('Search failed due to an unexpected error.');
    } finally {
      setLoading(false);
    }
  };

  // Vulnerable comment submission - sends unsanitized HTML to backend
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.author || !newComment.content) {
      alert('Please fill in both author and content');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/comments/${selectedPost.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newComment)
      });

      if (response.status === 403) {
        alert('WAF Blocked: Your comment was blocked by the firewall for security reasons.');
        setNewComment({ author: '', content: '' });
        return;
      }

      if (response.ok) {
        setNewComment({ author: '', content: '' });
        await fetchComments(selectedPost.id);
      } else {
        const data = await response.json();
        alert(`Failed to post comment: ${data.error}`);
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      alert('Failed to post comment due to an unexpected error.');
    }
  };
  
  const viewPost = async (post) => {
    setSelectedPost(post);
    setCurrentView('post');
    await fetchComments(post.id);
  };

  const renderPost = (post) => (
    <div 
      key={post.id}
      className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border border-gray-200"
      onClick={() => viewPost(post)}
    >
      <h2 className="text-2xl font-bold text-gray-800 mb-2">{post.title}</h2>
      <p className="text-gray-600">{post.content.substring(0, 150)}...</p>
      <div className="mt-4 flex items-center text-sm text-gray-500">
        <MessageSquare size={16} className="mr-1" />
        <span>{(comments[post.id] || []).length} comments</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Warning Banner */}
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <h1 
              className="text-3xl font-bold text-gray-900 cursor-pointer"
              onClick={() => setCurrentView('home')}
            >
              Vulnerable Blog
            </h1>
            
            {/* Search */}
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch(e)}
                placeholder="Search articles..."
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button 
                onClick={handleSearch}
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Search size={18} />
                Search
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {loading && <div className="text-center text-gray-600">Loading...</div>}

        {/* Home View */}
        {currentView === 'home' && !loading && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Latest Articles</h2>
            <div className="grid gap-6">
              {posts.map(post => renderPost(post))}
            </div>
          </div>
        )}

        {/* Search Results */}
        {currentView === 'search' && !loading && (
          <div>
            <button 
              onClick={() => setCurrentView('home')}
              className="text-blue-600 hover:underline mb-4"
            >
              ← Back to all articles
            </button>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Search Results for "{searchQuery}"
            </h2>
            {searchResults.length > 0 ? (
              <div className="grid gap-6">
                {searchResults.map(post => renderPost(post))}
              </div>
            ) : (
              <p className="text-gray-600">No articles found.</p>
            )}
          </div>
        )}

        {/* Post Detail */}
        {currentView === 'post' && selectedPost && !loading && (
          <div>
            <button 
              onClick={() => setCurrentView('home')}
              className="text-blue-600 hover:underline mb-4"
            >
              ← Back to all articles
            </button>
            
            <article className="bg-white p-8 rounded-lg shadow-md mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{selectedPost.title}</h1>
              <p className="text-gray-700 leading-relaxed">{selectedPost.content}</p>
            </article>

            {/* Comments Section */}
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Comments</h2>
              
              {/* Existing Comments - VULNERABLE TO XSS */}
              <div className="space-y-4 mb-8">
                {(comments[selectedPost.id] || []).map(comment => (
                  <div key={comment.id} className="border-l-4 border-blue-500 pl-4 py-2">
                    <div className="font-semibold text-gray-900">{comment.author}</div>
                    {/* DANGEROUS: Rendering unescaped HTML */}
                    <div 
                      className="text-gray-700 mt-1"
                      dangerouslySetInnerHTML={{ __html: comment.content }}
                    />
                  </div>
                ))}
              </div>

              {/* Comment Form */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Leave a Comment</h3>
                <div className="space-y-4">
                  <input
                    type="text"
                    value={newComment.author}
                    onChange={(e) => setNewComment({...newComment, author: e.target.value})}
                    placeholder="Your name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <textarea
                    value={newComment.content}
                    onChange={(e) => setNewComment({...newComment, content: e.target.value})}
                    placeholder="Your comment"
                    rows="4"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button 
                    onClick={handleCommentSubmit}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Post Comment
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-6 mt-12">
        <div className="max-w-6xl mx-auto px-4">
          <h3 className="font-bold mb-3">Intentional Vulnerabilities:</h3>
          <ul className="space-y-2 text-sm">
            <li></li>
            <li></li>
          </ul>
        </div>
      </footer>
    </div>
  );
}
