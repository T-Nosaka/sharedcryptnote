
/*
 * Git Pull
 */
export function useHandleGitPull( 
  setLoading: ( status:boolean) => void, 
  setMessage: (str: string) => void,
  callbacks?: {
    onSuccess?: () => void;
    onConflict?: () => void;
  }) {
  return async ( gitinfostr:string ) => {
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch('/api/git/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gitinfostr: gitinfostr}),
      });
      const data = await response.json();
      if (response.ok) {
        callbacks?.onSuccess?.();
      } else
        if (response.status == 409) {
          setMessage(`Error: ${data.error}`);
          callbacks?.onConflict?.();
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
