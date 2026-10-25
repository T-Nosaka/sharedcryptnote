import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/app/lib/auth";
import { isEmailAllowed } from "@/app/lib/allowlist";
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
    // ALLOWUSERS 制限: 許可外メアドは 403（既存セッション対策）
    if (!isEmailAllowed(session.user?.email)) {
      return NextResponse.json({ error: 'Forbidden: email not allowed' }, { status: 403 });
    }

    if (!selectFilePath) {
      return NextResponse.json({ error: 'selectFilePath is required' }, { status: 400 });
    }

    if (!gitinfostr) {
      return NextResponse.json({ error: 'gitinfostr is required' }, { status: 400 });
    }

    if (!password || password.length < 8) {
      return NextResponse.json({ error: 'password is required. need password length 8 characters or more.' }, { status: 400 });
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
    const absoluteFilePath = path.resolve(baseDir, selectFilePath);
    if (absoluteFilePath !== baseDir && !absoluteFilePath.startsWith(baseDir + path.sep)) {
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
