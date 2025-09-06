import path from "path";

/*
 * フォルダ、ファイル選択
 */ 
export function useHandleFileSelect(
    currentPath:string,
    setMessage: (str: string) => void, 
    callback?: (nextpath:string) => void,
    filecallback?: (fullPath:string,fileExtension:string) => void ) {

    return async (entry: { name: string; isDirectory: boolean }) => {
        if (entry.isDirectory) {
            // ディレクトリの場合、そのディレクトリに移動
            const newPath = path.join(currentPath, entry.name);
            if (callback)
                callback(newPath);
        } else {
            // ファイルの場合、編集可能かチェックし、内容を読み込む
            const fullPath = path.join(currentPath, entry.name);
            const fileExtension = path.extname(entry.name);
            if (filecallback)
                filecallback(fullPath,fileExtension);
        }
    }
}
