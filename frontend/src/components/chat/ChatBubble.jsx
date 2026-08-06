export default function ChatBubble({
  message,
  isUser,
  timestamp,
}) {
  return (
    <div
      className={`mb-3 flex w-full ${
        isUser ? 'justify-end' : 'justify-start'
      }`}
    >
      <div
        className={`max-w-[85%] px-4 py-3 shadow-md md:max-w-[75%] ${
          isUser
            ? 'rounded-2xl rounded-br-sm bg-[#6B4329] text-white'
            : 'rounded-2xl rounded-bl-sm border border-[#DDD0C1] bg-[#FFFBF5] text-[#38271F]'
        }`}
      >
        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed md:text-base">
          {message}
        </p>

        {timestamp && (
          <span
            className={`mt-1 block text-[10px] ${
              isUser
                ? 'text-[#E8D8C6]'
                : 'text-[#9A8576]'
            }`}
          >
            {timestamp}
          </span>
        )}
      </div>
    </div>
  );
}