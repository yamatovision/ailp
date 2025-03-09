'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Save, Upload, Trash2, X, ChevronRight, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Message, sendChatMessage } from '@/lib/api/chat';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';

// タイピングインジケーターコンポーネント
const TypingIndicator = () => (
  <div className="flex items-center space-x-1 py-2 px-1">
    <div className="w-2 h-2 rounded-full bg-[#3f51b5] animate-bounce" style={{ animationDelay: '0ms' }}></div>
    <div className="w-2 h-2 rounded-full bg-[#3f51b5] animate-bounce" style={{ animationDelay: '150ms' }}></div>
    <div className="w-2 h-2 rounded-full bg-[#3f51b5] animate-bounce" style={{ animationDelay: '300ms' }}></div>
  </div>
);

// アシスタント定義
type Assistant = {
  id: string;
  name: string;
  title?: string;
  description?: string;
  systemPrompt: string;
  initialMessage?: string;
  referenceDocuments?: string;
};

// デフォルトのアシスタント
const DEFAULT_ASSISTANTS: Assistant[] = [
  {
    id: 'web',
    name: 'Webサイト・LP',
    description: 'Webサイトやランディングページの文章作成',
    systemPrompt: 'LP・Webサイト向け文章作成モードです。商品・サービスの特徴、ターゲット層、訴求ポイントなどを教えてください。',
    initialMessage: 'こんにちは！Webサイトやランディングページの文章作成をお手伝いします。どのような内容についてサポートが必要ですか？'
  },
  {
    id: 'marketing',
    name: 'マーケティング',
    description: '広告文、メルマガ、セールスレター',
    systemPrompt: 'マーケティング文書作成モードです。広告文、メルマガ、セールスレターなどの目的やターゲット、訴求内容を教えてください。',
    initialMessage: 'マーケティング資料の作成をサポートします。ターゲット層や訴求ポイントを教えていただけますか？'
  },
  {
    id: 'idea',
    name: 'アイデア整理',
    description: 'アイデアの整理や企画立案の支援',
    systemPrompt: 'アイデア整理モードです。考えていることや整理したい内容を自由に入力してください。',
    initialMessage: 'アイデアの整理をお手伝いします。どのようなアイデアや企画について考えていますか？'
  },
  {
    id: 'seo',
    name: 'SEO対策',
    description: 'SEO対策を考慮したコンテンツ作成',
    systemPrompt: 'SEO対策を考慮したコンテンツ作成モードです。対象キーワード、競合サイト、ターゲットユーザーを教えてください。',
    initialMessage: 'SEO対策を考慮したコンテンツ作成をサポートします。対象キーワードや競合サイトの情報を教えてください。'
  }
];

// ファイルプレビューコンポーネント
const FilePreview = ({ file, onRemove }: { file: File, onRemove: () => void }) => (
  <div className="flex items-center bg-gray-50 p-2 rounded border mb-2">
    <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center mr-2">
      <span className="text-xs text-gray-600">{file.name.split('.').pop()}</span>
    </div>
    <div className="flex-1 overflow-hidden">
      <p className="text-sm truncate">{file.name}</p>
      <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
    </div>
    <button onClick={onRemove} className="text-gray-400 hover:text-red-500">
      <X size={16} />
    </button>
  </div>
);

export default function WritingAssistant() {
  const { toast } = useToast();
  const [assistants, setAssistants] = useState<Assistant[]>(DEFAULT_ASSISTANTS);
  const [selectedAssistant, setSelectedAssistant] = useState<Assistant>(DEFAULT_ASSISTANTS[0]);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: 'system',
      content: DEFAULT_ASSISTANTS[0].initialMessage || 'AI文章作成アシスタントへようこそ。どのような文章を作成したいですか？',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [exportContent, setExportContent] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isLoadingAssistants, setIsLoadingAssistants] = useState(false);
  // 保存済み文書管理は削除
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // アシスタント一覧を取得
  useEffect(() => {
    const fetchAssistants = async () => {
      try {
        setIsLoadingAssistants(true);
        const response = await fetch('/api/assistants');
        
        if (!response.ok) {
          throw new Error('アシスタント情報の取得に失敗しました');
        }
        
        const data = await response.json();
        
        // サーバーからカスタムアシスタント一覧を取得できた場合
        if (data && data.length > 0) {
          setAssistants([...DEFAULT_ASSISTANTS, ...data]);
        }
      } catch (error) {
        console.error('アシスタント情報取得エラー:', error);
        // エラーの場合でもデフォルトのアシスタントは表示
      } finally {
        setIsLoadingAssistants(false);
      }
    };

    fetchAssistants();
  }, []);

  // メッセージが追加されたときに自動スクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // アシスタント変更ハンドラ
  const handleAssistantChange = (assistant: Assistant) => {
    setSelectedAssistant(assistant);
    
    // 会話をリセット
    const initialMessage = assistant.initialMessage || 'どのようなサポートが必要ですか？';
    
    // システムメッセージを設定
    setMessages([
      {
        id: Date.now(),
        role: 'system',
        content: initialMessage,
      }
    ]);
    
    // 参考資料があれば処理
    if (assistant.referenceDocuments) {
      try {
        const documents = JSON.parse(assistant.referenceDocuments);
        if (Array.isArray(documents) && documents.length > 0) {
          // 参考資料を会話に追加（TODO: 実装）
          console.log('参考資料:', documents);
        }
      } catch (e) {
        console.error('参考資料のパースエラー:', e);
      }
    }
  };

  // ファイルアップロードハンドラ
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
      toast({
        title: "ファイルをアップロードしました",
        description: `${newFiles.length}個のファイルが追加されました`,
      });
    }
  };

  // ファイル削除ハンドラ
  const handleFileRemove = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  // メッセージ送信処理
  const sendMessage = async () => {
    if (!inputValue.trim()) return;

    // ユーザーメッセージを追加
    const userMessage: Message = {
      id: Date.now(),
      role: 'user',
      content: inputValue,
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      // ファイル情報を含めたメッセージを作成
      let messageToSend = inputValue;
      if (files.length > 0) {
        const fileInfo = files.map(file => 
          `${file.name} (${(file.size / 1024).toFixed(1)} KB)`
        ).join('\n');
        messageToSend += `\n\n添付ファイル情報:\n${fileInfo}`;
      }
      
      // システムメッセージ用のIDを生成
      const systemMessageId = Date.now();
      
      // 空のシステムメッセージを先に追加（タイピングインジケーターなしで）
      const systemMessage: Message = {
        id: systemMessageId,
        role: 'system',
        content: '', // 空の内容から始めて、ストリーミングで埋めていきます
      };
      
      // isTypingをfalseに設定 - タイピングインジケーターを表示しない
      setIsTyping(false);
      setMessages(prev => [...prev, systemMessage]);
      
      // システムプロンプトをメッセージヒストリーに追加
      const messagesWithSystemPrompt = [
        ...messages,
        {
          id: Date.now() - 1,
          role: 'system',
          content: selectedAssistant.systemPrompt,
        }
      ];
      
      // ストリーミングAPIをインポートして使用
      console.log('%c🔌 ストリーミングセッション開始%c メッセージ長: ' + messageToSend.length + '文字', 
        'background:#6610f2; color:white; font-weight:bold; padding:2px 5px; border-radius:3px;', 
        'color:#6610f2; font-weight:bold;');
      
      try {
        const { streamChatMessage } = await import('@/lib/api/chat');
        console.log('ストリーミングチャットメッセージ送信開始...');
        let accumulatedResponse = '';
        let receivedChunks = 0;
        
        await streamChatMessage(
          messageToSend,
          messagesWithSystemPrompt, // システムプロンプトを含めたメッセージ履歴を送信
          // チャンクごとにメッセージを更新
          (chunk) => {
            receivedChunks++;
            
            // 各チャンクを明確にコンソールに出力
            const cleanChunk = chunk.replace(/\n/g, '\\n');
            if (receivedChunks <= 5 || receivedChunks % 20 === 0) {
              // 装飾を追加してログを目立たせる
              console.log(`%c🤖 AI応答 #${receivedChunks}:%c "${cleanChunk.substring(0, 100)}${cleanChunk.length > 100 ? '...' : ''}"`, 
                'background:#4a5dc7; color:white; font-weight:bold; padding:2px 5px; border-radius:3px;', 
                'color:#4a5dc7; font-weight:bold;');
            }
            
            accumulatedResponse += chunk;
            
            // チャンクの長さに応じてログレベルを分ける（重要な内容をハイライト）
            if (chunk.length > 50) {
              console.log(`📝 重要なチャンク (${chunk.length}文字): "${cleanChunk.substring(0, 50)}..."`);
            }
            
            setMessages(prev => {
              // 最後のメッセージが現在のシステムメッセージかどうかをチェック
              const lastMessage = prev[prev.length - 1];
              if (lastMessage.id === systemMessageId) {
                // 現在のシステムメッセージを更新
                return [
                  ...prev.slice(0, prev.length - 1),
                  { ...lastMessage, content: lastMessage.content + chunk }
                ];
              }
              return prev;
            });
          },
          // 完了時の処理
          () => {
            console.log(`%c🎉 ストリーミング完了:%c 合計 ${receivedChunks} チャンク受信`, 
              'background:#28a745; color:white; font-weight:bold; padding:2px 5px; border-radius:3px;', 
              'color:#28a745; font-weight:bold;');
            
            // 完成した応答の最初と最後の部分をログ表示
            if (accumulatedResponse) {
              const firstPart = accumulatedResponse.substring(0, 100).replace(/\n/g, '\\n');
              const lastPart = accumulatedResponse.length > 150 
                ? accumulatedResponse.substring(accumulatedResponse.length - 100).replace(/\n/g, '\\n')
                : '';
                
              console.log(`%c📄 完成した応答:%c\n始め: "${firstPart}${accumulatedResponse.length > 100 ? '...' : ''}"\n${
                lastPart ? `終わり: "...${lastPart}"` : ''
              }\n計 ${accumulatedResponse.length} 文字`, 
                'background:#17a2b8; color:white; font-weight:bold; padding:2px 5px; border-radius:3px;', 
                'color:#17a2b8;');
            }
            
            setIsTyping(false);
            
            // 完成したレスポンスをエクスポート用に保存
            if (accumulatedResponse.trim()) {
              setExportContent(accumulatedResponse);
            }
          }
        );
      } catch (streamError) {
        console.error('Streaming API error:', streamError);
        
        // ストリーミングAPIが失敗した場合、通常のAPIを使用してフォールバック
        console.log('通常のAPIにフォールバック...');
        const response = await sendChatMessage(messageToSend, messages);
        
        // メッセージを更新
        setMessages(prev => {
          const lastMessage = prev[prev.length - 1];
          if (lastMessage.id === systemMessageId) {
            return [
              ...prev.slice(0, prev.length - 1),
              { ...lastMessage, content: response }
            ];
          }
          return [
            ...prev,
            {
              id: Date.now(),
              role: 'system',
              content: response,
            }
          ];
        });
        
        setIsTyping(false);
        
        // レスポンスをエクスポート用に保存
        if (response.trim()) {
          setExportContent(response);
        }
      }
    } catch (error) {
      console.error('Chat API error:', error);
      setIsTyping(false);
      
      // エラーメッセージを表示
      const errorMessage: Message = {
        id: Date.now(),
        role: 'system',
        content: `エラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}\n\n環境変数が正しく設定されているか確認してください。`,
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "API通信エラー",
        description: "環境変数（CLAUDE_API_KEY）が正しく設定されているか確認してください。",
        variant: "destructive",
      });
    }
  };

  // Enterキーでの送信（Shift+Enterは改行）
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // テキストのダウンロード
  const handleSaveContent = () => {
    if (!exportContent.trim()) {
      toast({
        title: "ダウンロードするコンテンツがありません",
        description: "AIからの応答を受け取ってからダウンロードしてください。",
        variant: "destructive",
      });
      return;
    }

    // テキストファイルとしてダウンロード
    const blob = new Blob([exportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AIテキスト_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    
    // クリーンアップ
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
    
    toast({
      title: "テキストファイルをダウンロードしました",
    });
  };

  // 会話のクリア (削除ボタンと同じ機能)
  const handleDeleteContent = () => {
    setMessages([{
      id: Date.now(),
      role: 'system',
      content: 'AI文章作成アシスタントへようこそ。どのような文章を作成したいですか？',
    }]);
    setExportContent('');
    toast({
      title: "会話をクリアしました",
    });
  };

  // 会話のクリア
  const handleClearConversation = () => {
    setMessages([{
      id: Date.now(),
      role: 'system',
      content: 'AI文章作成アシスタントへようこそ。どのような文章を作成したいですか？',
    }]);
    setExportContent('');
    toast({
      title: "会話をクリアしました",
    });
  };

  // サイドバー折りたたみフラグ（デフォルトで開いた状態）
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const hoverAreaRef = useRef<HTMLDivElement>(null);

  // ホバー時の処理
  const handleHoverStart = () => {
    setIsHovering(true);
    // ホバー時にサイドバーを開く
    if (isSidebarCollapsed) {
      setIsSidebarCollapsed(false);
    }
  };

  const handleHoverEnd = () => {
    setIsHovering(false);
    // ホバーが外れたらサイドバーを閉じる（ユーザーが明示的に開いた場合を除く）
    if (!isSidebarCollapsed && !sidebarRef.current?.contains(document.activeElement)) {
      setIsSidebarCollapsed(true);
    }
  };

  // サイドバーを固定するためのトグル関数
  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="flex h-full overflow-hidden">

      {/* ホバーエリア */}
      <div 
        ref={hoverAreaRef}
        className="absolute left-0 h-full w-8 z-10"
        onMouseEnter={handleHoverStart}
        onMouseLeave={handleHoverEnd}
      />

      {/* 左側: アシスタントリスト (折りたたみ可能) */}
      <div 
        ref={sidebarRef}
        className={`h-full border-r bg-gray-50 overflow-y-auto transition-all duration-300 ease-in-out ${
          isSidebarCollapsed && !isHovering ? 'w-0 opacity-0' : 'w-72 opacity-100'
        }`}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => {
          setIsHovering(false);
          // 明示的に開かれていない場合は自動的に閉じる
          if (!isSidebarCollapsed) {
            setTimeout(() => {
              if (!isHovering) {
                setIsSidebarCollapsed(true);
              }
            }, 300);
          }
        }}
      >
        <div className="w-72">
          <h2 className="text-lg font-semibold p-4 border-b flex justify-between items-center">
            <span>利用可能なアシスタント</span>
            <div className="flex items-center">
              <Link href="/assistants" title="アシスタント管理" className="mr-2">
                <Settings className="h-5 w-5 text-gray-500 hover:text-gray-700" />
              </Link>
              <button 
                onClick={toggleSidebar}
                className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                title={isSidebarCollapsed ? "サイドバーを固定する" : "サイドバーを閉じる"}
              >
                <ChevronRight className={`h-5 w-5 text-gray-500 transition-transform duration-300 ${
                  isSidebarCollapsed ? '' : 'transform rotate-180'
                }`} />
              </button>
            </div>
          </h2>
          <div className="p-3 space-y-2">
            {isLoadingAssistants ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : (
              assistants.map(assistant => (
                <Card 
                  key={assistant.id}
                  className={`p-3 cursor-pointer transition-all ${
                    selectedAssistant.id === assistant.id ? 'border-[#3f51b5] bg-[#f0f2ff]' : ''
                  }`}
                  onClick={() => handleAssistantChange(assistant)}
                >
                  <h3 className="font-medium">{assistant.title || assistant.name}</h3>
                  <p className="text-xs text-gray-600 mt-1">{assistant.description}</p>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 中央: チャットエリア */}
      <div className="flex-1 flex flex-col">
        {/* メッセージ表示エリア - ヘッダーを削除してスペースを広く使う */}
        <div className="flex-1 overflow-y-auto p-4 bg-[#f5f7fa]">
          <div className="space-y-4">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`px-4 py-3 rounded-lg ${
                    message.role === 'user' 
                      ? 'bg-[#3f51b5] text-white ml-2 max-w-[70%]' 
                      : 'bg-white border border-gray-200 text-gray-800 max-w-[80%] shadow-sm'
                  }`}
                >
                  <p className="whitespace-pre-line">{message.content}</p>
                </div>
              </div>
            ))}
            
            {/* ストリーミング中はタイピングインジケーターを表示しない - 既に応答が表示されているため */}
            
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* 右側: データパネルと入力エリア */}
      <div className="w-96 flex flex-col border-l max-h-full">
        <Tabs defaultValue="files" className="flex flex-col h-[calc(100% - 230px)]">
          <TabsList className="w-full justify-start border-b">
            <TabsTrigger value="files">ファイル</TabsTrigger>
            <TabsTrigger value="preview">プレビュー</TabsTrigger>
          </TabsList>
          
          <TabsContent value="files" className="p-4 overflow-y-auto flex-1">
            <div 
              className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center cursor-pointer hover:bg-gray-50"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-6 w-6 mx-auto text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">クリックしてファイルを選択</p>
              <p className="mt-1 text-xs text-gray-400">またはファイルをドラッグ&amp;ドロップ</p>
              <input 
                type="file" 
                multiple 
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden" 
              />
            </div>
            
            {files.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">アップロード済みファイル</h3>
                <div className="space-y-2">
                  {files.map((file, index) => (
                    <FilePreview 
                      key={index} 
                      file={file} 
                      onRemove={() => handleFileRemove(index)} 
                    />
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="preview" className="p-4 overflow-y-auto flex-1">
            {exportContent ? (
              <div className="whitespace-pre-line border rounded p-3">
                {exportContent}
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                プレビューするコンテンツがありません
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        {/* 入力エリア - 高さ固定 */}
        <div className="border-t p-4 h-[230px] flex flex-col">
          <Textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="AIに指示を送信..."
            className="h-[150px] max-h-[150px] resize-none mb-2 overflow-y-auto flex-none"
            disabled={isTyping}
          />
          
          <div className="flex justify-between">
            <Button
              onClick={handleDeleteContent}
              variant="outline"
              className="text-gray-700"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              会話をクリア
            </Button>
            
            <Button
              onClick={handleSaveContent}
              variant="outline"
              className="text-gray-700"
              disabled={!exportContent}
            >
              <Save className="h-4 w-4 mr-1" />
              ダウンロード
            </Button>
            
            <Button
              onClick={sendMessage}
              className="bg-[#3f51b5] hover:bg-[#4a5dc7]"
              disabled={!inputValue.trim() || isTyping}
            >
              <Send className="h-4 w-4 mr-1" />
              送信
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}