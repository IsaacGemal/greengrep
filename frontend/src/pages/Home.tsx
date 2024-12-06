import { Search, Upload } from 'lucide-react'
import { useNavigate, Link } from 'react-router-dom'
import { useState } from 'react'

function Home() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
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

          <button
            onClick={handleSearch}
            className="w-full bg-[#004d2f] hover:bg-[#006d3f] text-[#00ff00] py-6 text-lg rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#00ff00]"
          >
            Search Greentexts
          </button>
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

export default Home
