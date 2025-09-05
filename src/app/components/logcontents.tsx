'use client';

import React, { useState } from 'react';
import { DefaultLogFields, DiffResult, DiffResultBinaryFile, DiffResultNameStatusFile, DiffResultTextFile } from 'simple-git';
import { Repo } from '../models/gitinfo';
import { CheckoutFileMode } from '@/hooks/handleGitCheckoutfile';

/*
 * ログ処理
 */
export function LogContents({
    loading,
    repo,
    selectRepo,
    loglist,
    logdiffresult,
    setLoglist,
    setLogdiffResult,
    handleGitLogDetail,
    handleGitCheckoutHashFile,
}:{
    loading: boolean;
    repo: Repo | undefined;
    selectRepo: string;
    loglist:ReadonlyArray<DefaultLogFields>;
    logdiffresult:DiffResult|undefined;
    setLoglist:(loglist:ReadonlyArray<DefaultLogFields>|undefined)=>void;
    setLogdiffResult:(logdiffresult:DiffResult|undefined)=>void;
    handleGitLogDetail:(gitinfostr:string, hash:string) => void;
    handleGitCheckoutHashFile:(gitinfostr: string, mode: CheckoutFileMode, selectFilePath: string, hash?: string) => void;
}) {

    //排他選択の為、選択行キーを確保
    const [selectedLogHash, setSelectedLogHash] = useState<string | undefined>(undefined);

    //行クリック
    const handleRowClick = (hash: string) => {
        if (selectedLogHash === hash) {
            setSelectedLogHash(undefined);
            setLogdiffResult(undefined);
        } else {
            setSelectedLogHash(hash);
            setLogdiffResult(undefined);
            handleGitLogDetail(selectRepo, hash);
        }
    };

    //状態解析
    const statusAnalyze = (file:DiffResultTextFile|DiffResultBinaryFile|DiffResultNameStatusFile) => {
        const after = file.after;
        const before = file.before;
        let status = '変更';
        let color = 'text-yellow-400';

        if ( after === undefined || before === undefined ) {
            status = '削除';
            color = 'text-red-400';
        } else
        if (after > 0 && before === 0) {
            status = '新規';
            color = 'text-green-400';
        }
        return {status, color};
    }

    return (
        <div className="mt-4 p-6 border border-gray-700 rounded-lg w-full sm:max-w-xl bg-gray-800 shadow-lg" style={{maxWidth:600}}>
            <h2 className="text-2xl font-semibold mb-4 text-blue-300">📕{repo?.name}</h2>
            <div className="overflow-x-auto mt-4">
                <button
                onClick={() => setLoglist( undefined )}
                disabled={loading}
                className="w-full max-w-2xl px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                >
                ⏏️ 戻る
                </button>

                <table className="min-w-full border-collapse border border-gray-700">
                    <thead className="bg-gray-800">
                    <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-300 border-b border-gray-600">名前</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-300 border-b border-gray-600">日付</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-300 border-b border-gray-600">コメント</th>
                    </tr>
                    </thead>
                    <tbody className="bg-gray-900">
                    {loglist.map(log => (
                        <React.Fragment key={log.hash}>
                            <tr className="hover:bg-gray-700 transition-colors duration-150 cursor-pointer"
                            onClick={() => handleRowClick(log.hash)}>
                                <td className="px-4 py-2 border-b border-gray-700 text-sm">{log.author_name}</td>
                                <td className="px-4 py-2 border-b border-gray-700 text-sm">{new Date(log.date).toLocaleString()}</td>
                                <td className="px-4 py-2 border-b border-gray-700 text-sm">{log.message}</td>
                            </tr>
                            {selectedLogHash === log.hash && logdiffresult && (
                                <tr>
                                    <td colSpan={3} className="p-4 bg-gray-800">
                                        <div className="text-white">
                                            <tbody className="bg-gray-800">
                                                <tr>
                                                {logdiffresult.files.map(file => {
                                                    const {status, color} = statusAnalyze(file);
                                                    
                                                    return(
                                                        <ul key={file.file}>
                                                        <td className="px-1 py-1 border-gray-700 text-left text-sm">
                                                            <span className={color}>[{ status }]</span>
                                                        </td>
                                                        <td className="px-1 py-1 border-gray-700 text-left text-sm">
                                                            <button
                                                            disabled={loading || status === '新規'}
                                                            onClick={() => {
                                                                handleGitCheckoutHashFile( selectRepo, 'hash' , file.file, log.hash+"^");
                                                            }}
                                                            className="px-1 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                                                            >
                                                                戻す
                                                            </button>                                                            
                                                        </td>
                                                        <td className="px-1 py-1 border-gray-700 text-right text-sm">
                                                            <span className="font-semibold">{file.file}</span>
                                                        </td>
                                                        </ul>
                                                )})}
                                                </tr>
                                            </tbody>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </React.Fragment>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}