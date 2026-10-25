import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/app/lib/auth";
import { isEmailAllowed } from "@/app/lib/allowlist";
import { UserInfo } from "@/app/models/userinfo";
import path from "path";
import fs from 'fs/promises';
import { DEFAULTENCODE, encryptExtensions } from "@/app/utils/constants";
import * as fsa from 'fs';
import { TomboCrypt } from "../tombo_crypto";
import { SncCrypt, isSnc1Data } from "../snc_crypto";
import { isAsciiPassword, getPasswordMinLength } from "@/app/utils/constants";

/**
 * ファイルの内容を読み込む
 * @param req NextRequestオブジェクト
 * @returns ファイルの内容またはエラーレスポンス
 */
export async function POST(req: NextRequest) {
  try {

    const { gitinfostr, fileEncoding, relativeFilePath, fileExtension, password } = await req.json(); // encodingも取得

    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'session is required' }, { status: 400 });
    }
    // ALLOWUSERS 制限: 許可外メアドは 403（既存セッション対策）
    if (!isEmailAllowed(session.user?.email)) {
      return NextResponse.json({ error: 'Forbidden: email not allowed' }, { status: 403 });
    }

    if (!relativeFilePath) {
      return NextResponse.json({ error: 'File path is required' }, { status: 400 });
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
    const absoluteFilePath = path.resolve(baseDir, relativeFilePath);
    if (absoluteFilePath !== baseDir && !absoluteFilePath.startsWith(baseDir + path.sep)) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    // ファイルが存在し、ファイルであることを確認
    const stats = await fs.stat(absoluteFilePath);
    if (!stats.isFile()) {
      return NextResponse.json({ error: 'Path is not a file' }, { status: 400 });
    }

    if (fileExtension && encryptExtensions.includes((fileExtension as string).toLowerCase())) {
      const minPw = getPasswordMinLength();
      if (!password || (password as string).length < minPw) {
        return NextResponse.json({ error: `password is required. need password length ${minPw} characters or more.` }, { status: 400 });
      }
      if (typeof password !== 'string' || !isAsciiPassword(password)) {
        return NextResponse.json({ error: `password must be ASCII printable characters (${minPw} or more).` }, { status: 400 });
      }
    }

    let content = ""
    let enc: 'snc1' | 'bf01' | null = null
    if (fileExtension && encryptExtensions.includes(fileExtension.toLowerCase())) {
      // SNC1 / BF01 auto-detect (Phase1: magic-based)
      const encrypted = fsa.readFileSync(absoluteFilePath);
      const rawEnc = new Uint8Array(encrypted);

      let decrypted: Uint8Array | null = null;
      if (isSnc1Data(rawEnc)) {
        const pwBytes = new TextEncoder().encode(password);
        decrypted = SncCrypt.decrypt(pwBytes, rawEnc);
        enc = 'snc1';
      } else {
        const crypto = new TomboCrypt();
        const psword = new TextEncoder().encode(password);
        const passcode = TomboCrypt.passcode(psword);
        decrypted = await crypto.decode(passcode, encrypted);
        enc = 'bf01';
      }
      if (decrypted) {
        // 指定された文字コードでファイルの内容を読み込む
        if (fileEncoding == DEFAULTENCODE) {
            content = new TextDecoder().decode(decrypted);
        } else {
            content = new TextDecoder(fileEncoding).decode(decrypted);
        }
      } else {
        return NextResponse.json({ error: 'Failed to decrypt file' }, { status: 400 });
      }

    } else {
      // 指定された文字コードでファイルの内容を読み込む
      if (fileEncoding == DEFAULTENCODE) {
          content = await fs.readFile(absoluteFilePath, { encoding: fileEncoding as BufferEncoding });
      } else {
          const buffer = fsa.readFileSync(absoluteFilePath);
          const uint8Array = new Uint8Array(buffer);
          content = new TextDecoder(fileEncoding).decode(uint8Array);
      }
    }

    return NextResponse.json({ content, enc });
  } catch (error ) {
    console.error('Error reading file:', error);
    return NextResponse.json({ error: 'Failed to read file content' }, { status: 500 });
  }
}



