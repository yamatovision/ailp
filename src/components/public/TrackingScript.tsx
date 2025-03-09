'use client';

/**
 * トラッキングスクリプト挿入コンポーネント
 * アナリティクストラッキングコードを動的に挿入します
 */
import { useEffect } from 'react';
import Script from 'next/script';

interface TrackingScriptProps {
  lpId: string;
  sessionId: string;
}

export default function TrackingScript({ lpId, sessionId }: TrackingScriptProps) {
  // 基本的なトラッキング情報をwindowオブジェクトに設定
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // @ts-ignore
      window.__lpTrackingData = {
        lpId,
        sessionId,
        visitStarted: Date.now(),
        events: [],
      };
    }

    return () => {
      if (typeof window !== 'undefined') {
        // @ts-ignore
        delete window.__lpTrackingData;
      }
    };
  }, [lpId, sessionId]);

  // ビーコンAPI使用してタブ閉じる前に離脱イベントを送信
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (typeof window !== 'undefined' && navigator.sendBeacon) {
        const data = {
          lpId,
          sessionId,
          eventType: 'exit',
          timestamp: Date.now(),
          data: {
            // @ts-ignore
            timeSpent: Date.now() - (window.__lpTrackingData?.visitStarted || Date.now()),
            // @ts-ignore
            events: window.__lpTrackingData?.events?.length || 0,
          },
        };
        
        navigator.sendBeacon(
          '/api/tracking/exit',
          new Blob([JSON.stringify(data)], { type: 'application/json' })
        );
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [lpId, sessionId]);

  return (
    <>
      {/* Google Analytics - 本番環境ではプロパティIDを環境変数から取得 */}
      {process.env.NEXT_PUBLIC_GA_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', {
                page_path: window.location.pathname,
                user_properties: {
                  lp_id: '${lpId}',
                  session_id: '${sessionId}'
                }
              });
            `}
          </Script>
        </>
      )}

      {/* Facebook Pixel - 本番環境ではPixelIDを環境変数から取得 */}
      {process.env.NEXT_PUBLIC_FB_PIXEL_ID && (
        <Script id="facebook-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${process.env.NEXT_PUBLIC_FB_PIXEL_ID}');
            fbq('track', 'PageView', {
              lp_id: '${lpId}',
              session_id: '${sessionId}'
            });
          `}
        </Script>
      )}

      {/* カスタムトラッキングスクリプト - プラットフォーム独自のイベントキャプチャロジック */}
      <Script id="custom-tracking" strategy="afterInteractive">
        {`
          (function() {
            // 時間計測用
            var startTime = Date.now();
            var lastActivityTime = startTime;
            
            // ユーザー行動追跡
            function trackUserActivity() {
              lastActivityTime = Date.now();
              // イベントを内部配列に追加
              if (window.__lpTrackingData && window.__lpTrackingData.events) {
                window.__lpTrackingData.events.push({
                  type: 'activity',
                  time: lastActivityTime
                });
              }
            }
            
            // スクロール追跡
            var lastScrollPos = 0;
            var scrollTimer;
            
            function handleScroll() {
              if (scrollTimer) clearTimeout(scrollTimer);
              
              scrollTimer = setTimeout(function() {
                var currentScrollPos = window.scrollY;
                var docHeight = document.documentElement.scrollHeight;
                var winHeight = window.innerHeight;
                var scrollPercent = (currentScrollPos / (docHeight - winHeight)) * 100;
                
                // スクロールの方向を確認
                var direction = currentScrollPos > lastScrollPos ? 'down' : 'up';
                lastScrollPos = currentScrollPos;
                
                // スクロール深度をトラッキング（25%区切り）
                if (scrollPercent >= 25 && scrollPercent < 50) {
                  recordScrollDepth(25);
                } else if (scrollPercent >= 50 && scrollPercent < 75) {
                  recordScrollDepth(50);
                } else if (scrollPercent >= 75 && scrollPercent < 90) {
                  recordScrollDepth(75);
                } else if (scrollPercent >= 90) {
                  recordScrollDepth(100);
                }
                
                trackUserActivity();
              }, 100);
            }
            
            // スクロール深度を記録
            var recordedDepths = {};
            function recordScrollDepth(depth) {
              if (!recordedDepths[depth]) {
                // スクロール深度を記録
                fetch('/api/tracking/scroll', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    lpId: '${lpId}',
                    sessionId: '${sessionId}',
                    eventType: 'scroll_depth',
                    data: { depth: depth },
                    timestamp: Date.now()
                  })
                }).catch(function(err) {
                  console.warn('Failed to track scroll depth:', err);
                });
                
                recordedDepths[depth] = true;
              }
            }
            
            // イベントリスナーの追加
            window.addEventListener('scroll', handleScroll);
            window.addEventListener('click', trackUserActivity);
            window.addEventListener('mousemove', trackUserActivity);
            window.addEventListener('keypress', trackUserActivity);
            
            // トラッキングの引継ぎを防ぐため、リンククリック時に新しいセッションパラメータを追加
            document.addEventListener('click', function(e) {
              if (e.target.tagName === 'A' && e.target.href && !e.target.href.startsWith('javascript:')) {
                try {
                  var url = new URL(e.target.href);
                  if (url.host === window.location.host) {
                    url.searchParams.set('utm_session', '${sessionId}');
                    e.target.href = url.toString();
                  }
                } catch (err) {
                  console.warn('Failed to process link:', err);
                }
              }
            });
          })();
        `}
      </Script>
    </>
  );
}