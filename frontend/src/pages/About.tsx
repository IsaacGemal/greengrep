import Header from '../components/Header'
import Footer from '../components/Footer'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function About() {
  const [searchQuery, setSearchQuery] = useState('')
  const [nsfwEnabled, setNsfwEnabled] = useState(false)
  const navigate = useNavigate()

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`)
    }
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

      {/* Main Content */}
      <main className="flex-1 p-8 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">About Greengrep</h1>

        <div className="space-y-6 text-[#008000] font-mono">
          <section className="whitespace-pre-line">
            <p>
              {`> be me
> browsing the web
> no decent greentext search engine
> all roads lead to reddit slop
> screw it, I'll build one myself
> learn react, postgresql, and vector search
> spend way too much time on this
> it actually works
> mfw you're using it right now`}
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default About;
