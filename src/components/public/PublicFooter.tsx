'use client';

/**
 * 公開LP用フッターコンポーネント
 * LP下部に表示されるフッターセクション（著作権表示やプラットフォーム情報を含む）
 */
interface PublicFooterProps {
  lpName: string;
}

export default function PublicFooter({ lpName }: PublicFooterProps) {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="mt-16 py-8 px-4 bg-gray-100 text-sm text-gray-600">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-center md:text-left">
              &copy; {currentYear} {lpName}. All rights reserved.
            </p>
            <p className="text-center md:text-left text-xs text-gray-500 mt-1">
              This page is optimized with A/B testing technology.
            </p>
          </div>
          
          <div className="flex items-center">
            <span className="text-xs text-gray-400 mr-2">Powered by</span>
            <a 
              href="/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 font-medium transition"
            >
              AILP Platform
            </a>
          </div>
        </div>
        
        <div className="mt-6 border-t border-gray-200 pt-4 text-xs text-gray-400 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center md:text-left">
            <a href="/privacy" className="hover:text-gray-600 transition">Privacy Policy</a>
          </div>
          <div className="text-center">
            <a href="/terms" className="hover:text-gray-600 transition">Terms of Service</a>
          </div>
          <div className="text-center md:text-right">
            <a href="/contact" className="hover:text-gray-600 transition">Contact Us</a>
          </div>
        </div>
      </div>
    </footer>
  );
}