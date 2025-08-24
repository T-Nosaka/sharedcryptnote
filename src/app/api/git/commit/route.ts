import { UserInfo } from '@/app/models/userinfo';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/app/lib/auth';
import { getServerSession } from 'next-auth';

/*
 * Git Commit ハンドラ
 */
export async function POST(req: NextRequest) {
  try {
    const { gitinfostr, commitmessage } = await req.json();

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
 
    await gitinfo?.Commit( commitmessage );

    return NextResponse.json({ message: 'Repository commit successfully!' });

  } catch (error) {
    console.error('Error during git commit:', error);
    return NextResponse.json({ error: 'Failed to commit repository' }, { status: 500 });
  }
}

