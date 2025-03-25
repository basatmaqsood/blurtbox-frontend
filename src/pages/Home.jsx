'use client'
import { useEffect, useState } from "react";
import ConfessionList from "../components/confession-list";
import AddConfession from "../components/add-confession";
import TopConfessions from "../components/top-confessions";
import CategoryFilter from "../components/category-filter";

import io from "socket.io-client";
import Toast from "../components/toast";
import "../styles/App.css";
import { Link } from "react-router-dom";

export default function Home() {
  const [activeTab, setActiveTab] = useState("all");
  const [socket, setSocket] = useState(null);
  const [confessions, setConfessions] = useState([]);
  const [topConfessions, setTopConfessions] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [filteredConfessions, setFilteredConfessions] = useState([]);
  const [allCategories, setAllCategories] = useState([
    "Funny",
    "Regret",
    "Love",
    "Crime",
    "Sad",
    "NSFW",
    "General",
    "Work",
  ]);

  // Filter confessions based on selected categories
  useEffect(() => {
    if (selectedCategories.length === 0) {
      setFilteredConfessions(confessions);
    } else {
      setFilteredConfessions(
        confessions.filter(
          (confession) =>
            confession.category &&
            selectedCategories.includes(confession.category)
        )
      );
    }
  }, [selectedCategories, confessions]);

  // Handle category filter change
  const handleFilterChange = (categories) => {
    setSelectedCategories(categories);
  };

  // Add toast function
  const addToast = (title, message, type = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3000);
  };

  useEffect(() => {
    // Connect to socket
    const socketInstance = io(
      "https://calm-randy-xetawise-6e7e5bc2.koyeb.app"
    );
    setSocket(socketInstance);

    // Fetch initial confessions
    fetchConfessions();
    fetchTopConfessions();

    // Socket event listeners
    socketInstance.on("newConfession", (data) => {
      setConfessions((prev) => [data, ...prev]);
      addToast("New Confession", "Someone just shared a new confession!");
    });

    socketInstance.on("updateConfession", (updatedConfession) => {
      setConfessions((prev) =>
        prev.map((confession) =>
          confession._id === updatedConfession._id
            ? updatedConfession
            : confession
        )
      );

      // Also update top confessions if needed
      setTopConfessions((prev) => {
        const updatedTop = prev.map((confession) =>
          confession._id === updatedConfession._id
            ? updatedConfession
            : confession
        );
        return [...updatedTop].sort((a, b) => b.upvotes - a.upvotes);
      });
    });

    socketInstance.on("deleteConfession", (data) => {
      setConfessions((prev) =>
        prev.filter((confession) => confession._id !== data.id)
      );
      setTopConfessions((prev) =>
        prev.filter((confession) => confession._id !== data.id)
      );
      addToast(
        "Confession Removed",
        "A confession has been removed from the board.",
        "error"
      );
    });

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const fetchConfessions = async () => {
    try {
      const response = await fetch(
        "https://calm-randy-xetawise-6e7e5bc2.koyeb.app/api/confessions"
      );
      const data = await response.json();
      setConfessions(data);
      // Extract unique categories from confessions
      const categories = [
        ...new Set(
          data.map((confession) => confession.category).filter(Boolean)
        ),
      ];
      setAllCategories((prev) => [...new Set([...prev, ...categories])]);
    } catch (error) {
      console.error("Error fetching confessions:", error);
      addToast(
        "Error",
        "Failed to load confessions. Please try again later.",
        "error"
      );
    }
  };

  const fetchTopConfessions = async () => {
    try {
      const response = await fetch(
        "https://calm-randy-xetawise-6e7e5bc2.koyeb.app/api/confessions/top-upvoted"
      );
      const data = await response.json();
      setTopConfessions(data);
    } catch (error) {
      console.error("Error fetching top confessions:", error);
    }
  };

  return (
    <main className="min-h-screen p-4 md:p-8 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-purple-700 text-center mb-6">
            <a href="/">BlurtBox:</a> <span className="text-gray-500">Share Your Confessions</span> Anonymously!
          </h1>

        {/* Tab Navigation */}
        <div className="flex mb-6 border-b dark:border-gray-700">
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === "all"
                ? "border-b-2 border-purple-600 text-purple-600 dark:text-purple-400"
                : "text-gray-500 dark:text-gray-400"
            }`}
            onClick={() => setActiveTab("all")}
          >
            All Confessions
          </button>
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === "top"
                ? "border-b-2 border-purple-600 text-purple-600 dark:text-purple-400"
                : "text-gray-500 dark:text-gray-400"
            }`}
            onClick={() => setActiveTab("top")}
          >
            Top Confessions
          </button>
        </div>

        {/* Add Confession Button */}
        <div className="flex flex-col md:flex-row justify-between items-start mb-6 ">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="mb-6 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium flex cursor-pointer items-center transition-colors"
          >
            {showAddForm ? "Cancel" : "Share Your Confession"}
          </button>
          <Link
            to="/about"
            className="mb-6 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium flex items-center transition-colors"
          >
            {" "}
            About us
          </Link>
        </div>

        {/* Add Confession Form */}
        {showAddForm && (
          <div className="mb-8 animate-fade-in">
            <AddConfession
              onSubmit={(data) => {
                if (socket) {
                  socket.emit("newConfession", data, (response) => {
                    if (response.error) {
                      addToast("Error", response.error, "error");
                    } else {
                      addToast(
                        "Success!",
                        "Your confession has been posted anonymously."
                      );
                    }
                  });
                  setShowAddForm(false);
                }
              }}
            />
          </div>
        )}

        {/* Category Filter - Only show in "All Confessions" tab */}
        {activeTab === "all" && (
          <CategoryFilter
            categories={allCategories}
            onFilterChange={handleFilterChange}
          />
        )}

        {/* Content based on active tab */}
        {activeTab === "all" ? (
          <ConfessionList
            confessions={filteredConfessions}
            socket={socket}
            addToast={addToast}
          />
        ) : (
          <TopConfessions
            confessions={topConfessions}
            socket={socket}
            addToast={addToast}
          />
        )}
      </div>
      {/* Toast Container */}
      <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            title={toast.title}
            message={toast.message}
            type={toast.type}
            onClose={() =>
              setToasts((prev) => prev.filter((t) => t.id !== toast.id))
            }
          />
        ))}
      </div>

      <p className="text-center mt-4 mb-6 text-xl">
        Made with ❤ by{" "}
        <a
          target="_blank"
          href="https://www.basatmaqsood.live"
          className="text-purple-700 font-bold"
        >
          Basat Maqsood
        </a>
      </p>
      <p className="text-center mt-4">

      <a 
        href="https://www.basatmaqsood.live" target="_blank"
        className="mb-6  bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
        {" "}
        Visit me
      </a>
        </p>
    </main>
  );
}
