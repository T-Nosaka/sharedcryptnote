import { UserInfo } from '@/app/models/userinfo';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/app/lib/auth';
import { getServerSession } from 'next-auth';

/*
 * Git Delete
 */
export async function POST(req: NextRequest) {
  try {
    const { reponame } = await req.json();

    const session = await getServerSession(authOptions);

    if (!reponame) {
      return NextResponse.json({ error: 'reponame is required' }, { status: 400 });
    }
    if (!session) {
      return NextResponse.json({ error: 'session is required' }, { status: 400 });
    }

    //ユーザー取得
    const userinfo : UserInfo = session.user.info;
    const gitinfostr = await userinfo.selectRepo(reponame);
    if (!gitinfostr) {
      return NextResponse.json({ error: 'gitinfostr is required' }, { status: 400 });
    }

    const gitinfo = await userinfo.getGitInfo(gitinfostr);
    if (!gitinfo) {
      return NextResponse.json({ error: 'gitinfo is required' }, { status: 400 });
    }
 
    await userinfo.deleteGitInfo(gitinfo);

    return NextResponse.json({ message: 'Repository delete successfully!' });

  } catch (error) {
    console.error('Error during git delete:', error);
    const message = error instanceof Error ? error.message : String(error);

    return NextResponse.json({ error: `Failed to delete repository. ${message}` }, { status: 500 });
  }
}

