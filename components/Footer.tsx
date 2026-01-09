
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="mt-12 mb-8 text-center border-t pt-6 text-slate-600 no-print">
      <div className="font-bold text-lg">تصميم وإخراج : م/أحمد عبد الله السوقي</div>
      <div className="text-xs text-slate-400 mt-1">6 يناير 2026م</div>
    </footer>
  );
};

export const PrintFooter: React.FC = () => {
  return (
    <div className="hidden print-only text-center border-t pt-4 mt-8">
       <div className="font-bold text-sm">تصميم وإخراج : م/أحمد عبد الله السوقي</div>
       <div className="text-[10px] text-slate-400">6 يناير 2026م</div>
    </div>
  );
}

export default Footer;
