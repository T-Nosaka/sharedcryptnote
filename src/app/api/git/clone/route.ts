import { UserInfo } from '@/app/models/userinfo';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/app/lib/auth';
import { getServerSession } from 'next-auth';

/*
 * Git Clone ハンドラ
 */
export async function POST(req: NextRequest) {
  try {
    const { url, name, sshkey } = await req.json();

    const session = await getServerSession(authOptions);

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }
    if (!session) {
      return NextResponse.json({ error: 'session is required' }, { status: 400 });
    }

    //ユーザー取得
    const userinfo : UserInfo = session.user.info;
  
    let modifysshkey = undefined
    if (sshkey.length > 0) {
      modifysshkey = sshkey+"\n"; // SSH鍵は改行を含む
    }

    //Git Clone処理
    if ( await userinfo.gitclone(url,name,modifysshkey) == false ) {
      return NextResponse.json({ error: 'Failed to clone repository' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Repository cloned successfully!' });

  } catch (error) {
    console.error('Error during git clone:', error);
    return NextResponse.json({ error: 'Failed to clone repository' }, { status: 500 });
  }
}

