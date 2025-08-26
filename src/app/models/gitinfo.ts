import { RemoteWithoutRefs, ResetMode, simpleGit, SimpleGit, SimpleGitOptions } from 'simple-git';

import fs from 'fs/promises';
import { writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import path, { join } from 'path';
import { randomBytes } from 'crypto';
import { unlink } from 'fs/promises';

/*
 * リポジトリ情報
 */
export interface Repo {
  name: string;
  encoding: string;
  sshkey?: string;
}

/*
 * Git情報
 */
export class GitInfo {
    name:string;
    basepath:string;
    encoding: string = 'utf-8';

    sshkey?:string = undefined;

    // コンストラクタ
    constructor( name: string, path: string ) {
        this.name = name;
        this.basepath = path;
    }

    /*
     * JSON化
     */
    toJSON(): Repo {
        return {
            name: this.name,
            encoding: this.encoding,
            sshkey: this.sshkey,
        };
    }

    /*
     * SSH鍵ファイル作成
     */
    static async _makesshkeyfile( sshkey: string ) : Promise<string> {
        const tempDir = tmpdir();
        const unique = randomBytes(16).toString('hex');
        const sshkeyfile = join(tempDir, `tempfile_${unique}.key`);
        await writeFile(sshkeyfile, sshkey, 'utf-8');
        // パーミッションを600に変更
        await fs.chmod(sshkeyfile, 0o600);
        return sshkeyfile;
    }

    /*
     * SSH鍵ファイル削除
     */
    static async _deletesshkeyfile( sshkeyfile: string ) : Promise<void> {
        try {
            await unlink(sshkeyfile);
        } catch (error) {
            console.error('Error deleting SSH key file:', error);
        }
    }

    /*
     * Clone
     */
    static async clone( basepath: string, url: string, name:string, sshkey?: string ) : Promise<GitInfo | null> {

        // Gitリポジトリ作成
        try {
            await fs.access(basepath);
        } catch {
            await fs.mkdir(basepath, { recursive: true });
        }

        // SSH鍵ファイル作成
        let sshkeyfile = undefined;
        if (sshkey) {
            sshkeyfile = await GitInfo._makesshkeyfile(sshkey);
        }

        // simple-gitのオプション
        const options: Partial<SimpleGitOptions> = {
            baseDir: basepath,
            binary: 'git',
            maxConcurrentProcesses: 6,
            timeout: {
                block: 20000,
            },
        };
        if( sshkey != undefined ) {
            options.config = [
            `core.sshCommand=ssh -i ${sshkeyfile} -o StrictHostKeyChecking=no -F /dev/null`
            ];
        }

        try {
            const git: SimpleGit = simpleGit(options);

            // リポジトリのクローン
            await git.clone(url,name);

            // cloneしたインスタンス
            const newinstance = new GitInfo( name, basepath );
            if( sshkey != undefined ) {
                newinstance.sshkey = sshkey;
            }
            return newinstance;
        } catch (error) {
            console.error('Error during git clone:', error);
            return null;
        } finally {
            // SSH鍵ファイルを削除
            if( sshkeyfile != undefined ) {
                GitInfo._deletesshkeyfile(sshkeyfile);
            }
        }
    }

    /*
     * ベースディレクトリ
     */
    baseDir(): string {
        return path.join(this.basepath, this.name);
    }

    /*
     * 差分取得
     */
    async getChangedFiles() : Promise<{ changedFiles: { path: string; working_dir: string }[]; ahead: number; behind: number }> {

        type ChangedFile = { path: string; index: string; working_dir: string };
        const result = { changedFiles: [] as ChangedFile[], ahead: 0, behind: 0 };

        try {
            const options: Partial<SimpleGitOptions> = {
                baseDir: this.baseDir(),
            };
            const git: SimpleGit = simpleGit(options);

            // git status を実行し、リポジトリの状態を取得
            const status = await git.status();

            // 差分のあるファイル（変更済み、追加済み、削除済み）のリストを取得
            const changedFiles = status.files
                .filter(file => file.working_dir !== ' ' || file.index !== ' ')
                .map(file => ({path:file.path,index:file.index,working_dir:file.working_dir}));

            result.changedFiles = changedFiles;
            result.ahead = status.ahead;
            result.behind = status.behind;
            return result;
        } catch (err) {
            console.error('エラー:', err);
            return result;
        }
    }

    /*
     * Git Reset
     */
    async ResetHard(): Promise<void> {
        try {
            const options: Partial<SimpleGitOptions> = {
                baseDir: this.baseDir(),
            };
            const git: SimpleGit = simpleGit(options);

            // git reset --hard を実行
            await git.reset(ResetMode.HARD);
        } catch (error) {
            console.error('Error during git reset:', error);
            throw error;
        }
    }

    /*
     * Git Reset
     */
    async FileReset( filepath: string ): Promise<void> {
        try {
            const options: Partial<SimpleGitOptions> = {
                baseDir: this.baseDir(),
            };
            const git: SimpleGit = simpleGit(options);

            await git.reset(['--', filepath]);
            const status = await git.status([filepath]);
            const changedFiles = status.files;
            if (changedFiles.length > 0)
                await git.checkout(['--', filepath]);
        } catch (error) {
            console.error('Error during git file reset:', error);
            throw error;
        }
    }

    /*
     * Git Commit
     */
    async Commit( commitmessage: string ): Promise<void> {
        try {
            const options: Partial<SimpleGitOptions> = {
                baseDir: this.baseDir(),
            };
            const git: SimpleGit = simpleGit(options);

            // git add . を実行
            await git.add('./*');

            // git commit -m "commitmessage" を実行
            await git.commit(commitmessage);
        } catch (error) {
            console.error('Error during git commit:', error);
            throw error;
        }
    }

    /*
     * Git Push
     */
    async Push(): Promise<void> {
        let sshkeyfile = undefined;
        try {
            const options: Partial<SimpleGitOptions> = {
                baseDir: this.baseDir(),
            };
            // SSH鍵ファイル作成
            if (this.sshkey != undefined) {
                sshkeyfile = await GitInfo._makesshkeyfile(this.sshkey);
            }
            if( sshkeyfile != undefined ) {
                options.config = [
                `core.sshCommand=ssh -i ${sshkeyfile} -o StrictHostKeyChecking=no -F /dev/null`
                ];
            }

            const git: SimpleGit = simpleGit(options);

            // git push を実行
            await git.push();
        } catch (error) {
            console.error('Error during git push:', error);
            throw error;
        } finally {
            // SSH鍵ファイルを削除
            if( sshkeyfile != undefined ) {
                GitInfo._deletesshkeyfile(sshkeyfile);
            }            
        }
    }

    /*
     * Git Pull
     */
    async Pull(): Promise<void> {
        let sshkeyfile = undefined;
        try {
            const options: Partial<SimpleGitOptions> = {
                baseDir: this.baseDir(),
            };
            // SSH鍵ファイル作成
            if (this.sshkey != undefined) {
                sshkeyfile = await GitInfo._makesshkeyfile(this.sshkey);
            }
            if( sshkeyfile != undefined ) {
                options.config = [
                `core.sshCommand=ssh -i ${sshkeyfile} -o StrictHostKeyChecking=no -F /dev/null`
                ];
            }

            const git: SimpleGit = simpleGit(options);

            // git pull を実行
            await git.pull();
        } catch (error) {
            console.error('Error during git pull:', error);
            throw error;
        } finally {
            // SSH鍵ファイルを削除
            if( sshkeyfile != undefined ) {
                GitInfo._deletesshkeyfile(sshkeyfile);
            }            
        }
    }

    /*
     * Git Fetch
     */
    async Fetch(): Promise<void> {
        let sshkeyfile = undefined;
        try {
            const options: Partial<SimpleGitOptions> = {
                baseDir: this.baseDir(),
            };
            // SSH鍵ファイル作成
            if (this.sshkey != undefined) {
                sshkeyfile = await GitInfo._makesshkeyfile(this.sshkey);
            }
            if( sshkeyfile != undefined ) {
                options.config = [
                `core.sshCommand=ssh -i ${sshkeyfile} -o StrictHostKeyChecking=no -F /dev/null`
                ];
            }

            const git: SimpleGit = simpleGit(options);

            // git fetch を実行
            await git.fetch();
        } catch (error) {
            console.error('Error during git fetch:', error);
            throw error;
        } finally {
            // SSH鍵ファイルを削除
            if( sshkeyfile != undefined ) {
                GitInfo._deletesshkeyfile(sshkeyfile);
            }            
        }
    }

    /*
     * Git Add
     */
    async Add( filepath: string ): Promise<void> {
        try {
            const options: Partial<SimpleGitOptions> = {
                baseDir: this.baseDir(),
            };
            const git: SimpleGit = simpleGit(options);

            // git add filepath を実行
            await git.add(filepath);
        } catch (error) {
            console.error('Error during git add:', error);
            throw error;
        }
    }

    /*
     * Git Delete
     */
    async Delete( filepath: string ): Promise<void> {
        try {
            const options: Partial<SimpleGitOptions> = {
                baseDir: this.baseDir(),
            };
            const git: SimpleGit = simpleGit(options);

            await git.rm(filepath );
        } catch (error) {
            console.error('Error during git rm:', error);
            throw error;
        }
    }
}
