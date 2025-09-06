import path from "path";
import { DefaultLogFields } from "simple-git";

/*
 * Git Log
 */
export function useHandleGitLog( 
  setLoading: ( status:boolean) => void, 
  setMessage: (str: string) => void,
  callback?: (loglist:ReadonlyArray<DefaultLogFields>) => void ) {
  return async ( gitinfostr:string ) => {
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch('/api/git/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gitinfostr: gitinfostr }),
      });
      const data = await response.json();
      if (response.ok) {
        if (callback) {
          callback(data.loglist);
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

/*
 * Git File Log
 */
export function useHandleGitFileLog( 
  setLoading: ( status:boolean) => void, 
  setMessage: (str: string) => void,
  callback?: (selectFilePath:string, loglist:ReadonlyArray<DefaultLogFields>) => void ) {
  return async ( gitinfostr:string, currentpath:string, filename:string ) => {
    setLoading(true);
    setMessage('');
    try {
      const selectFilePath = path.join(currentpath,filename);
      const response = await fetch('/api/git/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gitinfostr: gitinfostr, selectFilePath:selectFilePath }),
      });
      const data = await response.json();
      if (response.ok) {
        if (callback) {
          callback(selectFilePath,data.loglist);
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

