import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { api, S3File } from '../services/api';

function ImageDetails() {
    const { key } = useParams();
    const [file, setFile] = useState<S3File | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchFile = async () => {
            try {
                const files = await api.getFiles();
                const foundFile = files.find(f => f.key === key);
                if (foundFile) {
                    setFile(foundFile);
                } else {
                    setError('Image not found');
                }
            } catch (err) {
                setError('Failed to fetch image');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchFile();
    }, [key]);

    if (loading) {
        return <div className="min-h-screen bg-[#001f0f] text-[#00ff00] flex items-center justify-center">
            Loading...
        </div>
    }

    if (error || !file) {
        return <div className="min-h-screen bg-[#001f0f] text-[#00ff00] flex items-center justify-center">
            {error}
        </div>
    }

    return (
        <div className="min-h-screen bg-[#001f0f] text-[#00ff00] flex flex-col">
            {/* Header */}
            <header className="flex items-center p-4 border-b border-[#004d2f]">
                <Link to="/search" className="text-[#00ff00] hover:text-[#7cfc00] transition-colors duration-200">
                    ← Back to results
                </Link>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-8 flex flex-col items-center">
                <div className="inline-block bg-[#002f1f] border border-[#004d2f] rounded-lg overflow-hidden">
                    <div className="flex justify-center">
                        <img
                            src={file.url}
                            alt={file.key}
                            className="max-w-[90vw] max-h-[70vh] object-contain bg-[#001f0f]"
                        />
                    </div>
                    <div className="p-6" style={{ width: 'min(90vw, 100%)' }}>
                        <h1 className="text-2xl font-medium mb-4">{file.key}</h1>
                        <div className="text-[#008000] space-y-2">
                            <p>Size: {Math.round(file.size / 1024)} KB</p>
                            <p>Last Modified: {new Date(file.lastModified).toLocaleString()}</p>
                            <p>URL: <a href={file.url} target="_blank" rel="noopener noreferrer"
                                className="text-[#00ff00] hover:text-[#7cfc00] transition-colors duration-200">
                                View original
                            </a></p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default ImageDetails;
