import { Search } from 'lucide-react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import { api, S3File } from '../services/api'
import LoadingTrigger from '../components/LoadingTrigger'
import Masonry from 'react-masonry-css'

function SearchResults() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
    const [files, setFiles] = useState<S3File[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [cursor, setCursor] = useState<string | undefined>()
    const [hasMore, setHasMore] = useState(true)
    const [isLoadingMore, setIsLoadingMore] = useState(false)

    const breakpointColumns = {
        default: 4,
        1100: 3,
        700: 2,
        500: 1
    }

    const loadFiles = useCallback(async (newCursor?: string) => {
        try {
            setIsLoadingMore(true)
            const response = await api.getFiles(newCursor)

            if (newCursor) {
                setFiles(prev => [...prev, ...response.files])
            } else {
                setFiles(response.files)
            }

            setCursor(response.nextCursor)
            setHasMore(response.hasMore)
        } catch (err) {
            setError('Failed to fetch images')
            console.error(err)
        } finally {
            setIsLoadingMore(false)
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadFiles()
    }, [loadFiles])

    const handleLoadMore = useCallback(() => {
        if (!isLoadingMore && hasMore) {
            loadFiles(cursor)
        }
    }, [cursor, hasMore, isLoadingMore, loadFiles])

    const handleSearch = () => {
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery)}`)
        }
    }

    if (loading) {
        return <div className="min-h-screen bg-[#001f0f] text-[#00ff00] flex items-center justify-center">
            Loading...
        </div>
    }

    if (error) {
        return <div className="min-h-screen bg-[#001f0f] text-[#00ff00] flex items-center justify-center">
            {error}
        </div>
    }

    return (
        <div className="min-h-screen bg-[#001f0f] text-[#00ff00] flex flex-col">
            {/* Header */}
            <header className="flex justify-between items-center p-4 border-b border-[#004d2f]">
                <Link to="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-[#00ff00] rounded-full"></div>
                    <span className="text-xl font-bold">
                        GREEN<span className="text-[#7cfc00]">GREP</span>
                    </span>
                </Link>

                {/* Search Bar */}
                <div className="flex-1 max-w-xl mx-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#008000]" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className="w-full bg-[#002f1f] border border-[#004d2f] text-[#00ff00] placeholder-[#008000] pl-10 pr-4 py-2 text-md rounded-md focus:outline-none focus:ring-2 focus:ring-[#00ff00] focus:border-transparent"
                        />
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-8">
                {/* Results Count */}
                <div className="text-[#008000] mb-6">
                    Found {files.length} results for "{searchQuery}"
                </div>

                {/* Results Grid - Updated to masonry-style layout */}
                <Masonry
                    breakpointCols={breakpointColumns}
                    className="flex w-auto -ml-6"
                    columnClassName="pl-6"
                >
                    {files.map((file) => (
                        <Link
                            to={`/image/${encodeURIComponent(file.key)}`}
                            key={file.key}
                            className="block mb-6"
                        >
                            <div className="bg-[#002f1f] border border-[#004d2f] rounded-lg overflow-hidden hover:border-[#00ff00] transition-colors duration-200">
                                <img
                                    src={file.url}
                                    alt={file.key}
                                    className="w-full h-auto"
                                />
                                <div className="p-4">
                                    <h3 className="text-[#00ff00] font-medium mb-2">{file.key}</h3>
                                    <p className="text-[#008000] text-sm">
                                        Size: {Math.round(file.size / 1024)} KB
                                        <br />
                                        Modified: {new Date(file.lastModified).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </Masonry>

                {/* Loading Trigger */}
                <LoadingTrigger
                    onIntersect={handleLoadMore}
                    enabled={hasMore && !isLoadingMore}
                />

                {/* Loading indicator */}
                {isLoadingMore && (
                    <div className="text-center py-4 text-[#008000]">
                        Loading more...
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="p-4 flex justify-center items-center text-sm gap-2">
                <span className="text-[#008000]">
                    Powered by Postgres Vector Search
                </span>
                <span className="text-[#008000]">•</span>
                <a
                    href="https://x.com/Aizkmusic"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#008000] hover:text-[#00ff00] transition-colors duration-200"
                >
                    Made by @Aizkmusic
                </a>
            </footer>
        </div>
    )
}

export default SearchResults