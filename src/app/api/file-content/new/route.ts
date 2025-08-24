import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/app/lib/auth";
import path from "path";
import { UserInfo } from "@/app/models/userinfo";
import fs from 'fs/promises';
import { DEFAULTENCODE, sleep } from "@/app/utils/constants";

/**
 * 新規ファイル作成
 * @param req NextRequestオブジェクト (bodyにfilePathとcontent、encodingを含む)
 * @returns 成功メッセージまたはエラーレスポンス
 */
export async function POST(req: NextRequest) {
  try {
    const { gitinfostr, currentPath, newFilename, kindtype } = await req.json();

    if (!gitinfostr ) {
      return NextResponse.json({ error: 'gitinfostr are required' }, { status: 400 });
    }
    if (!currentPath ) {
      return NextResponse.json({ error: 'currentPath are required' }, { status: 400 });
    }
    if (!newFilename || newFilename.length == 0 ) {
      return NextResponse.json({ error: 'newFilename are required' }, { status: 400 });
    }
    let filename = newFilename;
    if ( kindtype === "file" )
        filename = filename + ".txt";

    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'session is required' }, { status: 400 });
    }

    //ユーザー取得
    const userinfo : UserInfo = session.user.info;
    const gitinfo = await userinfo.getGitInfo(gitinfostr);
    if(!gitinfo ){
        return NextResponse.json({ error: 'need select repository' }, { status: 400 });
    }

    // セキュリティチェック: ルートディレクトリより上を参照しないようにする
    const absoluteFilePath = path.join(path.join(gitinfo.baseDir(), currentPath),filename);
    if (!absoluteFilePath.startsWith(gitinfo.baseDir())) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    if ( kindtype === "folder" ) {
        // ディレクトリ作成
        const dir = absoluteFilePath;
        try {
            await fs.mkdir(dir, { recursive: true });

            await gitinfo.Add( dir );

        } catch {
        }
    } else {
        // ファイルが存在する場合はエラー
        try {
            await fs.access(absoluteFilePath);
            return NextResponse.json({ error: 'File already exists' }, { status: 400 });
        } catch {
            // ファイルが存在しない場合は何もしない
        }
        // 空ファイル作成
        await fs.writeFile(absoluteFilePath, '', { encoding: DEFAULTENCODE });

        await gitinfo.Add( absoluteFilePath );
    }

    return NextResponse.json({ message: 'File new successfully!' });
  } catch (error) {
    console.error('Error writing file:', error);
    return NextResponse.json({ error: 'Failed to new file content' }, { status: 500 });
  }
}
