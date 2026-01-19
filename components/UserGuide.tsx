import React from 'react';
import { X, BookOpen, PenTool, Type, Download, Move } from 'lucide-react';

interface UserGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserGuide: React.FC<UserGuideProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto overflow-x-hidden relative animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 right-0 z-10 flex justify-end p-4 bg-gradient-to-b from-white via-white/80 to-transparent">
             <button 
              onClick={onClose}
              className="p-2 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 transition-colors shadow-sm"
            >
              <X className="w-5 h-5" />
            </button>
        </div>

        <div className="px-8 pb-10 pt-2">
          <div className="text-center mb-8">
             <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-50 mb-3">
                 <BookOpen className="w-6 h-6 text-red-800" />
             </div>
             <h2 className="text-2xl font-black text-stone-900">
                서예 사용 가이드
             </h2>
             <p className="text-stone-500 text-sm mt-1">Seoye: Digital Calligraphy</p>
          </div>

          <div className="space-y-8">
            <section className="bg-stone-50 p-5 rounded-xl border border-stone-100">
              <h3 className="text-lg font-bold text-stone-800 mb-3 flex items-center">
                <PenTool className="w-5 h-5 mr-2 text-stone-600" />
                그리기 모드 (Draw)
              </h3>
              <ul className="list-disc list-inside text-sm text-stone-600 space-y-2 leading-relaxed marker:text-stone-400">
                <li><strong className="text-stone-800">속도 감지</strong>: 빠르게 그으면 획이 얇아지고, 천천히 그으면 굵어지는 실제 붓의 물리적 특성을 반영합니다.</li>
                <li><strong className="text-stone-800">갈필(Roughness)</strong>: 붓의 거친 질감을 조절하여 마른 붓 효과(비백)를 낼 수 있습니다.</li>
                <li><strong className="text-stone-800">프리셋 저장</strong>: 나만의 브러시 설정을 저장하여 언제든 다시 불러올 수 있습니다.</li>
              </ul>
            </section>

            <section className="bg-stone-50 p-5 rounded-xl border border-stone-100">
              <h3 className="text-lg font-bold text-stone-800 mb-3 flex items-center">
                <Type className="w-5 h-5 mr-2 text-stone-600" />
                생성 모드 (Generate)
              </h3>
              <ul className="list-disc list-inside text-sm text-stone-600 space-y-2 leading-relaxed marker:text-stone-400">
                <li><strong className="text-stone-800">스타일 변환</strong>: 텍스트를 입력하면 서예 스타일로 실시간 변환됩니다.</li>
                <li><strong className="text-stone-800">서체 선택</strong>: 손글씨, 펜글씨, 붓글씨 등 다양한 느낌을 선택해보세요.</li>
                <li><strong className="text-stone-800">굵기 옵션</strong>: '얇게'는 섬세한 펜화, '굵게'는 임팩트 있는 로고 작업에 적합합니다.</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-bold text-stone-800 mb-3 flex items-center">
                <Move className="w-5 h-5 mr-2 text-stone-600" />
                제스처 및 뷰 컨트롤
              </h3>
              <ul className="space-y-3 text-sm text-stone-600 leading-relaxed">
                 <li className="flex items-start">
                    <span className="bg-stone-200 text-stone-700 text-[10px] font-bold px-1.5 py-0.5 rounded mr-2 mt-0.5 shrink-0">터치</span>
                    <span>두 손가락으로 화면을 오므리거나 벌려 <strong>확대/축소</strong>하고, 드래그하여 캔버스를 <strong>이동</strong>할 수 있습니다.</span>
                 </li>
              </ul>
            </section>
            
            <section>
              <h3 className="text-lg font-bold text-stone-800 mb-3 flex items-center">
                <Download className="w-5 h-5 mr-2 text-stone-600" />
                저장 및 활용
              </h3>
              <div className="grid grid-cols-2 gap-3">
                 <div className="bg-white border border-stone-200 p-3 rounded-lg text-center">
                    <span className="block font-bold text-stone-800 text-sm mb-1">PNG</span>
                    <span className="text-xs text-stone-500">배경이 포함된 이미지<br/>SNS 공유용</span>
                 </div>
                 <div className="bg-white border border-stone-200 p-3 rounded-lg text-center">
                    <span className="block font-bold text-stone-800 text-sm mb-1">SVG</span>
                    <span className="text-xs text-stone-500">투명 배경 벡터<br/>디자인/인쇄용</span>
                 </div>
              </div>
            </section>
          </div>
          
          <div className="mt-10 pt-6 border-t border-stone-100 text-center">
             <button 
               onClick={onClose}
               className="w-full bg-stone-900 text-white font-bold py-3 rounded-xl hover:bg-stone-800 transition-colors shadow-md"
             >
               시작하기
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserGuide;