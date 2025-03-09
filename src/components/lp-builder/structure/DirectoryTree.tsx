'use client';

import { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { 
  ChevronDown, ChevronUp, Trash2, Plus, Edit,
  LayoutGrid, FileText, Image, MessageSquare, CheckCircle, 
  ArrowRight, BarChart, Coffee, BookOpen, User, Award, Lightbulb,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Section, SECTION_TYPE_DESCRIPTIONS } from '@/types/structure';

// セクションアイコンのマッピング
const SECTION_ICONS = {
  'hero': <LayoutGrid className="h-5 w-5" />,
  'features': <CheckCircle className="h-5 w-5" />,
  'benefits': <CheckCircle className="h-5 w-5" />,
  'testimonials': <MessageSquare className="h-5 w-5" />,
  'pricing': <BarChart className="h-5 w-5" />,
  'faq': <FileText className="h-5 w-5" />,
  'cta': <ArrowRight className="h-5 w-5" />,
  'about': <Coffee className="h-5 w-5" />,
  'steps': <ArrowRight className="h-5 w-5" />,
  'curriculum': <BookOpen className="h-5 w-5" />,
  'instructor': <User className="h-5 w-5" />,
  'proof': <Award className="h-5 w-5" />,
  'future': <Lightbulb className="h-5 w-5" />,
  'default': <LayoutGrid className="h-5 w-5" />
};

interface DirectoryTreeProps {
  sections: Section[];
  expandedSection: string | null;
  onToggleSection: (id: string) => void;
  onEditSection: (id: string, field: string, value: any) => void;
  onRemoveSection: (id: string) => void;
  onAddSection: () => void;
  onReorderSections: (result: any) => void;
  onSelectSection?: (id: string) => void;
  selectedSection?: string | null;
}

const DirectoryTree = ({
  sections,
  expandedSection,
  onToggleSection,
  onEditSection,
  onRemoveSection,
  onAddSection,
  onReorderSections,
  onSelectSection,
  selectedSection
}: DirectoryTreeProps) => {
  
  // セクションアイコンを取得
  const getSectionIcon = (type: string) => {
    const key = type.toLowerCase();
    return SECTION_ICONS[key as keyof typeof SECTION_ICONS] || SECTION_ICONS.default;
  };
  
  // セクションの説明を取得
  const getSectionDescription = (type: string) => {
    const key = type.toLowerCase();
    return SECTION_TYPE_DESCRIPTIONS[key as keyof typeof SECTION_TYPE_DESCRIPTIONS] || 
      'カスタム定義されたセクション';
  };

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-1">セクション構造</h2>
        <p className="text-sm text-muted-foreground">
          AIが分析した最適なLP構造です。並べ替えや編集が可能です。
        </p>
      </div>

      <DragDropContext onDragEnd={onReorderSections}>
        <Droppable droppableId="sections">
          {(provided) => (
            <div 
              {...provided.droppableProps} 
              ref={provided.innerRef}
              className="space-y-2"
            >
              {sections.map((section, index) => (
                <Draggable 
                  key={section.id} 
                  draggableId={section.id} 
                  index={index}
                >
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className="mb-2"
                      onClick={() => onSelectSection && onSelectSection(section.id)}
                    >
                      <Card className={`border-2 overflow-hidden
                        ${selectedSection === section.id ? 'border-primary/40 bg-primary/5' : ''}`}
                      >
                        <div 
                          className={`p-3 cursor-pointer flex items-center justify-between ${
                            expandedSection === section.id ? 'border-b bg-slate-100' : ''
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleSection(section.id);
                          }}
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {getSectionIcon(section.type)}
                            <span className="font-medium truncate">{section.title}</span>
                            <div className="flex gap-1 flex-wrap">
                              <Badge variant="outline" className="text-xs">
                                {section.type}
                              </Badge>
                              <Badge variant="outline" className="text-xs bg-slate-100">
                                {section.position}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center ml-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                onRemoveSection(section.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-muted-foreground" />
                            </Button>
                            {expandedSection === section.id ? (
                              <ChevronUp className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                        
                        {expandedSection === section.id && (
                          <CardContent className="pt-3 pb-3">
                            <div className="space-y-3">
                              <div>
                                <label className="text-sm font-medium mb-1 block">セクションタイトル</label>
                                <input 
                                  type="text"
                                  className="w-full p-2 border rounded"
                                  value={section.title} 
                                  onChange={(e) => onEditSection(section.id, 'title', e.target.value)} 
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium mb-1 block">セクション内容</label>
                                <textarea 
                                  className="w-full p-2 border rounded min-h-[100px]"
                                  value={section.content} 
                                  rows={4}
                                  onChange={(e) => onEditSection(section.id, 'content', e.target.value)} 
                                />
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                <div>
                                  <label className="text-sm font-medium mb-1 block">タイプ</label>
                                  <select 
                                    className="w-full p-2 border rounded"
                                    value={section.type}
                                    onChange={(e) => onEditSection(section.id, 'type', e.target.value)}
                                  >
                                    <option value="hero">hero</option>
                                    <option value="features">features</option>
                                    <option value="benefits">benefits</option>
                                    <option value="testimonials">testimonials</option>
                                    <option value="pricing">pricing</option>
                                    <option value="faq">faq</option>
                                    <option value="cta">cta</option>
                                    <option value="about">about</option>
                                    <option value="steps">steps</option>
                                    <option value="curriculum">curriculum</option>
                                    <option value="instructor">instructor</option>
                                    <option value="proof">proof</option>
                                    <option value="future">future</option>
                                    <option value="custom">custom</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="text-sm font-medium mb-1 block">コンポーネント</label>
                                  <select 
                                    className="w-full p-2 border rounded"
                                    value={section.componentName}
                                    onChange={(e) => onEditSection(section.id, 'componentName', e.target.value)}
                                  >
                                    <option value="Hero">Hero</option>
                                    <option value="Benefits">Benefits</option>
                                    <option value="Testimonials">Testimonials</option>
                                    <option value="Pricing">Pricing</option>
                                    <option value="FAQ">FAQ</option>
                                    <option value="CallToAction">CallToAction</option>
                                    <option value="About">About</option>
                                    <option value="Steps">Steps</option>
                                    <option value="Curriculum">Curriculum</option>
                                    <option value="Instructor">Instructor</option>
                                    <option value="Proof">Proof</option>
                                    <option value="Future">Future</option>
                                    <option value="Custom">Custom</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="text-sm font-medium mb-1 block">表示位置</label>
                                  <input 
                                    type="number"
                                    className="w-full p-2 border rounded"
                                    min="0"
                                    value={section.position}
                                    onChange={(e) => onEditSection(section.id, 'position', parseInt(e.target.value))}
                                  />
                                </div>
                              </div>
                              <div className="pt-2 text-xs text-muted-foreground border-t mt-2">
                                <p className="font-medium mb-1">セクションタイプの説明:</p>
                                <p>{getSectionDescription(section.type)}</p>
                              </div>
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <Button onClick={onAddSection} variant="outline" className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        セクションを追加
      </Button>
    </div>
  );
};

export default DirectoryTree;