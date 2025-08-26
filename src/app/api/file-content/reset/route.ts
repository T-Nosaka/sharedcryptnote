import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/app/lib/auth";
import { UserInfo } from "@/app/models/userinfo";
import path from "path";
import fs from 'fs/promises';


/**
 * ファイルリセット
 * @param req NextRequestオブジェクト
 * @returns ファイルの内容またはエラーレスポンス
 */
export async function POST(req: NextRequest) {
  try {

    const { gitinfostr, selectFilePath } = await req.json();

    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'session is required' }, { status: 400 });
    }

    if (!selectFilePath) {
      return NextResponse.json({ error: 'selectFilePath is required' }, { status: 400 });
    }

    if (!gitinfostr) {
      return NextResponse.json({ error: 'gitinfostr is required' }, { status: 400 });
    }

    //ユーザー取得
    const userinfo : UserInfo = session.user.info;
    const gitinfo = await userinfo.getGitInfo(gitinfostr);
    if(!gitinfo ){
        return NextResponse.json({ error: 'need select repository' }, { status: 400 });
    }

    // セキュリティチェック: ルートディレクトリより上を参照しないようにする
    const absoluteFilePath = path.join(gitinfo.baseDir(), selectFilePath);
    if (!absoluteFilePath.startsWith(gitinfo.baseDir())) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    // ファイルが存在し、ファイルであることを確認
    const stats = await fs.stat(absoluteFilePath);
    if (stats.isFile()) {
        await fs.unlink(absoluteFilePath);
        await gitinfo.FileReset(absoluteFilePath);
    } else {
        await fs.rmdir( absoluteFilePath, { recursive: true });
        await gitinfo.FileReset(absoluteFilePath);
    }

    return NextResponse.json({ message: 'File reset successfully' }, { status: 200 });
  } catch (error ) {
    console.error('Error reading file:', error);
    return NextResponse.json({ error: 'Failed to reset file' }, { status: 500 });
  }
}
