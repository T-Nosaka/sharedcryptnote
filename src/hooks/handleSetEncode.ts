/*
 * Repo set encoding
 */
export function useHandleSetEncode(
  setMessage: (str: string) => void,
  callback?: (encoding:string) => void
) {
  return async (gitinfostr:string,encoding:string) => {
    setMessage('');
    try {
    const response = await fetch('/api/files/repoencode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gitinfostr:gitinfostr, encoding: encoding }),
    });
    const data = await response.json();
    if (response.ok) {
        setMessage(data.message);
        if (callback)
            callback(encoding);
    } else {
        setMessage(`Error: ${data.error}`);
    }
    } catch (error) {
    setMessage('An unexpected error occurred.');
    console.error(error);
    }
  };
}

