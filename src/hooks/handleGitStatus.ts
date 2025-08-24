
/*
 * Git Status
 */
export function useHandleGitStatus( 
  setLoading: ( status:boolean) => void, 
  setMessage: (str: string) => void,
  callback?: ( status: {path:string,index:string,working_dir:string}[], ahead:number,behind:number ) => void  ) {
  return async ( gitinfostr:string ) => {
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch('/api/git/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gitinfostr: gitinfostr }),
      });
      const data = await response.json();
      if (response.ok) {
        if (callback) {
          callback(data.status,data.ahead,data.behind);
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

