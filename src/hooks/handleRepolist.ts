
/*
 * Repo list
 */
export function useHandleRepolist(
  setRepoList: (files: { name: string; isDirectory: boolean }[]) => void,
  setLoading: (status: boolean) => void,
  setMessage: (str: string) => void
) {
  return async () => {
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/files/repolist');
      const data = await response.json();
      if (response.ok) {
        setMessage(data.message);
        setRepoList(data);
      } else {
        setMessage(`Error: ${data.error}`);
        setRepoList([]);
      }
    } catch (error) {
      setMessage(`An unexpected error occurred.${error}`);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
}

