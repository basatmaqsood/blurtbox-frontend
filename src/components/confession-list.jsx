"use client"

import { useState } from "react"
import ConfessionCard from "./confession-card"
import AlertDialog from "./alert-dialog"

export default function ConfessionList({ confessions, socket, addToast }) {
  const [reportingId, setReportingId] = useState(null)
  const [page, setPage] = useState(1)
  const confessionsPerPage = 10

  const handleLoadMore = () => {
    setPage((prev) => prev + 1)
  }

  const handleReportClick = (id) => {
    setReportingId(id)
  }

  const handleConfirmReport = () => {
    if (reportingId && socket) {
      socket.emit("report", { id: reportingId })
      setReportingId(null)
      addToast("Confession Reported", "Thank you for keeping our community safe.")
    }
  }

  // Get current confessions for pagination
  const displayedConfessions = confessions.slice(0, page * confessionsPerPage)
  const hasMore = confessions.length > page * confessionsPerPage

  return (
    <div className="space-y-6">
      {displayedConfessions.length > 0 ? (
        <>
          <div className="space-y-4">
            {displayedConfessions.map((confession) => (
              <ConfessionCard
                key={confession._id}
                confession={confession}
                socket={socket}
                onReportClick={handleReportClick}
              />
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center mt-8">
              <button
                onClick={handleLoadMore}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Load More
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          No confessions yet. Be the first to share!
        </div>
      )}

      <AlertDialog
        isOpen={!!reportingId}
        onClose={() => setReportingId(null)}
        title="Report Confession"
        description="Are you sure you want to report this confession as inappropriate? If a confession receives 5 reports, it will be automatically removed."
        confirmLabel="Report"
        cancelLabel="Cancel"
        onConfirm={handleConfirmReport}
      />
    </div>
  )
}

