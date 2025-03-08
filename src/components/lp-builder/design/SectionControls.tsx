'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button';

// セクションの型
export interface Section {
  id: string;
  name: string;
  status: string;
  variants: string[];
  active: string;
}

interface SectionControlsProps {
  sections: Section[];
  selectedSection: string;
  onSectionSelect: (id: string) => void;
}

export default function SectionControls({ 
  sections, 
  selectedSection, 
  onSectionSelect 
}: SectionControlsProps) {
  // セクションのアクティブ状態の取得
  const isSectionActive = (id: string) => {
    return id === selectedSection;
  };

  // セクション選択ハンドラ
  const handleSectionSelect = (id: string) => {
    onSectionSelect(id);
  };

  return (
    <div className="flex items-center">
      <div className="flex space-x-2 overflow-x-auto pb-2">
        {sections.map((section) => (
          <button
            key={section.id}
            className={`px-3 py-1.5 text-sm rounded-md flex items-center whitespace-nowrap ${
              isSectionActive(section.id)
                ? 'bg-primary text-white font-medium'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
            onClick={() => handleSectionSelect(section.id)}
          >
            {section.variants.length > 1 && (
              <span className="mr-1.5 w-2 h-2 bg-green-400 rounded-full"></span>
            )}
            {section.name.replace('セクション', '')}
          </button>
        ))}
      </div>
    </div>
  );
}