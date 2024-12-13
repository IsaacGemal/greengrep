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

        <div className="space-y-6 text-[#008000]">
          <section>
            <h2 className="text-xl text-[#00ff00] mb-2">What is Greengrep?</h2>
            <p>
              Greengrep is a visual search engine for greentexts, powered by PostgreSQL's vector search capabilities.
              It allows you to search through a collection of greentext images using natural language queries.
            </p>
          </section>

          <section>
            <h2 className="text-xl text-[#00ff00] mb-2">How it Works</h2>
            <p>
              Images are processed using computer vision to extract text and generate embeddings.
              These embeddings are stored in a PostgreSQL database, enabling semantic search capabilities
              that go beyond simple keyword matching.
            </p>
          </section>

          <section>
            <h2 className="text-xl text-[#00ff00] mb-2">Features</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Natural language search for greentext images</li>
              <li>Random greentext discovery</li>
              <li>Image upload capabilities</li>
              <li>NSFW content filtering</li>
              <li>Responsive masonry layout</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl text-[#00ff00] mb-2">Technology Stack</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Frontend: React, TypeScript, Tailwind CSS</li>
              <li>Backend: PostgreSQL with pgvector</li>
              <li>Storage: AWS S3</li>
              <li>Image Processing: Computer Vision APIs</li>
            </ul>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default About;
