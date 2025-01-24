import { useState, useRef, useEffect } from "react";

const VisualizationAgent = () => {
  const [databaseId, setDatabaseId] = useState("");
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentCheckpoint, setCurrentCheckpoint] = useState(null);
  const [pendingApproval, setPendingApproval] = useState(false);
  const ws = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const connectWebSocket = () => {
    setIsLoading(true);
    ws.current = new WebSocket(
      "ws://localhost:8000/visualization_agent/ws/chat"
    );

    ws.current.onopen = () => {
      setIsConnected(true);
      setIsLoading(false);
      addSystemMessage("Connected to server");
      // Send initial message immediately after connection
      const payload = {
        database_id: parseInt(databaseId),
        question: inputMessage,
      };
      ws.current.send(JSON.stringify(payload));
      addMessage("user", inputMessage);
      setInputMessage("");
    };

    ws.current.onclose = () => {
      setIsConnected(false);
      setIsLoading(false);
      setCurrentCheckpoint(null);
      setPendingApproval(false);
      addSystemMessage("Disconnected from server");
    };

    ws.current.onerror = (error) => {
      console.error("WebSocket error:", error);
      addMessage("error", "WebSocket connection error");
      setIsConnected(false);
      setIsLoading(false);
    };

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleAgentResponse(data);
      } catch (e) {
        addMessage("agent", event.data);
      }
    };
  };

  const handleAgentResponse = (data) => {
    if (data.table_list) {
      // Handle table list approval step
      setPendingApproval(true);
      addMessage("agent", {
        tables: data.table_list,
        message: "Found these tables. Would you like to proceed?",
      });
    } else if (data.checkpoint) {
      setCurrentCheckpoint(data);
      addMessage("checkpoint", {
        message: "Please review and adjust the query:",
        query: data.checkpoint.query,
        analysis: data.checkpoint.analysis,
        checkpointId: data.checkpoint_id,
      });
    } else if (data.answer) {
      addMessage("agent", {
        summary: data.answer.summary,
        results: data.answer.results,
        visualization: data.answer.decide_visualization,
      });
    } else if (data.error) {
      addMessage("error", data.error);
    }
  };

  const addMessage = (sender, content) => {
    setMessages((prev) => [
      ...prev,
      { sender, content, timestamp: new Date() },
    ]);
  };

  const addSystemMessage = (content) => {
    setMessages((prev) => [
      ...prev,
      { sender: "system", content, timestamp: new Date() },
    ]);
  };

  const sendApproval = (approve) => {
    const payload = { approve };
    ws.current.send(JSON.stringify(payload));
    addMessage("user", `Approval: ${approve ? "Accepted" : "Rejected"}`);
    setPendingApproval(false);
  };

  const sendAdjustedQuery = () => {
    if (!inputMessage.trim()) return;

    const payload = {
      query: inputMessage,
      checkpoint_id: currentCheckpoint.checkpoint_id,
    };

    ws.current.send(JSON.stringify(payload));
    addMessage("user", `Adjusted query: ${inputMessage}`);
    setCurrentCheckpoint(null);
    setInputMessage("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (currentCheckpoint) sendAdjustedQuery();
    }
  };

  const handleDisconnect = () => {
    if (ws.current) {
      ws.current.close();
    }
  };

  const formatContent = (message) => {
    if (message.sender === "agent") {
      if (message.content.tables) {
        return (
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-green-700 font-medium mb-2">
              {message.content.message}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {message.content.tables.map((table, index) => (
                <div key={index} className="bg-white p-2 rounded border">
                  {table}
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => sendApproval(true)}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Approve
              </button>
              <button
                onClick={() => sendApproval(false)}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Reject
              </button>
            </div>
          </div>
        );
      }
      return (
        <div className="space-y-2">
          {message.content.summary && (
            <div className="font-semibold text-blue-600">
              Summary: {message.content.summary}
            </div>
          )}
          {message.content.results && (
            <div className="bg-gray-100 p-3 rounded">
              <div className="font-medium mb-2">Query Results:</div>
              <pre className="whitespace-pre-wrap">
                {JSON.stringify(message.content.results, null, 2)}
              </pre>
            </div>
          )}
        </div>
      );
    }

    if (message.sender === "checkpoint") {
      return (
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="text-yellow-700 font-medium mb-2">
            {message.content.message}
          </div>
          <pre className="bg-gray-100 p-3 rounded mb-4 whitespace-pre-wrap">
            {message.content.query}
          </pre>
          <div className="text-sm text-yellow-700 mb-2">
            Analysis: {message.content.analysis}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Enter adjusted query..."
              className="flex-1 p-2 border rounded"
            />
            <button
              onClick={sendAdjustedQuery}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Submit
            </button>
          </div>
        </div>
      );
    }

    return message.content;
  };

  return (
    <div className="max-w-4xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-6">Visualization Agent Chat</h1>

      <div className="space-y-4">
        <div className="flex gap-4 items-center">
          <input
            type="number"
            value={databaseId}
            onChange={(e) => setDatabaseId(e.target.value)}
            placeholder="Enter Database ID"
            className="flex-1 p-2 border rounded-md"
            disabled={isConnected}
          />
          <button
            onClick={connectWebSocket}
            disabled={isConnected || isLoading || !databaseId || !inputMessage}
            className={`px-4 py-2 rounded-md ${
              isConnected || isLoading || !databaseId || !inputMessage
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600 text-white"
            }`}
          >
            {isLoading ? "Connecting..." : "Start Chat"}
          </button>
          <button
            onClick={handleDisconnect}
            disabled={!isConnected}
            className={`px-4 py-2 rounded-md ${
              !isConnected
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-red-500 hover:bg-red-600 text-white"
            }`}
          >
            Disconnect
          </button>
        </div>

        <div className="border rounded-lg h-96 bg-gray-50 flex flex-col">
          <div className="p-4 overflow-y-auto flex-1">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`mb-4 p-3 rounded-lg ${
                  message.sender === "user"
                    ? "bg-blue-100 ml-auto max-w-3/4"
                    : message.sender === "agent"
                    ? "bg-white mr-auto max-w-3/4 border"
                    : message.sender === "error"
                    ? "bg-red-100 border-red-200"
                    : message.sender === "system"
                    ? "bg-gray-100 text-center italic"
                    : "bg-yellow-100"
                }`}
              >
                <div className="text-xs text-gray-500 mb-1">
                  {message.sender} - {message.timestamp.toLocaleTimeString()}
                </div>
                <div className="break-words">{formatContent(message)}</div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t p-4 bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type your question..."
                className="flex-1 p-2 border rounded-md"
                disabled={isConnected || pendingApproval || currentCheckpoint}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisualizationAgent;
