'use client';

import { useState } from 'react';
import { Smartphone, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button';

interface PreviewControlsProps {
  previewMode: 'mobile' | 'desktop';
  onPreviewModeChange: (mode: 'mobile' | 'desktop') => void;
}

export default function PreviewControls({
  previewMode,
  onPreviewModeChange
}: PreviewControlsProps) {
  return (
    <ButtonGroup>
      <Button
        variant={previewMode === 'mobile' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onPreviewModeChange('mobile')}
      >
        <Smartphone className="h-4 w-4 mr-1" />
        モバイル
      </Button>
      <Button
        variant={previewMode === 'desktop' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onPreviewModeChange('desktop')}
      >
        <Monitor className="h-4 w-4 mr-1" />
        デスクトップ
      </Button>
    </ButtonGroup>
  );
}