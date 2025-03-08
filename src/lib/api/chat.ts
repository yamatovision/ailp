// Chat API クライアント

// チャットメッセージの型
export type Message = {
  id: number;
  role: 'user' | 'system';
  content: string;
};

/**
 * チャットメッセージを送信し、AIからの応答を取得する
 */
export async function sendChatMessage(message: string, history: Message[] = []): Promise<string> {
  try {
    // 現在のURLのポートを使用
    const apiUrl = window.location.hostname === 'localhost' 
      ? `${window.location.protocol}//${window.location.hostname}:${window.location.port}/api/chat`
      : '/api/chat';
      
    console.log('Using API URL:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        history,
      }),
    });

    // レスポンスをテキストとして取得
    const text = await response.text();
    
    // HTML形式のエラーレスポンスをチェック（<!DOCTYPE などで始まる場合）
    if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
      console.error('HTML error response received:', text.substring(0, 150) + '...');
      throw new Error('サーバーからHTMLエラーが返されました。環境変数が正しく設定されているか確認してください。');
    }
    
    // JSONとして解析
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error('Failed to parse response as JSON:', text.substring(0, 150) + '...');
      throw new Error('サーバーからの応答を解析できませんでした');
    }

    if (!response.ok) {
      throw new Error(data.error || 'Chat API request failed');
    }
    return data.response;
  } catch (error) {
    console.error('Error in chat API:', error);
    throw error;
  }
}