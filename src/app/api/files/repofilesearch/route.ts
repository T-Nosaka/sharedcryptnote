import { UserInfo } from "@/app/models/userinfo";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import fs from 'fs/promises';
import path from "path";

// 再帰的にファイルを検索する関数
async function searchFiles(dir: string, keyword: string, baseDir: string): Promise<{ name: string; isDirectory: boolean }[]> {
  let results: { name: string; isDirectory: boolean }[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    // .git ディレクトリは無視する
    if (entry.isDirectory() && entry.name === '.git') {
      continue;
    }

    if (entry.isDirectory()) {
      results = results.concat(await searchFiles(fullPath, keyword, baseDir));
    } else if (entry.name.toLowerCase().includes(keyword.toLowerCase())) {
      results.push({ 
        name: path.relative(baseDir, fullPath),
        isDirectory: false 
      });
    }
  }

  return results;
}

/*
 * リポジトリファイル検索
 */
export async function POST(req: NextRequest) {
  try {
    // リクエストからパスを取得（例: ?path=my-repo/sub-dir）
    const { relativePath, gitinfostr, keyword } = await req.json();

    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'session is required' }, { status: 400 });
    }
    if (!gitinfostr) {
      return NextResponse.json({ error: 'gitinfostr is required' }, { status: 400 });
    }
    if (!keyword) {
      return NextResponse.json({ error: 'keyword is required' }, { status: 400 });
    }

    //ユーザー取得
    const userinfo : UserInfo = session.user.info;
    const gitinfo = await userinfo.getGitInfo(gitinfostr);
    if(!gitinfo ){
        return NextResponse.json({ error: 'need select repository' }, { status: 400 });
    }

    // セキュリティチェック: ルートディレクトリより上を参照しないようにする
    const absolutePath = path.join(gitinfo.baseDir(), relativePath);
    if (!absolutePath.startsWith(gitinfo.baseDir())) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    const fileList = await searchFiles(absolutePath, keyword, absolutePath);

    // Sort the list by name
    fileList.sort((a, b) => {
      return a.name.localeCompare(b.name); // sort by name
    });

    return NextResponse.json(fileList);
  } catch (error) {
    console.error('Error fetching file list:', error);
    return NextResponse.json({ error: 'Failed to retrieve file list' }, { status: 500 });
  }
}
