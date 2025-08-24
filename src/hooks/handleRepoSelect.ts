
/*
 * Repo select
 */
export function useHandleRepoSelect(
  setselectRepo: (str: string|undefined) => void,
  setMessage: (str: string) => void,
  callback?: (gitinfostr:string,encoding:string) => void
) {
  return async (entry: { name: string; isDirectory: boolean }) => {
    setMessage('');
    if (entry.isDirectory) {
      try {
        const response = await fetch('/api/files/reposelect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: entry.name }),
        });
        const data = await response.json();
        if (response.ok) {
          setMessage(data.message);
          setselectRepo(data.gitinfostr);
          if (callback)
            callback(data.gitinfostr,data.encoding);
        } else {
          setMessage(`Error: ${data.error}`);
          setselectRepo(undefined);
        }
      } catch (error) {
        setMessage('An unexpected error occurred.');
        console.error(error);
      }
    }
  };
}

