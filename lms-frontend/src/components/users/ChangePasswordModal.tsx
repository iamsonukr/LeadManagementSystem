import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { UserRecord } from "@/types";

interface ChangePasswordModalProps {
  isOpen: boolean;
  user: UserRecord | null;
  onClose: () => void;
  onSubmit: (password: string) => void;
  isSubmitting: boolean;
}

export default function ChangePasswordModal({ isOpen, user, onClose, onSubmit, isSubmitting }: ChangePasswordModalProps) {
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }
    onSubmit(password);
    setPassword("");
  };

  if (!user) return null;

  return (
    <Modal open={isOpen} onClose={onClose} title="Change Password" subtitle={`Update password for ${user.name}`} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">New Password</label>
          <input
            type="password"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min 6 characters"
            required
            minLength={6}
          />
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            disabled={isSubmitting || password.length < 6}
          >
            {isSubmitting ? "Saving..." : "Save Password"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
