
/*
 * Repo filesearch
 */
export function useHandleRepofilesearch(
  setFilesearchList: (files: { name: string; isDirectory: boolean }[]) => void,
  setLoading: ( status:boolean) => void, 
  setMessage: (str: string) => void,
  callback?: (gitinfostr:string) => void
) {
  return async (gitinfostr:string ,path = '', keyword = '') => {
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch('/api/files/repofilesearch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ relativePath: path, gitinfostr: gitinfostr, keyword: keyword }),
      });
      const data = await response.json();
      if (response.ok) {
        setFilesearchList(data);
        setMessage(data.message);
        if(callback)
          callback(gitinfostr);
      } else {
        setMessage(`Error: ${data.error}`);
        setFilesearchList([]);
      }
    } catch (error) {
      console.error(error);
      setMessage(`An unexpected error occurred.${error}`);
      setFilesearchList([]);
    } finally {
      setLoading(false);
    }
  };
}

