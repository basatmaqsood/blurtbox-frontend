import React, { useState } from "react";
import socket from "../api/socket";

const ConfessionForm = () => {
    const [text, setText] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        if (text.trim() === "") return;

        socket.emit("newConfession", { text, category: "General" });
        setText(""); // Clear input field after submission
    };

    return (
        <form className="confession-form" onSubmit={handleSubmit}>
            <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Write your confession..."
                required
            />
            <button type="submit">Submit</button>
        </form>
    );
};

export default ConfessionForm;
