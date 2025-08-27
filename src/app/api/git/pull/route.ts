import { UserInfo } from '@/app/models/userinfo';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/app/lib/auth';
import { getServerSession } from 'next-auth';

/*
 * Git Pull ハンドラ
 */
export async function POST(req: NextRequest) {
  try {
    const { gitinfostr } = await req.json();

    const session = await getServerSession(authOptions);

    if (!gitinfostr) {
      return NextResponse.json({ error: 'gitinfostr is required' }, { status: 400 });
    }
    if (!session) {
      return NextResponse.json({ error: 'session is required' }, { status: 400 });
    }

    //ユーザー取得
    const userinfo : UserInfo = session.user.info;
    const gitinfo = await userinfo.getGitInfo(gitinfostr);
    if (!gitinfo) {
      return NextResponse.json({ error: 'gitinfo is required' }, { status: 400 });
    }
 
    await gitinfo?.Pull( );

    return NextResponse.json({ message: 'Repository pull successfully!' });

  } catch (error) {
    console.error('Error during git pull:', error);
    const message = error instanceof Error ? error.message : String(error);

    // コンフリクトエラーかどうかを判定
    if (message.includes('reconcile divergent') ) {
      return NextResponse.json({ 
        error: 'コンフリクトが発生しました。ローカルの変更を「戻す」ボタンでリセットしてください。',
        code: 'PULL_CONFLICT' 
      }, { status: 409 }); // 409 Conflict
    }

    return NextResponse.json({ error: `Failed to pull repository. ${message}` }, { status: 500 });
  }
}
