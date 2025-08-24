
/*
 * Repo delete
 */
export function useHandleRepoDelete(
    setLoading: ( status:boolean) => void,
    setMessage: (str: string) => void,
    callback?: () => void
) {
  return async (reponame: string) => {
    if (!window.confirm(`'${reponame}' を削除しますか？`)) {
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      const response = await fetch('/api/git/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reponame: reponame }),
      });
      const data = await response.json();
      if (response.ok) {
        if(callback)
          callback();
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error(error);
      setMessage(`An unexpected error occurred.${error}`);
    } finally {
      setLoading(false);
    }
  };
}
