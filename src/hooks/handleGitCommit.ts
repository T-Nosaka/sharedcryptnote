
/*
 * Git Commit
 */
export function useHandleGitCommit( 
  setLoading: ( status:boolean) => void, 
  setMessage: (str: string) => void,
  callback?: () => void  ) {
  return async ( gitinfostr:string, commitmessage:string ) => {
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch('/api/git/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gitinfostr: gitinfostr, commitmessage: commitmessage }),
      });
      const data = await response.json();
      if (response.ok) {
        if (callback) {
          callback();
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

