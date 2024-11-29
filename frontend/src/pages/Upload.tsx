import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api'
import React from 'react'
function Upload() {
    const [file, setFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
            setError(null)
            setSuccess(false)
        }
    }

    const handleUpload = async () => {
        if (!file) {
            setError('Please select a file first')
            return
        }

        setLoading(true)
        setError(null)

        try {
            await api.uploadFile(file)
            setSuccess(true)
            setFile(null)
            // Reset file input
            const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
            if (fileInput) fileInput.value = ''
        } catch (err) {
            setError('Failed to upload file')
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#001f0f] text-[#00ff00] flex flex-col">
            {/* Header */}
            <header className="flex justify-between items-center p-4">
                <Link to="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-[#00ff00] rounded-full"></div>
                    <span className="text-xl font-bold">
                        GREEN<span className="text-[#7cfc00]">GREP</span>
                    </span>
                </Link>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-8 flex flex-col items-center justify-center">
                <div className="w-full max-w-xl space-y-6">
                    <h1 className="text-3xl font-bold text-center mb-8">Upload Greentext</h1>

                    <div className="bg-[#002f1f] border-2 border-dashed border-[#004d2f] rounded-lg p-8 text-center">
                        <input
                            type="file"
                            onChange={handleFileChange}
                            className="hidden"
                            id="file-upload"
                            accept=".txt,.json"
                        />
                        <label
                            htmlFor="file-upload"
                            className="cursor-pointer flex flex-col items-center gap-4"
                        >
                            <div className="w-16 h-16 bg-[#004d2f] rounded-full flex items-center justify-center">
                                <span className="text-3xl">+</span>
                            </div>
                            <span className="text-[#008000]">
                                {file ? file.name : 'Choose a file or drag it here'}
                            </span>
                        </label>
                    </div>

                    {error && (
                        <div className="text-red-500 text-center">{error}</div>
                    )}

                    {success && (
                        <div className="text-[#00ff00] text-center">
                            File uploaded successfully!
                        </div>
                    )}

                    <button
                        onClick={handleUpload}
                        disabled={!file || loading}
                        className={`w-full bg-[#004d2f] hover:bg-[#006d3f] text-[#00ff00] py-4 text-lg rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#00ff00] ${(!file || loading) && 'opacity-50 cursor-not-allowed'
                            }`}
                    >
                        {loading ? 'Uploading...' : 'Upload File'}
                    </button>
                </div>
            </main>

            {/* Footer */}
            <footer className="p-4 flex justify-center items-center text-sm gap-2">
                <span className="text-[#008000]">
                    Powered by AWS S3
                </span>
            </footer>
        </div>
    )
}
export default Upload