import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

const QUICK_TAGS = ['Great attitude!', 'Very punctual', 'Safe driving', 'Communicated well', 'Handle with care', 'Professional'];

function StarRating({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  const display = hovered || value;
  return (
    <div className="star-rating" style={{ justifyContent: 'center' }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          className={`star-btn ${n <= display ? 'active' : ''}`}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          style={{ fontSize: '40px' }}
        >
          ⭐
        </button>
      ))}
    </div>
  );
}

const LABELS = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!'];

function RatingPage({ dbUser }) {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const [rating, setRating]   = useState(0);
  const [tags, setTags]       = useState([]);
  const [review, setReview]   = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);

  const toggleTag = (tag) => setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

  const handleSubmit = async () => {
    if (!rating) { alert('Please select a star rating.'); return; }
    setLoading(true);
    try {
      const isDriver = dbUser?.role === 'driver';
      const field = isDriver ? 'customerRating' : 'driverRating';
      const reviewField = isDriver ? 'customerReview' : 'driverReview';
      await updateDoc(doc(db, 'bookings', id), {
        [field]: rating,
        [reviewField]: review,
        ratingTags: tags,
        status: 'completed',
        completedAt: serverTimestamp(),
      });
      setDone(true);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  if (done) {
    return (
      <div className="dashboard-container" style={{ maxWidth: '480px', paddingTop: '60px', textAlign: 'center' }}>
        <div className="card" style={{ padding: '48px 32px' }}>
          <div style={{ fontSize: '72px', marginBottom: '20px' }}>🎉</div>
          <h2 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--navy)', marginBottom: '12px' }}>Thank You!</h2>
          <p style={{ color: 'var(--text-2)', fontSize: '15px', lineHeight: '1.6', marginBottom: '32px' }}>
            Your feedback helps make GrabExpress better for everyone. Your {rating}-star rating has been submitted.
          </p>
          <button onClick={() => navigate(dbUser?.role === 'driver' ? '/driver/deliveries' : '/book')} className="btn btn-primary btn-full btn-lg">Back to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container" style={{ maxWidth: '520px', paddingTop: '40px' }}>
      <div className="card" style={{ padding: '40px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '52px', marginBottom: '12px' }}>⭐</div>
          <h2 style={{ fontSize: '22px', fontWeight: 900, color: 'var(--navy)', marginBottom: '8px' }}>
            {dbUser?.role === 'driver' ? 'Rate the Customer' : 'Rate Your Driver'}
          </h2>
          <p style={{ color: 'var(--text-2)', fontSize: '14px' }}>
            {dbUser?.role === 'driver' ? 'How was the customer for order' : 'How was your delivery experience for order'} #{id.slice(-8).toUpperCase()}?
          </p>
        </div>

        {/* Stars */}
        <div style={{ marginBottom: '12px' }}>
          <StarRating value={rating} onChange={setRating} />
          {rating > 0 && (
            <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '18px', fontWeight: 700, color: rating >= 4 ? 'var(--primary)' : rating >= 3 ? 'var(--amber)' : 'var(--red)' }}>
              {LABELS[rating]}
            </div>
          )}
        </div>

        {/* Quick tags */}
        {rating >= 4 && (
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-2)', marginBottom: '10px', textAlign: 'center' }}>What went well?</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
              {QUICK_TAGS.map(tag => (
                <div
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  style={{
                    padding: '7px 14px', borderRadius: '20px', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                    border: `2px solid ${tags.includes(tag) ? 'var(--primary)' : 'var(--border)'}`,
                    background: tags.includes(tag) ? 'var(--primary-light)' : 'var(--surface)',
                    color: tags.includes(tag) ? 'var(--primary)' : 'var(--text-2)',
                    transition: 'var(--transition)',
                  }}
                >
                  {tags.includes(tag) ? '✓ ' : ''}{tag}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Text review */}
        <div className="form-group mb-24">
          <label className="form-label">Write a Review <span className="opt">(optional)</span></label>
          <textarea
            className="form-input form-textarea"
            placeholder="Share your experience to help others…"
            value={review}
            onChange={e => setReview(e.target.value)}
          />
        </div>

        <button onClick={handleSubmit} className="btn btn-primary btn-full btn-lg" disabled={loading || !rating}>
          {loading ? '⏳ Submitting…' : '✅ Submit Rating'}
        </button>
        <button onClick={() => navigate(dbUser?.role === 'driver' ? '/driver/deliveries' : '/book')} className="btn btn-ghost btn-full mt-8">Skip for now</button>
      </div>
    </div>
  );
}

export default RatingPage;
