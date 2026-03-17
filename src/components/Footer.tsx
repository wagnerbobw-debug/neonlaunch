import React, { useEffect, useState } from 'react';

export const Footer: React.FC = () => {
  const [year, setYear] = useState<string>('');
  useEffect(() => setYear(String(new Date().getFullYear())), []);
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footbrand">NeonLaunch</div>
        <div className="footnote">© <span id="year">{year}</span> • Neon MVP</div>
      </div>
    </footer>
  );
};