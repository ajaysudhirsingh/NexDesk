import React, { useEffect } from 'react';

const MessageToast = ({ message, type = 'success', onClose, duration = 5000 }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const typeStyles = {
    success: {
      bg: 'bg-green-50 border-green-200',
      text: 'text-green-800',
      icon: 'text-green-400',
      iconPath: 'M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
    },
    error: {
      bg: 'bg-red-50 border-red-200',
      text: 'text-red-800',
      icon: 'text-red-400',
      iconPath: 'M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
    },
    warning: {
      bg: 'bg-yellow-50 border-yellow-200',
      text: 'text-yellow-800',
      icon: 'text-yellow-400',
      iconPath: 'M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
    },
    info: {
      bg: 'bg-blue-50 border-blue-200',
      text: 'text-blue-800',
      icon: 'text-blue-400',
      iconPath: 'M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
    }
  };

  const styles = typeStyles[type];

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-sm w-full ${styles.bg} border-2 border-primary/60 rounded-3xl shadow-2xl p-5 backdrop-blur-md bg-white/70 transition-all duration-300 ease-in-out transform scale-100 animate-premium-toast`} style={{boxShadow:'0 8px 32px 0 rgba(37,99,235,0.12)'}}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className={`h-6 w-6 ${styles.icon} drop-shadow-md`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d={styles.iconPath} clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-4 flex-1">
          <p className={`text-base font-bold font-sans ${styles.text} drop-shadow-sm`}>
            {message}
          </p>
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button
            onClick={onClose}
            className={`inline-flex ${styles.text} hover:text-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary`}
          >
            <span className="sr-only">Close</span>
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessageToast;

/* Add animation for premium toast */
@keyframes premium-toast {
  0% { opacity: 0; transform: translateX(40px) scale(0.95); }
  100% { opacity: 1; transform: translateX(0) scale(1); }
}
.animate-premium-toast {
  animation: premium-toast 0.4s cubic-bezier(.4,0,.2,1);
} 