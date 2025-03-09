/**
 * トラッキングHOCコンポーネント
 * コンポーネントをトラッキング機能でラップするための高階コンポーネント
 */

'use client';

import React, { useEffect, useRef } from 'react';
import { useComponentTracking } from '@/hooks/use-component-tracking';

interface TrackingHocProps {
  lpId: string;
  componentId: string;
  children: React.ReactNode;
  className?: string;
  trackingOptions?: {
    trackVisibility?: boolean;
    visibilityThreshold?: number;
    trackClicks?: boolean;
    trackChildren?: boolean;
    conversionElements?: string[];
  };
}

/**
 * トラッキング機能を提供する高階コンポーネント
 * 子コンポーネントのビュー、クリック、コンバージョンを追跡する
 */
export default function TrackingHoc({
  lpId,
  componentId,
  children,
  className = '',
  trackingOptions = {}
}: TrackingHocProps) {
  // デフォルトのトラッキングオプション
  const options = {
    trackVisibility: true,
    visibilityThreshold: 0.5,
    trackClicks: true,
    trackChildren: true,
    conversionElements: [],
    ...trackingOptions
  };
  
  // コンポーネントトラッキングフックを使用
  const { variant, ref, trackClick } = useComponentTracking({
    lpId,
    componentId,
    ...options
  });
  
  // コンポーネントをクローンしてバリアント情報を追加
  const childrenWithProps = React.Children.map(children, child => {
    // Reactエレメントかどうかチェック
    if (React.isValidElement(child)) {
      return React.cloneElement(child, {
        'data-variant': variant,
        'data-component-id': componentId
      });
    }
    return child;
  });
  
  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={className}
      data-tracking-component={componentId}
      data-variant={variant}
    >
      {childrenWithProps}
    </div>
  );
}