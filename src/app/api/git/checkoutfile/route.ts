import { UserInfo } from '@/app/models/userinfo';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/app/lib/auth';
import { getServerSession } from 'next-auth';
import path from "path";

/*
 * Git Checkout file
 */
export async function POST(req: NextRequest) {
  try {
    const { gitinfostr, mode, selectFilePath, hash } = await req.json();

    const session = await getServerSession(authOptions);

    if (!gitinfostr) {
      return NextResponse.json({ error: 'gitinfostr is required' }, { status: 400 });
    }
    if (!session) {
      return NextResponse.json({ error: 'session is required' }, { status: 400 });
    }
    if (!mode) {
      return NextResponse.json({ error: 'mode is required' }, { status: 400 });
    }
    if (!selectFilePath) {
      return NextResponse.json({ error: 'selectFilePath is required' }, { status: 400 });
    }

    //ユーザー取得
    const userinfo : UserInfo = session.user.info;
    const gitinfo = await userinfo.getGitInfo(gitinfostr);
    if (!gitinfo) {
      return NextResponse.json({ error: 'gitinfo is required' }, { status: 400 });
    }

    // セキュリティチェック: ルートディレクトリより上を参照しないようにする
    // path.resolve で正規化してから比較する（.. による脱出と sibling prefix 攻撃を防ぐ）
    const baseDir = path.resolve(gitinfo.baseDir());
    const absoluteFilePath = path.resolve(baseDir, selectFilePath);
    if (absoluteFilePath !== baseDir && !absoluteFilePath.startsWith(baseDir + path.sep)) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    switch(mode) {
        case 'hash':
            await gitinfo?.CheckoutHash( selectFilePath, hash );
            break;
        case 'ours':
            await gitinfo?.CheckoutOurs( absoluteFilePath );
            break;
        default:
            await gitinfo?.CheckoutTheirs( absoluteFilePath );
            break;
    }

    return NextResponse.json({ message: 'Repository Checkout file successfully!' });

  } catch (error) {
    console.error('Error during git Checkout file:', error);
    const message = error instanceof Error ? error.message : String(error);

    return NextResponse.json({ error: `Failed to Checkout file repository. ${message}` }, { status: 500 });
  }
}
