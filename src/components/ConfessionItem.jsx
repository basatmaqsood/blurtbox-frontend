import React, { useState, useEffect } from "react";
import socket from "../api/socket";

const ConfessionItem = ({ confession }) => {
    const [confessionData, setConfessionData] = useState(confession);

    useEffect(() => {
        socket.on("updateConfession", (updatedConfession) => {
            if (updatedConfession._id === confession._id) {
                setConfessionData(updatedConfession);
            }
        });

        socket.on("deleteConfession", ({ id }) => {
            if (id === confession._id) {
                setConfessionData(null);
            }
        });

        return () => {
            socket.off("updateConfession");
            socket.off("deleteConfession");
        };
    }, [confession._id]);

    if (!confessionData) return null; // Hide deleted confessions

    return (
        <div className="confession">
            <p>{confessionData.text}</p>
            <div className="actions">
                <button onClick={() => socket.emit("upvote", { id: confessionData._id })}>
                    👍 {confessionData.upvotes}
                </button>
                <button onClick={() => socket.emit("undoUpvote", { id: confessionData._id })}>
                    ↩️ Undo
                </button>
                <button onClick={() => socket.emit("downvote", { id: confessionData._id })}>
                    👎 {confessionData.downvotes}
                </button>
                <button onClick={() => socket.emit("undoDownvote", { id: confessionData._id })}>
                    ↩️ Undo
                </button>
                <button onClick={() => socket.emit("report", { id: confessionData._id })}>
                    🚩 Report
                </button>
            </div>
        </div>
    );
};

export default ConfessionItem;
