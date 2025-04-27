import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'

interface SearchInputProps {
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSearch: () => void
}

const SearchInput: React.FC<SearchInputProps> = ({ value, onChange, onSearch }) => {
  const { t } = useTranslation()

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch()
    }
  }

  return (
    <div className='relative w-full max-w-md'>
      <input
        type='text'
        value={value}
        onChange={onChange}
        onKeyPress={handleKeyPress}
        placeholder={t('search_placeholder')}
        className='w-full px-5 py-3 pr-12 text-sm text-gray-800 bg-white border border-gray-300 rounded-lg shadow-sm 
                   focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-300'
      />
      <button
        onClick={onSearch}
        className='absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition'
      >
        <Search className='w-5 h-5' />
      </button>
    </div>
  )
}

const SearchContainer: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const { t } = useTranslation()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setError(t('empty_search_term'))
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `http://localhost:8000/api/products/search?query=${encodeURIComponent(searchTerm)}&per_page=10`
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || t('http_error', { status: response.status }))
      }

      const data = await response.json()

      if (!data.data || !data.data.data) {
        throw new Error(t('invalid_search_results'))
      }

      navigate(`/search?query=${encodeURIComponent(searchTerm)}`)
    } catch (err: any) {
      setError(err.message || t('error_fetching_search_results'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='flex flex-col items-center gap-4 p-6'>
      <SearchInput value={searchTerm} onChange={handleInputChange} onSearch={handleSearch} />
      {/* {loading && <p className='text-gray-500 text-sm'>{t('searching')}</p>}
      {error && <p className='text-red-500 text-sm'>{error}</p>} */}
    </div>
  )
}

export default SearchContainer
