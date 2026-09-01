import { useEffect, useState } from 'react';

// Deliberately vulnerable frontend used as a DAST scan target for SecurePulse.
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4002';

export default function App() {
  const [comments, setComments] = useState([]);
  const [author, setAuthor] = useState('');
  const [text, setText] = useState('');

  useEffect(() => {
    loadComments();
  }, []);

  async function loadComments() {
    const res = await fetch(`${API_BASE}/api/comments`);
    setComments(await res.json());
  }

  async function submitComment(e) {
    e.preventDefault();
    await fetch(`${API_BASE}/api/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author, text }),
    });
    setAuthor('');
    setText('');
    loadComments();
  }

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h1>Guestbook</h1>
      <form onSubmit={submitComment}>
        <input placeholder="Name" value={author} onChange={(e) => setAuthor(e.target.value)} />
        <br />
        <textarea placeholder="Comment" value={text} onChange={(e) => setText(e.target.value)} />
        <br />
        <button type="submit">Post</button>
      </form>
      <hr />
      {comments.map((comment) => (
        <div key={comment.id} style={{ marginBottom: 12 }}>
          <strong>{comment.author}</strong>
          {/* Vulnerable: renders comment text as raw HTML without sanitization (XSS) */}
          <div dangerouslySetInnerHTML={{ __html: comment.text }} />
        </div>
      ))}
    </div>
  );
}
