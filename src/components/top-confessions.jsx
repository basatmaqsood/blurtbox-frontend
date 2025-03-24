import ConfessionCard from "./confession-card"

export default function TopConfessions({ confessions, socket, addToast }) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Most Upvoted Confessions</h2>

      {confessions.length > 0 ? (
        <div className="space-y-4">
          {confessions.map((confession, index) => (
            <div key={confession._id} className="relative">
              {index < 3 && (
                <div className="absolute -left-4 -top-4 w-8 h-8 flex items-center justify-center bg-purple-600 text-white rounded-full font-bold z-10">
                  #{index + 1}
                </div>
              )}
              <div className={index < 3 ? "transform transition-transform hover:scale-[1.01]" : ""}>
                <ConfessionCard confession={confession} socket={socket} onReportClick={() => {}} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          No top confessions yet. Start upvoting!
        </div>
      )}
    </div>
  )
}

