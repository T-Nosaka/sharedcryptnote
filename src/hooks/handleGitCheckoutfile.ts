import path from "path";

export type CheckoutFileMode = 'ours' | 'theirs';

export const useHandleGitCheckoutFile = (
  setMessage: (message: string) => void,
  setLoading: (loading: boolean) => void,
  callback?: () => void
) => {
  return async (gitinfostr: string, mode: CheckoutFileMode, currentPath: string, fileName: string) => {

    setLoading(true);
    setMessage('');
    try {
        setLoading(true);
        const selectFilePath = path.join(currentPath,fileName);
        const response = await fetch('/api/git/checkoutfile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gitinfostr: gitinfostr, mode: mode, selectFilePath:selectFilePath })
        });
        const data = await response.json();
        if (response.ok) {
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
};