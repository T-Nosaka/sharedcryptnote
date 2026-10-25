import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/app/lib/auth";
import { isEmailAllowed } from "@/app/lib/allowlist";
import { UserInfo } from "@/app/models/userinfo";
import path from "path";
import fs from 'fs/promises';
import * as fsa from 'fs';
import { TomboCrypt } from "@/app/api/file-content/tombo_crypto";
import { encryptExtensions } from "@/app/utils/constants";
import { SncCrypt, isSnc1Data } from "@/app/api/file-content/snc_crypto";
import { isAsciiPassword, getPasswordMinLength } from "@/app/utils/constants";

/**
 * ファイル復号化
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

    const minPw = getPasswordMinLength();
    if (!password || password.length < minPw) {
      return NextResponse.json({ error: `password is required. need password length ${minPw} characters or more.` }, { status: 400 });
    }
    if (typeof password !== 'string' || !isAsciiPassword(password)) {
      return NextResponse.json({ error: `password must be ASCII printable characters (${minPw} or more).` }, { status: 400 });
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

    //復号処理
    const fileExtension = path.extname(selectFilePath);
    let enc: 'snc1' | 'bf01' | null = null;
    if (fileExtension && encryptExtensions.includes(fileExtension.toLowerCase())) {

        //拡張子変更
        const newFilePath = absoluteFilePath.slice(0, -fileExtension.length) + '.txt';

        // Tombo暗号
        const contents = fsa.readFileSync(absoluteFilePath);
        const raw = new Uint8Array(contents);
        let decrypted: Uint8Array | null = null;
        enc = 'bf01';
        if (isSnc1Data(raw)) {
          const pwBytes = new TextEncoder().encode(password);
          decrypted = SncCrypt.decrypt(pwBytes, raw);
          enc = 'snc1';
        } else {
          const crypto = new TomboCrypt();
          const psword = new TextEncoder().encode(password);
          const passcode = TomboCrypt.passcode(psword);
          decrypted = await crypto.decode(passcode, contents);
        }
        if (!decrypted) {
            return NextResponse.json({ error: 'Failed to decrypt file. Please check your password.' }, { status: 400 });
        }
        await fsa.writeFileSync(newFilePath,decrypted);

        //File delete
        fsa.unlinkSync(absoluteFilePath);
        await gitinfo.Delete(absoluteFilePath);

        //Git add
        await gitinfo.Add(newFilePath);
    } else {
        return NextResponse.json({ error: 'Failed from decrypted file' }, { status: 400 });
    }

    return NextResponse.json({ message: 'File decrypted successfully', enc }, { status: 200 });
  } catch (error ) {
    console.error('Error reading file:', error);
    return NextResponse.json({ error: 'Failed to read file content' }, { status: 500 });
  }
}
