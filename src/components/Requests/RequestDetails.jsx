import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FileUp, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const RequestDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState({ request: null, approvals: [] });
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [proofs, setProofs] = useState([]);
  const [reconAmount, setReconAmount] = useState('');
  const [savingRecon, setSavingRecon] = useState(false);

  const fetchAll = async () => {
    try {
      const [detailsRes, proofsRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/requests/${id}`),
        axios.get(`http://localhost:5000/api/uploads/proof/${id}`)
      ]);
      setData(detailsRes.data);
      setProofs(proofsRes.data.proofs || []);
    } catch (e) {
      // noop
    }
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [id]);

  const onFileChange = (e) => setFiles(Array.from(e.target.files || []));

  const uploadProofs = async () => {
    if (files.length === 0) return;
    setUploading(true);
    const form = new FormData();
    files.forEach(f => form.append('files', f));
    form.append('fileType', 'image');
    try {
      await axios.post(`http://localhost:5000/api/uploads/proof/${id}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFiles([]);
      fetchAll();
    } catch (e) {}
    setUploading(false);
  };

  const submitReconciliation = async () => {
    const value = Number(reconAmount);
    if (Number.isNaN(value)) return;
    setSavingRecon(true);
    try {
      await axios.post(`http://localhost:5000/api/requests/${id}/reconcile`, { actualSpent: value });
      setReconAmount('');
      fetchAll();
    } catch (e) {}
    setSavingRecon(false);
  };

  const canApprove = () => {
    const pendingForRole = data.approvals.find(a => a.approverRole === user?.role && a.decision === 'pending');
    return Boolean(pendingForRole);
  };

  const canUploadProofs = () => user?.role === 'coordinator';

  const [decision, setDecision] = useState('approved');
  const [remarks, setRemarks] = useState('');

  const actOnApproval = async () => {
    try {
      await axios.post(`http://localhost:5000/api/approvals/${id}/decision`, { decision, remarks });
      setRemarks('');
      fetchAll();
    } catch (e) {}
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const { request, approvals } = data;
  if (!request) return null;

  return (
    <div className="section">
      <button onClick={() => navigate(-1)} className="inline-flex items-center text-sm text-slate-600 hover:text-slate-800">
        <ArrowLeft className="mr-1" size={16} /> Back
      </button>

      <div className="card rounded-2xl">
        <div className="card-body">
          <h1 className="text-xl font-extrabold text-slate-900 mb-2">{request.eventName}</h1>
          <p className="text-slate-600 mb-4">{request.subject}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div><span className="text-slate-500">Department:</span> {request.department}</div>
            <div><span className="text-slate-500">Estimated:</span> ₹{request.estimatedBudget?.toLocaleString()}</div>
            <div><span className="text-slate-500">Status:</span> {request.status}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <h2 className="font-semibold text-slate-900 mb-4">Approval History</h2>
          <div className="space-y-3">
          {approvals.map(a => (
            <div key={a._id} className="flex items-center justify-between text-sm">
              <div>
                <div className="font-medium text-slate-800">{a.approverRole}</div>
                <div className="text-slate-500">{a.remarks || '—'}</div>
              </div>
              <div>{a.decision}</div>
            </div>
          ))}
          </div>
          {canApprove() && (
            <div className="mt-4 border-t border-slate-200 pt-4">
              <h3 className="font-medium text-slate-900 mb-2">Your Decision</h3>
              <div className="flex items-center space-x-3 mb-2">
                <label className="inline-flex items-center space-x-2 text-sm">
                  <input type="radio" checked={decision === 'approved'} onChange={() => setDecision('approved')} />
                  <span>Approve</span>
                </label>
                <label className="inline-flex items-center space-x-2 text-sm">
                  <input type="radio" checked={decision === 'rejected'} onChange={() => setDecision('rejected')} />
                  <span>Reject</span>
                </label>
              </div>
              <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={3} className="w-full px-3 py-2 border border-slate-300 rounded-md" placeholder="Remarks (optional)" />
              <div className="mt-3">
                <button onClick={actOnApproval} className="btn-primary">Submit Decision</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <h2 className="font-semibold text-slate-900 mb-4">Proof Uploads</h2>
        {request.status === 'approved' || request.status === 'reconciled' ? (
          canUploadProofs() ? (
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <input type="file" multiple onChange={onFileChange} />
                <button onClick={uploadProofs} disabled={uploading || files.length === 0} className="btn-primary disabled:opacity-50 flex items-center">
                  <FileUp className="mr-2" size={16} /> {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
              <ul className="list-disc pl-5 text-sm text-slate-600">
                {files.map(f => (<li key={f.name}>{f.name}</li>))}
              </ul>
            </div>
          ) : (
            <div className="text-sm text-slate-500">Only coordinators can upload proofs. You can view existing proofs below.</div>
          )
        ) : (
          <div className="text-sm text-slate-500">Proofs can be uploaded after approval.</div>
        )}

        <div className="mt-4">
          <h3 className="font-medium text-slate-900 mb-2">Existing Proofs</h3>
          {proofs.length === 0 ? (
            <div className="text-sm text-slate-500">No proofs uploaded.</div>
          ) : (
            <div className="space-y-2 text-sm">
              {proofs.map(p => (
                <div key={p._id} className="flex items-center justify-between">
                  <div className="text-slate-700">{p.fileName}</div>
                  <a className="text-blue-700 hover:underline" href={`http://localhost:5000/${p.filePath}`} target="_blank" rel="noreferrer">View</a>
                </div>
              ))}
            </div>
          )}
        </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <h2 className="font-semibold text-slate-900 mb-4">Reconciliation</h2>
        {request.status === 'approved' || request.status === 'reconciled' ? (
          <div className="flex items-center space-x-3">
            <input
              type="number"
              step="0.01"
              value={reconAmount}
              onChange={(e) => setReconAmount(e.target.value)}
              placeholder="Actual amount spent"
              className="px-3 py-2 border border-slate-300 rounded-md"
            />
            <button onClick={submitReconciliation} disabled={savingRecon || reconAmount === ''} className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-md disabled:opacity-50">
              {savingRecon ? 'Saving...' : 'Submit'}
            </button>
          </div>
        ) : (
          <div className="text-sm text-slate-500">Available after final approval.</div>
        )}
        </div>
      </div>
    </div>
  );
};

export default RequestDetails;


