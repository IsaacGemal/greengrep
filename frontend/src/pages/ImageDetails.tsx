import { useParams, Link, useLocation } from 'react-router-dom';
import { SearchResult } from '../services/api';

function ImageDetails() {
    const { key } = useParams();
    const location = useLocation();
    const file = location.state?.file as SearchResult || {
        url: `https://greengrep.s3.amazonaws.com/${key}`,
        similarity: 0
    };

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
                            alt={key}
                            className="max-w-[90vw] max-h-[70vh] object-contain bg-[#001f0f]"
                        />
                    </div>
                    <div className="p-6" style={{ width: 'min(90vw, 100%)' }}>
                        <h1 className="text-2xl font-medium mb-4">{key}</h1>
                        <div className="text-[#008000] space-y-2">
                            <p>Similarity: {(file.similarity * 100).toFixed(2)}%</p>
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
