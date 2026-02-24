import { useState } from "react";

function App() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const sendMessage = () => {
    if (message.trim() === "") return;
    setMessages([...messages, message]);
    setMessage("");
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
      
      <div className="w-full max-w-3xl h-[80vh] bg-gray-800 rounded-xl shadow-lg flex flex-col">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-700 text-xl font-semibold">
          NullChat
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg, index) => (
            <div 
              key={index}
              className="bg-blue-600 px-4 py-2 rounded-lg max-w-xs"
            >
              {msg}
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-700 flex gap-2">
          <input
            className="flex-1 bg-gray-700 rounded-lg px-3 py-2 outline-none"
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button
            onClick={sendMessage}
            className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Send
          </button>
        </div>

      </div>
    </div>
  );
}

export default App;