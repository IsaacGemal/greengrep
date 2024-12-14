import { Search, Upload, Shuffle } from 'lucide-react'
import { useNavigate, Link } from 'react-router-dom'
import { useState } from 'react'
import { api } from '../services/api'
import Footer from '../components/Footer'
function Home() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  }

  const handleRandomPosts = async () => {
    try {
      setLoading(true)
      const response = await api.getRandomPosts()

      // Navigate to random page instead of search
      navigate('/random', {
        state: {
          results: response.results,
          lastExecutedQuery: 'Random Posts'
        }
      })
    } catch (error) {
      console.error('Failed to fetch random posts:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#001f0f] text-[#00ff00] flex flex-col">
      {/* Header */}
      <header className="flex justify-between p-4">
        <span className="text-[#008000]">[greentexts]</span>
        <Link
          to="/upload"
          className="text-[#008000] hover:text-[#00ff00] transition-colors duration-200"
        >
          <Upload className="w-6 h-6" />
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center gap-8 px-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-16 h-16 bg-[#00ff00] rounded-full"></div>
          <h1 className="text-4xl font-bold">
            GREEN<span className="text-[#7cfc00]">GREP</span>
          </h1>
        </div>

        {/* Search Section */}
        <div className="w-full max-w-xl space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#008000]" />
            <input
              type="text"
              placeholder="search for greentexts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full bg-[#002f1f] border border-[#004d2f] text-[#00ff00] placeholder-[#008000] pl-10 pr-20 py-6 text-lg rounded-md focus:outline-none focus:ring-2 focus:ring-[#00ff00] focus:border-transparent"
            />
          </div>

          <div className="flex gap-4">

            <button
              onClick={handleRandomPosts}
              disabled={loading}
              className="flex-1 bg-[#004d2f] hover:bg-[#006d3f] text-[#00ff00] py-6 text-lg rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#00ff00] flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="animate-spin h-5 w-5 border-2 border-[#00ff00] border-t-transparent rounded-full" />
              ) : (
                <>
                  <Shuffle className="w-5 h-5" />
                  Roll
                </>
              )}
            </button>
            <button
              onClick={handleSearch}
              className="flex-1 bg-[#004d2f] hover:bg-[#006d3f] text-[#00ff00] py-6 text-lg rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#00ff00]"
            >
              Search Greentexts
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}

export default Home
