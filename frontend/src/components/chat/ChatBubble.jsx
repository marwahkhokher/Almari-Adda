export default function ChatBubble({ message, isUser, timestamp }) {
  return (
    <div className={`flex w-full mb-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] md:max-w-[75%] px-4 py-3 shadow-md ${
          isUser
            ? 'bg-pink-600 text-white rounded-2xl rounded-br-sm'
            : 'bg-white text-neutral-900 border-2 border-pink-100 rounded-2xl rounded-bl-sm'
        }`}
      >
        <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap break-words">{message}</p>
        {timestamp && (
          <span className={`text-[10px] mt-1 block ${isUser ? 'text-pink-100' : 'text-neutral-400'}`}>
            {timestamp}
          </span>
        )}
      </div>
    </div>
  );
}
