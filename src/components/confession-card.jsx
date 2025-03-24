"use client"

import { useEffect, useState, useRef } from "react"
import { Link } from "react-router-dom"

export default function ConfessionCard({ confession, socket, onReportClick, addToast }) {
  const [hasVoted, setHasVoted] = useState({
    upvote: false,
    downvote: false,
  })
  const [cooldown, setCooldown] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [comments, setComments] = useState(confession.comments || [])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [commentError, setCommentError] = useState("")
  const commentInputRef = useRef(null)

  useEffect(() => {
    // Update comments when confession updates
    setComments(confession.comments || [])
  }, [confession.comments])

  useEffect(() => {
    // Load voting state from localStorage
    const storedVotes = JSON.parse(localStorage.getItem("confessionVotes")) || {}
    if (storedVotes[confession._id]) {
      setHasVoted(storedVotes[confession._id])
    }

    // Listen for new comments
    if (socket) {
      const handleNewComment = (data) => {
        if (data.id === confession._id) {
          setComments((prev) => [...prev, data.comment])
        }
      }

      // Listen for error messages
      const handleErrorMessage = (data) => {
        // Check if this is related to our current comment submission
        if (isSubmitting) {
          setCommentError(data.message)
          setIsSubmitting(false)

          // Also show toast if available
          if (addToast) {
            addToast("Comment Error", data.message, "error")
          }
        }
      }

      socket.on("newComment", handleNewComment)
      socket.on("errorMessage", handleErrorMessage)

      return () => {
        socket.off("newComment", handleNewComment)
        socket.off("errorMessage", handleErrorMessage)
      }
    }
  }, [confession._id, socket, isSubmitting, addToast])

  const updateLocalStorage = (newVoteState) => {
    const storedVotes = JSON.parse(localStorage.getItem("confessionVotes")) || {}
    storedVotes[confession._id] = newVoteState
    localStorage.setItem("confessionVotes", JSON.stringify(storedVotes))
  }

  // Function to handle the vote
  const handleVote = (type) => {
    if (cooldown || !socket) return

    // Toggle vote state
    const newVoteState = { ...hasVoted }

    if (type === "upvote") {
      // If already upvoted, undo upvote
      if (newVoteState.upvote) {
        newVoteState.upvote = false
        socket.emit("undoUpvote", { id: confession._id })
      } else {
        // If was downvoted, undo downvote first
        if (newVoteState.downvote) {
          newVoteState.downvote = false
          socket.emit("undoDownvote", { id: confession._id })
        }
        // Apply upvote
        newVoteState.upvote = true
        socket.emit("upvote", { id: confession._id })
      }
    } else if (type === "downvote") {
      // If already downvoted, undo downvote
      if (newVoteState.downvote) {
        newVoteState.downvote = false
        socket.emit("undoDownvote", { id: confession._id })
      } else {
        // If was upvoted, undo upvote first
        if (newVoteState.upvote) {
          newVoteState.upvote = false
          socket.emit("undoUpvote", { id: confession._id })
        }
        // Apply downvote
        newVoteState.downvote = true
        socket.emit("downvote", { id: confession._id })
      }
    }

    setHasVoted(newVoteState)
    updateLocalStorage(newVoteState)

    // Set cooldown
    setCooldown(true)
    setTimeout(() => setCooldown(false), 2000) // 2 second cooldown
  }

  // Format date
  const formatDate = (dateString) => {
    const options = { month: "short", day: "numeric", year: "numeric" }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  // Handle comment submission
  const handleSubmitComment = async (e) => {
    e.preventDefault()

    if (!newComment.trim() || isSubmitting || !socket) return

    // Clear any previous errors
    setCommentError("")
    setIsSubmitting(true)

    try {
      // Send comment via socket first (this is the primary method)
      socket.emit("addComment", { id: confession._id, text: newComment })

      // Also try to send via API for persistence, but don't block on it
      try {
        // Use the correct API URL (port 5000 instead of the frontend port)
        const response = await fetch(`http://localhost:5000/api/confessions/${confession._id}/comments`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: newComment }),
        })

        // Only try to parse JSON if the response is ok
        if (response.ok) {
          const data = await response.json()
          console.log("Comment added via API:", data)
        } else {
          console.log("API returned error status:", response.status)
          // Don't throw here, we'll rely on the socket
        }
      } catch (apiError) {
        // Log API error but continue since we're using sockets as primary
        console.log("API error (continuing with socket):", apiError)
      }

      // Clear input after a short delay to allow for socket error
      setTimeout(() => {
        if (!commentError) {
          setNewComment("")
          setIsSubmitting(false)
        }
      }, 300)
    } catch (error) {
      console.error("Error adding comment:", error)
      setCommentError(error.message || "Failed to add comment")
      setIsSubmitting(false)
    }
  }

  // Toggle comments visibility
  const toggleComments = () => {
    setShowComments((prev) => !prev)
    // Focus the comment input when opening comments
    if (!showComments && commentInputRef.current) {
      setTimeout(() => {
        commentInputRef.current.focus()
      }, 100)
    }
  }

  return (
    <div className="relative">
      <Link to={`/post/${confession._id}`} className="block">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm transition-all hover:shadow-md animate-fade-in cursor-pointer">
          {confession.reports >= 3 && (
            <div className="mb-2 p-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 text-sm rounded-md">
              ⚠️ This confession has been flagged multiple times by the community
            </div>
          )}

          <div className="flex justify-between items-start mb-2">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {confession.category && (
                <span className="inline-block px-2 py-1 mr-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
                  {confession.category}
                </span>
              )}
              {formatDate(confession.createdAt)}
            </div>
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onReportClick(confession._id)
              }}
              className="text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400"
              aria-label="Report confession"
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
                <path d="M22.56 2.92L21.43 2l-2.12 2.75L17.5 2 16.37 2.92l1.68 2.98H9.5a1 1 0 0 0-.93.63L4 16h17l-4.57-11.37a1 1 0 0 0-.93-.63h-.32l1.43-2.25Z"></path>
                <path d="M4 21h17a1 1 0 0 0 1-1v-4H3v4a1 1 0 0 0 1 1Z"></path>
              </svg>
            </button>
          </div>

          <p className="text-gray-900 dark:text-gray-100 mb-4 whitespace-pre-line">{confession.text}</p>

          <div className="flex items-center gap-4">
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleVote("upvote")
              }}
              disabled={cooldown}
              className={`flex items-center gap-1 px-2 py-1 rounded ${
                hasVoted.upvote
                  ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700"
              } ${cooldown ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
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
                <path d="M7 10v12"></path>
                <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"></path>
              </svg>
              <span>{confession.upvotes || 0}</span>
            </button>

            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleVote("downvote")
              }}
              disabled={cooldown}
              className={`flex items-center gap-1 px-2 py-1 rounded ${
                hasVoted.downvote
                  ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700"
              } ${cooldown ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
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
                <path d="M17 14V2"></path>
                <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z"></path>
              </svg>
              <span>{confession.downvotes || 0}</span>
            </button>

            {/* Comments button */}
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                toggleComments()
              }}
              className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ml-auto cursor-pointer"
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
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              <span>{comments.length}</span>
            </button>
          </div>
        </div>
      </Link>

      {/* Comments section - Keep this outside the Link to prevent navigation when interacting with comments */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
          <h4 className="text-sm font-medium mb-3">Comments</h4>

          {/* Comments list */}
          <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
            {comments.length > 0 ? (
              comments.map((comment) => (
                <div key={comment._id} className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-md">
                  <p className="text-sm text-gray-800 dark:text-gray-200">{comment.text}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                No comments yet. Be the first to comment!
              </p>
            )}
          </div>

          {/* Add comment form */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleSubmitComment(e)
            }}
            className="space-y-2"
          >
            {commentError && (
              <div className="p-2 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 text-sm rounded-md">
                ⚠️ {commentError}
              </div>
            )}

            <div className="flex gap-2">
              <input
                ref={commentInputRef}
                type="text"
                value={newComment}
                onChange={(e) => {
                  setNewComment(e.target.value)
                  // Clear error when user starts typing again
                  if (commentError) setCommentError("")
                }}
                onClick={(e) => e.stopPropagation()}
                placeholder="Add a comment..."
                className={`flex-1 px-3 py-2 text-sm border rounded-md bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  commentError ? "border-red-500 dark:border-red-700" : "border-gray-300 dark:border-gray-600"
                }`}
                maxLength={200}
              />
              <button
                type="submit"
                disabled={!newComment.trim() || isSubmitting}
                className={`px-3 py-2 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 transition-colors ${
                  !newComment.trim() || isSubmitting ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                }`}
              >
                {isSubmitting ? "..." : "Post"}
              </button>
            </div>

            <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
              <span>Be respectful in your comments</span>
              <span>{newComment.length}/200</span>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

