// src/components/Footer.tsx
function Footer() {
    return (
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
    )
}

export default Footer
