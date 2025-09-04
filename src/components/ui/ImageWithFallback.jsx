import React, { useState } from 'react';

const ImageWithFallback = ({ src, alt = '', fallback = null, className = '', ...rest }) => {
  const [errored, setErrored] = useState(false);

  if (!src || errored) {
    return fallback || (
      <div className={`bg-slate-100 text-slate-400 flex items-center justify-center ${className}`} {...rest}>
        <span className="text-sm">No image</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setErrored(true)}
      {...rest}
    />
  );
};

export default ImageWithFallback;


