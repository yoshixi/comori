import React from 'react';
import { type Task } from '../gen/api';
import { TimerManager } from './TimerManager';

interface TaskSideMenuProps {
    task: Task | null;
    onClose: () => void;
}

export const TaskSideMenu: React.FC<TaskSideMenuProps> = ({ task, onClose }) => {
    // If no task is selected, we render nothing (or could render a hidden container for animation)
    if (!task) return null;

    return (
        <div className="fixed inset-y-0 right-0 w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out border-l border-gray-200 flex flex-col z-50">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <h3 className="font-semibold text-gray-800 truncate pr-2" title={task.title}>
                    {task.title}
                </h3>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
                    aria-label="Close details"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
                {/* Description Section */}
                <div>
                    <h4 className="text-xs uppercase tracking-wider text-gray-400 font-bold mb-2">Description</h4>
                    {task.description ? (
                        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed bg-gray-50 p-3 rounded-md border border-gray-100">
                            {task.description}
                        </p>
                    ) : (
                        <p className="text-sm text-gray-400 italic">No description provided</p>
                    )}
                </div>

                {/* Details Section */}
                <div>
                    <h4 className="text-xs uppercase tracking-wider text-gray-400 font-bold mb-2">Details</h4>
                    <div className="grid grid-cols-2 gap-y-3 text-sm">
                        <div className="text-gray-500">Status</div>
                        <div className="text-gray-800 font-medium">To Do</div>

                        <div className="text-gray-500">Due Date</div>
                        <div className="text-gray-800">
                            {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'None'}
                        </div>

                        <div className="text-gray-500">Created</div>
                        <div className="text-gray-800">{new Date(task.createdAt).toLocaleDateString()}</div>
                    </div>
                </div>

                {/* Timer/Activity Section */}
                <div>
                    {/* TimerManager already has its own structure, we modify it slightly via CSS if needed, 
               but for now just embedding it. */}
                    <TimerManager taskId={task.id} />
                </div>
            </div>
        </div>
    );
};
