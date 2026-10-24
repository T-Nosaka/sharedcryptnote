import { UserInfo } from "@/app/models/userinfo";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { isEmailAllowed } from "@/app/lib/allowlist";
import fs from 'fs/promises';
import path from "path";

/*
 * リポジトリファイルリスト
 */
export async function POST(req: NextRequest) {
  try {
    // リクエストからパスを取得（例: ?path=my-repo/sub-dir）
    const { relativePath, gitinfostr } = await req.json();

    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'session is required' }, { status: 400 });
    }
    // ALLOWUSERS 制限: 許可外メアドは 403（既存セッション対策）
    if (!isEmailAllowed(session.user?.email)) {
      return NextResponse.json({ error: 'Forbidden: email not allowed' }, { status: 403 });
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
    // path.resolve で正規化してから比較する（.. による脱出と sibling prefix 攻撃を防ぐ）
    const baseDir = path.resolve(gitinfo.baseDir());
    const absolutePath = path.resolve(baseDir, relativePath);
    if (absolutePath !== baseDir && !absolutePath.startsWith(baseDir + path.sep)) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    const entries = await fs.readdir(absolutePath, { withFileTypes: true });

    const fileList = entries.map(entry => ({
      name: entry.name,
      isDirectory: entry.isDirectory(),
    }));

    // Sort the list: directories first, then by name
    fileList.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) {
        return -1; // a (directory) comes first
      }
      if (!a.isDirectory && b.isDirectory) {
        return 1; // b (directory) comes first
      }
      return a.name.localeCompare(b.name); // sort by name
    });

    if ( relativePath == "." ) {
      // ルートディレクトリの場合、.gitディレクトリを除外
      return NextResponse.json(fileList.filter(file => file.name !== '.git'));
    }

    return NextResponse.json(fileList);
  } catch (error) {
    console.error('Error fetching file list:', error);
    return NextResponse.json({ error: 'Failed to retrieve file list' }, { status: 500 });
  }
}
