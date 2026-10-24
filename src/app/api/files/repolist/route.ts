import { UserInfo } from "@/app/models/userinfo";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { isEmailAllowed } from "@/app/lib/allowlist";

/*
 * リポジトリリスト
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'session is required' }, { status: 400 });
    }
    // ALLOWUSERS 制限: 許可外メアドは 403（既存セッション対策）
    if (!isEmailAllowed(session.user?.email)) {
      return NextResponse.json({ error: 'Forbidden: email not allowed' }, { status: 403 });
    }

    //ユーザー取得
    const userinfo : UserInfo = session.user.info;
    return NextResponse.json(await userinfo.repolist());
  } catch (error) {
    console.error('Error fetching file list:', error);
    return NextResponse.json({ error: 'Failed to retrieve file list' }, { status: 500 });
  }
}
