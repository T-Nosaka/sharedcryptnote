'use client';

import Image from 'next/image';

import { useState, useEffect, useCallback } from 'react';
import { useSession, signIn, signOut } from "next-auth/react";
import { useHandleClone } from '@/hooks/handleClone';
import { useHandleRepolist } from '@/hooks/handleRepolist';
import { useHandleRepoSelect } from '@/hooks/handleRepoSelect';
import { useHandleRepoExit } from '@/hooks/handleRepoExit';
import { useHandleRepofilelist } from '@/hooks/handleRepoFilelist';
import { useHandleFileSelect } from '@/hooks/handleFileSelect';
import { useHandleFileGoup } from '@/hooks/handleFileGoup';
import { editableExtensions } from './utils/constants';
import { handleFileGet } from '@/hooks/handleFileGet';
import { useHandleSetEncode } from '@/hooks/handleSetEncode';
import { Repo, StatusReulst } from './models/gitinfo';
import { useHandleFilePut } from '@/hooks/handleFilePut';
import { useHandleGitStatus } from '@/hooks/handleGitStatus';
import { useHandleGitReset } from '@/hooks/handleGitReset';
import { useHandleGitCommit } from '@/hooks/handleGitCommit';
import { useHandleGitPush } from '@/hooks/handleGitPush';
import { useHandleGitPull } from '@/hooks/handleGitPull';
import { useHandleFileNew } from '@/hooks/handleFileNew';
import { useHandleFileEncrypt } from '@/hooks/handleEncrypt';
import { useHandleFileDecrypt } from '@/hooks/handleDecrypt';
import { useHandleFileDelete } from '@/hooks/handleFileDelete';
import { useHandleRepoDelete } from '@/hooks/handleRepoDelete';
import { useHandleGitFetch } from '@/hooks/handleGitFetch';
import { useHandleFileReset } from '@/hooks/handleFileReset';
import { useHandleGitRebase } from '@/hooks/handleRebase';
import { AppContents } from './components/appcontents';
import { RepositorySection } from './components/repositorysection';
import { RepositoryState } from './components/repositorystate';
import { useHandleGitCheckoutFile, useHandleGitCheckoutHashFile } from '@/hooks/handleGitCheckoutfile';
import { useHandleGitLog } from '@/hooks/handleGitLog';
import { DefaultLogFields, DiffResult } from 'simple-git';
import { LogContents } from './components/logcontents';
import { useHandleGitLogDetail } from '@/hooks/handleGitLogDetail';
import { FileListContents } from './components/filelistcontents';
import { FileEditContents } from './components/fileedit';


export default function Home() {
  const { data: session, status } = useSession();
  const [repoUrl, setRepoUrl] = useState<string>('');
  const [repoName, setRepoName] = useState<string>('');
  const [sshkey, setSshkey] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [repoList, setRepoList] = useState<{ name: string; isDirectory: boolean }[]>([]);
  const [selectRepo, setselectRepo] = useState<string|undefined>(undefined); // 選択中リポジトリ
  const [fileList, setFileList] = useState<{ name: string; isDirectory: boolean }[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('.');
  const [editingFilePath, setEditingFilePath] = useState<string|undefined>(undefined);
  const [selectedFileContent, setSelectedFileContent] = useState<string>(''); // 編集中のファイル内容
  const [fileEncoding, setFileEncoding] = useState<string>('utf-8');
  const [password, setPassword] = useState<string>('');
  const [gitStatusList, setGitStatusList] = useState<{path:string,index:string,working_dir:string}[]>([]);
  const [gitStatusAhead, setGitStatusAhead] = useState<number>(0);
  const [gitStatusBehind, setGitStatusBehind] = useState<number>(0);
  const [commitmessage, setCommitMessage] = useState<string>('');
  const [newFileName, setNewFileName] = useState<string>('');
  const [gitBranch, setGitBranch] = useState<string>('');
  const [loglist, setLoglist] = useState<ReadonlyArray<DefaultLogFields>|undefined>(undefined);
  const [logdiffresult, setLogdiffResult] = useState<DiffResult|undefined>(undefined);

  let repo: Repo | undefined;
  if(selectRepo) {
    repo = JSON.parse(selectRepo) as Repo;
  }
  const handleGitStatus = useHandleGitStatus(setLoading,setMessage,( status: StatusReulst ) =>{
    setGitStatusList(status.changedFiles);
    setGitStatusAhead(status.ahead);
    setGitStatusBehind(status.behind);
    setGitBranch(status.branch);
  });

  const handleRepoFilelist = useHandleRepofilelist(setFileList, setLoading, setMessage, async (gitinfostr) => {
    handleGitStatus(gitinfostr);
  });
  const handleRepolist = useHandleRepolist(setRepoList, setLoading, setMessage);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleRepolistOnes = useCallback<()=>Promise<void>>(handleRepolist, [session]);

  const handleRepoSelect = useHandleRepoSelect(setselectRepo, setMessage, (gitinfostr,encoding) => {
    handleGitFetch(gitinfostr);
    setFileEncoding(encoding);
    handleRepoFilelist(gitinfostr,currentPath); // リポジトリ選択後にファイルリストを更新
  });
  const handleClone = useHandleClone( setLoading, setMessage, () => {
    setRepoUrl('');
    setRepoName('');
    setSshkey('');
    handleRepolist();
  } );
  const handleRepoExit = useHandleRepoExit( setselectRepo, setMessage, () => {
    setCurrentPath('.');
    setPassword('');
    setFileList([]);
    setCommitMessage('');
    setNewFileName('');
    setGitStatusList([]);
    setGitStatusAhead(0);
    setGitStatusBehind(0);
    setGitBranch('');
    setEditingFilePath(undefined);
    setSelectedFileContent('');
  } );
  const handleRepoDelete = useHandleRepoDelete(setLoading,setMessage, () => {
    handleRepolist();
  });
  const handleFileselect = useHandleFileSelect( currentPath, setMessage, ( nextpath ) => {
    // ディレクトリ選択時の処理
    if (selectRepo) {
      setCurrentPath(nextpath);
      handleRepoFilelist(selectRepo,nextpath);
    }
  }, (relativeFilePath,fileExtension) => {
    // ファイル選択時の処理
    if (fileExtension && editableExtensions.includes(fileExtension.toLowerCase())) {
      if (selectRepo) {
        setSelectedFileContent(''); // 編集開始時は内容をクリア
        handleFileGet(selectRepo,fileEncoding,relativeFilePath,fileExtension,password,setMessage,setLoading, (contents) => {
          setEditingFilePath(relativeFilePath);
          console.log('File contents:', contents) ;
          setSelectedFileContent(contents);
        });
      }

    } else {
      setMessage(`Error: ${fileExtension} ファイルは編集できません。`);
      setEditingFilePath(undefined);
      return;
    }
  } ); // ファイル選択ハンドラ
  const handleFilegoup = useHandleFileGoup(currentPath, (nextpath) => {
    if (selectRepo) {
      setCurrentPath(nextpath);
      handleRepoFilelist(selectRepo,nextpath);
    }
  } );
  const handleSaveFile = useHandleFilePut(setMessage,setLoading,() => {
    setEditingFilePath(undefined);
    setSelectedFileContent('');
    setMessage('保存しました。');
    if(selectRepo)
      handleGitStatus(selectRepo);
  });
  const handleCancelEdit = () => {
    setEditingFilePath(undefined);
    setSelectedFileContent('');
    setMessage('編集をキャンセルしました。');
  };
  const handleSetEncode = useHandleSetEncode(setMessage,(encoding) => {
    setFileEncoding(encoding);
  });
  const handleGitReset = useHandleGitReset(setLoading,setMessage, () => {
    setMessage('リセットしました。');
    if(selectRepo)
      handleRepoFilelist(selectRepo,currentPath);
  } );
  const handleGitRebase = useHandleGitRebase(setLoading,setMessage, () => {
    setMessage('リベースしました。');
    if(selectRepo)
      handleRepoFilelist(selectRepo,currentPath);
  } );
  const handleGitCommit = useHandleGitCommit(setLoading,setMessage, () => {
    setMessage('コミットしました。');
    setCommitMessage('');    
    if(selectRepo)
      handleGitStatus(selectRepo);
  });
  const handleGitPush = useHandleGitPush(setLoading,setMessage, () => {
    setMessage('プッシュしました。');
    if(selectRepo)
      handleGitStatus(selectRepo);
  });
  const handleGitPull = useHandleGitPull(setLoading,setMessage, {
    onSuccess: () => {
      if(selectRepo)
        handleGitStatus(selectRepo);
      setMessage('プルしました。');
    },
    onProbrem: () => {
      if(selectRepo)
        handleGitStatus(selectRepo);
    }
  });
  const handleGitFetch = useHandleGitFetch(setLoading,setMessage, (gitinfostr:string) => {
    if(gitinfostr)
      handleGitStatus(gitinfostr);
  });
  const handleNewFile = useHandleFileNew(setMessage,setLoading,() => {
    setMessage('新規作成しました。');
    if(selectRepo) {
      handleRepoFilelist(selectRepo,currentPath);
      setNewFileName('');
    }
  });
  const handleEncrypt = useHandleFileEncrypt(setMessage,setLoading,() => {
    setMessage('暗号化しました。');
    if(selectRepo) {
      handleRepoFilelist(selectRepo,currentPath);
    }
  });
  const handleDecrypt = useHandleFileDecrypt(setMessage,setLoading,() => {
    setMessage('復号化しました。');
    if(selectRepo) {
      handleRepoFilelist(selectRepo,currentPath);
    }
  });
  const handleFileDelete = useHandleFileDelete(setMessage, setLoading, () => {
    setMessage('削除しました。');
    if(selectRepo) {
      handleRepoFilelist(selectRepo, currentPath);
    }
  });
  const handleFileReset = useHandleFileReset(setMessage, setLoading, () => {
    setMessage('戻しました。');
    if(selectRepo) {
      handleRepoFilelist(selectRepo, currentPath);
    }
  });
  const handleGitCheckoutFile = useHandleGitCheckoutFile( setMessage, setLoading, () => {
    setMessage('checkoutしました。');
  });
  const handleGitCheckoutHashFile = useHandleGitCheckoutHashFile( setMessage, setLoading, () => {
    setMessage('checkoutしました。');
    if(selectRepo) {
      handleRepoFilelist(selectRepo, currentPath);
    }
  });
  const handleGitLog = useHandleGitLog(setLoading,setMessage, (loglist) => {
    setLoglist(loglist);
  });
  const handleGitLogDetail = useHandleGitLogDetail(setLoading,setMessage, (diffresult) => {
    setLogdiffResult(diffresult)
  });

  // コンポーネントの初回マウント時にファイルリストを自動取得
  useEffect( () => {
    if (status === 'authenticated' ) {
      //リポジトリ一覧取得
      handleRepolistOnes();
    }
  }, [handleRepolistOnes, status]);

  if (status === 'authenticated' ) {

    return (
      <AppContents>

        <div className="flex items-center space-x-4 mb-8">
          <h1>{session.user?.name}</h1>
          <button
            onClick={() => signOut()}
            className="flex items-center justify-center px-4 py-2 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-white bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500"
          >
            <Image src="/signout.svg" alt="Sign out" width={20} height={20} className="mr-2" />
            <span>exit</span>
          </button>
        </div>

        <div className="text-4xl mb-4">
          {loading ? '⏳' : null }
        </div>

        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-4">
          {message && (
            <div className={`mt-4 p-3 rounded-md ${message.startsWith('Error') ? 'bg-red-800' : 'bg-green-800'} text-white text-sm`}>
              <p>{message}</p>
            </div>
          )}
        </div>

        { selectRepo ? (
          
          <div className="w-full" style={{maxWidth:600}}>
            
            {(loglist) ? (
              <LogContents
                loading={loading}
                logdiffresult={logdiffresult}
                repo={repo}
                selectRepo={selectRepo}
                loglist={loglist}
                setLoglist={setLoglist}
                setLogdiffResult={setLogdiffResult}
                handleGitLogDetail={handleGitLogDetail}
                handleGitCheckoutHashFile={handleGitCheckoutHashFile}
              />
            ) : (

              <div className="w-full" style={{maxWidth:600}}>

                {editingFilePath!=undefined ? ( 

                  <div className="w-full" style={{maxWidth:600}}>
                    {/*ファイル編集*/}
                    <FileEditContents 
                      loading={loading}
                      repo={repo}
                      editingFilePath={editingFilePath}
                      selectedFileContent={selectedFileContent}
                      selectRepo={selectRepo}
                      fileEncoding={fileEncoding}
                      password={password}
                      setSelectedFileContent={setSelectedFileContent}
                      handleSaveFile={handleSaveFile}
                      handleCancelEdit={handleCancelEdit}
                    />
                  </div>

                ) : (

                  <div className="w-full" style={{maxWidth:600}}>

                    { /* リポジトリ状態 */}
                    <RepositoryState
                      loading={loading}
                      repo={repo}
                      selectRepo={selectRepo}
                      gitBranch={gitBranch}
                      gitStatusAhead={gitStatusAhead}
                      gitStatusBehind={gitStatusBehind}
                      gitStatusList={gitStatusList}
                      commitmessage={commitmessage}
                      setCommitMessage={setCommitMessage}
                      handleGitReset={handleGitReset}
                      handleGitCommit={handleGitCommit}
                      handleGitPush={handleGitPush}
                      handleGitPull={handleGitPull}
                      handleGitRebase={handleGitRebase}
                      handleGitLog={handleGitLog}
                      handleRepoExit={handleRepoExit}
                    />

                    { /* ファイルリスト */}
                    <FileListContents 
                      loading={loading}
                      selectRepo={selectRepo}
                      fileEncoding={fileEncoding}
                      password={password}
                      currentPath={currentPath}
                      fileList={fileList}
                      gitStatusList={gitStatusList}
                      gitBranch={gitBranch}
                      newFileName={newFileName}
                      setLoading={setLoading}
                      setMessage={setMessage}
                      setPassword={setPassword}
                      setNewFileName={setNewFileName}
                      handleSetEncode={handleSetEncode}
                      handleFilegoup={handleFilegoup}
                      handleFileselect={handleFileselect}
                      handleDecrypt={handleDecrypt}
                      handleEncrypt={handleEncrypt}
                      handleFileDelete={handleFileDelete}
                      handleFileReset={handleFileReset}
                      handleGitCheckoutFile={handleGitCheckoutFile}
                      handleNewFile={handleNewFile}
                      handleGitCheckoutHashFile={handleGitCheckoutHashFile}
                    />

                  </div>
                )}

              </div>
            )}
          </div>

        ) : (
           /* リポジトリ一覧 */
          <RepositorySection 
            loading={loading} 
            repoList={repoList} 
            repoUrl={repoUrl} 
            repoName={repoName} 
            sshkey={sshkey} 
            setRepoUrl={setRepoUrl} 
            setRepoName={setRepoName} 
            setSshkey={setSshkey} 
            handleRepoSelect={handleRepoSelect}
            handleRepoDelete={handleRepoDelete}
            handleClone={handleClone}
          />

        )}

      </AppContents>        
    );
  }
  if (status === 'loading') {
    return (
      <AppContents>
        <div>Loading...</div>
      </AppContents>
    );
  }

  return ( 
    <AppContents>
      <button
        onClick={() => signIn("google")}
        className="flex items-center justify-center px-4 py-2 mt-4 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-white bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500"
      >
        <svg className="w-5 h-5 mr-3" version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" xmlnsXlink="http://www.w3.org/1999/xlink">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
          <path fill="none" d="M0 0h48v48H0z"></path>
        </svg>
        <span>Googleでサインイン</span>
      </button>
    </AppContents>
  );
}
