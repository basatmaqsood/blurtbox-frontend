import React, { useState, useEffect } from "react";
import socket from "../api/socket";
import ConfessionItem from "./ConfessionItem";

const ConfessionList = () => {
    const [confessions, setConfessions] = useState([]);

    useEffect(() => {
        socket.emit("getConfessions"); // Request latest confessions on load

        socket.on("confessionList", (data) => {
            setConfessions(data);
        });

        socket.on("newConfession", (confession) => {
            setConfessions((prev) => [confession, ...prev]);
        });

        socket.on("updateConfession", (updatedConfession) => {
            setConfessions((prev) =>
                prev.map((c) => (c._id === updatedConfession._id ? updatedConfession : c))
            );
        });

        socket.on("deleteConfession", ({ id }) => {
            setConfessions((prev) => prev.filter((c) => c._id !== id));
        });

        return () => {
            socket.off("confessionList");
            socket.off("newConfession");
            socket.off("updateConfession");
            socket.off("deleteConfession");
        };
    }, []);

    return (
        <div className="confession-list">
            {confessions.map((confession) => (
                <ConfessionItem key={confession._id} confession={confession} />
            ))}
        </div>
    );
};

export default ConfessionList;