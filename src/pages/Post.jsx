"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, Link } from "react-router-dom"
import io from "socket.io-client"

function Post() {
  const { id } = useParams() // Get confession ID from URL
  const [confession, setConfession] = useState(null)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [commentError, setCommentError] = useState("")
  const [hasVoted, setHasVoted] = useState({ upvote: false, downvote: false })
  const [cooldown, setCooldown] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [socket, setSocket] = useState(null)
  const [copied, setCopied] = useState(false)
  const commentInputRef = useRef(null)
  const [hateWarning, setHateWarning] = useState("")
  const [commentSubmitted, setCommentSubmitted] = useState(false)

  // Connect to socket
  useEffect(() => {
    const socketInstance = io("https://calm-randy-xetawise-6e7e5bc2.koyeb.app/")
    setSocket(socketInstance)

    return () => {
      socketInstance.disconnect()
    }
  }, [])

  // Fetch confession data
  useEffect(() => {
    setLoading(true)
    setError(null)

    fetch(`https://calm-randy-xetawise-6e7e5bc2.koyeb.app/api/confessions/${id}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to load confession")
        }
        return res.json()
      })
      .then((data) => {
        setConfession(data)
        setComments(data.comments || [])
        setLoading(false)
      })
      .catch((err) => {
        console.error(err)
        setError(err.message)
        setLoading(false)
      })

    // Load voting state from localStorage
    const storedVotes = JSON.parse(localStorage.getItem("confessionVotes")) || {}
    if (storedVotes[id]) {
      setHasVoted(storedVotes[id])
    }
  }, [id])

  // Socket event listeners
  useEffect(() => {
    if (!socket) return

    // Listen for updates to this specific confession
    const handleConfessionUpdate = (updatedConfession) => {
      if (updatedConfession._id === id) {
        setConfession(updatedConfession)
      }
    }

    // Listen for new comments
    const handleNewComment = (data) => {
      if (data.id === id) {
        // Always update the comments list when a new comment is received
        setComments((prev) => {
          // Check if this comment is already in the list to avoid duplicates
          const commentExists = prev.some(
            (comment) =>
              comment._id === data.comment._id ||
              (comment.text === data.comment.text && comment.createdAt === data.comment.createdAt),
          )

          if (!commentExists) {
            return [...prev, data.comment]
          }
          return prev
        })

        // If this was our own comment submission, reset the form
        if (isSubmitting) {
          setIsSubmitting(false)
          setCommentSubmitted(false)
          setNewComment("")
        }
      }
    }

    // Listen for error messages
    const handleErrorMessage = (data) => {
      // Only process error if we're actually submitting
      if (isSubmitting) {
        setCommentError(data.message)
        setIsSubmitting(false)
        setCommentSubmitted(false)

        // Clear the comment input if it's a hate speech error
        if (data.message.includes("hate speech")) {
          setNewComment("")
        }
      }
    }

    socket.on("updateConfession", handleConfessionUpdate)
    socket.on("newComment", handleNewComment)
    socket.on("errorMessage", handleErrorMessage)

    return () => {
      socket.off("updateConfession", handleConfessionUpdate)
      socket.off("newComment", handleNewComment)
      socket.off("errorMessage", handleErrorMessage)
    }
  }, [socket, id, isSubmitting, commentSubmitted])

  // Update localStorage for votes
  const updateLocalStorage = (newVoteState) => {
    const storedVotes = JSON.parse(localStorage.getItem("confessionVotes")) || {}
    storedVotes[id] = newVoteState
    localStorage.setItem("confessionVotes", JSON.stringify(storedVotes))
  }

  // Handle voting
  const handleVote = (type) => {
    if (cooldown || !socket || !confession) return

    // Toggle vote state
    const newVoteState = { ...hasVoted }

    if (type === "upvote") {
      // If already upvoted, undo upvote
      if (newVoteState.upvote) {
        newVoteState.upvote = false
        socket.emit("undoUpvote", { id })
      } else {
        // If was downvoted, undo downvote first
        if (newVoteState.downvote) {
          newVoteState.downvote = false
          socket.emit("undoDownvote", { id })
        }
        // Apply upvote
        newVoteState.upvote = true
        socket.emit("upvote", { id })
      }
    } else if (type === "downvote") {
      // If already downvoted, undo downvote
      if (newVoteState.downvote) {
        newVoteState.downvote = false
        socket.emit("undoDownvote", { id })
      } else {
        // If was upvoted, undo upvote first
        if (newVoteState.upvote) {
          newVoteState.upvote = false
          socket.emit("undoUpvote", { id })
        }
        // Apply downvote
        newVoteState.downvote = true
        socket.emit("downvote", { id })
      }
    }

    setHasVoted(newVoteState)
    updateLocalStorage(newVoteState)

    // Set cooldown
    setCooldown(true)
    setTimeout(() => setCooldown(false), 2000) // 2 second cooldown
  }

  // Handle comment submission
  const handleSubmitComment = async (e) => {
    e.preventDefault()

    if (!newComment.trim() || isSubmitting || !socket) return

    // Clear any previous errors
    setCommentError("")
    setIsSubmitting(true)

    try {
      // Send comment via socket
      socket.emit("addComment", { id, text: newComment })

      // Don't clear the input yet - wait for the socket response
      // The socket event handler will clear it on success
    } catch (error) {
      console.error("Error adding comment:", error)
      setCommentError("Failed to submit comment. Please try again.")
      setIsSubmitting(false)
    }
  }

  // Handle report
  const handleReport = () => {
    if (!socket || !confession) return

    if (window.confirm("Are you sure you want to report this confession as inappropriate?")) {
      socket.emit("report", { id })
      alert("Thank you for keeping our community safe. This confession has been reported.")
    }
  }

  // Format date
  const formatDate = (dateString) => {
    const options = {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  // Copy URL to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Share on social media
  const shareOnTwitter = () => {
    const text = confession
      ? `"${confession.text.substring(0, 100)}${confession.text.length > 100 ? "..." : ""}" - Anonymous Confession`
      : ""
    const url = window.location.href
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      "_blank",
    )
  }

  const shareOnFacebook = () => {
    const url = window.location.href
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank")
  }

  const shareOnWhatsApp = () => {
    const text = confession
      ? `"${confession.text.substring(0, 100)}${confession.text.length > 100 ? "..." : ""}" - Anonymous Confession`
      : ""
    const url = window.location.href
    window.open(`https://wa.me/?text=${encodeURIComponent(text + " " + url)}`, "_blank")
  }

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto p-4 max-w-3xl">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto p-4 max-w-3xl">
        <div className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 p-4 rounded-lg">
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p>{error}</p>
          <Link to="/" className="mt-4 inline-block px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
            Return to Home
          </Link>
        </div>
      </div>
    )
  }

  // No confession found
  if (!confession) {
    return (
      <div className="container mx-auto p-4 max-w-3xl">
        <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 p-4 rounded-lg">
          <h2 className="text-xl font-bold mb-2">Confession Not Found</h2>
          <p>The confession you're looking for doesn't exist or has been removed.</p>
          <Link to="/" className="mt-4 inline-block px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
            Return to Home
          </Link>
        </div>
      </div>
    )
  }

  // Simple hate speech detection
  const checkForHateSpeech = (text) => {
    const hateTerms = ["hate", "kill", "die", "stupid", "idiot", "racist", "ugly"]
    const lowerText = text.toLowerCase()

    for (const term of hateTerms) {
      if (lowerText.includes(term)) {
        return true
      }
    }
    return false
  }

  return (
    <div className="bg-gray-50">

    <div className="container mx-auto p-4 max-w-3xl bg-gray-50">
      {/* Back button */}
      <Link to="/" className="inline-flex items-center text-purple-600 dark:text-purple-400 hover:underline mb-6">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mr-2"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
        Back to All Confessions
      </Link>

      {/* Main confession card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md mb-6">
        {confession.reports >= 3 && (
          <div className="mb-4 p-3 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 text-sm rounded-md">
            ⚠️ This confession has been flagged multiple times by the community
          </div>
        )}

        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            {confession.category && (
              <span className="inline-block px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm">
                {confession.category}
              </span>
            )}
            <span className="text-sm text-gray-500 dark:text-gray-400">{formatDate(confession.createdAt)}</span>
          </div>
          <button
            onClick={handleReport}
            className="text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400"
            aria-label="Report confession"
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
              <path d="M22.56 2.92L21.43 2l-2.12 2.75L17.5 2 16.37 2.92l1.68 2.98H9.5a1 1 0 0 0-.93.63L4 16h17l-4.57-11.37a1 1 0 0 0-.93-.63h-.32l1.43-2.25Z"></path>
              <path d="M4 21h17a1 1 0 0 0 1-1v-4H3v4a1 1 0 0 0 1 1Z"></path>
            </svg>
          </button>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">{confession.text}</h1>

        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => handleVote("upvote")}
            disabled={cooldown}
            className={`flex items-center gap-1 px-3 py-2 rounded-md ${
              hasVoted.upvote
                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                : "hover:bg-gray-100 dark:hover:bg-gray-700"
            } ${cooldown ? "opacity-50 cursor-not-allowed" : ""}`}
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
              <path d="M7 10v12"></path>
              <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"></path>
            </svg>
            <span>{confession.upvotes || 0}</span>
          </button>

          <button
            onClick={() => handleVote("downvote")}
            disabled={cooldown}
            className={`flex items-center gap-1 px-3 py-2 rounded-md ${
              hasVoted.downvote
                ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                : "hover:bg-gray-100 dark:hover:bg-gray-700"
            } ${cooldown ? "opacity-50 cursor-not-allowed" : ""}`}
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
              <path d="M17 14V2"></path>
              <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z"></path>
            </svg>
            <span>{confession.downvotes || 0}</span>
          </button>
        </div>

        {/* Share section */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Share this confession</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={shareOnTwitter}
              className="flex items-center gap-1 px-3 py-2 bg-[#1DA1F2] text-white rounded-md hover:bg-opacity-90 cursor-pointer"
              aria-label="Share on Twitter"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
              </svg>
              <span className="hidden sm:inline">Twitter</span>
            </button>
            <button
              onClick={shareOnFacebook}
              className="flex items-center gap-1 px-3 py-2 bg-[#4267B2] text-white rounded-md hover:bg-opacity-90 cursor-pointer"
              aria-label="Share on Facebook"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
              </svg>
              <span className="hidden sm:inline">Facebook</span>
            </button>
            <button
              onClick={shareOnWhatsApp}
              className="flex items-center gap-1 px-3 py-2 bg-[#25D366] text-white rounded-md hover:bg-opacity-90 cursor-pointer"
              aria-label="Share on WhatsApp"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"></path>
              </svg>
              <span className="hidden sm:inline">WhatsApp</span>
            </button>
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-1 px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 cursor-pointer"
              aria-label="Copy link"
            >
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
              >
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
              </svg>
              <span>{copied ? "Copied!" : "Copy Link"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Comments section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Comments ({comments.length})</h2>

        {/* Add comment form */}
        <form onSubmit={handleSubmitComment} className="mb-6 space-y-3">
          {commentError && (
            <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 text-sm rounded-md mb-3 flex items-start">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2 flex-shrink-0 mt-0.5"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>{commentError}</span>
            </div>
          )}

          <div className="flex gap-2">
            <input
              ref={commentInputRef}
              type="text"
              value={newComment}
              onChange={(e) => {
                setNewComment(e.target.value)
                if (commentError) setCommentError("")

                // Check for potential hate speech
                if (checkForHateSpeech(e.target.value)) {
                  setHateWarning("Your comment may contain inappropriate language. Please be respectful.")
                } else {
                  setHateWarning("")
                }
              }}
              placeholder="Add a comment..."
              className={`flex-1 px-4 py-3 text-sm border rounded-md bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                commentError ? "border-red-500 dark:border-red-700" : "border-gray-300 dark:border-gray-600"
              }`}
              maxLength={200}
            />
            <button
              type="submit"
              disabled={!newComment.trim() || isSubmitting}
              className={`px-4 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors ${
                !newComment.trim() || isSubmitting ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isSubmitting ? (
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : (
                "Post"
              )}
            </button>
          </div>
          {hateWarning && (
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 text-sm rounded-md">
              <div className="flex items-start">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2 flex-shrink-0 mt-0.5"
                >
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
                  <path d="M12 9v4"></path>
                  <path d="M12 17h.01"></path>
                </svg>
                <span>{hateWarning}</span>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
            <span>Be respectful in your comments</span>
            <span>{newComment.length}/200</span>
          </div>
        </form>

        {/* Comments list */}
        <div className="space-y-4">
          {comments.length > 0 ? (
            comments.map((comment) => (
              <div key={comment._id} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-gray-800 dark:text-gray-200 mb-2">{comment.text}</p>
                {comment.createdAt && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(comment.createdAt)}</p>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mx-auto mb-3 opacity-50"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              <p className="text-lg font-medium">No comments yet</p>
              <p className="text-sm">Be the first to share your thoughts!</p>
            </div>
          )}
        </div>
      </div>
    </div>
    </div>
  )
}

export default Post

