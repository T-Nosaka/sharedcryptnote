'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession, signIn, signOut } from "next-auth/react";
import { useHandleClone } from '@/hooks/handleClone';
import { useHandleRepolist } from '@/hooks/handleRepolist';
import { useHandleRepoSelect } from '@/hooks/handleRepoSelect';
import { useHandleRepoExit } from '@/hooks/handleRepoExit';
import { useHandleRepofilelist } from '@/hooks/handleRepoFilelist';
import { useHandleFileSelect } from '@/hooks/handleFileSelect';
import { useHandleFileGoup } from '@/hooks/handleFileGoup';
import { editableExtensions, supportedEncodings, encryptExtensions } from './utils/constants';
import { handleFileGet } from '@/hooks/handleFileGet';
import { useHandleSetEncode } from '@/hooks/handleSetEncode';
import { Repo, StatusReulst } from './models/gitinfo';
import { useHandleFilePut } from '@/hooks/handleFilePut';
import { useHandleGitStatus } from '@/hooks/handleGitStatus';
import path from 'path';
import { useHandleGitReset } from '@/hooks/handleGitReset';
import { useHandleGitCommit } from '@/hooks/handleGitCommit';
import { useHandleGitPush } from '@/hooks/handleGitPush';
import { useHandleGitPull } from '@/hooks/handleGitPull';
import { useHandleFileNew } from '@/hooks/handleFileNew';
import { useHandleFileEncrypt } from '@/hooks/handleEncrypt';
import { useHandleFileDecrypt } from '@/hooks/handleDecrypt';
import { useHandleFileDelete } from '@/hooks/handleFileDelete';
import { useHandleRepoDelete } from '@/hooks/handleRepoDelete';
import Image from 'next/image';
import { useHandleGitFetch } from '@/hooks/handleGitFetch';
import { useHandleFileReset } from '@/hooks/handleFileReset';
import { useHandleGitRebase } from '@/hooks/handleRebase';
import { AppContents } from './components/appcontents';
import { RepositorySection } from './components/repositorysection';
import { RepositoryState } from './components/repositorystate';
import { useHandleGitCheckoutFile } from '@/hooks/handleGitCheckoutfile';


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

  const handleStatusOut = (gitstatuslist:{path:string,index:string,working_dir:string}[], entry:{ name: string; isDirectory: boolean } ) => {
    if(entry.isDirectory == true) {

      //サブディレクトリに変化がある場合
      if (gitstatuslist.length > 0) {
        const fullpath = path.join(currentPath, entry.name);
        const status = gitstatuslist.find(file => file.path.startsWith(fullpath));
        if (status ) {
          return "!📂"; // 変更があるサブディレクトリ
        }
      }
      return "📁";
    }

    const fileicon = encryptExtensions.includes(path.extname(entry.name.toLowerCase())) ? "💼":"📄";
    if (gitstatuslist.length > 0 ) {
      const fullpath = path.join(currentPath, entry.name);
      const status = gitstatuslist.find(file => file.path === fullpath);
      if (status ) {

          if( status.index === 'A' )
            return "➕"+fileicon; // 新規ファイル
          if( status.working_dir === 'D' )
            return "❌"+fileicon; // 削除されたファイル
          if( status.working_dir === 'A' )
            return "✔️"+fileicon; // 追加されたファイル
          if( status.working_dir === 'M' )
            return "✏️"+fileicon; // 変更されたファイル
          if( status.working_dir === 'R' )
            return "🔀"+fileicon; // 名前変更されたファイル
          if( status.working_dir === 'C' )
            return "📝"+fileicon; // コピーされたファイル

        return status.working_dir+fileicon; // 変更があるファイル  
      }
    }
    return fileicon;
  }
  const handleIsModify = (gitstatuslist:{path:string,index:string,working_dir:string}[], entry:{ name: string; isDirectory: boolean }) : boolean => {
    if(entry.isDirectory == true) {

      //サブディレクトリに変化がある場合
      if (gitstatuslist.length > 0) {
        const fullpath = path.join(currentPath, entry.name);
        const status = gitstatuslist.find(file => file.path.startsWith(fullpath));
        if (status ) {
          return true; // 変更があるサブディレクトリ
        }
      }
      return false;
    }

    if (gitstatuslist.length > 0 ) {
      const fullpath = path.join(currentPath, entry.name);
      const status = gitstatuslist.find(file => file.path === fullpath);
      if (status ) {
        return true;
      }
    }
    return false;
  }
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
    onProbrem: (status) => {
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

  const isChiFile = (entry:{ name: string; isDirectory: boolean }) => {
    if (entry.isDirectory==true)
      return false;
    return encryptExtensions.includes(path.extname(entry.name).toLowerCase()) ? true : false ;
  }

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

            {editingFilePath!=undefined ? ( 

              /*ファイル編集*/
              <div className="mt-4 p-1 border border-gray-700 rounded-lg w-full sm:max-w-xl bg-gray-800 shadow-lg" style={{maxWidth:600}}>
                <h2 className="text-2xl font-semibold mb-4 text-blue-300">📕{repo?.name}</h2>                
                <span className="text-white">
                  {editingFilePath}              
                </span>                

                <div className="mt-4 p-0 border border-gray-700 rounded-lg w-full sm:max-w-xl bg-gray-800 shadow-lg" style={{maxWidth:600}}>
                  <textarea
                    className="w-full h-80 p-0 border border-gray-600 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    value={selectedFileContent}
                    onChange={(e) => setSelectedFileContent(e.target.value)}
                    placeholder="ファイルの内容を入力..."
                  ></textarea>
                  <button
                    onClick={() => handleSaveFile(selectRepo,fileEncoding,editingFilePath,selectedFileContent,password)}
                    disabled={loading}
                    className="w-full sm:w-auto px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? '保存中...' : '保存'}
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    disabled={loading}
                    className="w-full sm:w-auto px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                  >
                    キャンセル
                  </button>
                </div>
              </div>

            ) : (

              <div className="w-full" style={{maxWidth:600}}>

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
                />

                <div className="mt-4 p-1 border border-gray-700 rounded-lg w-full sm:max-w-xl bg-gray-800 shadow-lg" style={{maxWidth:600}}>

                  {/* 文字コード選択ドロップダウン */}
                  <label htmlFor="encoding-select" className="block text-sm font-medium text-gray-400 mb-1">
                    文字コードを選択:
                  </label>
                  <select
                    id="encoding-select"
                    value={fileEncoding}
                    onChange={(e) => handleSetEncode( selectRepo ,e.target.value)}
                    className="w-full p-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loading}
                  >
                    {supportedEncodings.map(enc => (
                      <option key={enc} value={enc}>{enc.toUpperCase()}</option>
                    ))}
                  </select>

                  {/* パスワード入力欄 */}
                  <label htmlFor="password-input" className="block text-sm font-medium text-gray-400 mt-4 mb-1">
                    パスワード:
                  </label>
                  <input
                    id="password-input"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="パスワードを入力"
                    className="w-full p-2 border border-gray-600 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loading}
                  />

                  {/*ファイル一覧*/}
                  <div className="flex flex-col items-center space-y-4 mb-4 w-full max-w-xl" style={{maxWidth:600}}>

                    <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-4 w-full max-w-xl" style={{maxWidth:600}}>
                      <div className="mt-4 p-6 border border-gray-700 rounded-lg w-full sm:max-w-xl bg-gray-800 shadow-lg" style={{maxWidth:600}}>

                          <p><span className="text-white">{currentPath}</span></p>
                          <hr />

                          <ul className="list-none p-0">

                          { currentPath != '.' ? (
                            //親ディレトリ
                            <li
                              key=".."
                              onClick={() =>{ if (!loading) handleFilegoup();}}
                              className="flex items-center space-x-3 p-2 rounded-md cursor-pointer hover:bg-gray-700 transition-colors duration-150"
                            >
                              <span className="text-yellow-400">🔼</span>
                              <span className="text-white">..</span>
                            </li>
                            ) : ( null ) 
                          }

                          {fileList.length > 0 ? (
                              fileList.map(entry => (

                                // gitStatusListから変更状態を取得
                                // 変更状態がある場合はアイコンを変更
                                <li
                                  key={entry.name}
                                  className="flex items-center space-x-3 p-2 rounded-md cursor-pointer hover:bg-gray-700 transition-colors duration-150"
                                >
                                  <span
                                    className="text-yellow-400"
                                    onClick={()=>{if (!loading) handleFileselect(selectRepo,entry);}}>
                                      {handleStatusOut(gitStatusList,entry)}
                                  </span>

                                  <span
                                    className="text-white"
                                    onClick={()=>{if (!loading) handleFileselect(selectRepo,entry);}}>
                                    {entry.name}
                                  </span>

                                  <div className="flex items-center space-x-2 ml-auto">

                                    { entry.isDirectory == false ? (
                                      isChiFile(entry) ? (
                                    <button className="ml-1 text-yellow-400 disabled:bg-gray-700 justify-end" 
                                            disabled={loading || password.length < 5}
                                            title={ password.length < 5 ? "パスワードを入力して下さい":`${entry.name}を復号化`}
                                            onClick={() => {
                                              handleDecrypt( selectRepo,currentPath,entry.name,password);
                                              }}>
                                      🔓
                                    </button>):(
                                    <button className="ml-2 text-yellow-400 disabled:bg-gray-700 justify-end" 
                                            disabled={loading || password.length < 5}
                                            title={ password.length < 5 ? "パスワードを入力して下さい":`${entry.name}を暗号化`}
                                            onClick={() =>{
                                              handleEncrypt( selectRepo,currentPath,entry.name,password);
                                              }}>
                                      🔒
                                    </button>)
                                    ):(null)}
                                    { handleIsModify(gitStatusList,entry) ? (
                                      <button className="ml-1 text-yellow-400 disabled:bg-gray-700 justify-end" 
                                            disabled={loading}
                                            title={ `${entry.name}を戻す`}
                                            onClick={() => {
                                              handleFileReset( selectRepo,currentPath,entry.name);
                                              }}>
                                        ↩️
                                      </button>
                                      ):(null) }

                                    { gitBranch == "(no" && entry.isDirectory == false && handleIsModify(gitStatusList,entry) ? (
                                      <div>
                                        <button className="ml-1 text-yellow-400 disabled:bg-gray-700 justify-end" 
                                                disabled={loading }
                                                title={ `${entry.name}を自分のファイルに更新`}
                                                onClick={() => {
                                                  handleGitCheckoutFile( selectRepo, 'theirs' , currentPath,entry.name);
                                                  }}>
                                          ◀
                                        </button>
                                        <button className="ml-1 text-yellow-400 disabled:bg-gray-700 justify-end" 
                                                disabled={loading }
                                                title={ `${entry.name}を相手のファイルに更新`}
                                                onClick={() => {
                                                  handleGitCheckoutFile( selectRepo, 'ours' , currentPath,entry.name);
                                                  }}>
                                          ▶
                                        </button>
                                      </div>
                                    ):(null)}

                                    <button
                                      className="text-red-500 hover:text-red-700 justify-end"
                                      disabled={loading}
                                      onClick={() => handleFileDelete(selectRepo, currentPath, entry.name)}
                                      title={`${entry.name}を削除`}
                                    >
                                      🗑️
                                    </button>
                                  </div>
                                </li>
                              ))
                          ) : (
                            null
                          )}
                          </ul>
                      </div>
                    </div>
                    {/* ファイル作成入力欄 */}
                    <div className="flex w-full sm:max-w-xl space-x-2" style={{maxWidth:600}}>

                      <input
                        type="text"
                        value={newFileName}
                        onChange={(e) => setNewFileName(e.target.value)}
                        placeholder="新規ファイル・フォルダ"
                        className="flex-grow p-2 border border-gray-600 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => handleNewFile( selectRepo, currentPath, newFileName, "file" )}
                        disabled={loading || newFileName.length == 0 }
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex-shrink-0 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                      >
                      +📄
                      </button>
                      <button
                        onClick={() => handleNewFile( selectRepo, currentPath, newFileName, "folder" )}
                        disabled={loading || newFileName.length == 0 }
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex-shrink-0 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                      >
                      +📁
                      </button>

                    </div>
                    <button
                      onClick={() => handleRepoExit()}
                      className="w-full max-w-2xl px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                      style={{maxWidth:600}}
                    >
                      ⏏️ Go back
                    </button>
                  </div>
                </div>
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
