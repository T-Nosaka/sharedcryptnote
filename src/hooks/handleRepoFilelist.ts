
/*
 * Repo filelist
 */
export function useHandleRepofilelist(
  setFileList: (files: { name: string; isDirectory: boolean }[]) => void,
  setLoading: ( status:boolean) => void, 
  setMessage: (str: string) => void,
  callback?: (gitinfostr:string) => void
) {
  return async (gitinfostr:string ,path = '') => {
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch('/api/files/repofilelist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ relativePath: path, gitinfostr: gitinfostr }),
      });
      const data = await response.json();
      if (response.ok) {
        setFileList(data);
        setMessage(data.message);
        if(callback)
          callback(gitinfostr);
      } else {
        setMessage(`Error: ${data.error}`);
        setFileList([]);
      }
    } catch (error) {
      console.error(error);
      setMessage(`An unexpected error occurred.${error}`);
      setFileList([]);
    } finally {
      setLoading(false);
    }
  };
}

