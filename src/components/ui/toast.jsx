import { motion, AnimatePresence } from 'framer-motion';

const toastMessages = [
  "Logged. Nice and simple.",
  "Smooth.",
  "Logged.",
  "Done."
];

export const Toast = ({ show, message }) => {
  // Randomize message if not provided
  const displayMessage = message || toastMessages[Math.floor(Math.random() * toastMessages.length)];

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none"
        >
          <div className="bg-gray-900 text-white px-6 py-3 rounded-full shadow-lg shadow-gray-900/30 border border-gray-700">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-sm font-medium">{displayMessage}</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
