
/*
 * Git Fetch
 */
export function useHandleGitFetch( 
  setLoading: ( status:boolean) => void, 
  setMessage: (str: string) => void,
  callback?: (gitinfostr:string) => void  ) {
  return async ( gitinfostr:string ) => {
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch('/api/git/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gitinfostr: gitinfostr}),
      });
      const data = await response.json();
      if (response.ok) {
        if (callback) {
          callback(gitinfostr);
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

