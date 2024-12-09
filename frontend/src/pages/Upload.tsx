import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api'
import React from 'react'
interface FileWithStatus {
    file: File;
    status: 'pending' | 'uploading' | 'success' | 'error';
    error?: string;
}

function Upload() {
    const [files, setFiles] = useState<FileWithStatus[]>([])
    const [isDragging, setIsDragging] = useState(false)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files).map(file => ({
                file,
                status: 'pending' as const
            }))
            setFiles(prev => [...prev, ...newFiles])
        }
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)

        const droppedFiles = Array.from(e.dataTransfer.files)
            .filter(file => file.type === 'image/jpeg' || file.type === 'image/png')
            .map(file => ({
                file,
                status: 'pending' as const
            }))

        setFiles(prev => [...prev, ...droppedFiles])
    }

    const uploadFile = async (fileWithStatus: FileWithStatus, index: number) => {
        setFiles(prev => prev.map((f, i) =>
            i === index ? { ...f, status: 'uploading' } : f
        ))

        try {
            await api.uploadFile(fileWithStatus.file)
            setFiles(prev => prev.map((f, i) =>
                i === index ? { ...f, status: 'success' } : f
            ))
        } catch (err) {
            setFiles(prev => prev.map((f, i) =>
                i === index ? { ...f, status: 'error', error: 'Failed to upload file' } : f
            ))
            console.error(err)
        }
    }

    const handleUploadAll = async () => {
        const pendingFiles = files.filter(f => f.status === 'pending')
        for (const file of pendingFiles) {
            await uploadFile(file, files.indexOf(file))
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

                    <div
                        className={`bg-[#002f1f] border-2 border-dashed ${isDragging ? 'border-[#00ff00]' : 'border-[#004d2f]'
                            } rounded-lg p-8 text-center transition-colors duration-200`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        <input
                            type="file"
                            onChange={handleFileChange}
                            className="hidden"
                            id="file-upload"
                            accept="image/jpeg,image/png"
                            multiple
                        />
                        <label
                            htmlFor="file-upload"
                            className="cursor-pointer flex flex-col items-center gap-4"
                        >
                            <div className="w-16 h-16 bg-[#004d2f] rounded-full flex items-center justify-center">
                                <span className="text-3xl">+</span>
                            </div>
                            <span className="text-[#008000]">
                                Drop files here or click to select
                            </span>
                        </label>
                    </div>

                    {/* File List */}
                    {files.length > 0 && (
                        <div className="space-y-4">
                            {files.map((fileWithStatus, index) => (
                                <div
                                    key={index}
                                    className="bg-[#002f1f] p-4 rounded-lg flex items-center justify-between"
                                >
                                    <span className="text-[#008000] truncate">
                                        {fileWithStatus.file.name}
                                    </span>
                                    <span className="ml-4">
                                        {fileWithStatus.status === 'pending' && '🔄'}
                                        {fileWithStatus.status === 'uploading' && '⏳'}
                                        {fileWithStatus.status === 'success' && '✅'}
                                        {fileWithStatus.status === 'error' && '❌'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {files.length > 0 && (
                        <button
                            onClick={handleUploadAll}
                            disabled={files.every(f => f.status === 'success')}
                            className={`w-full bg-[#004d2f] hover:bg-[#006d3f] text-[#00ff00] py-4 text-lg rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#00ff00] ${files.every(f => f.status === 'success') && 'opacity-50 cursor-not-allowed'
                                }`}
                        >
                            Upload All Files
                        </button>
                    )}
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