import React from 'react';

const ErrorState = ({ title = 'Something went wrong', message = 'Please try again later.', onRetry }) => {
  return (
    <div className="bg-white/95 backdrop-blur rounded-xl shadow-lg p-8 text-center">
      <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-50 flex items-center justify-center">
        <span className="text-red-600 text-2xl">!</span>
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-1">{title}</h3>
      <p className="text-slate-600 mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-md hover:from-blue-700 hover:to-indigo-700"
        >
          Retry
        </button>
      )}
    </div>
  );
};

export default ErrorState;


