const variantStyles = {
  success: {
    icon: (
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
        <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
    ),
    titleClass: 'text-emerald-800',
  },
  error: {
    icon: (
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
        <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
    ),
    titleClass: 'text-red-800',
  },
  info: {
    icon: (
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
        <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    ),
    titleClass: 'text-blue-800',
  },
};

const MessageDialog = ({ isOpen, variant = 'info', title, message, onClose }) => {
  if (!isOpen) return null;

  const style = variantStyles[variant] || variantStyles.info;

  return (
    <div
      className="fixed bottom-4 right-4 z-[60] max-w-sm w-full p-4"
      role="alert"
      aria-labelledby="message-dialog-title"
    >
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-5 text-center">
        {style.icon}
        <h3 id="message-dialog-title" className={`mt-3 text-base font-semibold ${style.titleClass}`}>
          {title}
        </h3>
        {message && (
          <p className="mt-1.5 text-sm text-gray-600">
            {message}
          </p>
        )}
        <div className="mt-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex w-full justify-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessageDialog;
