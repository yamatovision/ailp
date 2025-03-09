// Chat API クライアント

// チャットメッセージの型
export type Message = {
  id: number;
  role: 'user' | 'system';
  content: string;
};

/**
 * チャットメッセージを送信し、AIからの応答を取得する（非ストリーミング）
 */
export async function sendChatMessage(message: string, history: Message[] = []): Promise<string> {
  try {
    // 現在のURLのポートを使用
    const apiUrl = window.location.hostname === 'localhost' 
      ? `${window.location.protocol}//${window.location.hostname}:${window.location.port}/api/chat`
      : '/api/chat';
      
    console.log('Using API URL:', apiUrl);
    
    // セッショントークンを取得する方法
    let token = null;
    
    // 方法1: ローカルストレージから直接トークンを取得
    try {
      const supabaseToken = localStorage.getItem('supabase.auth.token');
      if (supabaseToken) {
        token = JSON.parse(supabaseToken)?.currentSession?.access_token;
      }
    } catch (e) {
      console.warn('ローカルストレージからのトークン取得に失敗:', e);
    }
    
    // 方法2: Supabaseセッションからも取得を試みる
    if (!token) {
      try {
        const sbSession = localStorage.getItem('sb-localhost-auth-token');
        if (sbSession) {
          token = JSON.parse(sbSession)?.access_token;
        }
      } catch (e) {
        console.warn('Supabaseセッションからのトークン取得に失敗:', e);
      }
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 認証トークンがあれば追加
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify({
        message,
        history,
        stream: false
      }),
      // 認証Cookieを送信
      credentials: 'include',
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

/**
 * チャットメッセージを送信し、ストリーミングで応答を取得する
 */
export async function streamChatMessage(
  message: string, 
  history: Message[] = [], 
  onChunk: (chunk: string) => void, 
  onDone: () => void
): Promise<void> {
  try {
    // 現在のURLのポートを使用
    const apiUrl = window.location.hostname === 'localhost' 
      ? `${window.location.protocol}//${window.location.hostname}:${window.location.port}/api/chat`
      : '/api/chat';
      
    console.log('ストリーミングモードでAPIを呼び出します:', apiUrl);
    console.log('リクエストデータ:', { 
      messageLength: message.length,
      historyCount: history.length,
      stream: true 
    });
    
    // セッショントークンを取得する方法
    let token = null;
    
    // 方法1: ローカルストレージから直接トークンを取得
    try {
      const supabaseToken = localStorage.getItem('supabase.auth.token');
      if (supabaseToken) {
        token = JSON.parse(supabaseToken)?.currentSession?.access_token;
      }
    } catch (e) {
      console.warn('ローカルストレージからのトークン取得に失敗:', e);
    }
    
    // 方法2: Supabaseセッションからも取得を試みる
    if (!token) {
      try {
        const sbSession = localStorage.getItem('sb-localhost-auth-token');
        if (sbSession) {
          token = JSON.parse(sbSession)?.access_token;
        }
      } catch (e) {
        console.warn('Supabaseセッションからのトークン取得に失敗:', e);
      }
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 認証トークンがあれば追加
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify({
        message,
        history,
        stream: true
      }),
      // 認証Cookieを送信
      credentials: 'include',
    });

    if (!response.ok) {
      const text = await response.text();
      let errorMessage = 'Stream request failed';
      try {
        const errorData = JSON.parse(text);
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        // JSONとして解析できない場合は元のエラーメッセージを使用
      }
      throw new Error(errorMessage);
    }

    // レスポンスヘッダーのログ出力
    console.log('ストリーミングレスポンスのヘッダー:', 
      [...response.headers.entries()].reduce((obj, [key, val]) => ({ ...obj, [key]: val }), {})
    );
    
    // Server-Sent Eventsの処理
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('応答からReaderを取得できませんでした');
    }
    
    console.log('レスポンスボディからリーダーを取得しました');
    const decoder = new TextDecoder();
    let buffer = '';
    let chunkCount = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        console.log('ストリームの読み取りが完了しました');
        onDone();
        break;
      }

      // バッファに新しいチャンクを追加
      const decodedValue = decoder.decode(value, { stream: true });
      buffer += decodedValue;
      
      // デバッグ情報
      if (chunkCount === 0) {
        console.log('最初のチャンクを受信:', decodedValue.substring(0, 100));
      }
      chunkCount++;
      
      // SSEフォーマットの行を処理（'data: {...}\n\n'）
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || ''; // 最後の不完全なチャンクを残す

      let processedData = 0;
      for (const line of lines) {
        if (line.trim() === '') continue;
        
        const dataMatch = line.match(/^data: (.+)$/);
        if (!dataMatch) {
          console.log('マッチしないライン:', line);
          continue;
        }
        
        const data = dataMatch[1];
        if (data === '[DONE]') {
          console.log('ストリーム終了マーカー [DONE] を受信');
          onDone();
          continue;
        }
        
        try {
          const parsedData = JSON.parse(data);
          if (parsedData.text) {
            processedData++;
            onChunk(parsedData.text);
          }
        } catch (e) {
          console.error('ストリーミングチャンクの解析に失敗:', e, 'データ:', data);
        }
      }
      
      if (chunkCount % 10 === 0 || processedData > 0) {
        console.log(`チャンク #${chunkCount}: ${processedData}個のデータパケットを処理`);
      }
    }
  } catch (error) {
    console.error('Error in streaming chat API:', error);
    throw error;
  }
}