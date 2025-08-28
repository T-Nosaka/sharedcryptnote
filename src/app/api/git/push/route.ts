import { UserInfo } from '@/app/models/userinfo';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/app/lib/auth';
import { getServerSession } from 'next-auth';

/*
 * Git Push ハンドラ
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
 
    await gitinfo?.Push( );

    return NextResponse.json({ message: 'Repository push successfully!' });

  } catch (error) {
    console.error('Error during git push:', error);
    const message = error instanceof Error ? error.message : String(error);
    
    return NextResponse.json({ error: `Failed to push repository. ${message}` }, { status: 500 });
  }
}
