import React, { useState } from 'react';
import axios from 'axios';

const ResetPassword = () => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      setStatus({ ok: false, msg: 'Passwords do not match.' });
      return;
    }
    setLoading(true);
    setStatus(null);
    try {
      await axios.post('http://localhost:5000/api/auth/reset', { token, password });
      setStatus({ ok: true, msg: 'Password updated. You can now sign in.' });
    } catch (e) {
      setStatus({ ok: false, msg: 'Reset link is invalid or expired.' });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="card w-full max-w-md">
        <div className="card-body">
          <h1 className="mb-4">Reset Password</h1>
          <form onSubmit={submit} className="space-y-3">
            <input
              type="password"
              required
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
            />
            <input
              type="password"
              required
              placeholder="Confirm password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="input"
            />
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Saving…' : 'Save password'}
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

export default ResetPassword;


