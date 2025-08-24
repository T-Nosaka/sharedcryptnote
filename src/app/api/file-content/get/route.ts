import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/app/lib/auth";
import { UserInfo } from "@/app/models/userinfo";
import path from "path";
import fs from 'fs/promises';
import { DEFAULTENCODE, encryptExtensions } from "@/app/utils/constants";
import * as fsa from 'fs';
import { TomboCrypt } from "../tombo_crypto";

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
    const absoluteFilePath = path.join(gitinfo.baseDir(), relativeFilePath);
    if (!absoluteFilePath.startsWith(gitinfo.baseDir())) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    // ファイルが存在し、ファイルであることを確認
    const stats = await fs.stat(absoluteFilePath);
    if (!stats.isFile()) {
      return NextResponse.json({ error: 'Path is not a file' }, { status: 400 });
    }

    let content = ""
    if (fileExtension && encryptExtensions.includes(fileExtension.toLowerCase())) {
      // Tombo暗号
      const encrypted = fsa.readFileSync(absoluteFilePath);

      const crypto = new TomboCrypt();
      const psword = new TextEncoder().encode(password);
      const passcode = TomboCrypt.passcode(psword);

      const decrypted = await crypto.decode(passcode, encrypted);
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

    return NextResponse.json({ content });
  } catch (error ) {
    console.error('Error reading file:', error);
    return NextResponse.json({ error: 'Failed to read file content' }, { status: 500 });
  }
}



