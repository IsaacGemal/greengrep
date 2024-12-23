// src/pages/SearchResults.tsx
import { Link, useSearchParams, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import Masonry from 'react-masonry-css'
import debounce from 'lodash/debounce'
import { api } from '../services/api'
import { SearchResult } from '../services/api'
import Header from '../components/Header'
import Footer from '../components/Footer'
import LoadingTrigger from '../components/LoadingTrigger'

function SearchResults() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const location = useLocation()

    const initialSearchQuery = searchParams.get('q') || ''
    const [searchQuery, setSearchQuery] = useState(initialSearchQuery)
    const [results, setResults] = useState<SearchResult[]>(location.state?.results || [])
    const [loading, setLoading] = useState(!location.state?.results)
    const [error, setError] = useState<string | null>(null)
    const [lastExecutedQuery, setLastExecutedQuery] = useState<string | null>(
        location.state?.lastExecutedQuery || null
    )
    const [nsfwEnabled, setNsfwEnabled] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [hasMore, setHasMore] = useState(true)
    const ITEMS_PER_PAGE = 20

    const breakpointColumns = {
        default: 4,
        1100: 3,
        700: 2,
        500: 1
    }

    const debouncedSearch = useCallback(
        debounce(async (query: string, page: number) => {
            const sanitizedQuery = query.replace(/^&+/, '')

            if (!sanitizedQuery) {
                setLoading(false)
                return
            }

            if (sanitizedQuery !== lastExecutedQuery || page > 1) {
                try {
                    if (page === 1) {
                        setLoading(true)
                    }

                    const response = await api.search(sanitizedQuery, page, ITEMS_PER_PAGE)

                    if (page === 1) {
                        setResults(response.results)
                    } else {
                        setResults(prev => [...prev, ...response.results])
                    }

                    setLastExecutedQuery(sanitizedQuery)
                    setHasMore(response.results.length === ITEMS_PER_PAGE)

                    if (page === 1) {
                        navigate(`/search?q=${encodeURIComponent(sanitizedQuery)}`, {
                            replace: true,
                            state: {
                                results: response.results,
                                lastExecutedQuery: sanitizedQuery
                            }
                        })
                    }
                } catch (err) {
                    console.error('Search error:', err)
                    setError('Failed to perform search')
                } finally {
                    setLoading(false)
                }
            } else if (sanitizedQuery === lastExecutedQuery) {
                setLoading(false)
            }
        }, 500),
        [lastExecutedQuery, navigate]
    )

    useEffect(() => {
        debouncedSearch(searchQuery, currentPage)
        return () => {
            debouncedSearch.cancel()
        }
    }, [searchQuery, currentPage, debouncedSearch])

    useEffect(() => {
        if (!initialSearchQuery && !location.state?.results) {
            navigate('/', { replace: true })
        }
    }, [initialSearchQuery, location.state?.results, navigate])

    const handleSearch = () => {
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery)}`)
        }
    }

    const handleLoadMore = useCallback(() => {
        if (!loading && hasMore) {
            setCurrentPage(prev => prev + 1)
        }
    }, [loading, hasMore])

    if (loading) {
        return (
            <div className="min-h-screen bg-[#001f0f] text-[#00ff00] flex flex-col">
                <Header
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    handleSearch={handleSearch}
                    nsfwEnabled={nsfwEnabled}
                    setNsfwEnabled={setNsfwEnabled}
                />

                <main className="flex-1 p-8">
                    <div className="text-[#008000] mb-6 flex items-center gap-2">
                        <div className="animate-spin h-4 w-4 border-2 border-[#00ff00] border-t-transparent rounded-full"></div>
                        <span>Searching...</span>
                    </div>
                </main>

                <Footer />
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#001f0f] text-[#00ff00] flex items-center justify-center">
                {error}
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#001f0f] text-[#00ff00] flex flex-col">
            <Header
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                handleSearch={handleSearch}
                nsfwEnabled={nsfwEnabled}
                setNsfwEnabled={setNsfwEnabled}
            />

            <main className="flex-1 p-8">
                <div className="text-[#008000] mb-6">
                    {lastExecutedQuery === 'Random Posts'
                        ? `Showing ${results.length} random posts`
                        : `Found ${results.length} results for "${searchQuery}"`}
                </div>

                <Masonry
                    breakpointCols={breakpointColumns}
                    className="flex w-auto -ml-6"
                    columnClassName="pl-6"
                >
                    {results.map((result, index) => (
                        <div key={index} className="block mb-6">
                            <Link
                                to={`/image/${encodeURIComponent(result.url?.split('/').pop() || '')}`}
                                state={{ file: result }}
                            >
                                <div className="bg-[#002f1f] border border-[#004d2f] rounded-lg overflow-hidden hover:border-[#00ff00] transition-colors duration-200">
                                    <div className={`relative ${result.is_nsfw && !nsfwEnabled ? 'blur-xl' : ''}`}>
                                        <img
                                            src={result.url}
                                            alt={`Search result ${index + 1}`}
                                            className="w-full h-auto"
                                        />
                                        {result.is_nsfw && !nsfwEnabled && (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="text-[#00ff00] bg-[#002f1f] px-3 py-1 rounded">NSFW</span>
                                            </div>
                                        )}
                                    </div>
                                    {lastExecutedQuery !== 'Random Posts' && (
                                        <div className="p-4">
                                            <p className="text-[#008000] text-sm">
                                                Similarity: {((result.similarity * 100) % 100).toFixed(2)}%
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </Link>
                        </div>
                    ))}
                </Masonry>

                {hasMore && (
                    <LoadingTrigger onIntersect={handleLoadMore} enabled={!loading} />
                )}

                {loading && currentPage > 1 && (
                    <div className="mt-8 flex justify-center">
                        <div className="animate-spin h-8 w-8 border-2 border-[#00ff00] border-t-transparent rounded-full"></div>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    )
}

export default SearchResults
