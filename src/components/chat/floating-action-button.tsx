"use client";

import { useState, useCallback } from "react";
import { FiPlus } from "react-icons/fi";
import ContactSelectionModal from "./contact-selection-modal";

export default function FloatingActionButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  return (
    <>
      <button
        onClick={openModal}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-green-500 text-white flex items-center justify-center shadow-lg hover:bg-green-600 transition-colors z-50"
        aria-label="New chat"
      >
        <FiPlus size={24} />
      </button>

      <ContactSelectionModal isOpen={isModalOpen} onClose={closeModal} />
    </>
  );
}
