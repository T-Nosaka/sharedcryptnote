import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/app/lib/auth";
import path from "path";
import { UserInfo } from "@/app/models/userinfo";
import fs from 'fs/promises';
import { DEFAULTENCODE, encryptExtensions } from "@/app/utils/constants";
import { TomboCrypt } from "../tombo_crypto";
import * as Encoding from 'encoding-japanese';
import * as fsa from 'fs';

/**
 * ファイルの内容を保存する
 * @param req NextRequestオブジェクト (bodyにfilePathとcontent、encodingを含む)
 * @returns 成功メッセージまたはエラーレスポンス
 */
export async function POST(req: NextRequest) {
  try {
    const { gitinfostr: gitinfostr, fileEncoding, editingFilePath, fileExtension, content, password } = await req.json();

    if (!editingFilePath || typeof content === 'undefined') {
      return NextResponse.json({ error: 'File path and content are required' }, { status: 400 });
    }

    if (!editingFilePath || typeof fileExtension === 'undefined') {
      return NextResponse.json({ error: 'File path and ext are required' }, { status: 400 });
    }

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
    const absoluteFilePath = path.join(gitinfo.baseDir(), editingFilePath);
    if (!absoluteFilePath.startsWith(gitinfo.baseDir())) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    // ディレクトリが存在するか確認し、なければ作成
    const dir = path.dirname(absoluteFilePath);
    try {
      await fs.access(dir);
    } catch (error) {
      await fs.mkdir(dir, { recursive: true });
    }

    if (fileExtension && encryptExtensions.includes(fileExtension.toLowerCase())) {
      //暗号
      const crypto = new TomboCrypt();
      const psword = new TextEncoder().encode(password);
      const passcode = TomboCrypt.passcode(psword);

      const unicodeArray = Encoding.stringToCode(content);
      // UnicodeからShift_JISに変換
      const strArray = Encoding.convert(unicodeArray, {
        to: fileEncoding,
        from: 'UNICODE'
      });
      const strcontent = new Uint8Array(strArray);

      const crypted = await crypto.encode(passcode, strcontent);
      fsa.writeFileSync(absoluteFilePath,crypted)
    } else {

      // 指定された文字コードでファイルの内容を書き込む
      if (fileEncoding == DEFAULTENCODE) {
        await fs.writeFile(absoluteFilePath, content, { encoding: (fileEncoding || DEFAULTENCODE) as BufferEncoding });
      } else {
        const unicodeArray = Encoding.stringToCode(content);
        // UnicodeからShift_JISに変換
        const sjisArray = Encoding.convert(unicodeArray, {
          to: fileEncoding,
          from: 'UNICODE'
        });
        const strcontent = new Uint8Array(sjisArray);
        fsa.writeFileSync(absoluteFilePath,strcontent)
      }
    }

    return NextResponse.json({ message: 'File saved successfully!' });
  } catch (error) {
    console.error('Error writing file:', error);
    return NextResponse.json({ error: 'Failed to save file content' }, { status: 500 });
  }
}
