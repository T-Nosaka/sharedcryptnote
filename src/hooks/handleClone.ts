
/*
 * Git Clone
 */
export function useHandleClone( 
  setLoading: ( status:boolean) => void, 
  setMessage: (str: string) => void,
  callback?: () => void  ) {
  return async ( repoUrl: string ,name: string, sshkey: string ) => {
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch('/api/git/clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: repoUrl, name:name, sshkey: sshkey }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage(data.message);
        if (callback)
            callback();
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

