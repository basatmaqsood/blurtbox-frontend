export default function About() {
  return (
    <div className="bg-gray-50">

    <div className="container mx-auto p-4 max-w-3xl bg-gray-50">
      {/* Back Button */}
      <Link
        to="/"
        className="inline-flex items-center text-purple-600 dark:text-purple-400 hover:underline mb-6"
      >
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
        Back to Home
      </Link>

      {/* About BlurtBox */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          About BlurtBox
        </h1>
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          BlurtBox is a **safe and anonymous** platform where users can 
          **share their thoughts, secrets, and confessions** freely. 
          We believe in open expression while ensuring that every user 
          feels **respected and safe**.
        </p>

        <div className="mt-4 space-y-3">
          <p className="text-gray-700 dark:text-gray-300">
            💬 **Express yourself** without revealing your identity.
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            ⚖️ **AI-powered moderation** ensures a safe and respectful space.
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            🔒 **No tracking, no pressure**—just your words, truly anonymous.
          </p>
        </div>
      </div>

      {/* AI-Powered Hate Speech Detection */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          How We Detect Hate Speech Using AI
        </h2>
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          BlurtBox uses **advanced AI algorithms** to **detect and filter** 
          out hate speech, bullying, and harmful language **in real-time**. 
          Our system works by analyzing text submissions and flagging 
          inappropriate content **before it's posted**.
        </p>

        <div className="mt-4 space-y-3">
          <p className="text-gray-700 dark:text-gray-300">
            🔹 **AI-Based Natural Language Processing (NLP)** scans text 
            for offensive words and hate patterns.
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            🔹 **Machine Learning Models** continuously improve, learning 
            from reported posts and user feedback.
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            🔹 **Contextual Understanding** ensures that words are judged 
            based on meaning, not just keywords.
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            🔹 **Human Moderation Backup**: If AI is uncertain, our 
            **moderators** review flagged content.
          </p>
        </div>
      </div>

      {/* Our Mission */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Our Mission
        </h2>
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          Our goal is to provide a **judgment-free zone** where people 
          can share their thoughts **without fear of harassment**.  
          We strive to maintain a community where **honesty and kindness** 
          go hand in hand.
        </p>
      </div>

      {/* How It Works */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          How It Works
        </h2>
        <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300">
          <li>🔹 **Submit** an anonymous confession.</li>
          <li>🔹 **AI scans your post** for inappropriate content.</li>
          <li>🔹 **If approved**, your confession is published.</li>
          <li>🔹 **Community engagement** through reactions & comments.</li>
          <li>🔹 **Users can report** offensive content for review.</li>
        </ul>
      </div>
    </div>
    </div>

  );
}
