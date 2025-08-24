import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/app/lib/auth";
import { UserInfo } from "@/app/models/userinfo";
import path from "path";
import fs from 'fs/promises';
import * as fsa from 'fs';

/**
 * 再帰的にディレクトリを探索し、すべてのファイルパスのリストを返します。
 * @param dirPath 探索を開始するディレクトリのパス
 * @returns ファイルパスの配列
 */
async function _getAllFiles(dirPath: string): Promise<string[]> {
    let files: string[] = [];
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
            files = files.concat(await _getAllFiles(fullPath));
        } else {
            files.push(fullPath);
        }
    }
    return files;
}

/**
 * ファイル削除
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
        //File delete
        fsa.unlinkSync(absoluteFilePath);
        await gitinfo.Delete(absoluteFilePath);
    } else {
        //Directory delete
        const deletefiles = await _getAllFiles(absoluteFilePath);

        await fs.rmdir( absoluteFilePath, { recursive: true });
        for await ( const filepath of deletefiles ) {
            await gitinfo.Delete(filepath);
        }
    }

    return NextResponse.json({ message: 'File delete successfully' }, { status: 200 });
  } catch (error ) {
    console.error('Error reading file:', error);
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
  }
}
