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

  // Scroll to the bottom of the chat window
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  // Connect to WebSocket
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
        handleStreamedMessage(data);
      } catch (e) {
        if (event.data === "null") {
          addMessage("success", "Processing Completed");
        } else {
          console.error("Error parsing WebSocket message:", e);
          addMessage("error", "Error processing server response");
        }
      }
    };
  };

  // Handle incoming WebSocket messages
  const handleStreamedMessage = (data) => {
    if (data.type === "info") {
      addSystemMessage(data.content); // Handle info messages directly
    } else if (data.type === "node_update" && data.node === "ListTableNode") {
      const { data: nodeData } = data;

      // Construct the agent message content based on available data
      const agentMessage = {};

      if (nodeData.table_list) {
        agentMessage.table_list = nodeData.table_list;
      }
      // Append or create the agent message
      if (
        messages.length > 0 &&
        messages[messages.length - 1].sender === "agent" &&
        messages[messages.length - 1].isStreaming
      ) {
        appendToLastMessage("agent", agentMessage);
      } else {
        addMessage("agent", agentMessage); // Initial message
      }
    } else if (data.type === "node_update" && data.node === "GetInfoNode") {
      const { data: nodeData } = data;

      // Construct the agent message content based on available data
      const agentMessage = {};

      if (nodeData.table_info) {
        agentMessage.table_info = nodeData.table_info;
      }

      if (nodeData.info_analysis) {
        agentMessage.info_analysis = nodeData.info_analysis;
      }

      // Append or create the agent message
      if (
        messages.length > 0 &&
        messages[messages.length - 1].sender === "agent" &&
        messages[messages.length - 1].isStreaming
      ) {
        appendToLastMessage("agent", agentMessage);
      } else {
        addMessage("agent", agentMessage); // Initial message
      }
    } else if (
      data.type === "node_update" &&
      data.node === "GenerateQueryNode"
    ) {
      const { data: nodeData } = data;

      // Construct the agent message content based on available data
      const agentMessage = {};

      if (nodeData.query) {
        agentMessage.query = nodeData.query;
      }
      if (nodeData.generate_analysis) {
        agentMessage.generate_analysis = nodeData.generate_analysis;
      }
      // Append or create the agent message
      if (
        messages.length > 0 &&
        messages[messages.length - 1].sender === "agent" &&
        messages[messages.length - 1].isStreaming
      ) {
        appendToLastMessage("agent", agentMessage);
      } else {
        addMessage("agent", agentMessage); // Initial message
      }
    } else if (data.type === "node_update" && data.node === "CheckQueryNode") {
      const { data: nodeData } = data;

      // Construct the agent message content based on available data
      const agentMessage = {};

      if (nodeData.check_query_analysis) {
        agentMessage.check_query_analysis = nodeData.check_query_analysis;
      }
      // Append or create the agent message
      if (
        messages.length > 0 &&
        messages[messages.length - 1].sender === "agent" &&
        messages[messages.length - 1].isStreaming
      ) {
        appendToLastMessage("agent", agentMessage);
      } else {
        addMessage("agent", agentMessage); // Initial message
      }
    } else if (
      data.type === "node_update" &&
      data.node === "ExecuteQueryNode"
    ) {
      const { data: nodeData } = data;

      // Construct the agent message content based on available data
      const agentMessage = {};

      if (nodeData.column_list) {
        agentMessage.column_list = nodeData.column_list;
      }

      if (nodeData.results) {
        agentMessage.results = nodeData.results;
      }
      if (nodeData.summary) {
        agentMessage.summary = nodeData.summary;
      }
      // Append or create the agent message
      if (
        messages.length > 0 &&
        messages[messages.length - 1].sender === "agent" &&
        messages[messages.length - 1].isStreaming
      ) {
        appendToLastMessage("agent", agentMessage);
      } else {
        addMessage("agent", agentMessage); // Initial message
      }
    } else if (
      data.type === "node_update" &&
      data.node === "SummarizeDataNode"
    ) {
      const { data: nodeData } = data;

      // Construct the agent message content based on available data
      const agentMessage = {};

      if (nodeData.summary) {
        agentMessage.summary = nodeData.summary;
      }
      // Append or create the agent message
      if (
        messages.length > 0 &&
        messages[messages.length - 1].sender === "agent" &&
        messages[messages.length - 1].isStreaming
      ) {
        appendToLastMessage("agent", agentMessage);
      } else {
        addMessage("agent", agentMessage); // Initial message
      }
    } else if (
      data.type === "node_update" &&
      data.node === "DecideVisualizationNode"
    ) {
      const { data: nodeData } = data;

      // Construct the agent message content based on available data
      const agentMessage = {};

      if (nodeData.decide_visualization) {
        agentMessage.visualization_type = nodeData.decide_visualization;
      }

      // Append or create the agent message
      if (
        messages.length > 0 &&
        messages[messages.length - 1].sender === "agent" &&
        messages[messages.length - 1].isStreaming
      ) {
        appendToLastMessage("agent", agentMessage);
      } else {
        addMessage("agent", agentMessage); // Initial message
      }
    } else if (
      data.type === "node_update" &&
      data.node === "VizStructureNode"
    ) {
      const { data: nodeData } = data;

      // Construct the agent message content based on available data
      const agentMessage = {};

      if (nodeData.viz_structure) {
        agentMessage.viz_structure = nodeData.viz_structure;
      }

      // Append or create the agent message
      if (
        messages.length > 0 &&
        messages[messages.length - 1].sender === "agent" &&
        messages[messages.length - 1].isStreaming
      ) {
        appendToLastMessage("agent", agentMessage);
      } else {
        addMessage("agent", agentMessage); // Initial message
      }
    } else if (
      data.type === "node_update" &&
      data.node === "PlotStructureNode"
    ) {
      const { data: nodeData } = data;

      // Construct the agent message content based on available data
      const agentMessage = {};

      if (nodeData.plot_structure) {
        agentMessage.plot_structure = nodeData.plot_structure;
      }

      // Append or create the agent message
      if (
        messages.length > 0 &&
        messages[messages.length - 1].sender === "agent" &&
        messages[messages.length - 1].isStreaming
      ) {
        appendToLastMessage("agent", agentMessage);
      } else {
        addMessage("agent", agentMessage); // Initial message
      }
    } else if (data.type === "checkpoint") {
      // Handle checkpoint for human input
      setCurrentCheckpoint(data);
      addMessage("checkpoint", {
        message: "Please review and adjust the query:",
        query: data.data.query,
        table_info: data.data.table_info,
        info_analysis: data.data.info_analysis,
        generate_sql_query_analysis: data.data.generate_analysis,
        check_query_analysis: data.data.check_query_analysis,
        checkpointId: data.checkpoint_id,
        column_list: data.data.column_list,
        results: data.data.results,
        summary: data.data.summary,
        visualization_type: data.data.decide_visualization,
      });
    } else if (data.type === "error") {
      // Handle errors
      addMessage("error", data.content);
    }
  };

  // Add a new message to the chat
  const addMessage = (sender, content) => {
    setMessages((prev) => [
      ...prev,
      {
        sender,
        content,
        timestamp: new Date(),
        isStreaming: sender === "agent",
      },
    ]);
  };

  // Append content to the last message (for streaming)
  const appendToLastMessage = (sender, newContent) => {
    setMessages((prev) => {
      const lastMessage = prev[prev.length - 1];
      if (
        lastMessage &&
        lastMessage.sender === sender &&
        lastMessage.isStreaming
      ) {
        // Append new content to the last message
        return [
          ...prev.slice(0, -1),
          {
            ...lastMessage,
            content: {
              ...lastMessage.content,
              ...newContent,
            },
          },
        ];
      } else {
        // Add a new message if the last message is not from the same sender or not streaming
        return [
          ...prev,
          {
            sender,
            content: newContent,
            timestamp: new Date(),
            isStreaming: true,
          },
        ];
      }
    });
  };

  // Add a system message (e.g., connection status)
  const addSystemMessage = (content) => {
    setMessages((prev) => [
      ...prev,
      { sender: "system", content, timestamp: new Date() },
    ]);
  };

  // Send approval for table list
  const sendApproval = (approve) => {
    const payload = { approve };
    ws.current.send(JSON.stringify(payload));
    addMessage("user", `Approval: ${approve ? "Accepted" : "Rejected"}`);
    setPendingApproval(false);
  };

  // Send adjusted query for checkpoint
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

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (currentCheckpoint) sendAdjustedQuery();
    }
  };

  // Disconnect WebSocket
  const handleDisconnect = () => {
    if (ws.current) {
      ws.current.close();
    }
  };

  // Format message content based on sender
  const formatContent = (message) => {
    if (message.sender === "agent") {
      return (
        <div className="space-y-2">
          {message.content.node && (
            <div className="text-sm text-gray-500">
              Node: {message.content.node}
            </div>
          )}
          {message.content.table_list && (
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-green-700 font-medium mb-2">
                Found these tables. Would you like to proceed?
              </div>
              <div className="grid grid-cols-2 gap-2">
                {message.content.table_list.map((table, index) => (
                  <div
                    key={index}
                    className="bg-white p-2 rounded border text-black"
                  >
                    {table}
                  </div>
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => sendApproval(true)}
                  className="px-4 py-2 bg-green-500 text-black rounded hover:bg-green-600"
                >
                  Approve
                </button>
                <button
                  onClick={() => sendApproval(false)}
                  className="px-4 py-2 bg-red-500 text-black rounded hover:bg-red-600"
                >
                  Reject
                </button>
              </div>
            </div>
          )}
          {message.content.table_info && (
            <div className="bg-gray-100 p-3 rounded">
              <div className="font-medium mb-2 text-black">
                Table Info with Sample Rows:
              </div>
              <pre className="whitespace-pre-wrap text-black">
                {typeof message.content.table_info === "object"
                  ? JSON.stringify(message.content.table_info, null, 2)
                  : message.content.table_info}{" "}
                {/* Convert to string */}
              </pre>
            </div>
          )}
          {message.content.info_analysis && (
            <div className="bg-gray-100 p-3 rounded">
              <div className="font-medium mb-2 text-black">
                Analysis of the Table Info:
              </div>
              <pre className="whitespace-pre-wrap text-black">
                {typeof message.content.info_analysis === "object"
                  ? JSON.stringify(message.content.info_analysis, null, 2)
                  : message.content.info_analysis}{" "}
                {/* Convert to string */}
              </pre>
            </div>
          )}
          {message.content.generate_sql_query_analysis && (
            <div className="bg-gray-100 p-3 rounded">
              <div className="font-medium mb-2 text-black">
                Analysis of the SQL Query Generated:
              </div>
              <pre className="whitespace-pre-wrap text-black">
                {message.content.generate_sql_query_analysis}
              </pre>
            </div>
          )}
          {message.content.check_query_analysis && (
            <div className="bg-gray-100 p-3 rounded">
              <div className="font-medium mb-2 text-black">
                Analysis after SQL query validation :
              </div>
              <pre className="whitespace-pre-wrap text-black">
                {message.content.check_query_analysis}
              </pre>
            </div>
          )}
          {message.content.query && (
            <div className="bg-gray-100 p-3 rounded">
              <div className="font-medium mb-2 text-black">
                Generated Query:
              </div>
              <pre className="whitespace-pre-wrap text-black">
                {message.content.query}
              </pre>
            </div>
          )}
          {message.content.column_list && (
            <div className="bg-gray-100 p-3 rounded">
              <div className="font-medium mb-2 text-black">
                Columns To Extract Results:
              </div>
              <pre className="whitespace-pre-wrap text-black">
                {message.content.column_list}
              </pre>
            </div>
          )}
          {message.content.viz_structure && (
            <div className="bg-gray-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2 text-purple-400">
                Visualization Structure
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-blue-400">Axes</h4>
                  <pre className="text-sm text-white">
                    X-Axis:{" "}
                    {JSON.stringify(
                      message.content.viz_structure.axes.x_axis,
                      null,
                      2
                    )}
                    {"\n"}
                    Y-Axis:{" "}
                    {JSON.stringify(
                      message.content.viz_structure.axes.y_axis,
                      null,
                      2
                    )}
                  </pre>
                </div>
                <div>
                  <h4 className="font-medium text-blue-400">Data Points</h4>
                  <pre className="text-sm text-white">
                    {JSON.stringify(
                      message.content.viz_structure.data_points,
                      null,
                      2
                    )}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {message.content.plot_structure && (
            <div className="bg-gray-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2 text-green-400">
                Final Plot Structure
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-blue-300">Axes Data</h4>
                  <pre className="text-sm text-white">
                    {JSON.stringify(
                      message.content.plot_structure.axes,
                      null,
                      2
                    )}
                  </pre>
                </div>
                <div>
                  <h4 className="font-medium text-blue-300">Data Points</h4>
                  <pre className="text-sm text-white">
                    {JSON.stringify(
                      message.content.plot_structure.data_points.data,
                      null,
                      2
                    )}
                  </pre>
                </div>
              </div>
              {message.content.plot_structure.additional_customization && (
                <div className="mt-4">
                  <h4 className="font-medium text-blue-400">Customizations</h4>
                  <pre className="text-sm  text-white">
                    {JSON.stringify(
                      message.content.plot_structure.additional_customization,
                      null,
                      2
                    )}
                  </pre>
                </div>
              )}
            </div>
          )}
          {message.content.results && (
            <div className="bg-gray-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2 text-yellow-400">
                Query Results
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-gray-800">
                  <thead>
                    <tr>
                      {message.content.column_list?.map((col, index) => (
                        <th
                          key={index}
                          className="px-4 py-2 text-left text-blue-300 border-b border-gray-600"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {message.content.results?.map((row, rowIndex) => (
                      <tr key={rowIndex} className="hover:bg-gray-600">
                        {row.map((cell, cellIndex) => (
                          <td
                            key={cellIndex}
                            className="px-4 py-2 text-gray-300"
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {message.content.summary && (
            <div className="bg-gray-100 p-3 rounded">
              <div className="font-medium mb-2  text-black">
                Summary based on the Extracted Data:
              </div>
              <pre className="whitespace-pre-wrap  text-black">
                {typeof message.content.summary === "object"
                  ? JSON.stringify(message.content.summary, null, 2)
                  : message.content.summary}{" "}
                {/* Convert to string */}
              </pre>
            </div>
          )}
          {message.content.visualization_type && (
            <div className="bg-gray-100 p-3 rounded">
              <div className="font-medium mb-2  text-black">
                Visualization Type based on the Data:
              </div>
              <pre className="whitespace-pre-wrap text-black">
                {message.content.visualization_type === "object"
                  ? JSON.stringify(message.content.visualization_type, null, 3)
                  : message.content.visualization_type}{" "}
              </pre>
            </div>
          )}
        </div>
      );
    }

    return message.content;
  };

  return (
    <div className="max-w-6xl max-h-fit mb-10 mx-auto mt-8 p-6 bg-gray-900 rounded-lg shadow-xl text-gray-100">
      <h1 className="text-2xl font-bold mb-6 text-purple-400">
        Visualization Agent Chat
      </h1>

      <div className="space-y-4">
        <div className="flex gap-4 items-center">
          <input
            type="number"
            value={databaseId}
            onChange={(e) => setDatabaseId(e.target.value)}
            placeholder="Enter Database ID"
            className="flex-1 p-2 border rounded-md bg-gray-800 border-gray-700 text-white"
            disabled={isConnected}
          />
          <button
            onClick={connectWebSocket}
            disabled={isConnected || isLoading || !databaseId || !inputMessage}
            className={`px-4 py-2 rounded-md ${
              isConnected || isLoading || !databaseId || !inputMessage
                ? "bg-gray-700 cursor-not-allowed text-gray-400"
                : "bg-purple-600 hover:bg-purple-700 text-white"
            }`}
          >
            {isLoading ? "Connecting..." : "Start Chat"}
          </button>
          <button
            onClick={handleDisconnect}
            disabled={!isConnected}
            className={`px-4 py-2 rounded-md ${
              !isConnected
                ? "bg-gray-700 cursor-not-allowed text-gray-400"
                : "bg-red-600 hover:bg-red-700 text-white"
            }`}
          >
            Disconnect
          </button>
        </div>

        <div className="border rounded-lg h-screen bg-gray-700 flex flex-col">
          <div className="p-4 overflow-y-auto flex-1">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`mb-4 p-3 rounded-lg ${
                  message.sender === "user"
                    ? "bg-blue-800 ml-auto max-w-3/4"
                    : message.sender === "agent"
                    ? "bg-gray-800 mr-auto max-w-3/4 border border-gray-700"
                    : message.sender === "error"
                    ? "bg-red-800 border-red-900"
                    : message.sender === "system"
                    ? "bg-gray-700 text-center italic"
                    : "bg-yellow-800"
                }`}
              >
                <div className="text-xs text-gray-400 mb-1">
                  {message.sender} - {message.timestamp.toLocaleTimeString()}
                </div>
                <div className="break-words">{formatContent(message)}</div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-gray-700 p-2 rounded-lg bg-gray-800">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type your question..."
                className="flex-1 p-2 border rounded-md bg-gray-700 border-gray-600 text-white"
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
