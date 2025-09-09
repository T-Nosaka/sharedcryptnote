'use client';

import React, { useState } from 'react';
import path from 'path';

import { encryptExtensions, supportedEncodings } from '../utils/constants';
import { CheckoutFileMode } from '@/hooks/handleGitCheckoutfile';
import FileLogModal from './filelogmodal'; // モーダルコンポーネントをインポート
import { DefaultLogFields } from 'simple-git';
import { useHandleGitFileLog } from '@/hooks/handleGitLog';


/*
 * ファイルリスト
 */
export function FileListContents({
  loading,
  selectRepo,
  fileEncoding,
  password,
  currentPath,
  fileList,
  filesearchList,
  gitStatusList,
  gitBranch,
  newFileName,
  setLoading,
  setMessage,
  setPassword,
  setFilesearchList,
  setNewFileName,
  handleSetEncode,
  handleFilegoup,
  handleFileselect,
  handleDecrypt,
  handleEncrypt,
  handleFileDelete,
  handleFileReset,
  handleGitCheckoutFile,
  handleNewFile,
  handleGitCheckoutHashFile,
  handleRepoFilesearchlist,
}: {
  loading: boolean;
  selectRepo: string;
  fileEncoding: string;
  password: string;
  currentPath: string;
  fileList: { name: string; isDirectory: boolean }[];
  filesearchList: { name: string; isDirectory: boolean }[];
  gitStatusList: {path:string,index:string,working_dir:string}[];
  gitBranch: string;
  newFileName: string;
  setLoading: (value:boolean) => void;
  setMessage: (value: string) => void;
  setPassword: (value: string) => void;
  setNewFileName: (value: string) => void;
  setFilesearchList: (value: { name: string; isDirectory: boolean }[]) => void;
  handleSetEncode: (gitinfostr: string, encoding: string) => void;
  handleFilegoup: () => void;
  handleFileselect: ( entry: { name: string; isDirectory: boolean }) => void;
  handleDecrypt: (gitinfostr: string, currentpath: string, filename: string, password: string) => void;
  handleEncrypt: ( gitinfostr: string, currentpath: string, filename: string, password: string) => void;
  handleFileDelete: (gitinfostr: string, currentpath: string, filename: string) => void;
  handleFileReset: (gitinfostr: string, currentPath: string, fileName: string) => void;
  handleGitCheckoutFile: (gitinfostr: string, mode: CheckoutFileMode, currentPath: string, fileName: string) => void;
  handleNewFile: (gitinfostr: string, currentPath: string, fileName: string, type: string) => void;
  handleGitCheckoutHashFile:(gitinfostr: string, mode: CheckoutFileMode, selectFilePath: string, hash?: string) => void;
  handleRepoFilesearchlist:(gitinfostr:string ,path :string , keyword :string) => void;
})
 {
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState('');
  const [loglist, setLoglist] = useState<ReadonlyArray<DefaultLogFields>|undefined>(undefined);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [isSearchmode,setSearchmode] = useState(false);

  const handleGitFileLog = useHandleGitFileLog(setLoading,setMessage, (selectFilePath,loglist) => {
    setSelectedFile(selectFilePath);
    setLoglist(loglist);
    setModalOpen(true);
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

          if( status.index === 'A' || status.working_dir === 'A' )
            return "➕"+fileicon; // 新規ファイル
          if( status.index === 'M' || status.working_dir === 'M' )
            return "✏️"+fileicon; // 変更されたファイル

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

  const isChiFile = (entry:{ name: string; isDirectory: boolean }) => {
    if (entry.isDirectory==true)
      return false;
    return encryptExtensions.includes(path.extname(entry.name).toLowerCase()) ? true : false ;
  }  

  return (
    <>
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

          {/* ファイル検索入力欄 */}
          <div className="flex w-full sm:max-w-xl space-x-2 mt-4">
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="ファイル名検索"
              className="flex-grow p-2 border border-gray-600 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => {handleRepoFilesearchlist(selectRepo, currentPath, searchKeyword); setSearchmode(true);}}
              disabled={loading || searchKeyword.length === 0}
              title="ファイル名を検索"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex-shrink-0 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
            >
              🔍
            </button>
          </div>

          {/*ファイル一覧*/}
          <div className="flex flex-col items-center space-y-4 mb-4 w-full max-w-xl">

          {isSearchmode ? (
            //ファイル検索結果
            <div className="w-full">

              <button 
                className="modal-close-btn"
                disabled={loading}
                onClick={() => { setSearchmode(false); setFilesearchList([]); }}>
                &times;
               </button>

                <p><span className="text-white">{currentPath}</span></p>
                <hr />

                <ul className="list-none p-0">
                  {filesearchList.length > 0 ? (
                      filesearchList.map(entry => (
                      // gitStatusListから変更状態を取得
                      // 変更状態がある場合はアイコンを変更
                      <li
                          key={entry.name}
                          className="flex items-center space-x-3 p-2 rounded-md cursor-pointer hover:bg-gray-700 transition-colors duration-150"
                      >
                          <span
                          className="text-yellow-400"
                          onClick={()=>{if (!loading) handleFileselect(entry);}}>
                              {handleStatusOut(gitStatusList,entry)}
                          </span>

                          <span
                          className="text-white"
                          onClick={()=>{if (!loading) handleFileselect(entry);}}>
                          {entry.name}
                          </span>

                          <div className="flex items-center space-x-2 ml-auto">

                          { entry.isDirectory == false ? (
                            <button
                              className="text-blue-400 hover:text-blue-600 justify-end"
                              disabled={loading}
                              onClick={() => handleGitFileLog( selectRepo, currentPath, entry.name)}
                              title={`${entry.name}の履歴`}
                            >
                              🕒
                            </button>
                          ) : null}

                          { entry.isDirectory == false ? (
                              isChiFile(entry) ? (
                          <button className="ml-1 text-yellow-400 disabled:bg-gray-700 justify-end" 
                                  disabled={loading || password.length < 5}
                                  title={ password.length < 5 ? "パスワードを入力して下さい":`${entry.name}を復号化`}
                                  onClick={() => {
                                      handleDecrypt( selectRepo,currentPath,entry.name,password);
                                      setSearchmode(false);
                                      setFilesearchList([]);
                                      }}>
                              🔓
                          </button>):(
                          <button className="ml-2 text-yellow-400 disabled:bg-gray-700 justify-end" 
                                  disabled={loading || password.length < 5}
                                  title={ password.length < 5 ? "パスワードを入力して下さい":`${entry.name}を暗号化`}
                                  onClick={() =>{
                                      handleEncrypt( selectRepo,currentPath,entry.name,password);
                                      setSearchmode(false);
                                      setFilesearchList([]);
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
                                      setSearchmode(false);
                                      setFilesearchList([]);
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
                                          setSearchmode(false);
                                          setFilesearchList([]);
                                          }}>
                                  ◀
                              </button>
                              <button className="ml-1 text-yellow-400 disabled:bg-gray-700 justify-end" 
                                      disabled={loading }
                                      title={ `${entry.name}を相手のファイルに更新`}
                                      onClick={() => {
                                          handleGitCheckoutFile( selectRepo, 'ours' , currentPath,entry.name);
                                          setSearchmode(false);
                                          setFilesearchList([]);
                                          }}>
                                  ▶
                              </button>
                              </div>
                          ):(null)}

                          <button
                              className="text-red-500 hover:text-red-700 justify-end"
                              disabled={loading}
                              onClick={() => {
                                handleFileDelete(selectRepo, currentPath, entry.name);
                                setSearchmode(false);
                                setFilesearchList([]);
                              }}
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
          ):(
            <div className="w-full">
              <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-4 w-full max-w-xl" >
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
                              onClick={()=>{if (!loading) handleFileselect(entry);}}>
                                  {handleStatusOut(gitStatusList,entry)}
                              </span>

                              <span
                              className="text-white"
                              onClick={()=>{if (!loading) handleFileselect(entry);}}>
                              {entry.name}
                              </span>

                              <div className="flex items-center space-x-2 ml-auto">

                              { entry.isDirectory == false ? (
                                <button
                                  className="text-blue-400 hover:text-blue-600 justify-end"
                                  disabled={loading}
                                  onClick={() => handleGitFileLog( selectRepo, currentPath, entry.name)}
                                  title={`${entry.name}の履歴`}
                                >
                                  🕒
                                </button>
                              ) : null}

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
              <div className="flex w-full sm:max-w-xl space-x-2" >

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
                  title={`${newFileName}.txt ファイルを作成`}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex-shrink-0 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                  >
                  +📄
                  </button>
                  <button
                  onClick={() => handleNewFile( selectRepo, currentPath, newFileName, "folder" )}
                  disabled={loading || newFileName.length == 0 }
                  title={`${newFileName} フォルダを作成`}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex-shrink-0 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                  >
                  +📁
                  </button>

              </div>
            </div>
          )}
          
          </div>
      </div>
      {loglist ? (
        <FileLogModal 
          selectRepo={selectRepo}
          isOpen={isModalOpen}
          onClose={() => {setModalOpen(false);setLoglist([]);}}
          fileName={selectedFile}
          loglist={loglist}
          handleGitCheckoutHashFile={handleGitCheckoutHashFile}
        />
      ):(null)}
    </>
  );
}

