'use client';

import { FolderTree, Code, Blocks, RectangleHorizontal, X } from 'lucide-react';
import { Section } from '@/types/structure';

// セクションのスタイル・外観を定義
const SECTION_STYLES: Record<string, string> = {
  'hero': 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-500/30',
  'features': 'bg-gradient-to-r from-green-500/20 to-teal-500/20 border-green-500/30',
  'benefits': 'bg-gradient-to-r from-green-500/20 to-teal-500/20 border-green-500/30',
  'testimonials': 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-500/30',
  'pricing': 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-cyan-500/30',
  'faq': 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border-indigo-500/30',
  'cta': 'bg-gradient-to-r from-rose-500/20 to-pink-500/20 border-rose-500/30',
  'about': 'bg-gradient-to-r from-slate-500/20 to-gray-500/20 border-slate-500/30',
  'steps': 'bg-gradient-to-r from-violet-500/20 to-purple-500/20 border-violet-500/30',
  'curriculum': 'bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border-blue-500/30',
  'instructor': 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/30',
  'proof': 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border-amber-500/30',
  'future': 'bg-gradient-to-r from-sky-500/20 to-blue-500/20 border-sky-500/30',
  'default': 'bg-gradient-to-r from-gray-500/20 to-slate-500/20 border-gray-500/30'
};

// セクションのコンテンツ要素のプレースホルダーを生成
const generatePlaceholderContent = (type: string, content: string) => {
  const commonClasses = "bg-white bg-opacity-40 rounded shadow-sm";
  
  switch (type) {
    case 'hero':
      return (
        <>
          <div className={`${commonClasses} w-3/4 h-8 mb-4`}></div>
          <div className={`${commonClasses} w-1/2 h-6 mb-8`}></div>
          <div className={`${commonClasses} w-40 h-10`}></div>
        </>
      );
    case 'features':
    case 'benefits':
      return (
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className={`${commonClasses} h-24 flex flex-col items-center justify-center p-2`}>
              <div className="bg-white rounded-full w-8 h-8 mb-2"></div>
              <div className="w-3/4 h-3 bg-white rounded mb-1"></div>
              <div className="w-full h-3 bg-white rounded mb-1"></div>
              <div className="w-2/3 h-3 bg-white rounded"></div>
            </div>
          ))}
        </div>
      );
    case 'testimonials':
      return (
        <div className="grid grid-cols-2 gap-4">
          {[1, 2].map(i => (
            <div key={i} className={`${commonClasses} p-3`}>
              <div className="flex items-center mb-2">
                <div className="w-10 h-10 bg-white rounded-full mr-2"></div>
                <div>
                  <div className="w-24 h-3 bg-white rounded mb-1"></div>
                  <div className="w-16 h-2 bg-white rounded"></div>
                </div>
              </div>
              <div className="w-full h-3 bg-white rounded mb-1"></div>
              <div className="w-full h-3 bg-white rounded mb-1"></div>
              <div className="w-3/4 h-3 bg-white rounded"></div>
            </div>
          ))}
        </div>
      );
    case 'pricing':
      return (
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className={`${commonClasses} p-3 flex flex-col items-center`}>
              <div className="w-20 h-4 bg-white rounded mb-2"></div>
              <div className="w-16 h-6 bg-white rounded mb-4"></div>
              <div className="w-full h-2 bg-white rounded mb-1"></div>
              <div className="w-full h-2 bg-white rounded mb-1"></div>
              <div className="w-full h-2 bg-white rounded mb-1"></div>
              <div className="w-full h-2 bg-white rounded mb-3"></div>
              <div className="w-24 h-8 bg-white rounded"></div>
            </div>
          ))}
        </div>
      );
    case 'faq':
      return (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className={`${commonClasses} p-3`}>
              <div className="w-3/4 h-4 bg-white rounded mb-2"></div>
              <div className="w-full h-2 bg-white rounded mb-1"></div>
              <div className="w-full h-2 bg-white rounded mb-1"></div>
              <div className="w-4/5 h-2 bg-white rounded"></div>
            </div>
          ))}
        </div>
      );
    case 'cta':
      return (
        <div className="flex flex-col items-center">
          <div className={`${commonClasses} w-2/3 h-6 mb-3`}></div>
          <div className={`${commonClasses} w-1/2 h-4 mb-6`}></div>
          <div className={`${commonClasses} w-40 h-10`}></div>
        </div>
      );
    default:
      // コンテンツからテキスト行数を推測して動的にプレースホルダーを生成
      const lines = Math.max(3, Math.min(8, Math.ceil(content.length / 50)));
      return (
        <div className="space-y-2">
          <div className={`${commonClasses} w-1/2 h-6 mb-3`}></div>
          {Array.from({ length: lines }).map((_, i) => (
            <div 
              key={i} 
              className={`${commonClasses} h-3`} 
              style={{ width: `${Math.floor(50 + Math.random() * 50)}%` }}
            ></div>
          ))}
        </div>
      );
  }
};

interface SectionPreviewProps {
  sections: Section[];
  selectedSection: string | null;
  onSelectSection: (id: string) => void;
}

const SectionPreview: React.FC<SectionPreviewProps> = ({ 
  sections, 
  selectedSection, 
  onSelectSection 
}) => {
  const renderSections = () => {
    return sections.sort((a, b) => a.position - b.position).map(section => {
      const style = SECTION_STYLES[section.type.toLowerCase()] || SECTION_STYLES.default;
      const isSelected = section.id === selectedSection;
      
      return (
        <div 
          key={section.id} 
          className={`
            border-2 rounded-lg p-4 mb-4 transition-all duration-300
            ${style}
            ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}
          `}
          onClick={() => onSelectSection(section.id)}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <h3 className="font-medium text-lg">{section.title}</h3>
              <span className="ml-2 text-xs text-muted-foreground">({section.componentName})</span>
            </div>
            <div className="flex items-center gap-1 text-xs">
              <span className="text-muted-foreground">Position:</span>
              <span className="font-medium">{section.position}</span>
            </div>
          </div>
          
          <div className="p-4 border border-dashed border-slate-300 rounded bg-white/30">
            {generatePlaceholderContent(section.type, section.content)}
          </div>
          
          {isSelected && (
            <div className="mt-3 text-sm">
              <p className="text-muted-foreground break-words whitespace-pre-wrap">
                {section.content}
              </p>
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-1">ワイヤーフレームプレビュー</h2>
        <p className="text-sm text-muted-foreground">
          セクションの構成と配置のプレビューです。クリックして選択できます。
        </p>
      </div>

      <div className="border rounded-md p-6 bg-slate-50 min-h-[300px]">
        {sections.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-60 text-muted-foreground">
            <FolderTree className="h-16 w-16 mb-4" />
            <p>セクションが追加されていません</p>
            <p className="text-sm">「AIで構造を作成」ボタンをクリックして分析を開始してください</p>
          </div>
        ) : (
          <div className="space-y-1">
            {renderSections()}
          </div>
        )}
      </div>
    </div>
  );
};

export default SectionPreview;