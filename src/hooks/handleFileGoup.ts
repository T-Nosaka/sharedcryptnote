import { dirname } from 'path';

/*
 * 親ディレクトリ移動
 */
export function useHandleFileGoup(
    currentPath:string,
    callback?: (nextpath:string) => void ) {

  // 親ディレクトリへ移動するハンドラー
  return async () => {
    const nextpath = dirname(currentPath);
    if (callback)
        callback(nextpath);      
  };
}
