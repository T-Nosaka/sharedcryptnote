
/*
 * 新規ファイル
 */
export function useHandleFileNew(
    setMessage: (str: string) => void,
    setLoading: (status: boolean) => void,
    callback?: (contents:string) => void ) {
  return async (
    gitinfostr: string,
    currentPath : string,
    newFilename : string,
    kindtype:string,
  ) => {
    try {
        setLoading(true);
        const response = await fetch('/api/file-content/new', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gitinfostr: gitinfostr, currentPath: currentPath, newFilename: newFilename, kindtype: kindtype}),
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
