'use client';

import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';

import { Message, sendChatMessage } from '@/lib/api/chat';

// タイピングインジケーターコンポーネント
const TypingIndicator = () => (
  <div className="flex items-center space-x-1 py-2 px-1">
    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }}></div>
    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }}></div>
    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }}></div>
  </div>
);

type ChatInterfaceProps = {
  initialMessages?: Message[];
  onComplete?: (messages: Message[]) => void;
};

export default function ChatInterface({ initialMessages = [], onComplete }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages.length ? initialMessages : [
    {
      id: 1,
      role: 'system',
      content: 'LP作成アシスタントへようこそ。どのようなランディングページを作成したいですか？',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // メッセージが追加されたときに自動スクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // メッセージ送信処理
  const sendMessage = async () => {
    if (!inputValue.trim()) return;

    // ユーザーメッセージを追加
    const userMessage: Message = {
      id: Date.now(),
      role: 'user',
      content: inputValue,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      // API Helperを使用してメッセージを送信
      const messageToSend = inputValue;
      const response = await sendChatMessage(messageToSend, messages);
      
      // AIからの応答をメッセージに追加
      const systemMessage: Message = {
        id: Date.now(),
        role: 'system',
        content: response,
      };
      
      setMessages((prev) => [...prev, systemMessage]);
      setIsTyping(false);
      
    } catch (error) {
      console.error('Chat API error:', error);
      setIsTyping(false);
      
      // エラーメッセージをシステムメッセージとして表示
      const errorMessage: Message = {
        id: Date.now(),
        role: 'system',
        content: 'すみません、エラーが発生しました。もう一度お試しください。',
      };
      
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  // Enterキーでの送信（Shift+Enterは改行）
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // 「次へ」ボタンのクリックハンドラ
  const handleNextStep = () => {
    if (onComplete) {
      onComplete(messages);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold mb-2">AIアシスタントとチャット</h1>
            <p className="text-muted-foreground">
              AIに作成したいLPについて説明してください。商品・サービスの内容、ターゲット層、特徴などを伝えると、最適なLPを提案します。
            </p>
          </div>
          
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in`}
            >
              {message.role === 'system' && (
                <Avatar className="h-9 w-9 mr-2 bg-primary text-primary-foreground">
                  AI
                </Avatar>
              )}
              <div 
                className={`px-4 py-3 rounded-lg ${
                  message.role === 'user' 
                    ? 'bg-primary text-primary-foreground ml-2 max-w-[70%]' 
                    : 'bg-white border max-w-[80%] shadow-sm'
                }`}
              >
                <p className="whitespace-pre-line leading-relaxed">{message.content}</p>
              </div>
              {message.role === 'user' && (
                <Avatar className="h-9 w-9 ml-2 bg-slate-700">
                  You
                </Avatar>
              )}
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <Avatar className="h-9 w-9 mr-2 bg-primary text-primary-foreground">
                AI
              </Avatar>
              <Card className="px-4 py-3 max-w-[80%] shadow-sm">
                <TypingIndicator />
              </Card>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      <div className="border-t p-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end space-x-2">
            <Textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="AIに指示を送信... (例: 商品の特徴、メリット、ターゲットユーザーなど)"
              className="flex-1 min-h-[80px] resize-none"
              disabled={isTyping}
            />
            <Button 
              onClick={sendMessage} 
              variant="default"
              className="h-10 px-4"
              disabled={!inputValue.trim() || isTyping}
            >
              <Send className="h-4 w-4 mr-2" />
              送信
            </Button>
          </div>
          
          <div className="flex justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              十分な情報が集まったら、「次へ」ボタンをクリックしてください
            </p>
            <Button 
              onClick={handleNextStep}
              className="px-6"
              variant="default"
            >
              次へ: LP生成
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}