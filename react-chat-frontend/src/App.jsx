import { useState, useRef, useEffect } from "react";

const VisualizationAgent = () => {
  const [databaseId, setDatabaseId] = useState("");
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const ws = useRef(null);

  const connectWebSocket = () => {
    setIsLoading(true);
    ws.current = new WebSocket(
      "ws://localhost:8000/visualization_agent_ws/chat_ws"
    );

    ws.current.onopen = () => {
      setIsConnected(true);
      setIsLoading(false);
      // Send the initial message
      sendMessage();
    };

    ws.current.onclose = () => {
      setIsConnected(false);
      setIsLoading(false);
    };

    ws.current.onerror = (error) => {
      console.error("WebSocket error:", error);
      setMessages((prev) => [
        ...prev,
        { type: "error", content: "WebSocket connection error" },
      ]);
      setIsConnected(false);
      setIsLoading(false);
    };

    ws.current.onmessage = (event) => {
      const message = event.data;
      setMessages((prev) => [...prev, { type: "message", content: message }]);
    };
  };

  const sendMessage = () => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      const payload = {
        database_id: parseInt(databaseId),
        question: question,
      };
      ws.current.send(JSON.stringify(payload));
    }
  };

  const handleDisconnect = () => {
    if (ws.current) {
      ws.current.close();
    }
  };

  useEffect(() => {
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  const formatMessage = (message) => {
    if (message.content.includes(":")) {
      const [step, content] = message.content.split(":", 2);
      return (
        <div className="mb-4">
          <span className="font-bold text-blue-600">{step}</span>
          <span className="ml-2">{content}</span>
        </div>
      );
    }
    return <div className="mb-4">{message.content}</div>;
  };

  return (
    <div className="max-w-4xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-6">Data Visualization Agent</h1>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Database ID
            </label>
            <input
              type="number"
              value={databaseId}
              onChange={(e) => setDatabaseId(e.target.value)}
              placeholder="Enter database ID"
              className="w-full p-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Question</label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask your question"
              className="w-full p-2 border rounded-md"
            />
          </div>
        </div>

        <div className="flex space-x-4">
          <button
            onClick={connectWebSocket}
            disabled={isConnected || isLoading || !databaseId || !question}
            className={`px-4 py-2 rounded-md ${
              isConnected || isLoading || !databaseId || !question
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600 text-white"
            }`}
          >
            {isLoading ? "Connecting..." : "Connect"}
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

        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Response Stream</h3>
          <div className="border rounded-lg p-4 h-96 overflow-y-auto bg-gray-50">
            {messages.length === 0 ? (
              <p className="text-gray-500 text-center">No messages yet</p>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={message.type === "error" ? "text-red-500" : ""}
                >
                  {formatMessage(message)}
                </div>
              ))
            )}
          </div>
        </div>

        {isConnected && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
            <strong className="font-bold">Connected! </strong>
            <span className="block sm:inline">
              WebSocket connection established successfully.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default VisualizationAgent;
