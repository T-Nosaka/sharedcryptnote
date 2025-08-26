import path from "path";

export const useHandleFileReset = (
  setMessage: (message: string) => void,
  setLoading: (loading: boolean) => void,
  callback?: () => void
) => {
  const handleFileDelete = async (gitinfostr: string, currentPath: string, fileName: string) => {
    if (!window.confirm(`'${fileName}' を戻しますか？`)) {
      return;
    }

    setLoading(true);
    setMessage('');
    try {
        setLoading(true);
        const selectFilePath = path.join(currentPath,fileName);
        const response = await fetch('/api/file-content/reset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gitinfostr: gitinfostr, selectFilePath:selectFilePath })
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

  return handleFileDelete;
};