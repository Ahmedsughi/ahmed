
import React, { useState } from 'react';
import { generateQuizFromPDF } from './services/gemini';
import { QuizResult, AppState, QuizConfig } from './types';
import Footer, { PrintFooter } from './components/Footer';

// Use declaration to bypass TypeScript error for global html2pdf
declare var html2pdf: any;

const App: React.FC = () => {
  const [state, setState] = useState<AppState>('IDLE');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [config, setConfig] = useState<QuizConfig>({ minAge: 10, maxAge: 14, questionCount: 10 });
  const [result, setResult] = useState<QuizResult | null>(null);
  const [activeTab, setActiveTab] = useState<'student' | 'teacher'>('student');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPdfFile(e.target.files[0]);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleGenerate = async () => {
    if (!pdfFile) return alert('يرجى رفع ملف PDF أولاً');
    if (config.minAge > config.maxAge) return alert('يجب أن يكون العمر الأدنى أقل من أو يساوي العمر الأقصى');
    
    setState('LOADING');
    try {
      const base64 = await fileToBase64(pdfFile);
      const quiz = await generateQuizFromPDF(base64, config.minAge, config.maxAge, config.questionCount);
      setResult(quiz);
      setState('GENERATED');
    } catch (error) {
      console.error(error);
      setState('ERROR');
    }
  };

  const handleDownloadPDF = () => {
    const element = document.getElementById('quiz-content');
    if (!element) return;

    const opt = {
      margin: 10,
      filename: `اختبار_رواد_القراءة_${activeTab === 'student' ? 'طلاب' : 'معلمين'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // Run html2pdf
    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-8">
      <header className="w-full max-w-4xl text-center mb-10 no-print">
        <h1 className="text-4xl font-bold text-slate-800 mb-2">مؤسسة الرواد للتعليم والتوعية</h1>
        <p className="text-xl text-blue-600 font-medium">نظام ذكي لتوليد أسئلة مشروع رواد القراءة</p>
      </header>

      {state !== 'GENERATED' && (
        <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl overflow-hidden no-print">
          <div className="p-8 space-y-8">
            {/* Upload Section */}
            <div className="space-y-4">
              <label className="block text-lg font-medium text-slate-700">1. ارفع الكتاب (PDF)</label>
              <div className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center transition-colors ${pdfFile ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300 hover:border-blue-400'}`}>
                <input 
                  type="file" 
                  accept="application/pdf" 
                  onChange={handleFileChange}
                  className="hidden" 
                  id="pdf-upload" 
                />
                <label htmlFor="pdf-upload" className="cursor-pointer flex flex-col items-center">
                  <svg className={`w-12 h-12 mb-4 ${pdfFile ? 'text-emerald-500' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-slate-600 font-medium">
                    {pdfFile ? pdfFile.name : 'انقر لرفع ملف PDF أو اسحبه هنا'}
                  </span>
                </label>
              </div>
            </div>

            {/* Config Section */}
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="block text-slate-700 font-medium">2. الفئة العمرية المستهدفة</label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500 min-w-max">من:</span>
                    <input 
                      type="number" 
                      min="5" 
                      max="25"
                      value={config.minAge}
                      onChange={(e) => setConfig({ ...config, minAge: parseInt(e.target.value) || 5 })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      placeholder="الأدنى"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500 min-w-max">إلى:</span>
                    <input 
                      type="number" 
                      min="5" 
                      max="25"
                      value={config.maxAge}
                      onChange={(e) => setConfig({ ...config, maxAge: parseInt(e.target.value) || 25 })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      placeholder="الأقصى"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <label className="block text-slate-700 font-medium">3. عدد الأسئلة المطلوبة</label>
                <select 
                  value={config.questionCount}
                  onChange={(e) => setConfig({ ...config, questionCount: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                >
                  {[5, 10, 15, 20, 25, 30].map(n => (
                    <option key={n} value={n}>{n} أسئلة</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={state === 'LOADING' || !pdfFile}
              className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg transition-all ${state === 'LOADING' ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 active:transform active:scale-95'}`}
            >
              {state === 'LOADING' ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  جاري تحليل الكتاب وتوليد الأسئلة...
                </span>
              ) : 'توليد الاختبار الآن'}
            </button>

            {state === 'ERROR' && (
              <p className="text-red-500 text-center font-medium">حدث خطأ أثناء المعالجة، يرجى المحاولة مرة أخرى.</p>
            )}
          </div>
        </div>
      )}

      {state === 'GENERATED' && result && (
        <div className="w-full max-w-5xl space-y-6">
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
            {/* Results Header */}
            <div className="bg-slate-50 border-b p-4 flex flex-col md:flex-row justify-between items-center gap-4 no-print">
              <div className="flex bg-slate-200 p-1 rounded-xl">
                <button 
                  onClick={() => setActiveTab('student')}
                  className={`px-6 py-2 rounded-lg font-medium transition-all ${activeTab === 'student' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-600 hover:bg-slate-300'}`}
                >
                  نسخة الطالب
                </button>
                <button 
                  onClick={() => setActiveTab('teacher')}
                  className={`px-6 py-2 rounded-lg font-medium transition-all ${activeTab === 'teacher' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-600 hover:bg-slate-300'}`}
                >
                  نسخة المعلم (الإجابات)
                </button>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setState('IDLE')}
                  className="px-6 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-all font-medium"
                >
                  إنشاء اختبار جديد
                </button>
                <button 
                  onClick={handleDownloadPDF}
                  className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all shadow-md font-medium"
                >
                  تحميل ملف PDF
                </button>
              </div>
            </div>

            {/* Content Display */}
            <div className="p-8 md:p-12 bg-white" id="quiz-content" dir="rtl">
              {/* Institution Header for Print/PDF */}
              <div className="flex justify-between items-center border-b-2 border-slate-900 pb-4 mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-black">مؤسسة الرواد للتعليم والتوعية</h2>
                  <h3 className="text-xl text-blue-700">مشروع "رواد القراءة"</h3>
                </div>
                <div className="text-left">
                  <p className="font-medium text-black">الفئة العمرية: {result.targetAgeRange.min} إلى {result.targetAgeRange.max} سنة</p>
                  <p className="font-medium text-black">التاريخ: {new Date().toLocaleDateString('ar-EG')}</p>
                </div>
              </div>

              <div className="text-center mb-10">
                <h4 className="text-2xl font-bold underline mb-2 text-black">اختبار تقييمي: {result.title}</h4>
                <p className="text-slate-500 no-print">({activeTab === 'student' ? 'نسخة الطالب' : 'نسخة المعلم'})</p>
              </div>

              <div className="space-y-12">
                {result.questions.map((q, idx) => (
                  <div key={q.id} className="relative group border-b border-slate-100 pb-8 last:border-0">
                    <div className="flex items-start gap-4">
                      <span className="flex-shrink-0 w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center font-bold text-sm">
                        {idx + 1}
                      </span>
                      <div className="flex-grow space-y-4">
                        <div className="flex justify-between items-start">
                           <h5 className="text-lg font-bold text-black leading-relaxed">{q.question}</h5>
                           {activeTab === 'teacher' && (
                             <span className={`text-xs px-2 py-1 rounded border hidden md:inline-block ${q.difficulty === 'سهل' ? 'bg-green-50 text-green-700 border-green-200' : q.difficulty === 'متوسط' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                               {q.difficulty}
                             </span>
                           )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {q.options.map((option, oIdx) => (
                            <div 
                              key={oIdx} 
                              className={`p-3 rounded-lg border flex items-center gap-3 transition-colors ${
                                activeTab === 'teacher' && option === q.correctAnswer 
                                ? 'bg-emerald-50 border-emerald-500' 
                                : 'border-slate-200 bg-white'
                              }`}
                            >
                              <span className="w-6 h-6 rounded-full border border-slate-300 flex items-center justify-center text-xs font-medium text-slate-500">
                                {['أ', 'ب', 'ج', 'د'][oIdx]}
                              </span>
                              <span className={`text-black ${activeTab === 'teacher' && option === q.correctAnswer ? 'font-bold text-emerald-800' : ''}`}>
                                {option}
                              </span>
                              {activeTab === 'teacher' && option === q.correctAnswer && (
                                <svg className="w-5 h-5 text-emerald-500 ms-auto" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                          ))}
                        </div>

                        {activeTab === 'teacher' && (
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center">
                            <p className="text-sm font-medium">
                              <span className="text-slate-500">الإجابة الصحيحة: </span>
                              <span className="text-emerald-700 font-bold">{q.correctAnswer}</span>
                            </p>
                            <p className="text-sm text-blue-700 font-bold">
                              صفحة: {q.pageNumber}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Branding for Download/Print */}
              <div className="mt-12 text-center pt-6 border-t border-slate-200">
                <div className="font-bold text-lg text-black">تصميم وإخراج : م/أحمد عبد الله السوقي</div>
                <div className="text-xs text-slate-400 mt-1">6 يناير 2026م</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default App;
