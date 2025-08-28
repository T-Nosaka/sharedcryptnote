import { GitInfo } from "./gitinfo";
import { pathJoin, REPO_DIR } from '@/app/utils/constants';
import fs from 'fs/promises';

import {Repo} from './gitinfo';

/*
 * 定義情報
 */
interface RepoS {
  repos: Repo[];
}

/*
 * ユーザー情報
 */
export class UserInfo {

    jti: string;
    sub: string;
    email: string
    name: string;

    // コンストラクタ
    constructor( pjti:string, psub:string, user?: { name?: string; email?: string } ) {
        this.jti = pjti;
        this.sub = psub;
        this.name = user?.name ?? "";
        this.email = user?.email ?? "";
    }

    /*
     * ベースディレクトリ
     */
    async baseDir(): Promise<string> {
        const basedir = pathJoin(REPO_DIR, this.sub);
        // ディレクトリが存在しない場合は作成
        await fs.mkdir(basedir, { recursive: true }).catch(err => {
            console.error(`Failed to create directory ${basedir}:`, err);
        });

        return basedir;
    }

    /*
     * Gitリポジトリのベースディレクトリ
     */
    async gitBaseDir(): Promise<string> {
        const basedir = await this.baseDir();
        const gitbasedir = pathJoin(basedir, "git-repos");

        // ディレクトリが存在しない場合は作成
        await fs.mkdir(gitbasedir, { recursive: true }).catch(err => {
            console.error(`Failed to create directory ${gitbasedir}:`, err);
        });

        return gitbasedir;
    }


    /*
     * 定義情報
     */
    private async loadinfo(): Promise<RepoS> {
        const basedir = await this.baseDir();
        const userinfofile = pathJoin(basedir, "info.json");

        try {
        const jsonStr = await fs.readFile(userinfofile, 'utf-8');
        return JSON.parse(jsonStr);
        } catch {
            const basedata : RepoS = {
                repos:[]
            };
            const emptyjson = JSON.stringify(basedata, null, 2);
            await fs.writeFile(userinfofile, emptyjson, 'utf-8');
            return JSON.parse(emptyjson);
        }
    }

    /*
     * 定義保存
     */
    private async saveinfo( jsondata:RepoS ): Promise<void> {
        const basedir = await this.baseDir();
        const userinfofile = pathJoin(basedir, "info.json");

        const json = JSON.stringify(jsondata, null, 2);
        await fs.writeFile(userinfofile, json, 'utf-8');
    }

    /*
     * リポジトリリスト
     */
    async repolist(): Promise<Array<{ name: string; isDirectory: boolean }>> {

        const basedir = await this.gitBaseDir();
        const entries = await fs.readdir(basedir, { withFileTypes: true });
        const fileList = entries.map(entry => ({
            name: entry.name,
            isDirectory: entry.isDirectory(),
        }));

        return fileList;
    }

    /*
     * Git Clone
     */
    async gitclone(url: string, name:string, sshkey?: string): Promise<boolean> {
        // GitInfoのcloneメソッドを呼び出す
        const result = await GitInfo.clone( await this.gitBaseDir(), url, name, this.email, sshkey);
        if( result == null ) {
            return false;
        }

        //repoノード追加
        await this.updateGitInfo( result );

        return true;
    }

    /*
     * Git情報更新
     */
    async updateGitInfo( gitinfo:GitInfo ): Promise<void> {
        // Git情報を更新
        const jsondata = await this.loadinfo();
        const repoIndex = jsondata.repos.findIndex(repo => repo.name === gitinfo.name);
        if (repoIndex !== -1) {
            jsondata.repos[repoIndex] = gitinfo.toJSON();
            await this.saveinfo(jsondata);
        } else {
            const repo = gitinfo.toJSON();
            jsondata.repos.push(repo);
            await this.saveinfo( jsondata );
        }
    }

    /*
     * Git情報取得
     */
    async getGitInfo(gitinfostr:string): Promise<GitInfo | undefined> {
        if( gitinfostr != "" ) {
            try {
                const repo = JSON.parse(gitinfostr) as Repo;
                const gitinfo = new GitInfo(repo.name, await this.gitBaseDir());
                gitinfo.sshkey = repo.sshkey;
                gitinfo.encoding = repo.encoding;
                return gitinfo;
            } catch (error) {
                console.error('Error parsing gitinfo:', error);
                return undefined;
            }
        }
        return undefined;
    }

    /*
     * リポジトリ選択
     */
    async selectRepo( name: string ):Promise<string | undefined> {
        const jsondata = await this.loadinfo();
        const repo = jsondata.repos.find( repo => repo.name === name );
        if( repo ) {
            return JSON.stringify(repo);
        }
    }

    /*
     * Git Delete
     */
    async deleteGitInfo(gitinfo:GitInfo): Promise<void> {

        // Git情報を更新
        const jsondata = await this.loadinfo();
        const repoIndex = jsondata.repos.findIndex(repo => repo.name === gitinfo.name);
        if (repoIndex !== -1) {
            jsondata.repos.splice(repoIndex, 1);
            await this.saveinfo(jsondata);
        }

        //リポジトリ削除
        await fs.rmdir( gitinfo.baseDir(), { recursive: true });
    }
}
