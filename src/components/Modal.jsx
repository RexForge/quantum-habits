import React from 'react';

const Modal = ({ isOpen, onClose, children, className = '' }) => {
  if (!isOpen) return null;
  return (
    <>
      {/* Backdrop */}
      <div
         className="fixed inset-0 bg-black bg-opacity-50 z-40"
         onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`fixed z-50 ${className}`}
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
         }}
        onClick={(e) => e.stopPropagation()}
        >
        {children}
      </div>
    </>
  );
};

export default Modal;
