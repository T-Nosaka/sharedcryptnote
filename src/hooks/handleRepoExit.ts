
/*
 * Repo exit
 */
export function useHandleRepoExit(
  setselectRepo: (str: string|undefined) => void,
  setMessage: (str: string) => void,
  callback?: () => void
) {
  return async () => {
    setMessage('');
    setselectRepo(undefined);
    if (callback)
      callback();    
  };
}
