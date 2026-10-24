import { UserInfo } from '@/app/models/userinfo';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/app/lib/auth';
import { isEmailAllowed } from '@/app/lib/allowlist';
import { getServerSession } from 'next-auth';

/*
 * Git LogDetail ハンドラ
 */
export async function POST(req: NextRequest) {
  try {
    const { gitinfostr, hash } = await req.json();

    const session = await getServerSession(authOptions);

    if (!gitinfostr) {
      return NextResponse.json({ error: 'gitinfostr is required' }, { status: 400 });
    }
    if (!session) {
      return NextResponse.json({ error: 'session is required' }, { status: 400 });
    }
    // ALLOWUSERS 制限: 許可外メアドは 403（既存セッション対策）
    if (!isEmailAllowed(session.user?.email)) {
      return NextResponse.json({ error: 'Forbidden: email not allowed' }, { status: 403 });
    }

    //ユーザー取得
    const userinfo : UserInfo = session.user.info;
    const gitinfo = await userinfo.getGitInfo(gitinfostr);
    if (!gitinfo) {
      return NextResponse.json({ error: 'gitinfo is required' }, { status: 400 });
    }
 
    const diffresult = await gitinfo?.LogDetail(hash);

    return NextResponse.json({ diffresult: diffresult,message: 'Repository logdetail successfully!' });

  } catch (error) {
    console.error('Error during git logdetail:', error);
    const message = error instanceof Error ? error.message : String(error);

    return NextResponse.json({ error: `Failed to logdetail repository. ${message}` }, { status: 500 });
  }
}

