"use client"

import { useState } from "react"

export default function AddConfession({ onSubmit }) {
  const [text, setText] = useState("")
  const [category, setCategory] = useState("")
  const [errors, setErrors] = useState({})
  const [isSelectOpen, setIsSelectOpen] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()

    // Validate
    const newErrors = {}
    if (!text.trim()) {
      newErrors.text = "Your confession can't be empty"
    } else if (text.length > 500) {
      newErrors.text = "Your confession is too long (max 500 characters)"
    }

    setErrors(newErrors)

    // Submit if no errors
    if (Object.keys(newErrors).length === 0) {
      onSubmit({ text, category })
      setText("")
      setCategory("")
    }
  }

  const categories =  ["Funny", "Regret", "Love", "Crime", "Sad", "NSFW","General", "Work"]

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
      <h2 className="text-xl font-semibold mb-4">Share Your Confession</h2>
      <p className="text-sm mb-4">Note: We use AI to filter Hate speech and such content so please avoid that. You can try if you want. Our AI won't allow it 😝</p>

      <div className="space-y-4">
        <div>
          <label htmlFor="category" className="block mb-2 text-sm font-medium">
            Category (Optional)
          </label>
          <div className="relative">
            <button
              type="button"
              className="w-full flex justify-between items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-left"
              onClick={() => setIsSelectOpen(!isSelectOpen)}
            >
              {category || "Select a category"}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`transition-transform ${isSelectOpen ? "rotate-180" : ""}`}
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>

            {isSelectOpen && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg">
                <ul className="py-1 max-h-60 overflow-auto">
                  {categories.map((cat) => (
                    <li
                      key={cat}
                      className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                      onClick={() => {
                        setCategory(cat)
                        setIsSelectOpen(false)
                      }}
                    >
                      {cat}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="confession" className="block mb-2 text-sm font-medium">
            Your Confession
          </label>
          <textarea
            id="confession"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Share something anonymously..."
            className="w-full min-h-[150px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          {errors.text && <p className="mt-1 text-sm text-red-500">{errors.text}</p>}
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 text-right">{text.length}/500</div>
        </div>

        <button
          type="submit"
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
        >
          Post Anonymously
        </button>

        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
          All confessions are anonymous. Please be respectful and follow community guidelines.
        </p>
      </div>
    </form>
  )
}

