import path from 'path';

/*
 * ファイル暗号化
 */
export function useHandleFileEncrypt(
    setMessage: (str: string) => void,
    setLoading: (status: boolean) => void,
    callback?: (contents:string) => void ) {
  return async (
    gitinfostr: string,
    currentpath: string,
    filename: string,
    password: string,
  ) => {
    try {
        setLoading(true);
        const selectFilePath = path.join(currentpath,filename);
        const response = await fetch('/api/file-content/encrypt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gitinfostr: gitinfostr, selectFilePath: selectFilePath, password: password }),
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
