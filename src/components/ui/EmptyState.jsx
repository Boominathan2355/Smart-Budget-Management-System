import React from 'react';

const EmptyState = ({ icon = null, title = 'Nothing here yet', message = 'There is no data to display.' }) => {
  return (
    <div className="bg-white/95 backdrop-blur rounded-xl shadow-lg p-12 text-center">
      {icon ? (
        <div className="mx-auto mb-4 h-12 w-12 flex items-center justify-center text-slate-400">{icon}</div>
      ) : (
        <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">—</div>
      )}
      <h3 className="text-lg font-medium text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-600">{message}</p>
    </div>
  );
};

export default EmptyState;


