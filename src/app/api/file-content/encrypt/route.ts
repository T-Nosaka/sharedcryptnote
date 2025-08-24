import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/app/lib/auth";
import { UserInfo } from "@/app/models/userinfo";
import path from "path";
import fs from 'fs/promises';
import * as fsa from 'fs';
import { TomboCrypt } from "@/app/api/file-content/tombo_crypto";
import { textExtensions } from "@/app/utils/constants";

/**
 * ファイル暗号化
 * @param req NextRequestオブジェクト
 * @returns ファイルの内容またはエラーレスポンス
 */
export async function POST(req: NextRequest) {
  try {

    const { gitinfostr, selectFilePath, password } = await req.json();

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

    if (!password || password.length < 5) {
      return NextResponse.json({ error: 'password is required. need password length 5 word.' }, { status: 400 });
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
    if (!stats.isFile()) {
      return NextResponse.json({ error: 'Path is not a file' }, { status: 400 });
    }

    //暗号処理
    const fileExtension = path.extname(selectFilePath);
    if (fileExtension && textExtensions.includes(fileExtension.toLowerCase())) {

        //拡張子変更
        const newFilePath = absoluteFilePath.slice(0, -fileExtension.length) + '.chi';

        // Tombo暗号
        const crypto = new TomboCrypt();
        const psword = new TextEncoder().encode(password);
        const passcode = TomboCrypt.passcode(psword);

        const contents = fsa.readFileSync(absoluteFilePath);
        const crypted = await crypto.encode(passcode, contents);
        await fsa.writeFileSync(newFilePath,crypted);

        //File delete
        fsa.unlinkSync(absoluteFilePath);
        await gitinfo.Delete(absoluteFilePath);

        //Git add
        await gitinfo.Add(newFilePath);
    } else {
        return NextResponse.json({ error: 'Failed from encrypted file' }, { status: 400 });
    }

    return NextResponse.json({ message: 'File encrypted successfully' }, { status: 200 });
  } catch (error ) {
    console.error('Error reading file:', error);
    return NextResponse.json({ error: 'Failed to read file content' }, { status: 500 });
  }
}
