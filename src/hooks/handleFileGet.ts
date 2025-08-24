
export async function handleFileGet( 
    gitinfostr: string,
    fileEncoding: string,
    relativeFilePath : string, 
    fileExtension : string,
    password: string,
    setMessage: (str: string) => void,
    setLoading: (status: boolean) => void,
    callback?: (contents:string) => void) {
    try {
        setLoading(true);
        const response = await fetch('/api/file-content/get', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gitinfostr: gitinfostr, fileEncoding:fileEncoding, relativeFilePath: relativeFilePath, fileExtension: fileExtension, password: password }),
        });
        const data = await response.json();
        if (response.ok) {
            if (callback)
                callback(data.content);            
        } else {
            setMessage(`Error: ${data.error}`);
        }
    } catch (error) {
        setMessage('An unexpected error occurred.');
        console.error(error);
    } finally {
        setLoading(false);
    }
}
