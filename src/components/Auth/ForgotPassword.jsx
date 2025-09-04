import React, { useState } from 'react';
import axios from 'axios';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      await axios.post('http://localhost:5000/api/auth/forgot', { email });
      setStatus({ ok: true, msg: 'If the email exists, a reset link has been sent.' });
    } catch (e) {
      setStatus({ ok: false, msg: 'Something went wrong. Try again later.' });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="card w-full max-w-md">
        <div className="card-body">
          <h1 className="mb-4">Forgot Password</h1>
          <p className="text-sm text-slate-600 mb-4">Enter your email and we will send a password reset link.</p>
          <form onSubmit={submit} className="space-y-3">
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
            />
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
          {status && (
            <div className={`mt-3 text-sm ${status.ok ? 'text-green-700' : 'text-red-600'}`}>{status.msg}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;


