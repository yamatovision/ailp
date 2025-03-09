// login-form.tsx の修正案

// 問題点:
// 1. setTimeout内でのrouter.pushとwindow.location.hrefの二重リダイレクト
// 2. セッション確立とリダイレクトのタイミングの問題

// 修正案:
async function onSubmit(values: FormValues) {
  setIsFormSubmitting(true);

  try {
    // 統一されたログイン処理を実行
    const result = await login(values.email, values.password);

    if (!result.success) {
      toast({
        variant: 'destructive',
        title: 'ログインエラー',
        description: result.error || 'ログインに失敗しました',
      });
      setIsFormSubmitting(false);
      return;
    }

    toast({
      title: 'ログイン成功',
      description: 'ダッシュボードにリダイレクトします',
    });

    // 単純化: セッションの確立を待ってから一度だけリダイレクト
    // タイムアウトを長めに設定して、セッションが確実に確立されるようにする
    setTimeout(() => {
      // Next.jsのルーターを使用 - routerの代わりにwindow.location.hrefを使用するとブラウザのフルリロードが発生
      window.location.href = '/dashboard';
    }, 1000);
  } catch (error) {
    toast({
      variant: 'destructive',
      title: 'ログインエラー',
      description: '予期せぬエラーが発生しました',
    });
  } finally {
    setIsFormSubmitting(false);
  }
}

// 問題の原因と解決策:
// 
// 1. router.pushによるリダイレクトとwindow.location.hrefによるリダイレクトが競合し、
//    タイミングによっては意図しない動作を引き起こしている可能性がある。
//    解決策: 単一のリダイレクト方法に統一する。
//
// 2. タイムアウトが短すぎてセッションが完全に確立される前にリダイレクトが行われている可能性がある。
//    解決策: タイムアウトを長めに設定する。
//
// 3. Next.jsのルーターによるリダイレクトはクライアントサイドのルーティングであり、
//    認証情報が完全に反映されていない可能性がある。
//    解決策: window.location.hrefを使用してフルページリロードを強制する。
//
// 4. キャッシュの問題がある可能性がある。
//    解決策: キャッシュをバイパスするためのクエリパラメータを追加する。
//    例: window.location.href = '/dashboard?t=' + Date.now();

// auth-context.tsx の修正案:
// ログイン成功時にも明示的にリダイレクト処理を追加する

async function login(email: string, password: string) {
  const result = await storeLogin(email, password);
  
  if (result.success) {
    // ログイン成功時のリダイレクト処理を追加
    window.location.href = '/dashboard?t=' + Date.now();
  }
  
  return result;
}