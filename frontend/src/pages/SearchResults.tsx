import { Search } from 'lucide-react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import { api } from '../services/api'
import { SearchResult } from '../services/api'
import Masonry from 'react-masonry-css'
import debounce from 'lodash/debounce'

function SearchResults() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
    const [results, setResults] = useState<SearchResult[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const breakpointColumns = {
        default: 4,
        1100: 3,
        700: 2,
        500: 1
    }

    const debouncedSearch = useCallback(
        debounce(async (query: string) => {
            if (query) {
                try {
                    setLoading(true);
                    const response = await api.search(query);
                    setResults(response.results);
                } catch (error) {
                    console.error('Search error:', error);
                    setError('Failed to perform search');
                } finally {
                    setLoading(false);
                }
            }
        }, 500),
        []
    );

    useEffect(() => {
        debouncedSearch(searchQuery);

        // Cleanup function to cancel pending debounced calls
        return () => {
            debouncedSearch.cancel();
        };
    }, [searchQuery, debouncedSearch]);

    const handleSearch = () => {
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery)}`)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#001f0f] text-[#00ff00] flex flex-col">
                {/* Keep the header */}
                <header className="flex justify-between items-center p-4 border-b border-[#004d2f]">
                    <Link to="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-[#00ff00] rounded-full"></div>
                        <span className="text-xl font-bold">
                            GREEN<span className="text-[#7cfc00]">GREP</span>
                        </span>
                    </Link>

                    {/* Keep the search bar */}
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

                {/* Loading indicator in main content area */}
                <main className="flex-1 p-8">
                    <div className="text-[#008000] mb-6 flex items-center gap-2">
                        <div className="animate-spin h-4 w-4 border-2 border-[#00ff00] border-t-transparent rounded-full"></div>
                        <span>Searching...</span>
                    </div>
                </main>

                {/* Keep the footer */}
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
                    Found {results.length} results for "{searchQuery}"
                </div>

                {/* Results Grid */}
                <Masonry
                    breakpointCols={breakpointColumns}
                    className="flex w-auto -ml-6"
                    columnClassName="pl-6"
                >
                    {results.map((result, index) => (
                        <div
                            key={index}
                            className="block mb-6"
                        >
                            <div className="bg-[#002f1f] border border-[#004d2f] rounded-lg overflow-hidden hover:border-[#00ff00] transition-colors duration-200">
                                <img
                                    src={result.url}
                                    alt={`Search result ${index + 1}`}
                                    className="w-full h-auto"
                                />
                                <div className="p-4">
                                    <p className="text-[#008000] text-sm">
                                        Similarity: {(result.similarity * 100).toFixed(2)}%
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </Masonry>
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