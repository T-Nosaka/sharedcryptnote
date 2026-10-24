import { UserInfo } from "@/app/models/userinfo";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { isEmailAllowed } from "@/app/lib/allowlist";

/*
 * リポジトリ選択
 */
export async function POST(req: NextRequest) {
  try {
    const { name } = await req.json();

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

    const gitinfostr = await userinfo.selectRepo(name);
    if (!gitinfostr) {
      return NextResponse.json({ error: 'Failed to get gitinfostr' }, { status: 500 });
    }

    const gitinfo = await userinfo.getGitInfo(gitinfostr);
    if (!gitinfo) {
      return NextResponse.json({ error: 'Failed to get git info' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Repository selected successfully!' , gitinfostr: gitinfostr, encoding: gitinfo.encoding }, { status: 200 });
  } catch (error) {
    console.error('Error repository select:', error);
    return NextResponse.json({ error: 'Failed to repository select' }, { status: 500 });
  }
}
