import { UserInfo } from '@/app/models/userinfo';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/app/lib/auth';
import { getServerSession } from 'next-auth';

/*
 * Git Status ハンドラ
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
 
    const statusresult = await gitinfo?.getChangedFiles();

    return NextResponse.json({ status:statusresult.changedFiles, ahead:statusresult.ahead, behind:statusresult.behind, message: 'Repository status successfully!' });

  } catch (error) {
    console.error('Error during git status:', error);
    return NextResponse.json({ error: 'Failed to status repository' }, { status: 500 });
  }
}

