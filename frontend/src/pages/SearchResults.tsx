import { Search } from 'lucide-react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'

function SearchResults() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
    const results = Array(Math.max(3, searchQuery.length)).fill(null) // Number of results based on query length

    const handleSearch = () => {
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery)}`)
        }
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {results.map((_, index) => (
                        <div
                            key={index}
                            className="bg-[#002f1f] border border-[#004d2f] rounded-lg overflow-hidden hover:border-[#00ff00] transition-colors duration-200"
                        >
                            <img
                                src={`https://picsum.photos/400/300?random=${index}`}
                                alt={`Result ${index + 1}`}
                                className="w-full h-48 object-cover"
                            />
                            <div className="p-4">
                                <h3 className="text-[#00ff00] font-medium mb-2">Greentext #{index + 1}</h3>
                                <p className="text-[#008000] text-sm">
                                    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
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