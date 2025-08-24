import { extname } from 'path';

/*
 * ファイル保存
 */
export function useHandleFilePut(
    setMessage: (str: string) => void,
    setLoading: (status: boolean) => void,
    callback?: (contents:string) => void ) {
  return async (
    gitinfostr: string,
    fileEncoding: string,
    editingFilePath : string,
    content : string,
    password: string,
  ) => {
    try {
        setLoading(true);
        const fileExtension = extname(editingFilePath);
        const response = await fetch('/api/file-content/put', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gitinfostr: gitinfostr, fileEncoding:fileEncoding, editingFilePath: editingFilePath, fileExtension: fileExtension, content:content, password: password }),
        });
        const data = await response.json();
        if (response.ok) {
            if (callback)
                callback(data.content);            
        } else {
            setMessage(`Error: ${data.error}`);
        }
    } catch (error) {
        setMessage('An unexpected error occurred.');
        console.error(error);
    } finally {
        setLoading(false);
    }
  };
}
