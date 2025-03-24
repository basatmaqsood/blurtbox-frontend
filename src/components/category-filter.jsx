"use client"

import { useState, useEffect, useRef } from "react"

export default function CategoryFilter({ categories, onFilterChange }) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState([])
  const dropdownRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Toggle category selection
  const toggleCategory = (category) => {
    setSelectedCategories((prev) => {
      const newSelection = prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]

      // Notify parent component about filter change
      onFilterChange(newSelection)
      return newSelection
    })
  }

  // Clear all filters
  const clearFilters = () => {
    setSelectedCategories([])
    onFilterChange([])
  }

  return (
    <div className="mb-6 relative" ref={dropdownRef}>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
          </svg>
          <span>Filter by Category</span>
          <span className="ml-1 text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-0.5 rounded-full">
            {selectedCategories.length}
          </span>
        </button>

        {selectedCategories.length > 0 && (
          <button
            onClick={clearFilters}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Selected categories pills */}
      {selectedCategories.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {selectedCategories.map((category) => (
            <span
              key={category}
              className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 rounded-full text-sm"
            >
              {category}
              <button
                onClick={() => toggleCategory(category)}
                className="hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full p-0.5"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 6 6 18"></path>
                  <path d="m6 6 12 12"></path>
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute z-10 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg">
          <div className="p-2">
            <div className="mb-2 px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400">Select categories</div>
            <div className="max-h-60 overflow-y-auto">
              {categories.map((category) => (
                <div
                  key={category}
                  className="flex items-center px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md cursor-pointer"
                >
                  <input
                    type="checkbox"
                    id={`category-${category}`}
                    checked={selectedCategories.includes(category)}
                    onChange={() => toggleCategory(category)}
                    className="w-4 h-4 text-purple-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-purple-500"
                  />
                  <label htmlFor={`category-${category}`} className="ml-2 w-full cursor-pointer">
                    {category}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

