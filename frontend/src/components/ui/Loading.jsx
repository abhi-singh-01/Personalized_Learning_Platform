export default function Loading({ text = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="animate-spin h-10 w-10 border-4 border-primary-500 border-t-transparent rounded-full mb-4" />
      <p className="text-gray-500 dark:text-gray-400">{text}</p>
    </div>
  );
}