import { DiffResult } from "simple-git";

/*
 * Git LogDetail
 */
export function useHandleGitLogDetail( 
  setLoading: ( status:boolean) => void, 
  setMessage: (str: string) => void,
  callback?: (diffresult:DiffResult) => void  ) {
  return async ( gitinfostr:string, hash:string ) => {
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch('/api/git/logdetail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gitinfostr: gitinfostr, hash: hash }),
      });
      const data = await response.json();
      if (response.ok) {
        if (callback) {
          callback(data.diffresult);
        }
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

